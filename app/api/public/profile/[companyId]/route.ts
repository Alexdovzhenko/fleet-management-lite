import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const type = request.nextUrl.searchParams.get("type") ?? "affiliate"

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        city: true,
        state: true,
        logo: true,
        banner: true,
        about: true,
        affiliateAbout: true,
        clientAbout: true,
        clientVehicleIds: true,
        createdAt: true,
        vehicles: {
          where: { status: { not: "OUT_OF_SERVICE" } },
          select: {
            id: true,
            name: true,
            type: true,
            year: true,
            make: true,
            model: true,
            capacity: true,
            photoUrl: true,
            photos: true,
            hideFromProfile: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Pick the right about text and vehicle list based on profile type
    let about: string | null
    let vehicles: typeof company.vehicles

    if (type === "client") {
      about = company.clientAbout ?? company.about ?? null
      const ids = new Set(company.clientVehicleIds)
      vehicles = ids.size > 0
        ? company.vehicles.filter(v => ids.has(v.id))
        : company.vehicles.filter(v => !v.hideFromProfile)
    } else {
      about = company.affiliateAbout ?? company.about ?? null
      vehicles = company.vehicles.filter(v => !v.hideFromProfile)
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      website: company.website,
      city: company.city,
      state: company.state,
      logo: company.logo,
      banner: company.banner,
      about,
      createdAt: company.createdAt,
      vehicles,
    })
  } catch (err) {
    console.error("GET /api/public/profile error:", err)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}
