import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/auth/invite?token=xxx — validate invite (public, no auth)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const invite = await prisma.companyInvite.findUnique({
    where: { token },
    include: { company: { select: { name: true } } },
  })

  if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  if (invite.acceptedAt) return NextResponse.json({ error: "This invite has already been used" }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired" }, { status: 410 })

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    companyName: invite.company.name,
  })
}
