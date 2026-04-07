import { cn, getTripStatusLabel } from "@/lib/utils"
import type { TripStatus } from "@/types"

interface TripStatusBadgeProps {
  status: TripStatus
  className?: string
}

const statusDotColor: Record<TripStatus, string> = {
  UNASSIGNED: "bg-gray-500",
  QUOTE: "bg-purple-500",
  CONFIRMED: "bg-blue-500",
  DISPATCHED: "bg-amber-500",
  DRIVER_EN_ROUTE: "bg-amber-400",
  DRIVER_ARRIVED: "bg-emerald-400",
  IN_PROGRESS: "bg-emerald-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-red-400",
}

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
        `status-${status.toLowerCase().replace(/_/g, "-")}`,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", statusDotColor[status])} />
      {getTripStatusLabel(status)}
    </span>
  )
}

export function TripStatusDot({ status }: { status: TripStatus }) {
  return (
    <span
      className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusDotColor[status])}
      title={getTripStatusLabel(status)}
    />
  )
}
