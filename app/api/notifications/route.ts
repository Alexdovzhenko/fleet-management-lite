import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import type { AppNotificationType } from "@prisma/client"

const AFFILIATE_TYPES: AppNotificationType[] = [
  "AFFILIATE_INVITE_RECEIVED",
  "AFFILIATE_INVITE_ACCEPTED",
  "AFFILIATE_INVITE_DECLINED",
]
// Farm-in: jobs sent TO us by an affiliate
const FARM_IN_TYPES: AppNotificationType[] = [
  "FARM_OUT_RECEIVED",
  "FARM_OUT_CANCELLED",
]
// Farm-out: jobs we sent TO an affiliate (and their response)
const FARM_OUT_TYPES: AppNotificationType[] = [
  "FARM_OUT_ACCEPTED",
  "FARM_OUT_DECLINED",
]
const TRIP_TYPES: AppNotificationType[] = [
  "TRIP_PICKUP_TIME_CHANGED",
  "TRIP_PICKUP_ADDRESS_CHANGED",
  "TRIP_DROPOFF_ADDRESS_CHANGED",
  "TRIP_NOTES_CHANGED",
  "TRIP_STATUS_CHANGED",
  "TRIP_DRIVER_CHANGED",
  "TRIP_CANCELLED",
]
const QUOTE_TYPES: AppNotificationType[] = [
  "QUOTE_REQUEST_RECEIVED",
]

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const tab = request.nextUrl.searchParams.get("tab") ?? "all"
  const cursor = request.nextUrl.searchParams.get("cursor")
  const limit = 40

  let typeFilter: AppNotificationType[] | undefined
  if (tab === "affiliates") typeFilter = AFFILIATE_TYPES
  else if (tab === "farmin") typeFilter = FARM_IN_TYPES
  else if (tab === "farmout") typeFilter = FARM_OUT_TYPES
  else if (tab === "reservations") typeFilter = TRIP_TYPES
  else if (tab === "quotes") typeFilter = QUOTE_TYPES
  else if (tab === "unread") typeFilter = undefined

  const where = {
    companyId,
    ...(typeFilter ? { type: { in: typeFilter } } : {}),
    ...(tab === "unread" ? { readAt: null } : {}),
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  }

  const notifications = await prisma.appNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  const nextCursor = hasMore
    ? notifications[notifications.length - 1]?.createdAt.toISOString()
    : null

  return NextResponse.json({ notifications, nextCursor })
}
