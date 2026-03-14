import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const schema = z.object({ affiliateCompanyId: z.string().min(1) })

// POST /api/affiliates/customer
// Finds or creates a Customer record in your company for a connected affiliate.
// Used during reservation creation so trips can be billed to an affiliate account.
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const { affiliateCompanyId } = schema.parse(body)

    // Verify they are actually a connected affiliate (ACCEPTED)
    const connection = await prisma.affiliateConnection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: companyId, receiverId: affiliateCompanyId },
          { senderId: affiliateCompanyId, receiverId: companyId },
        ],
      },
      select: { affiliateCode: true },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not a connected affiliate" }, { status: 403 })
    }

    // Get the affiliate company details
    const affiliate = await prisma.company.findUnique({
      where: { id: affiliateCompanyId },
      select: { name: true, email: true, phone: true },
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Find or create a Customer record for this affiliate in your company
    // Key: email + companyId. If no email, key by affiliate company name in the `company` field.
    let customer = affiliate.email
      ? await prisma.customer.findFirst({
          where: { companyId, email: affiliate.email },
        })
      : await prisma.customer.findFirst({
          where: { companyId, company: affiliate.name },
        })

    if (!customer) {
      // Auto-generate a customer number
      const count = await prisma.customer.count({ where: { companyId } })
      const customerNumber = String(count + 1).padStart(4, "0")

      customer = await prisma.customer.create({
        data: {
          companyId,
          customerNumber,
          name: affiliate.name,
          email: affiliate.email || undefined,
          phone: affiliate.phone || "",
          company: affiliate.name,
          notes: `Affiliate account — ${connection.affiliateCode ?? ""}`.trim(),
        },
      })
    }

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/affiliates/customer error:", error)
    return NextResponse.json({ error: "Failed to get or create affiliate customer" }, { status: 500 })
  }
}
