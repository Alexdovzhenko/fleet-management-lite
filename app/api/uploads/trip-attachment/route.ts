import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "trip-attachments"
const MAX_SIZE = 3 * 1024 * 1024 // 3 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
])

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
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 3 MB limit" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const storagePath = `${companyId}/pending/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabase = getAdminClient()
    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      url: data.publicUrl,
      storagePath,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    })
  } catch (err) {
    console.error("Trip attachment pre-upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
