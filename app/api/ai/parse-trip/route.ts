import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-context"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a trip booking assistant for a limousine company.
Parse natural language trip descriptions and extract structured trip data.

Return ONLY valid JSON with these fields (omit fields you can't determine):
{
  "pickupDate": "YYYY-MM-DD",
  "pickupTime": "HH:MM" (24h),
  "pickupAddress": "full address string",
  "dropoffAddress": "full address string",
  "passengerCount": number,
  "passengerName": "name if mentioned",
  "flightNumber": "airline + number if mentioned (e.g. AA1234)",
  "tripType": "ONE_WAY|ROUND_TRIP|HOURLY|AIRPORT_PICKUP|AIRPORT_DROPOFF|MULTI_STOP|SHUTTLE",
  "meetAndGreet": boolean,
  "vip": boolean,
  "childSeat": boolean,
  "internalNotes": "any special notes"
}

Rules:
- Today is ${new Date().toISOString().split("T")[0]}
- If no year specified, assume current year
- If no time specified, leave pickupTime empty
- Detect airport pickups/dropoffs from context (JFK, LAX, MIA, etc.)
- Return ONLY the JSON object, no markdown, no explanation`

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const { text } = await request.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Parse this trip booking: "${text}"` }],
      system: SYSTEM_PROMPT,
    })

    const content = message.content[0]
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from AI" }, { status: 500 })
    }

    let parsed: object
    try {
      parsed = JSON.parse(content.text.trim())
    } catch {
      return NextResponse.json({ error: "Could not parse AI response as JSON" }, { status: 500 })
    }

    return NextResponse.json({ parsed })
  } catch (error) {
    console.error("POST /api/ai/parse-trip error:", error)
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 })
  }
}
