import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { buildPasswordChangeOtpEmailHtml } from "@/lib/email"

function hashCode(code: string): string {
  return createHash("sha256").update(code + (process.env.OTP_SALT || "lx-otp-salt")).digest("hex")
}

function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
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
    const body = await request.json()
    const { currentPassword } = body

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 })
    }

    // Rate limiting: max 3 OTP requests per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const recentCount = await prisma.passwordChangeOtp.count({
      where: { userId, createdAt: { gte: fifteenMinutesAgo } },
    })
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      )
    }

    // Get user record
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Verify current password by signing in with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      // Generic message — don't reveal whether the password is wrong vs account issues
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Generate OTP and store hashed
    const code = generateOtp()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

    // Invalidate any existing OTPs for this user, then create fresh one
    await prisma.passwordChangeOtp.deleteMany({ where: { userId } })
    await prisma.passwordChangeOtp.create({ data: { userId, codeHash, expiresAt } })

    // Send email
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing — skipping email, OTP:", code)
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME ?? "Livery Connect"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@liveryconnect.com"}>`,
        to: user.email,
        subject: `${code} — Your Livery Connect verification code`,
        html: buildPasswordChangeOtpEmailHtml({ code, userName: user.name }),
      })
    }

    return NextResponse.json({ sent: true, email: maskEmail(user.email) })
  } catch (error) {
    console.error("change-password/request error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  const masked = local.slice(0, 2) + "***"
  return `${masked}@${domain}`
}
