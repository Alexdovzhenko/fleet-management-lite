"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Grid3X3, Plus, Users, List } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/dispatch", icon: Grid3X3, label: "Dispatch" },
  { href: "/trips/new", icon: Plus, label: "New Trip", isAction: true },
  { href: "/trips", icon: List, label: "Trips" },
  { href: "/customers", icon: Users, label: "Customers" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) && item.href !== "/trips/new"

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-6 rounded-full shadow-lg"
                style={{ backgroundColor: "#2563EB" }}
              >
                <item.icon className="w-5 h-5 text-white" />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
