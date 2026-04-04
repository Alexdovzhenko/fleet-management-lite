import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const createSchema = z.object({
  email:     z.string().email(),
  label:     z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  // Return all sender emails, seeding from company.email if none exist
  let senders = await prisma.senderEmail.findMany({
    where: { companyId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })

  if (senders.length === 0) {
    // Auto-seed the company's registration email as the default
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { email: true } })
    if (company?.email) {
      const seeded = await prisma.senderEmail.create({
        data: { companyId, email: company.email, label: "Primary", isDefault: true },
      })
      senders = [seeded]
    }
  }

  return NextResponse.json(senders)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const body = await request.json()
  const data = createSchema.parse(body)

  // If setting as default, clear other defaults first
  if (data.isDefault) {
    await prisma.senderEmail.updateMany({ where: { companyId }, data: { isDefault: false } })
  }

  // If no others exist, make this one the default
  const count = await prisma.senderEmail.count({ where: { companyId } })
  const makeDefault = data.isDefault ?? (count === 0)

  const sender = await prisma.senderEmail.create({
    data: { companyId, email: data.email, label: data.label, isDefault: makeDefault },
  })

  return NextResponse.json(sender, { status: 201 })
}
