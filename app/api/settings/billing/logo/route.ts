import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "company-logos"
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, WebP, and SVG files are allowed" },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png"
    const storagePath = `${companyId}/logo.${ext}`

    const supabase = getAdminClient()
    const bytes = await file.arrayBuffer()

    // Delete existing logo if it exists
    await supabase.storage.from(BUCKET).remove([storagePath])

    // Upload new logo
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const logoUrl = data.publicUrl

    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error("[POST /api/settings/billing/logo]", error)
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
  }
}
