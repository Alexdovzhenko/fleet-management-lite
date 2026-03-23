import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

// Reserved slugs that must not collide with app routes
const RESERVED_SLUGS = new Set([
  "api", "auth", "onboarding", "settings", "drivers", "vehicles",
  "trips", "dispatch", "customers", "affiliates", "notifications",
  "invoices", "fleet", "dashboard", "p", "c", "login", "signup",
  "admin", "livery", "connect",
])

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

async function generateUniqueSlug(name: string, excludeId: string): Promise<string> {
  let base = toSlug(name)
  if (!base) base = "company"
  if (RESERVED_SLUGS.has(base)) base = `${base}-limo`

  let candidate = base
  let suffix = 2
  while (true) {
    const existing = await prisma.company.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${suffix++}`
  }
}

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
  about:              z.string().optional(),
  affiliateAbout:     z.string().optional(),
  clientAbout:        z.string().optional(),
  clientVehicleIds:   z.array(z.string()).optional(),
  timezone:           z.string().optional(),
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

    // Auto-generate slug from name if company doesn't have one yet
    const current = await prisma.company.findUnique({ where: { id: companyId }, select: { slug: true, name: true } })
    let slug = current?.slug ?? null
    if (!slug && (data.name || current?.name)) {
      slug = await generateUniqueSlug(data.name ?? current?.name ?? "", companyId)
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { ...data, ...(slug && !current?.slug ? { slug } : {}) },
    })
    return NextResponse.json(company)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
