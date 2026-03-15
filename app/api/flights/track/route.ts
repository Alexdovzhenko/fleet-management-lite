import { NextRequest, NextResponse } from "next/server"

const AEROAPI_BASE = "https://aeroapi.flightaware.com/aeroapi"

interface AeroFlight {
  ident: string
  ident_iata?: string
  status: string
  origin?: { code_iata: string; name: string }
  destination?: { code_iata: string; name: string }
  scheduled_in?: string
  estimated_in?: string
  actual_in?: string
  gate_destination?: string
  baggage_claim?: string
  arrival_delay?: number  // in seconds
  operator_iata?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const flight = searchParams.get("flight")?.toUpperCase().replace(/\s+/g, "")
  const date = searchParams.get("date") // YYYY-MM-DD

  if (!flight) return NextResponse.json({ error: "flight param required" }, { status: 400 })

  const apiKey = process.env.AEROAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Flight tracking not configured" }, { status: 503 })
  }

  try {
    const baseDate = date || new Date().toISOString().split("T")[0]
    const start = `${baseDate}T00:00:00Z`
    const end = `${baseDate}T23:59:59Z`
    const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(flight)}?start=${start}&end=${end}&max_pages=1`

    const res = await fetch(url, {
      headers: { "x-apikey": apiKey },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      if (res.status === 404) return NextResponse.json({ error: "Flight not found" }, { status: 404 })
      if (res.status === 401) return NextResponse.json({ error: "Invalid API key" }, { status: 503 })
      return NextResponse.json({ error: "Flight data unavailable" }, { status: res.status })
    }

    const data = await res.json()
    const flights: AeroFlight[] = data.flights || []

    if (!flights.length) {
      return NextResponse.json({ error: "No flight data found for this date" }, { status: 404 })
    }

    const f = flights[0]
    const delayMinutes = f.arrival_delay ? Math.round(f.arrival_delay / 60) : null

    return NextResponse.json({
      flightNumber: f.ident_iata || f.ident || flight,
      status: f.status || null,
      origin: f.origin?.code_iata || null,
      destination: f.destination?.code_iata || null,
      scheduledArrival: f.scheduled_in || null,
      estimatedArrival: f.estimated_in || f.scheduled_in || null,
      actualArrival: f.actual_in || null,
      arrivalGate: f.gate_destination || null,
      baggageClaim: f.baggage_claim || null,
      arrivalDelayMinutes: delayMinutes,
    })
  } catch (err) {
    console.error("Flight track error:", err)
    return NextResponse.json({ error: "Failed to fetch flight data" }, { status: 500 })
  }
}
