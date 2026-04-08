import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    // Fetch unique vehicle types from company's vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId },
      select: { type: true },
    })

    // Extract unique types
    const uniqueTypes = Array.from(new Set(vehicles.map((v) => v.type)))

    // Format as dropdown options
    const options = uniqueTypes.map((type) => ({
      value: type,
      label: type.replace(/_/g, " "),
    }))

    return NextResponse.json(options)
  } catch (error) {
    console.error("GET /api/vehicles/types error:", error)
    return NextResponse.json({ error: "Failed to fetch vehicle types" }, { status: 500 })
  }
}
