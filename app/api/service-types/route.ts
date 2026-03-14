import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const DEFAULT_TYPES = [
  { value: "ONE_WAY",         label: "One Way",              description: "Standard point-to-point transfer",    iconName: "Route",      color: "bg-slate-100 text-slate-600",   isBuiltIn: true, sortOrder: 0 },
  { value: "ROUND_TRIP",      label: "Round Trip",           description: "Pickup and return to origin",          iconName: "RefreshCw",  color: "bg-indigo-50 text-indigo-600",  isBuiltIn: true, sortOrder: 1 },
  { value: "HOURLY",          label: "Hourly / As Directed", description: "Billed by the hour",                   iconName: "Clock",      color: "bg-teal-50 text-teal-600",      isBuiltIn: true, sortOrder: 2 },
  { value: "AIRPORT_PICKUP",  label: "Airport Pickup",       description: "Arrival — meet at baggage claim",      iconName: "Plane",      color: "bg-sky-50 text-sky-600",        isBuiltIn: true, sortOrder: 3 },
  { value: "AIRPORT_DROPOFF", label: "Airport Drop-Off",     description: "Departure — drop at terminal",         iconName: "Plane",      color: "bg-sky-50 text-sky-600",        isBuiltIn: true, sortOrder: 4 },
  { value: "MULTI_STOP",      label: "Multi-Stop",           description: "Multiple intermediate stops",          iconName: "Layers",     color: "bg-orange-50 text-orange-600",  isBuiltIn: true, sortOrder: 5 },
  { value: "SHUTTLE",         label: "Shuttle",              description: "Shared or group transport",            iconName: "Users",      color: "bg-purple-50 text-purple-600",  isBuiltIn: true, sortOrder: 6 },
]

async function ensureDefaults(companyId: string) {
  const existing = await prisma.serviceType.count({ where: { companyId } })
  if (existing === 0) {
    await prisma.serviceType.createMany({ data: DEFAULT_TYPES.map((t) => ({ ...t, companyId })) })
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    await ensureDefaults(companyId)
    const types = await prisma.serviceType.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json(types)
  } catch {
    return NextResponse.json({ error: "Failed to fetch service types" }, { status: 500 })
  }
}

const createSchema = z.object({
  label:       z.string().min(1),
  description: z.string().optional(),
  iconName:    z.string().default("Car"),
  color:       z.string().default("bg-gray-100 text-gray-600"),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = createSchema.parse(body)
    const maxOrder = await prisma.serviceType.aggregate({ where: { companyId }, _max: { sortOrder: true } })
    const value = `custom_${Date.now()}`
    const type = await prisma.serviceType.create({
      data: { ...data, value, companyId, isBuiltIn: false, isEnabled: true, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    })
    return NextResponse.json(type, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    return NextResponse.json({ error: "Failed to create service type" }, { status: 500 })
  }
}
