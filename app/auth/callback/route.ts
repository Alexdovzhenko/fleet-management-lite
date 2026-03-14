import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Build the redirect response first, then set cookies on it
  let redirectTo = `${origin}/onboarding`

  // We'll collect cookies to set from Supabase
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach((c) => cookiesToSet.push(c))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
  }

  const authUser = data.session.user

  try {
    // Check if User row already exists (returning user)
    const existingUser = await prisma.user.findUnique({ where: { authId: authUser.id } })

    if (existingUser) {
      const company = await prisma.company.findUnique({ where: { id: existingUser.companyId } })
      if (company && !company.onboardingCompleted) {
        redirectTo = `${origin}/onboarding`
      } else {
        redirectTo = `${origin}/dispatch`
      }
    } else {
      // New user — create Company + User from signup metadata
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

      await prisma.user.create({
        data: {
          authId: authUser.id,
          email: authUser.email!,
          name: contactName,
          role: "OWNER",
          companyId: company.id,
        },
      })

      await supabase.auth.updateUser({
        data: { companyId: company.id, role: "OWNER" },
      })

      redirectTo = `${origin}/onboarding`
    }
  } catch (err) {
    console.error("Callback DB error:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=setup_failed`)
  }

  // Build response with cookies from Supabase set on it
  const response = NextResponse.redirect(redirectTo)
  cookiesToSet.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}
