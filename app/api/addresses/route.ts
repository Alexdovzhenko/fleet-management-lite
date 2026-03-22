import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const upsertSchema = z.object({
  name:     z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city:     z.string().optional(),
  state:    z.string().optional(),
  zip:      z.string().optional(),
  country:  z.string().optional(),
  phone:    z.string().optional(),
  notes:    z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50)

  try {
    const where = q
      ? {
          companyId,
          OR: [
            { address1: { contains: q, mode: "insensitive" as const } },
            { name:     { contains: q, mode: "insensitive" as const } },
            { city:     { contains: q, mode: "insensitive" as const } },
          ],
        }
      : { companyId }

    const addresses = await prisma.companyAddress.findMany({
      where,
      orderBy: [{ lastUsedAt: "desc" }, { useCount: "desc" }],
      take: q ? limit : undefined,
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("GET /api/addresses error:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = upsertSchema.parse(body)

    // Normalise for dedup: lowercase, trimmed
    const addr1 = data.address1.trim()
    const city  = (data.city ?? "").trim().toLowerCase()
    const state = (data.state ?? "").trim().toLowerCase()

    // Try to find an existing entry for this company + address
    const existing = await prisma.companyAddress.findFirst({
      where: {
        companyId,
        address1: { equals: addr1, mode: "insensitive" },
        city:     city  ? { equals: city,  mode: "insensitive" } : undefined,
        state:    state ? { equals: state, mode: "insensitive" } : undefined,
      },
    })

    if (existing) {
      // Increment use count and refresh metadata
      const updated = await prisma.companyAddress.update({
        where: { id: existing.id },
        data: {
          useCount:   { increment: 1 },
          lastUsedAt: new Date(),
          // Enrich any empty fields with new data
          name:     data.name     || existing.name     || undefined,
          address2: data.address2 || existing.address2 || undefined,
          city:     data.city     || existing.city     || undefined,
          state:    data.state    || existing.state    || undefined,
          zip:      data.zip      || existing.zip      || undefined,
          country:  data.country  || existing.country  || undefined,
          phone:    data.phone    || existing.phone    || undefined,
          notes:    data.notes    || existing.notes    || undefined,
        },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.companyAddress.create({
      data: { ...data, address1: addr1, companyId },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/addresses error:", error)
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
  }
}
