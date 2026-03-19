import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "driver-files"
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars not configured")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const slot = formData.get("slot") as string | null // e.g. "avatar", "license-front", "license-back", "doc1", "doc2"

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 })

    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "File must be an image or PDF" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || (isPdf ? "pdf" : "jpg")
    const folder = slot || "misc"
    const path = `${companyId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabase = getAdminClient()

    // Auto-create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true })
    }

    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: publicUrl, name: file.name })
  } catch (err) {
    console.error("Driver upload error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 })
  }
}
