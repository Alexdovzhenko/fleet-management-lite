"use client"

import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dispatch": "Dispatch",
  "/calendar": "Calendar",
  "/trips": "Trips",
  "/customers": "Customers",
  "/drivers": "Drivers",
  "/vehicles": "Vehicles",
  "/invoices": "Invoices",
  "/settings": "Settings",
}

function getPageTitle(pathname: string): string {
  const exact = pageTitles[pathname]
  if (exact) return exact
  const match = Object.keys(pageTitles)
    .filter((k) => k !== "/")
    .find((k) => pathname.startsWith(k))
  return match ? pageTitles[match] : "Fleet Management"
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const today = format(new Date(), "EEEE, MMMM d")

  return (
    <header className="h-[60px] border-b bg-white flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="w-4 h-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  )
}
