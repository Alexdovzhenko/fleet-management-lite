import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { Resend } from "resend"
import { buildPasswordChangeOtpEmailHtml } from "@/lib/email"

function hashCode(code: string): string {
  return createHash("sha256").update(code + (process.env.OTP_SALT || "lx-otp-salt")).digest("hex")
}

function generateOtp(): string {
  const array = new Uint32Array(1)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    const { randomFillSync } = require("crypto")
    randomFillSync(array)
  }
  return String(100000 + (array[0] % 900000))
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth.ctx

  try {
    // Only allow resend if a pending OTP exists (meaning current password was already verified)
    const existing = await prisma.passwordChangeOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "No pending verification. Please start the change password process again." },
        { status: 400 }
      )
    }

    // Cooldown: only allow resend if the last OTP was created > 60s ago
    const secondsSinceCreated = (Date.now() - existing.createdAt.getTime()) / 1000
    if (secondsSinceCreated < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceCreated)
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting a new code.`, cooldown: waitSeconds },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const code = generateOtp()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Replace OTP
    await prisma.passwordChangeOtp.deleteMany({ where: { userId } })
    await prisma.passwordChangeOtp.create({ data: { userId, codeHash, expiresAt } })

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME ?? "Livery Connect"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@liveryconnect.com"}>`,
        to: user.email,
        subject: `${code} — Your Livery Connect verification code`,
        html: buildPasswordChangeOtpEmailHtml({ code, userName: user.name }),
      })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("change-password/resend error:", error)
    return NextResponse.json({ error: "Failed to resend code" }, { status: 500 })
  }
}
