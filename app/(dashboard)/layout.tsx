import { DockNav } from "@/components/layout/dock-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 md:p-6 pb-32">{children}</main>
      <DockNav />
    </div>
  )
}
