import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const MAX_ATTEMPTS = 5

function hashCode(code: string): string {
  return createHash("sha256").update(code + (process.env.OTP_SALT || "lx-otp-salt")).digest("hex")
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (password.length > 128) return "Password is too long"
  return null
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth.ctx

  try {
    const body = await request.json()
    const { newPassword, code } = body

    if (!newPassword || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const passwordError = validatePassword(String(newPassword))
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

    const codeStr = String(code).trim().replace(/\s/g, "")
    if (!/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: "Verification code must be 6 digits" }, { status: 400 })
    }

    // Find the latest OTP for this user
    const otp = await prisma.passwordChangeOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    if (!otp) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      )
    }

    // Check expiry first
    if (otp.expiresAt < new Date()) {
      await prisma.passwordChangeOtp.delete({ where: { id: otp.id } })
      return NextResponse.json(
        { error: "Code expired. Please request a new one.", expired: true },
        { status: 400 }
      )
    }

    // Check max attempts
    if (otp.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordChangeOtp.delete({ where: { id: otp.id } })
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code.", expired: true },
        { status: 400 }
      )
    }

    // Verify code (constant-time comparison via hash)
    const inputHash = hashCode(codeStr)
    if (inputHash !== otp.codeHash) {
      const updated = await prisma.passwordChangeOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      })
      const remaining = MAX_ATTEMPTS - updated.attempts
      return NextResponse.json(
        { error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      )
    }

    // Code is valid — update password via Supabase Admin API
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.authId, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Supabase updateUser error:", updateError)
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 })
    }

    // Clean up OTP
    await prisma.passwordChangeOtp.delete({ where: { id: otp.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("change-password/verify error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
