import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import { prisma } from "@/lib/db"
import { z } from "zod"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId, companyId } = auth.ctx

  const [user, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, companyId: true },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, email: true, phone: true, address: true, city: true, state: true, timezone: true, logo: true, onboardingCompleted: true },
    }),
  ])

  return NextResponse.json({ user, company })
}

const updateSchema = z.object({
  name:  z.string().min(1).optional(),
  phone: z.string().optional(),
  role:  z.enum(["OWNER", "DISPATCHER"]).optional(),
})

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth.ctx

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const user = await prisma.user.update({ where: { id: userId }, data })
    return NextResponse.json(user)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
