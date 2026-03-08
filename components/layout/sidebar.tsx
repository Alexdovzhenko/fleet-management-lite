"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Grid3X3,
  Calendar,
  List,
  Users,
  UserCheck,
  Car,
  FileText,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dispatch", icon: Grid3X3, label: "Dispatch" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/trips", icon: List, label: "Trips" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/drivers", icon: UserCheck, label: "Drivers" },
  { href: "/vehicles", icon: Car, label: "Vehicles" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col w-[240px] min-h-screen border-r bg-primary-900 text-white"
      style={{ backgroundColor: "#0A1628" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-[60px] border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none text-white">FleetLite</div>
          <div className="text-[10px] text-white/50 leading-none mt-0.5">Pro Dispatch</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">Admin</div>
            <div className="text-[10px] text-white/50 truncate">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
