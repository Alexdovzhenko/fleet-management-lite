import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TripPayment } from "@/types"

// ──────────────────────────────────────────────────────────────────────────────
// Billing Settings Hooks
// ──────────────────────────────────────────────────────────────────────────────

interface BillingSettings {
  id: string
  companyId: string
  companyName?: string
  address?: string
  phone?: string
  billingEmail?: string
  logoUrl?: string
  dateFormat: string
  invoicePrefix: string
  paymentTerms: string
  footerNote?: string
  createdAt: string
  updatedAt: string
}

async function fetchBillingSettings(): Promise<BillingSettings> {
  const res = await fetch("/api/settings/billing")
  if (!res.ok) {
    try {
      const errorData = await res.json()
      throw new Error(errorData.details || errorData.error || "Failed to fetch billing settings")
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error("Failed to fetch billing settings")
    }
  }
  return res.json()
}

async function updateBillingSettings(data: Partial<BillingSettings>): Promise<BillingSettings> {
  const res = await fetch("/api/settings/billing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    try {
      const errorData = await res.json()
      throw new Error(errorData.details || errorData.error || "Failed to update billing settings")
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error("Failed to update billing settings")
    }
  }
  return res.json()
}

async function uploadBillingLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/settings/billing/logo", {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    try {
      const errorData = await res.json()
      throw new Error(errorData.details || errorData.error || "Failed to upload logo")
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error("Failed to upload logo")
    }
  }
  return res.json()
}

export function useBillingSettings() {
  return useQuery({
    queryKey: ["billingSettings"],
    queryFn: fetchBillingSettings,
  })
}

export function useUpdateBillingSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateBillingSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billingSettings"] })
    },
  })
}

export function useUploadBillingLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: uploadBillingLogo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billingSettings"] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Trip Billing Hooks
// ──────────────────────────────────────────────────────────────────────────────

interface BillingData {
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
  miscFee1Label: string
  miscFee1Amount: number
  miscFee2Label: string
  miscFee2Amount: number
  miscFee3Label: string
  miscFee3Amount: number
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

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  billTo: {
    name: string
    email?: string
    phone?: string
  }
  company: {
    name: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
  lineItems: Array<{
    description: string
    qty: number
    unitPrice: number
    amount: number
  }>
  summary: {
    subtotal: number
    farmOutTotal: number
    discount: number
    creditCardFee: number
    gratuity: number
    subtotalWithAdjustments: number
    tax: number
    total: number
  }
  paymentTerms: string
  footerNote?: string
}

async function fetchTripBilling(tripId: string): Promise<{ billingData: BillingData }> {
  const res = await fetch(`/api/trips/${tripId}/billing`)
  if (!res.ok) throw new Error("Failed to fetch trip billing")
  return res.json()
}

async function updateTripBilling(
  tripId: string,
  data: Partial<BillingData>
): Promise<{ billingData: BillingData }> {
  const res = await fetch(`/api/trips/${tripId}/billing`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update trip billing")
  return res.json()
}

async function fetchTripInvoice(tripId: string): Promise<InvoiceData> {
  const res = await fetch(`/api/trips/${tripId}/invoice`)
  if (!res.ok) throw new Error("Failed to fetch invoice data")
  return res.json()
}

async function fetchInvoicesByTrip(tripNumber: string): Promise<any[]> {
  const res = await fetch(`/api/billing/invoices?search=${encodeURIComponent(tripNumber)}`)
  if (!res.ok) throw new Error("Failed to fetch invoices")
  return res.json()
}

async function fetchInvoicesByCustomer(customerId: string): Promise<any[]> {
  const res = await fetch(`/api/billing/invoices?accountId=${encodeURIComponent(customerId)}`)
  if (!res.ok) throw new Error("Failed to fetch invoices")
  return res.json()
}

export function useTripBilling(tripId: string | undefined) {
  return useQuery({
    queryKey: ["tripBilling", tripId],
    queryFn: () => fetchTripBilling(tripId!),
    enabled: !!tripId,
  })
}

export function useUpdateTripBilling(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BillingData>) => updateTripBilling(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tripBilling", tripId] })
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
      qc.invalidateQueries({ queryKey: ["tripInvoice", tripId] })
    },
  })
}

export function useTripInvoice(tripId: string | undefined) {
  return useQuery({
    queryKey: ["tripInvoice", tripId],
    queryFn: () => fetchTripInvoice(tripId!),
    enabled: !!tripId,
  })
}

export function useInvoicesByTrip(tripNumber: string | undefined) {
  return useQuery({
    queryKey: ["invoicesByTrip", tripNumber],
    queryFn: () => fetchInvoicesByTrip(tripNumber!),
    enabled: !!tripNumber,
  })
}

export function useInvoicesByCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ["invoicesByCustomer", customerId],
    queryFn: () => fetchInvoicesByCustomer(customerId!),
    enabled: !!customerId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Payment Hooks (existing)
// ──────────────────────────────────────────────────────────────────────────────

async function fetchPayments(tripId: string): Promise<TripPayment[]> {
  const res = await fetch(`/api/trips/${tripId}/payments`)
  if (!res.ok) throw new Error("Failed to fetch payments")
  return res.json()
}

async function addPayment(
  tripId: string,
  data: { amount: number; method: string; notes?: string; paidAt?: string }
): Promise<TripPayment> {
  const res = await fetch(`/api/trips/${tripId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to add payment")
  return res.json()
}

async function deletePayment(tripId: string, paymentId: string): Promise<void> {
  const res = await fetch(`/api/trips/${tripId}/payments/${paymentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete payment")
}

export function usePayments(tripId: string | undefined) {
  return useQuery({
    queryKey: ["payments", tripId],
    queryFn: () => fetchPayments(tripId!),
    enabled: !!tripId,
  })
}

export function useAddPayment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { amount: number; method: string; notes?: string; paidAt?: string }) =>
      addPayment(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", tripId] })
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
    },
  })
}

export function useDeletePayment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(tripId, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", tripId] })
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Invoice Creation Hook
// ──────────────────────────────────────────────────────────────────────────────

async function createTripInvoice(tripId: string): Promise<any> {
  const res = await fetch(`/api/trips/${tripId}/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    try {
      const errorData = await res.json()
      throw new Error(errorData.error || "Failed to create invoice")
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error("Failed to create invoice")
    }
  }
  return res.json()
}

export function useCreateTripInvoice(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createTripInvoice(tripId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
      qc.invalidateQueries({ queryKey: ["tripInvoice", tripId] })
      qc.invalidateQueries({ queryKey: ["invoicesByCustomer"] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Invoice Send Hook
// ──────────────────────────────────────────────────────────────────────────────

async function sendInvoice(
  tripId: string,
  data: { primaryEmail: string; secondaryEmail?: string; message?: string; senderEmailId?: string }
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/trips/${tripId}/invoice/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    try {
      const errorData = await res.json()
      throw new Error(errorData.error || "Failed to send invoice")
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error("Failed to send invoice")
    }
  }
  return res.json()
}

export function useSendInvoice(tripId: string) {
  return useMutation({
    mutationFn: (data: { primaryEmail: string; secondaryEmail?: string; message?: string; senderEmailId?: string }) =>
      sendInvoice(tripId, data),
  })
}
