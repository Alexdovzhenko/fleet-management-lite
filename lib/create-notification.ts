import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import type { AppNotificationType } from "@prisma/client"

export async function createNotification({
  companyId,
  type,
  title,
  body,
  entityId,
  entityType,
  metadata,
}: {
  companyId: string
  type: AppNotificationType
  title: string
  body: string
  entityId?: string
  entityType?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await prisma.appNotification.create({
      data: {
        companyId,
        type,
        title,
        body,
        entityId,
        entityType,
        metadata: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  } catch (err) {
    // Non-fatal — never let notification creation crash the main request
    console.error("createNotification error:", err)
  }
}
