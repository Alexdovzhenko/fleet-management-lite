import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateSchema = z.object({
  name:     z.string().min(1).optional(),
  email:    z.string().email().optional().or(z.literal("")),
  phone:    z.string().optional(),
  address:  z.string().optional(),
  city:     z.string().optional(),
  state:    z.string().optional(),
  zip:      z.string().optional(),
  logo:     z.string().optional(),
  banner:   z.string().optional(),
  website:  z.string().optional(),
  timezone: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(company)
  } catch {
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const company = await prisma.company.update({ where: { id: companyId }, data })
    return NextResponse.json(company)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
