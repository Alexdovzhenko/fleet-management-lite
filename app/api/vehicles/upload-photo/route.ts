import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "vehicle-photos"
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 })
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 })

    const ext = file.name.split(".").pop() || "jpg"
    const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabase = await createClient()
    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
