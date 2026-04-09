import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "trip-attachments"
const MAX_SIZE = 3 * 1024 * 1024 // 3 MB
const MAX_COUNT = 5

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { tripId } = await params

  // Verify trip ownership
  const trip = await prisma.trip.findFirst({ where: { id: tripId, companyId } })
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

  // Count existing attachments
  const existingCount = await prisma.tripAttachment.count({ where: { tripId } })
  if (existingCount >= MAX_COUNT) {
    return NextResponse.json(
      { error: `Maximum ${MAX_COUNT} attachments per reservation` },
      { status: 400 }
    )
  }

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
    const storagePath = `${companyId}/${tripId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabase = getAdminClient()
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    const attachment = await prisma.tripAttachment.create({
      data: {
        tripId,
        companyId,
        name: file.name,
        url: data.publicUrl,
        mimeType: file.type,
        size: file.size,
        storagePath,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    console.error("Attachment upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
