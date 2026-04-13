"use client"

import { useRouter, usePathname } from "next/navigation"
import { Building2, BookMarked, Settings2, Zap, LayoutGrid, Mail, ExternalLink, User, Users, LogOut, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Section = "profile" | "address-book" | "service-types" | "status-actions" | "grid-columns" | "personal" | "team" | "sender-emails" | "pdf-branding" | "billing"

const NAV_GROUPS: { label: string; items: { key: Section; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "Company",
    items: [
      { key: "profile",      label: "Profile",      icon: Building2 },
      { key: "address-book", label: "Address Book",  icon: BookMarked },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { key: "service-types",   label: "Service Types",   icon: Settings2 },
      { key: "status-actions",  label: "Status Actions",  icon: Zap },
      { key: "grid-columns",    label: "Grid Columns",    icon: LayoutGrid },
    ],
  },
  {
    label: "Email & PDFs",
    items: [
      { key: "sender-emails", label: "Sender Emails", icon: Mail },
      { key: "pdf-branding",  label: "PDF Branding",  icon: ExternalLink },
      { key: "billing",       label: "Billing",       icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "personal", label: "Personal",     icon: User },
      { key: "team",     label: "Team",         icon: Users },
    ],
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Extract current section from pathname (/settings/profile -> profile)
  const currentSection = pathname.split("/").pop() as Section || "profile"

  const handleSectionChange = (newSection: Section) => {
    router.push(`/settings/${newSection}`)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden min-h-[calc(100vh-10rem)]">

        {/* ── Mobile Tab Bar (hidden on md+) ── */}
        <div className="md:hidden border-b border-gray-100 overflow-x-auto">
          <div className="flex px-2 py-2 gap-0.5 min-w-max">
            {NAV_GROUPS.flatMap((group) =>
              group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleSectionChange(item.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0",
                    currentSection === item.key
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <item.icon className={cn("w-[13px] h-[13px] flex-shrink-0", currentSection === item.key ? "text-blue-600" : "text-gray-400")} />
                  <span className="hidden xs:inline">{item.label}</span>
                </button>
              ))
            )}
          </div>
          {/* Mobile logout */}
          <div className="border-t border-gray-100 px-2 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-[13px] h-[13px]" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Desktop Sidebar (hidden on mobile) ── */}
        <aside className="hidden md:flex md:w-[200px] md:shrink-0 md:border-r md:border-gray-100 md:flex-col md:bg-gray-50/40">
          <div className="px-5 py-[18px] border-b border-gray-100">
            <p className="text-[13px] font-bold text-gray-900 tracking-tight">Settings</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2.5 mb-1.5">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSectionChange(item.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all text-left",
                        currentSection === item.key
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-500 hover:bg-gray-100/80 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("w-[15px] h-[15px] flex-shrink-0", currentSection === item.key ? "text-blue-600" : "text-gray-400")} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <LogOut className="w-[15px] h-[15px] flex-shrink-0 text-gray-400" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
