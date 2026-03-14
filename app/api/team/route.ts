import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { prisma } from "@/lib/db"
import { z } from "zod"

// GET /api/team — list users + pending invites
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.companyInvite.findMany({
      where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({ users, invites })
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["DISPATCHER", "VIEWER"]),
})

// POST /api/team — send invite
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can invite team members" }, { status: 403 })
  }

  const body = await request.json()
  const data = inviteSchema.parse(body)

  // Check no existing active invite for this email
  const existing = await prisma.companyInvite.findFirst({
    where: { companyId, email: data.email, acceptedAt: null, expiresAt: { gt: new Date() } },
  })
  if (existing) {
    return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 409 })
  }

  const invite = await prisma.companyInvite.create({
    data: {
      companyId,
      email: data.email,
      role: data.role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${invite.token}`

  // TODO: Send email via Resend when RESEND_API_KEY is configured
  // For now, return the invite URL in the response for manual sharing
  console.log(`Invite URL for ${data.email}: ${inviteUrl}`)

  return NextResponse.json({ invite, inviteUrl }, { status: 201 })
}
