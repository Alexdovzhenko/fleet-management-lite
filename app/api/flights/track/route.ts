import { NextRequest, NextResponse } from "next/server"

// AeroDataBox via RapidAPI — https://rapidapi.com/aerodatabox/api/aerodatabox
const AERODATABOX_BASE = "https://aerodatabox.p.rapidapi.com"

interface AeroDataBoxFlight {
  number?: string
  status?: string
  departure?: {
    airport?: { iata?: string; name?: string }
    scheduledTime?: { utc?: string; local?: string }
    revisedTime?: { utc?: string; local?: string }
    actualTime?: { utc?: string; local?: string }
    gate?: string
    terminal?: string
  }
  arrival?: {
    airport?: { iata?: string; name?: string }
    scheduledTime?: { utc?: string; local?: string }
    revisedTime?: { utc?: string; local?: string }
    actualTime?: { utc?: string; local?: string }
    gate?: string
    terminal?: string
    baggageBelt?: string
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const flight = searchParams.get("flight")?.toUpperCase().replace(/\s+/g, "")
  const date = searchParams.get("date") // YYYY-MM-DD

  if (!flight) return NextResponse.json({ error: "flight param required" }, { status: 400 })

  const apiKey = process.env.AERODATABOX_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Flight tracking not configured" }, { status: 503 })
  }

  try {
    const baseDate = date || new Date().toISOString().split("T")[0]
    const url = `${AERODATABOX_BASE}/flights/number/${encodeURIComponent(flight)}/${baseDate}`

    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
      },
      next: { revalidate: 300 }, // cache 5 min
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`AeroDataBox ${res.status} for ${flight}:`, errBody)
      if (res.status === 404) return NextResponse.json({ error: "Flight not found" }, { status: 404 })
      if (res.status === 401 || res.status === 403) return NextResponse.json({ error: `Auth error ${res.status}: ${errBody.slice(0, 120)}` }, { status: 503 })
      return NextResponse.json({ error: `API error ${res.status}: ${errBody.slice(0, 120)}` }, { status: res.status })
    }

    const data: AeroDataBoxFlight[] = await res.json()
    if (!data?.length) {
      return NextResponse.json({ error: "No flight data found for this date" }, { status: 404 })
    }

    const f = data[0]
    const arr = f.arrival

    const scheduledArrival = arr?.scheduledTime?.utc || null
    const estimatedArrival = arr?.revisedTime?.utc || arr?.scheduledTime?.utc || null
    const actualArrival = arr?.actualTime?.utc || null

    // Calculate delay in minutes
    let arrivalDelayMinutes: number | null = null
    if (scheduledArrival && estimatedArrival && !actualArrival) {
      const diff = new Date(estimatedArrival).getTime() - new Date(scheduledArrival).getTime()
      arrivalDelayMinutes = Math.round(diff / 60000)
      if (arrivalDelayMinutes <= 0) arrivalDelayMinutes = null
    }

    // Build gate string — include terminal if available
    const gate = arr?.gate || null
    const terminal = arr?.terminal || null
    const arrivalGate = gate && terminal ? `${terminal}${gate}` : gate || (terminal ? `Terminal ${terminal}` : null)

    return NextResponse.json({
      flightNumber: f.number || flight,
      status: f.status || null,
      origin: f.departure?.airport?.iata || null,
      destination: arr?.airport?.iata || null,
      scheduledArrival,
      estimatedArrival,
      actualArrival,
      arrivalGate,
      baggageClaim: arr?.baggageBelt ? `Carousel ${arr.baggageBelt}` : null,
      arrivalDelayMinutes,
    })
  } catch (err) {
    console.error("Flight track error:", err)
    return NextResponse.json({ error: "Failed to fetch flight data" }, { status: 500 })
  }
}
