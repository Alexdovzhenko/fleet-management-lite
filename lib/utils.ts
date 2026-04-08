import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns"
import type { TripStatus, VehicleType, DriverStatus, InvoiceStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (isToday(d)) return "Today"
  if (isTomorrow(d)) return "Tomorrow"
  return format(d, "MMM d, yyyy")
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d 'at' h:mm a")
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return ""
  const trimmed = time.trim()

  // Check if it has AM/PM
  if (/[AaPp][Mm]/.test(trimmed)) {
    // If it already has a colon, return as-is
    if (trimmed.includes(':')) {
      return trimmed
    }
    // If no colon (e.g., "2PM"), add ":00" before AM/PM
    const match = trimmed.match(/^(\d{1,2})\s*([APap][Mm])$/)
    if (match) {
      return `${match[1]}:00 ${match[2].toUpperCase()}`
    }
    return trimmed
  }

  // No AM/PM, try parsing 24-hour format (HH:MM)
  const [hours, minutes] = trimmed.split(":").map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatCurrency(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return "—"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function generateConfirmationNumber(): string {
  // Alphabet excludes visually ambiguous chars: 0/O, 1/I/L
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `LC-${code}`
}

export function generateInvoiceNumber(): string {
  const num = Math.floor(Math.random() * 999999).toString().padStart(6, "0")
  return `INV-${num}`
}

export function getTripStatusLabel(status: TripStatus): string {
  const labels: Record<TripStatus, string> = {
    UNASSIGNED:      "Unassigned",
    QUOTE:           "Quote",
    CONFIRMED:       "Assigned",
    DISPATCHED:      "Dispatched",
    DRIVER_EN_ROUTE: "On the Way",
    DRIVER_ARRIVED:  "On Location",
    IN_PROGRESS:     "POB",
    COMPLETED:       "Completed",
    CANCELLED:       "Cancelled",
    NO_SHOW:         "No Show",
  }
  return labels[status]
}

export function getTripStatusClass(status: TripStatus): string {
  const classes: Record<TripStatus, string> = {
    UNASSIGNED: "status-unassigned",
    QUOTE: "status-quote",
    CONFIRMED: "status-confirmed",
    DISPATCHED: "status-dispatched",
    DRIVER_EN_ROUTE: "status-driver-en-route",
    DRIVER_ARRIVED: "status-driver-arrived",
    IN_PROGRESS: "status-in-progress",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    NO_SHOW: "status-cancelled",
  }
  return classes[status]
}

export function getVehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    SEDAN: "Sedan",
    SUV: "SUV",
    STRETCH_LIMO: "Stretch Limo",
    SPRINTER: "Sprinter Van",
    PARTY_BUS: "Party Bus",
    COACH: "Coach Bus",
    OTHER: "Other",
  }
  return labels[type]
}

export function getDriverStatusLabel(status: DriverStatus): string {
  const labels: Record<DriverStatus, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    ON_LEAVE: "On Leave",
  }
  return labels[status]
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    DRAFT: "Draft",
    SENT: "Sent",
    VIEWED: "Viewed",
    PAID: "Paid",
    OVERDUE: "Overdue",
    CANCELLED: "Cancelled",
  }
  return labels[status]
}

export function truncateAddress(address: string, maxLength = 35): string {
  if (address.length <= maxLength) return address
  return address.slice(0, maxLength) + "…"
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function calculateTotal(
  price: number,
  gratuityPercent: number
): { gratuity: number; total: number } {
  const gratuity = Math.round(price * (gratuityPercent / 100) * 100) / 100
  return { gratuity, total: price + gratuity }
}
