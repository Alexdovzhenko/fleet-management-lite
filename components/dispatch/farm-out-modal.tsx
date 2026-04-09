"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Building2, MapPin, Phone, CheckCircle2, ChevronRight, Loader2, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCreateFarmOut } from "@/lib/hooks/use-farm-outs"
import { formatCurrency } from "@/lib/utils"
import type { Trip } from "@/types"

interface Partner {
  connectionId: string
  affiliateCode: string | null
  id: string
  name: string
  email: string | null
  phone: string | null
  logo: string | null
  city: string | null
  state: string | null
}

function usePartners() {
  return useQuery<Partner[]>({
    queryKey: ["affiliate-partners"],
    queryFn: async () => {
      const res = await fetch("/api/affiliates/connections/partners")
      if (!res.ok) throw new Error("Failed to fetch partners")
      return res.json()
    },
    staleTime: 30_000,
  })
}

interface FarmOutModalProps {
  trip: Trip
  open: boolean
  onClose: () => void
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter",
  PARTY_BUS: "Party Bus",
  COACH: "Coach",
  OTHER: "Other",
}

const VEHICLE_TYPE_OPTIONS = Object.entries(VEHICLE_TYPE_LABELS)

export function FarmOutModal({ trip, open, onClose }: FarmOutModalProps) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [agreedPrice, setAgreedPrice] = useState<string>("")
  const [vehicleType, setVehicleType] = useState<string>(trip.vehicle?.type || "")
  const [step, setStep] = useState<"select" | "confirm">("select")
  const [successId, setSuccessId] = useState<string | null>(null)

  const { data: partners = [], isLoading } = usePartners()
  const createFarmOut = useCreateFarmOut(trip.id)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return partners.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.city || "").toLowerCase().includes(q) ||
        (a.state || "").toLowerCase().includes(q) ||
        (a.affiliateCode || "").toLowerCase().includes(q)
    )
  }, [partners, search])

  const selectedAffiliate = partners.find((a) => a.id === selectedId)

  function handleSelectAffiliate(id: string) {
    setSelectedId(id)
    setStep("confirm")
  }

  function handleBack() {
    setStep("select")
    setSelectedId(null)
  }

  async function handleConfirm() {
    if (!selectedId) return
    try {
      const result = await createFarmOut.mutateAsync({
        toCompanyId: selectedId,
        message: message.trim() || undefined,
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : undefined,
        vehicleType: vehicleType || undefined,
      })
      setSuccessId(result.id)
    } catch {
      // error handled below via createFarmOut.error
    }
  }

  function handleClose() {
    onClose()
    // Reset after animation
    setTimeout(() => {
      setStep("select")
      setSelectedId(null)
      setSearch("")
      setMessage("")
      setAgreedPrice("")
      setVehicleType(trip.vehicle?.type || "")
      setSuccessId(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {step === "confirm" && !successId && (
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-600 transition-colors mr-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              )}
              <h2 className="text-base font-semibold text-gray-900">
                {successId ? "Farm-Out Sent" : step === "select" ? "Farm Out Trip" : "Confirm Farm-Out"}
              </h2>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {trip.tripNumber} · {trip.pickupAddress.split(",")[0]} → {trip.dropoffAddress.split(",")[0]}
          </p>
        </div>

        {/* Success state */}
        {successId && (
          <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Request sent!</p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedAffiliate?.name} has been notified and will confirm shortly.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2" style={{ backgroundColor: "#2563EB" }}>
              Done
            </Button>
          </div>
        )}

        {/* Select affiliate step */}
        {!successId && step === "select" && (
          <>
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="Search affiliates by name, city, or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[360px] px-2 pb-4">
              {isLoading && (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading affiliates...</span>
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400">
                  {partners.length === 0
                    ? "No connected affiliates. Connect with affiliates in the Affiliates Network."
                    : "No affiliates match your search."}
                </div>
              )}
              {filtered.map((affiliate) => (
                <button
                  key={affiliate.id}
                  onClick={() => handleSelectAffiliate(affiliate.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  {/* Avatar */}
                  {affiliate.logo ? (
                    <img
                      src={affiliate.logo}
                      alt={affiliate.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{affiliate.name}</span>
                      {affiliate.affiliateCode && (
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {affiliate.affiliateCode}
                        </span>
                      )}
                    </div>
                    {(affiliate.city || affiliate.state) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          {[affiliate.city, affiliate.state].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Confirm step */}
        {!successId && step === "confirm" && selectedAffiliate && (
          <div className="px-6 py-5 space-y-5">
            {/* Selected affiliate */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              {selectedAffiliate.logo ? (
                <img
                  src={selectedAffiliate.logo}
                  alt={selectedAffiliate.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedAffiliate.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {(selectedAffiliate.city || selectedAffiliate.state) && (
                    <span className="text-xs text-gray-500">
                      {[selectedAffiliate.city, selectedAffiliate.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {selectedAffiliate.phone && (
                    <a
                      href={`tel:${selectedAffiliate.phone}`}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedAffiliate.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Trip summary */}
            <div className="space-y-1 text-sm text-gray-600">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trip Details</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900 font-medium">{new Date(trip.pickupDate).toLocaleDateString()}</span>
                <span className="text-gray-500">Time</span>
                <span className="text-gray-900 font-medium">{trip.pickupTime}</span>
                <span className="text-gray-500">Pickup</span>
                <span className="text-gray-900 font-medium truncate">{trip.pickupAddress.split(",")[0]}</span>
                <span className="text-gray-500">Dropoff</span>
                <span className="text-gray-900 font-medium truncate">{trip.dropoffAddress.split(",")[0]}</span>
                <span className="text-gray-500">Passengers</span>
                <span className="text-gray-900 font-medium">{trip.passengerCount}</span>
                {trip.totalPrice && (
                  <>
                    <span className="text-gray-500">Trip Value</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(trip.totalPrice)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Vehicle type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Type Required
              </label>
              <div className="relative">
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all appearance-none pr-9"
                >
                  <option value="">— Not specified —</option>
                  {VEHICLE_TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Agreed price */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Agreed Farm-Out Price <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Message <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Any special instructions or notes for the receiving company..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Error */}
            {createFarmOut.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {createFarmOut.error.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={createFarmOut.isPending}
              >
                Back
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: "#2563EB" }}
                onClick={handleConfirm}
                disabled={createFarmOut.isPending}
              >
                {createFarmOut.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  "Send Farm-Out Request"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
