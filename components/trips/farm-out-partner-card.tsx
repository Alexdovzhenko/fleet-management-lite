"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, MapPin, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"

interface FarmOutPartnerCardProps {
  selectedPartnerId: string | null
  onSelectPartner: (partnerId: string | null) => void
}

interface PartnerData {
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

export function FarmOutPartnerCard({ selectedPartnerId, onSelectPartner }: FarmOutPartnerCardProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch partners
  const { data: partners = [], isLoading } = useQuery<PartnerData[]>({
    queryKey: ["affiliate-partners"],
    queryFn: async () => {
      const res = await fetch("/api/affiliates/connections/partners")
      if (!res.ok) throw new Error("Failed to fetch partners")
      return res.json()
    },
    staleTime: 30_000,
  })

  // Filter partners by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.state || "").toLowerCase().includes(q) ||
        (p.affiliateCode || "").toLowerCase().includes(q)
    )
  }, [partners, search])

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        <Building2 className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Farm Out Partner</h4>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">Optional</span>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        {selectedPartner ? (
          // Selected partner preview
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
              {selectedPartner.logo ? (
                <img
                  src={selectedPartner.logo}
                  alt={selectedPartner.name}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-200">
                  <Building2 className="w-4 h-4 text-blue-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selectedPartner.name}</p>
                {(selectedPartner.city || selectedPartner.state) && (
                  <p className="text-xs text-gray-600 truncate">
                    {[selectedPartner.city, selectedPartner.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectPartner(null)
                  setSearch("")
                  setSearchOpen(false)
                }}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Remove selected partner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Change partner button */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-full text-xs text-gray-500 hover:text-blue-600 transition-colors text-center py-1.5 font-medium"
            >
              Change partner
            </button>
          </div>
        ) : (
          // Search/select state
          <>
            <div className="relative">
              <Input
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                className="h-9 text-sm pr-3"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Partners dropdown */}
            {searchOpen && (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg z-10">
                {isLoading && (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">Loading partners...</div>
                )}
                {!isLoading && filtered.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">
                    {partners.length === 0 ? "No partners connected" : "No matches found"}
                  </div>
                )}
                {filtered.length > 0 && (
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-100">
                    {filtered.map((partner) => (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => {
                          onSelectPartner(partner.id)
                          setSearchOpen(false)
                          setSearch("")
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5"
                      >
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900">{partner.name}</p>
                          {(partner.city || partner.state) && (
                            <p className="text-[11px] text-gray-500">
                              {[partner.city, partner.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Close search on outside click */}
            {searchOpen && (
              <div
                className="fixed inset-0 z-[9]"
                onClick={() => setSearchOpen(false)}
                aria-hidden="true"
              />
            )}

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Select an affiliate partner to farm out this reservation. You can change this anytime.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
