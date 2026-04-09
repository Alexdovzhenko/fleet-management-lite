import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "trip-attachments"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars not configured")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; attachmentId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { tripId, attachmentId } = await params

  const attachment = await prisma.tripAttachment.findFirst({
    where: { id: attachmentId, tripId, companyId },
  })
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 })

  try {
    const supabase = getAdminClient()
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([attachment.storagePath])
    if (storageError) {
      console.error("Storage delete error:", storageError)
      // Non-fatal: continue with DB deletion
    }

    await prisma.tripAttachment.delete({ where: { id: attachmentId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Attachment delete error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
