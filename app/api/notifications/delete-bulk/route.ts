import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// DELETE /api/notifications/delete-bulk
// Body: { range: "24h" | "week" | "all" } OR { ids: string[] }
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      // Delete specific notifications by ID (must belong to this company)
      await prisma.appNotification.deleteMany({
        where: { id: { in: body.ids }, companyId },
      })
      return NextResponse.json({ success: true })
    }

    if (body.range) {
      let createdAtFilter: { lt?: Date } | undefined
      if (body.range === "24h") {
        createdAtFilter = { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      } else if (body.range === "week") {
        createdAtFilter = { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
      // "all" has no filter

      await prisma.appNotification.deleteMany({
        where: {
          companyId,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (error) {
    console.error("DELETE /api/notifications/delete-bulk error:", error)
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}
