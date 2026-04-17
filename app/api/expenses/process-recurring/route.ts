import { NextRequest, NextResponse } from "next/server"
import { processRecurringExpenses } from "@/lib/recurring-expenses"

/**
 * Process recurring expenses
 * This endpoint should be called daily via a cron job (e.g., EasyCron, GitHub Actions, Vercel Crons)
 *
 * Protected by CRON_SECRET env variable
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "")
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const dayOfMonth = new Date().getDate()
    const result = await processRecurringExpenses(dayOfMonth)

    return NextResponse.json({
      message: `Processed ${result.processed} recurring expenses, created ${result.created} new instances`,
      ...result,
    })
  } catch (error) {
    console.error("[POST /api/expenses/process-recurring]", error)
    return NextResponse.json(
      { error: "Failed to process recurring expenses" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check status and see upcoming expenses (for debugging)
 * Also protected by CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "")
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.json({
    status: "ok",
    nextRun: new Date().toISOString(),
    message: "Use POST to trigger recurring expense processing",
  })
}
