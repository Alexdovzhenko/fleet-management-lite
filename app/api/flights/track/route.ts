import { NextRequest, NextResponse } from "next/server"

// FlightAware AeroAPI v4 — https://flightaware.com/commercial/aeroapi
const AEROAPI_BASE = "https://aeroapi.flightaware.com/aeroapi"

interface AeroAPIFlight {
  ident?: string
  ident_iata?: string
  status?: string
  origin?: {
    code_iata?: string
    name?: string
    timezone?: string
  }
  destination?: {
    code_iata?: string
    name?: string
    timezone?: string
  }
  scheduled_in?: string | null   // UTC gate arrival (scheduled)
  estimated_in?: string | null   // UTC gate arrival (estimated)
  actual_in?: string | null      // UTC gate arrival (actual)
  scheduled_on?: string | null   // UTC touchdown (scheduled)
  actual_on?: string | null      // UTC touchdown (actual)
  arrival_delay?: number | null  // seconds (positive = late)
  gate_destination?: string | null
  terminal_destination?: string | null
  baggage_claim?: string | null
}

interface AeroAPIResponse {
  flights?: AeroAPIFlight[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const flight = searchParams.get("flight")?.toUpperCase().replace(/\s+/g, "")
  const date = searchParams.get("date") // YYYY-MM-DD

  if (!flight) return NextResponse.json({ error: "flight param required" }, { status: 400 })

  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Flight tracking not configured" }, { status: 503 })
  }

  try {
    const baseDate = date || new Date().toISOString().split("T")[0]
    // Query a 24-hour window for the given date
    const start = `${baseDate}T00:00:00Z`
    const end   = `${baseDate}T23:59:59Z`

    const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(flight)}?start=${start}&end=${end}`

    const res = await fetch(url, {
      headers: {
        "x-apikey": apiKey,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`FlightAware ${res.status} for ${flight}:`, errBody)
      const detail = errBody.slice(0, 300)
      if (res.status === 404) return NextResponse.json({ error: "Flight not found", detail }, { status: 404 })
      if (res.status === 401 || res.status === 403) return NextResponse.json({ error: `Auth error ${res.status}`, detail }, { status: 503 })
      return NextResponse.json({ error: `API error ${res.status}`, detail }, { status: res.status })
    }

    const data: AeroAPIResponse = await res.json()
    const flights = data?.flights
    if (!flights?.length) {
      return NextResponse.json({ error: "No flight data found for this date" }, { status: 404 })
    }

    const f = flights[0]

    const scheduledArrival  = f.scheduled_in || null
    const estimatedArrival  = f.estimated_in || f.scheduled_in || null
    const actualArrival     = f.actual_in || null
    const destinationTimezone = f.destination?.timezone || null

    // Delay in minutes from FlightAware's arrival_delay (seconds)
    let arrivalDelayMinutes: number | null = null
    if (f.arrival_delay && f.arrival_delay > 0 && !actualArrival) {
      arrivalDelayMinutes = Math.round(f.arrival_delay / 60)
    }

    // Build gate string
    const gate     = f.gate_destination || null
    const terminal = f.terminal_destination || null
    const arrivalGate = gate && terminal
      ? `${terminal}-${gate}`
      : gate || (terminal ? `Terminal ${terminal}` : null)

    return NextResponse.json({
      flightNumber:      f.ident_iata || f.ident || flight,
      status:            f.status || null,
      origin:            f.origin?.code_iata || null,
      destination:       f.destination?.code_iata || null,
      destinationTimezone,
      scheduledArrival,
      estimatedArrival,
      actualArrival,
      arrivalGate,
      baggageClaim:      f.baggage_claim ? `Carousel ${f.baggage_claim}` : null,
      arrivalDelayMinutes,
    })
  } catch (err) {
    console.error("Flight track error:", err)
    return NextResponse.json({ error: "Failed to fetch flight data" }, { status: 500 })
  }
}
