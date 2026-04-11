"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Building2, MapPin, ChevronRight, Loader2, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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

interface FarmOutPartnerSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (partnerId: string) => void
}

export function FarmOutPartnerSelectModal({ open, onClose, onSelect }: FarmOutPartnerSelectModalProps) {
  const [search, setSearch] = useState("")

  const { data: partners = [], isLoading } = usePartners()

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

  function handleClose() {
    onClose()
    setTimeout(() => {
      setSearch("")
    }, 300)
  }

  function handleSelect(id: string) {
    onSelect(id)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl" showCloseButton={false}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-900">Select Partner</h2>
            <button
              onClick={handleClose}
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 -mr-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          <p className="text-xs text-gray-500">Select an affiliate partner to farm out this reservation</p>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all placeholder:text-gray-400"
              placeholder="Search affiliates by name, city, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Partners list */}
        <div className="overflow-y-auto max-h-[400px] px-2 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading partners...</span>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">
              {partners.length === 0
                ? "No connected partners"
                : "No partners match your search"}
            </div>
          )}
          {filtered.map((affiliate) => (
            <button
              key={affiliate.id}
              onClick={() => handleSelect(affiliate.id)}
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
      </DialogContent>
    </Dialog>
  )
}
