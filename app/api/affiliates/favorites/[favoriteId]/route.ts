import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// DELETE /api/affiliates/favorites/[favoriteId] — remove from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ favoriteId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { favoriteId } = await params

  try {
    await prisma.affiliateFavorite.deleteMany({
      where: { companyId, favoriteId },
    })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("DELETE /api/affiliates/favorites/[favoriteId] error:", error)
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
  }
}
