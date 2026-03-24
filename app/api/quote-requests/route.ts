import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  try {
    const quotes = await prisma.quoteRequest.findMany({
      where: {
        companyId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(quotes)
  } catch (err) {
    console.error("GET /api/quote-requests error:", err)
    return NextResponse.json({ error: "Failed to fetch quote requests" }, { status: 500 })
  }
}
