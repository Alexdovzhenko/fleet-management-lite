import { cn } from "@/lib/utils"
import { useStatusConfig } from "@/lib/hooks/use-status-config"
import type { TripStatus } from "@/types"

interface TripStatusBadgeProps {
  status: TripStatus
  className?: string
}

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const { getStatusDotClass, getStatusLabel } = useStatusConfig()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
        `status-${status.toLowerCase().replace(/_/g, "-")}`,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", getStatusDotClass(status))} />
      {getStatusLabel(status)}
    </span>
  )
}

export function TripStatusDot({ status }: { status: TripStatus }) {
  const { getStatusDotClass, getStatusLabel } = useStatusConfig()

  return (
    <span
      className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getStatusDotClass(status))}
      title={getStatusLabel(status)}
    />
  )
}
