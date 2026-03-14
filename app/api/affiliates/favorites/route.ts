import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

// GET /api/affiliates/favorites — returns the set of favorited company IDs
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const favorites = await prisma.affiliateFavorite.findMany({
      where: { companyId },
      select: { id: true, favoriteId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(favorites)
  } catch (error) {
    console.error("GET /api/affiliates/favorites error:", error)
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
  }
}

const addSchema = z.object({ favoriteId: z.string().min(1) })

// POST /api/affiliates/favorites — add to favorites
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const { favoriteId } = addSchema.parse(body)

    if (favoriteId === companyId) {
      return NextResponse.json({ error: "Cannot favorite yourself" }, { status: 400 })
    }

    // Upsert — safe to call even if already exists
    const favorite = await prisma.affiliateFavorite.upsert({
      where: { companyId_favoriteId: { companyId, favoriteId } },
      create: { companyId, favoriteId },
      update: {},
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/affiliates/favorites error:", error)
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 })
  }
}
