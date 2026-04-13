/**
 * Billing calculation utilities
 * Real-time computation of totals, fees, and invoice data
 */

export interface BillingData {
  // Block 1 - Primary Charges
  flatRate: number
  perHourQty: number
  perHourRate: number
  travelTimeQty: number
  travelTimeRate: number
  waitTimeQty: number
  waitTimeRate: number
  extraStopsQty: number
  extraStopsRate: number
  airportFee: number
  parkingFee: number
  meetAndGreet: number
  carSeatQty: number
  carSeatRate: number
  lateEarlyCharge: number
  lateEarlyType: "late" | "early"
  creditCardFeePct: number
  gratuityPct: number
  discountPct: number

  // Block 2 - Additional Charges
  miscFee1Label: string
  miscFee1Amount: number
  miscFee2Label: string
  miscFee2Amount: number
  miscFee3Label: string
  miscFee3Amount: number

  // Block 3 - Farm-out Costs
  farmOutRate: number
  farmOutGratuity: number
  farmOutStops: number
  farmOutTolls: number
  farmOutParking: number
  farmOutAirportFee: number
  farmOutWaitTime: number
  farmOutFuelSurcharge: number
  farmOutMeetAndGreet: number
  farmOutChildSeat: number
  farmOutDiscountPct: number
  farmOutLateEarlyCharge: number
  farmOutLateEarlyType: "late" | "early"
  farmOutCCFeePct: number
}

export interface BillingTotals {
  // Block subtotals
  block1Subtotal: number
  block2Subtotal: number
  block3Subtotal: number

  // Combined subtotal (Block 1 + Block 2)
  subtotal: number

  // Adjustments on main total
  discount: number
  subtotalAfterDiscount: number
  gratuity: number
  creditCardFee: number

  // Subtotal with all adjustments
  subtotalWithAdjustments: number

  // Farm-out totals (separate)
  farmOutSubtotal: number
  farmOutDiscount: number
  farmOutLateEarlyCharge: number
  farmOutCCFee: number
  farmOutTotal: number

  // Grand total
  tax: number
  total: number
}

const DEFAULT_BILLING_DATA: BillingData = {
  flatRate: 0,
  perHourQty: 0,
  perHourRate: 0,
  travelTimeQty: 0,
  travelTimeRate: 0,
  waitTimeQty: 0,
  waitTimeRate: 0,
  extraStopsQty: 0,
  extraStopsRate: 0,
  airportFee: 0,
  parkingFee: 0,
  meetAndGreet: 0,
  carSeatQty: 0,
  carSeatRate: 0,
  lateEarlyCharge: 0,
  lateEarlyType: "late",
  creditCardFeePct: 0,
  gratuityPct: 0,
  discountPct: 0,
  miscFee1Label: "Misc Fee 1",
  miscFee1Amount: 0,
  miscFee2Label: "Misc Fee 2",
  miscFee2Amount: 0,
  miscFee3Label: "Misc Fee 3",
  miscFee3Amount: 0,
  farmOutRate: 0,
  farmOutGratuity: 0,
  farmOutStops: 0,
  farmOutTolls: 0,
  farmOutParking: 0,
  farmOutAirportFee: 0,
  farmOutWaitTime: 0,
  farmOutFuelSurcharge: 0,
  farmOutMeetAndGreet: 0,
  farmOutChildSeat: 0,
  farmOutDiscountPct: 0,
  farmOutLateEarlyCharge: 0,
  farmOutLateEarlyType: "late",
  farmOutCCFeePct: 0,
}

export function getDefaultBillingData(): BillingData {
  return JSON.parse(JSON.stringify(DEFAULT_BILLING_DATA))
}

/**
 * Compute all billing totals from billing data
 */
export function computeBillingTotals(data: Partial<BillingData> = {}): BillingTotals {
  const b = { ...DEFAULT_BILLING_DATA, ...data }

  // BLOCK 1 - Primary Charges
  const block1Subtotal =
    b.flatRate +
    b.perHourQty * b.perHourRate +
    b.travelTimeQty * b.travelTimeRate +
    b.waitTimeQty * b.waitTimeRate +
    b.extraStopsQty * b.extraStopsRate +
    b.airportFee +
    b.parkingFee +
    b.meetAndGreet +
    b.carSeatQty * b.carSeatRate +
    b.lateEarlyCharge

  // BLOCK 2 - Additional Charges
  const block2Subtotal = b.miscFee1Amount + b.miscFee2Amount + b.miscFee3Amount

  // Combined subtotal
  const subtotal = block1Subtotal + block2Subtotal

  // Discount
  const discount = (subtotal * b.discountPct) / 100
  const subtotalAfterDiscount = subtotal - discount

  // Gratuity (on subtotal after discount)
  const gratuity = (subtotalAfterDiscount * b.gratuityPct) / 100

  // Credit Card Fee (on subtotal after discount + gratuity)
  const creditCardFee = ((subtotalAfterDiscount + gratuity) * b.creditCardFeePct) / 100

  // Subtotal with all adjustments
  const subtotalWithAdjustments = subtotalAfterDiscount + gratuity + creditCardFee

  // BLOCK 3 - Farm-out Costs
  const farmOutSubtotal =
    b.farmOutRate +
    b.farmOutGratuity +
    b.farmOutStops +
    b.farmOutTolls +
    b.farmOutParking +
    b.farmOutAirportFee +
    b.farmOutWaitTime +
    b.farmOutFuelSurcharge +
    b.farmOutMeetAndGreet +
    b.farmOutChildSeat

  const farmOutDiscount = (farmOutSubtotal * b.farmOutDiscountPct) / 100
  const farmOutAfterDiscount = farmOutSubtotal - farmOutDiscount
  const farmOutLateEarlyCharge = b.farmOutLateEarlyCharge
  const farmOutCCFee = ((farmOutAfterDiscount + farmOutLateEarlyCharge) * b.farmOutCCFeePct) / 100
  const farmOutTotal = farmOutAfterDiscount + farmOutLateEarlyCharge + farmOutCCFee

  // Tax (not currently used, but included for future)
  const tax = 0

  // Grand total
  const total = subtotalWithAdjustments + farmOutTotal + tax

  return {
    block1Subtotal,
    block2Subtotal,
    block3Subtotal: farmOutSubtotal,
    subtotal,
    discount,
    subtotalAfterDiscount,
    gratuity,
    creditCardFee,
    subtotalWithAdjustments,
    farmOutSubtotal,
    farmOutDiscount,
    farmOutLateEarlyCharge,
    farmOutCCFee,
    farmOutTotal,
    tax,
    total,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
