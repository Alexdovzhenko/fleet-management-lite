import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { prisma } from "@/lib/db"

type AuthContext = {
  userId: string
  companyId: string
  role: string
}

type AuthResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse }

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    select: { id: true, companyId: true, role: true },
  })

  if (!user) {
    // No DB row yet — this happens when email confirmation is disabled and the
    // /auth/callback route was never triggered. Bootstrap Company + User now.
    try {
      const meta = authUser.user_metadata as { companyName?: string; contactName?: string }
      const companyName = meta?.companyName || "My Company"
      const contactName = meta?.contactName || authUser.email?.split("@")[0] || "Owner"

      const company = await prisma.company.create({
        data: {
          name: companyName,
          email: authUser.email!,
          timezone: "America/New_York",
          onboardingCompleted: false,
        },
      })

      const newUser = await prisma.user.create({
        data: {
          authId: authUser.id,
          email: authUser.email!,
          name: contactName,
          role: "OWNER",
          companyId: company.id,
        },
      })

      return { ok: true, ctx: { userId: newUser.id, companyId: company.id, role: "OWNER" } }
    } catch {
      // Race condition: a parallel request already bootstrapped this user.
      // Re-query to find the row that was just created.
      const existing = await prisma.user.findUnique({
        where: { authId: authUser.id },
        select: { id: true, companyId: true, role: true },
      })
      if (existing) {
        return { ok: true, ctx: { userId: existing.id, companyId: existing.companyId, role: existing.role } }
      }
      return {
        ok: false,
        response: NextResponse.json({ error: "Failed to set up account" }, { status: 500 }),
      }
    }
  }

  return { ok: true, ctx: { userId: user.id, companyId: user.companyId, role: user.role } }
}
