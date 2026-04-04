# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                  # Start dev server at localhost:3000

# Build
npm run build                # prisma generate + next build

# Database
npm run db:push              # Push schema changes (no migration history)
npm run db:migrate           # Create and apply a migration
npm run db:seed              # Seed demo data (tsx prisma/seed.ts)
npm run db:studio            # Open Prisma Studio

# Lint
npm run lint
```

All database commands read `.env.local` via `prisma.config.ts` — no separate `.env` needed.

## Architecture

### Tech Stack
- **Next.js 16** App Router, React 19, TypeScript
- **Tailwind v4** + **Shadcn v4** (uses Base UI, not Radix, for most primitives)
- **Prisma v7** + `@prisma/adapter-pg` — no `url` in `schema.prisma`; DB connection config lives in `prisma.config.ts`
- **React Query v5** for all server state; **Zustand** for UI-only state
- **Supabase** for auth (SSR cookies via `@supabase/ssr`)
- **Resend** for email delivery; **@react-pdf/renderer** for server-side PDF generation

### Key Gotchas

**Prisma v7**: Connection string goes in `prisma.config.ts`, not `schema.prisma`. The `PrismaPg` adapter is required — never use the default Prisma client directly.

**Shadcn v4 / Base UI**: `Select` `onValueChange` types as `{}`, not `string`. Always guard with `typeof v === "string"` before using the value.

**Zod v4 + react-hook-form**: Use `z.number()` with `valueAsNumber: true` on the input (not `z.coerce.number()`). Cast resolver as `Resolver<T>`. ZodError uses `.issues`, not `.errors`.

**@react-pdf/renderer**: Must stay server-only. It's listed in `serverExternalPackages` in `next.config.ts`. Do not import from client components.

**Resend**: Initialized lazily in `lib/email.ts` (not at module level) to avoid build-time crash when `RESEND_API_KEY` is absent.

**Prisma client** (`lib/db.ts`): Falls back to a placeholder connection string at build time so `prisma generate` succeeds without a real DB.

### Multi-Tenancy
Every model has `companyId`. All API routes call `requireAuth()` from `lib/auth-context.ts`, which returns `{ userId, companyId, role }`. Every DB query must filter by `companyId` from the auth context — never trust `companyId` from request body/params.

### Auth Flow
1. Supabase handles sign-up/sign-in.
2. `requireAuth()` reads the Supabase session from cookies, looks up the `User` row by `authId`.
3. If no `User` row exists (email confirmation disabled), it auto-bootstraps `Company` + `User` rows.
4. Dashboard layout (`app/(dashboard)/layout.tsx`) wraps everything in `<AuthProvider>` and redirects to `/onboarding` if `company.onboardingCompleted` is false.

### Route Structure
```
app/
  (dashboard)/          # Auth-protected routes, wrapped in AuthProvider + DockNav
    dispatch/           # Main trip board
    trips/new/          # New trip creation with post-create email shortcuts
    drivers/
    vehicles/
    customers/
    invoices/
    affiliates/         # Affiliate network + farm-out management
    settings/           # Company profile, sender emails, PDF branding, team
    ...
  api/
    trips/[tripId]/
      route.ts          # GET/PATCH/DELETE single trip
      send-email/       # POST — generates PDF + sends via Resend
      farm-out/         # Farm-out lifecycle
    sender-emails/      # GET (auto-seeds default) / POST
    sender-emails/[id]/ # PUT / DELETE (auto-promotes next default)
    ai/
      parse-trip/       # Claude: natural language → structured trip data
      suggest-driver/   # Claude: suggest driver based on trip
    public/
      profile/          # Public company profile (no auth)
      quote-request/    # Public quote submission form
  onboarding/           # First-run wizard
  p/[slug]/             # Public-facing company profile pages
```

### Data Layer Pattern
Each entity follows the same pattern:
1. **API route** in `app/api/<entity>/` — handles auth, DB queries, returns JSON
2. **React Query hook** in `lib/hooks/use-<entity>.ts` — wraps fetch calls, exposes `useQuery`/`useMutation`
3. **Types** declared in `types/index.ts` (mirrors Prisma model shapes as plain interfaces)

### Zustand Stores (`stores/`)
- `dock-store.ts` — active nav item and dock visibility
- `column-order-store.ts` — dispatch board column ordering
- `status-actions-store.ts` — which status action panel is open

### AI Features
`app/api/ai/parse-trip/` and `app/api/ai/suggest-driver/` use `claude-haiku-4-5` via `@anthropic-ai/sdk`. Parse-trip converts free-text trip descriptions into structured `Trip` fields. Suggest-driver ranks available drivers based on trip context.

### Email + PDF System
- `lib/email.ts` — `sendEmailWithPdf()` + HTML builders for Driver/Client/Affiliate
- `lib/pdf.tsx` — `generateDriverJobOrderPdf()` / `generateReservationPdf()` using `@react-pdf/renderer`
- `app/api/trips/[tripId]/send-email/route.ts` — orchestrates: resolve recipient → fetch branding → generate PDF → send via Resend → record `TripNotification`
- `components/email/send-email-modal.tsx` — reusable modal used in both the edit flow and post-create success screen
- Resend sender: platform always sends from `RESEND_FROM_EMAIL`; company's `SenderEmail` is used as `replyTo`
- Free Resend tier (`onboarding@resend.dev`) can only deliver to the account owner's own email

### Public Profile (`app/p/[slug]/`)
Unauthenticated pages for company profiles and quote request forms. Uses `app/api/public/` routes which skip auth.

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=
DIRECT_URL=                         # Supabase direct connection (for migrations)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=                  # e.g. onboarding@resend.dev or noreply@yourdomain.com
RESEND_FROM_NAME=
NEXT_PUBLIC_MAPBOX_TOKEN=
FLIGHTAWARE_API_KEY=                # optional, for flight tracking
```

## Deployment
- **Vercel** (production at www.liveryconnect.com)
- All env vars above must be set in Vercel project settings
- `npm run build` runs `prisma generate` first — Prisma generate must succeed without a real DB (handled by the placeholder fallback in `lib/db.ts`)
