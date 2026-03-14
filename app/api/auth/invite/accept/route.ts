import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

// POST /api/auth/invite/accept — create Supabase user + DB user for invite
export async function POST(request: NextRequest) {
  const { token, name, password } = await request.json()

  if (!token || !name || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const invite = await prisma.companyInvite.findUnique({
    where: { token },
    include: { company: true },
  })

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 })
  if (invite.acceptedAt) return NextResponse.json({ error: "Invite already used" }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 })

  // Use service role to create auth user without email confirmation
  const cookieStore = await cookies()
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { companyId: invite.companyId, role: invite.role },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Create DB user
  await prisma.user.create({
    data: {
      authId: authData.user.id,
      email: invite.email,
      name,
      role: invite.role,
      companyId: invite.companyId,
    },
  })

  // Mark invite accepted
  await prisma.companyInvite.update({
    where: { token },
    data: { acceptedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
