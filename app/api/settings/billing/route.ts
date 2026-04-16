import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const billingSettingsSchema = z.object({
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "Month DD, YYYY"]).optional(),
  invoicePrefix: z.string().optional(),
  paymentTerms: z.string().optional(),
  footerNote: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    let billingSettings = await prisma.billingSettings.findUnique({
      where: { companyId },
    })

    // If not found, create with defaults
    if (!billingSettings) {
      billingSettings = await prisma.billingSettings.create({
        data: {
          companyId,
          companyName: "",
          address: "",
          phone: "",
          billingEmail: "",
          dateFormat: "MM/DD/YYYY",
          invoicePrefix: "INV-",
          paymentTerms: "Due upon receipt",
        },
      })
    }

    return NextResponse.json(billingSettings)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[GET /api/settings/billing]", errorMsg)
    return NextResponse.json({ error: "Failed to fetch billing settings", details: errorMsg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = billingSettingsSchema.parse(body)

    // Clean empty strings
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "")
    )

    const billingSettings = await prisma.billingSettings.upsert({
      where: { companyId },
      create: { companyId, ...cleanData },
      update: cleanData,
    })

    return NextResponse.json(billingSettings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 })
    }
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[PATCH /api/settings/billing]", errorMsg)
    return NextResponse.json(
      {
        error: "Failed to update billing settings",
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
