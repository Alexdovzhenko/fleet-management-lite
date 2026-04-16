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
    OPEN: "Open",
    SETTLED: "Settled",
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

export interface BillingTotals {
  primaryTotal: number
  secondaryTotal: number
  farmoutTotal: number
  subtotal: number
  discount: number
  gratuityAmt: number
  adjustmentsTotal: number
  taxAmt: number
  total: number
  totalPaid: number
  balance: number
}

export function computeBillingTotals(
  billingData: any | null | undefined,
  payments: { amount: string | number }[] = []
): BillingTotals {
  const lineItems = billingData?.lineItems ?? []
  const charges = billingData?.adjustments ?? {}

  // Sum line items by tab
  const primaryTotal = lineItems
    .filter((item: any) => item.tab === 'primary')
    .reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0)
  const secondaryTotal = lineItems
    .filter((item: any) => item.tab === 'secondary')
    .reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0)
  const farmoutTotal = lineItems
    .filter((item: any) => item.tab === 'farmout')
    .reduce((sum: number, item: any) => sum + (item.rate * item.qty), 0)

  // Calculate all charges
  const rate = charges.rate ?? 0
  const setupFee = charges.setupFee ?? 0
  const stc = charges.stc ?? 0
  const stops = charges.stops ?? 0
  const tolls = charges.tolls ?? 0
  const parking = charges.parking ?? 0
  const waiting = charges.waiting ?? 0
  const airportFee = charges.airportFee ?? 0
  const fuelSurcharge = charges.fuelSurcharge ?? 0
  const meetGreet = charges.meetGreet ?? 0
  const phone = charges.phone ?? 0
  const miscFee1 = charges.miscFee1 ?? 0
  const miscFee2 = charges.miscFee2 ?? 0
  const miscFee3 = charges.miscFee3 ?? 0
  const voucherTotal = (charges.voucherQty ?? 0) * (charges.voucherRate ?? 0)
  const perUnitTotal = (charges.perUnitQty ?? 0) * (charges.perUnitRate ?? 0)
  const perMileTotal = (charges.perMileQty ?? 0) * (charges.perMileRate ?? 0)
  const perPassTotal = (charges.perPassQty ?? 0) * (charges.perPassRate ?? 0)
  const holidayCharge = charges.holidayCharge ?? 0
  const lateEarlyCharge = charges.lateEarlyCharge ?? 0

  // Subtotal = all base charges before discount and tax
  const subtotal =
    primaryTotal +
    secondaryTotal +
    farmoutTotal +
    rate +
    setupFee +
    stc +
    stops +
    tolls +
    parking +
    waiting +
    airportFee +
    fuelSurcharge +
    meetGreet +
    phone +
    miscFee1 +
    miscFee2 +
    miscFee3 +
    voucherTotal +
    perUnitTotal +
    perMileTotal +
    perPassTotal +
    holidayCharge +
    lateEarlyCharge

  // Discount
  const discountType = charges.discountType ?? 'flat'
  const discountAmount = charges.discountAmount ?? 0
  const discount =
    discountType === 'flat' ? discountAmount : subtotal * (discountAmount / 100)
  const afterDiscount = subtotal - discount

  // Gratuity (applied after discount)
  const gratuityPercent = charges.gratuityPercent ?? 0
  const gratuityAmt = afterDiscount * (gratuityPercent / 100)

  // All adjustments total (excluding taxes)
  const adjustmentsTotal = gratuityAmt

  // Tax base = after discount + gratuity
  const taxBase = afterDiscount + gratuityAmt

  // Taxes
  const stdTax1 = taxBase * ((charges.stdTax1Percent ?? 0) / 100)
  const stateTax = taxBase * ((charges.stateTaxPercent ?? 0) / 100)
  const taxAmt = stdTax1 + stateTax

  // Total
  const total = taxBase + taxAmt

  // Payments
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0)
  const balance = total - totalPaid

  return {
    primaryTotal: Math.round(primaryTotal * 100) / 100,
    secondaryTotal: Math.round(secondaryTotal * 100) / 100,
    farmoutTotal: Math.round(farmoutTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    gratuityAmt: Math.round(gratuityAmt * 100) / 100,
    adjustmentsTotal: Math.round(adjustmentsTotal * 100) / 100,
    taxAmt: Math.round(taxAmt * 100) / 100,
    total: Math.round(total * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balance: Math.round(balance * 100) / 100,
  }
}
