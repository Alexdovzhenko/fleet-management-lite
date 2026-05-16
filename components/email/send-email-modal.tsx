"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  User, Car, ArrowRightLeft, Mail, FileText, ChevronDown,
  CheckCircle2, AlertTriangle, Loader2, Send, X, UserCheck,
} from "lucide-react"
import { useSenderEmails, useSendTripEmail } from "@/lib/hooks/use-sender-emails"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { cn } from "@/lib/utils"
import type { Trip, SenderEmail, Driver, Vehicle } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipientType = "driver" | "client" | "affiliate"

interface TabDef {
  key: RecipientType
  label: string
  Icon: React.ElementType
  getEmail: (trip: Trip) => string | null | undefined
  docType: string
  docDesc: string
  iconBg: string
  iconColor: string
}

const TABS: TabDef[] = [
  {
    key:       "driver",
    label:     "Driver",
    Icon:      Car,
    getEmail:  (t) => t.driver?.email ?? null,
    docType:   "Job Order",
    docDesc:   "Operational format — fast to read, driver-optimized",
    iconBg:    "var(--lc-bg-glass-hover)",
    iconColor: "var(--lc-text-secondary)",
  },
  {
    key:       "client",
    label:     "Client",
    Icon:      User,
    getEmail:  (t) => t.passengerEmail ?? t.customer?.email ?? null,
    docType:   "Reservation PDF",
    docDesc:   "Full confirmation — branded, professional",
    iconBg:    "rgba(96,165,250,0.15)",
    iconColor: "rgba(147,197,253,0.90)",
  },
  {
    key:       "affiliate",
    label:     "Affiliate",
    Icon:      ArrowRightLeft,
    getEmail:  (t) => {
      const accepted = t.farmOuts?.find(f => f.status === "ACCEPTED" || (f as { toCompany?: { id: string } }).toCompany)
      return (accepted as { toCompany?: { id: string; name: string } & { email?: string } })?.toCompany?.email ?? null
    },
    docType:   "Reservation PDF",
    docDesc:   "Full trip details — affiliate-professional format",
    iconBg:    "rgba(139,92,246,0.15)",
    iconColor: "rgba(196,181,253,0.90)",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Vehicle",
}

// ─── Driver Assignment Modal ──────────────────────────────────────────────────

interface DriverAssignmentModalProps {
  trip: Trip
  drivers: Driver[]
  vehicles: Vehicle[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (driverId: string, vehicleId?: string) => Promise<void>
  isLoading?: boolean
}

function DriverAssignmentModal({ trip, drivers, vehicles, open, onOpenChange, onAssign, isLoading = false }: DriverAssignmentModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [driverDropOpen, setDriverDropOpen] = useState(false)
  const [vehicleDropOpen, setVehicleDropOpen] = useState(false)
  const driverRef = useRef<HTMLDivElement>(null)
  const driverDropRef = useRef<HTMLDivElement>(null)
  const vehicleRef = useRef<HTMLDivElement>(null)
  const vehicleDropRef = useRef<HTMLDivElement>(null)

  const selectedDriver = drivers.find(d => d.id === selectedDriverId) ?? null
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? null

  useEffect(() => {
    if (!open) {
      setSelectedDriverId("")
      setSelectedVehicleId("")
      setDriverDropOpen(false)
      setVehicleDropOpen(false)
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        driverRef.current && !driverRef.current.contains(e.target as Node) &&
        driverDropRef.current && !driverDropRef.current.contains(e.target as Node)
      ) setDriverDropOpen(false)
      if (
        vehicleRef.current && !vehicleRef.current.contains(e.target as Node) &&
        vehicleDropRef.current && !vehicleDropRef.current.contains(e.target as Node)
      ) setVehicleDropOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 max-w-md overflow-hidden"
        showCloseButton={false}
        style={{
          background: "var(--lc-bg-surface)",
          border: "1px solid var(--lc-bg-glass-hover)",
          borderRadius: "18px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.70)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--lc-bg-glass-hover)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}
            >
              <UserCheck className="w-4 h-4" style={{ color: "#c9a87c" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--lc-text-primary)" }}>Assign Driver & Vehicle</h2>
              <p className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>{trip.tripNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Driver Picker */}
          <div ref={driverRef} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)" }}>Driver</p>
            {selectedDriver ? (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(201,168,124,0.08)", border: "1px solid rgba(201,168,124,0.20)" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{ background: "rgba(201,168,124,0.15)", color: "#c9a87c" }}>
                  {selectedDriver.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedDriver.avatarUrl} alt={selectedDriver.name} className="w-full h-full object-cover" />
                  ) : getInitials(selectedDriver.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{selectedDriver.name}</div>
                  {selectedDriver.phone && <div className="text-[11px] truncate" style={{ color: "var(--lc-text-dim)" }}>{selectedDriver.phone}</div>}
                </div>
                <button type="button" onClick={() => setSelectedDriverId("")} style={{ color: "var(--lc-text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.80)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDriverDropOpen(!driverDropOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  background: "var(--lc-bg-card)",
                  border: "1px dashed var(--lc-border)",
                  color: "var(--lc-text-label)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.35)"; (e.currentTarget as HTMLElement).style.color = "rgba(201,168,124,0.85)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--lc-border)"; (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass)" }}>
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 text-left text-sm">Select driver…</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${driverDropOpen ? "rotate-180" : ""}`} />
              </button>
            )}
            {driverDropOpen && !selectedDriver && createPortal(
              <div
                ref={driverDropRef}
                style={{
                  position: "fixed",
                  top: (driverRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                  left: driverRef.current?.getBoundingClientRect().left ?? 0,
                  width: driverRef.current?.getBoundingClientRect().width ?? 0,
                  zIndex: 9999,
                  background: "var(--lc-bg-surface)",
                  border: "1px solid var(--lc-border)",
                  borderRadius: "14px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.70)",
                  overflow: "hidden",
                }}
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)", borderBottom: "1px solid var(--lc-bg-glass-mid)" }}>
                  Active Drivers
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {drivers.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-center" style={{ color: "var(--lc-text-label)" }}>No active drivers</div>
                  ) : drivers.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setSelectedDriverId(d.id); setDriverDropOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                      style={{ borderBottom: "1px solid var(--lc-bg-card)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: "rgba(201,168,124,0.12)", color: "#c9a87c" }}>
                        {d.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
                        ) : getInitials(d.name)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--lc-text-secondary)" }}>{d.name}</div>
                        {d.phone && <div className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>{d.phone}</div>}
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#34d399" }} />
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Vehicle Picker */}
          <div ref={vehicleRef} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)" }}>
              Vehicle <span style={{ color: "var(--lc-text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(optional)</span>
            </p>
            {selectedVehicle ? (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass-mid)" }}>
                  <Car className="w-4 h-4" style={{ color: "var(--lc-text-secondary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{selectedVehicle.name}</div>
                  <div className="text-[11px]" style={{ color: "var(--lc-text-dim)" }}>
                    {VEHICLE_TYPE_LABEL[selectedVehicle.type] ?? "Vehicle"} · {selectedVehicle.capacity} pax
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedVehicleId("")} style={{ color: "var(--lc-text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.80)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setVehicleDropOpen(!vehicleDropOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  background: "var(--lc-bg-card)",
                  border: "1px dashed var(--lc-border)",
                  color: "var(--lc-text-label)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--lc-border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--lc-border)"; (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass)" }}>
                  <Car className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 text-left text-sm">Select vehicle…</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${vehicleDropOpen ? "rotate-180" : ""}`} />
              </button>
            )}
            {vehicleDropOpen && !selectedVehicle && createPortal(
              <div
                ref={vehicleDropRef}
                style={{
                  position: "fixed",
                  top: (vehicleRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                  left: vehicleRef.current?.getBoundingClientRect().left ?? 0,
                  width: vehicleRef.current?.getBoundingClientRect().width ?? 0,
                  zIndex: 9999,
                  background: "var(--lc-bg-surface)",
                  border: "1px solid var(--lc-border)",
                  borderRadius: "14px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.70)",
                  overflow: "hidden",
                }}
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)", borderBottom: "1px solid var(--lc-bg-glass-mid)" }}>
                  Available Vehicles
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {vehicles.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-center" style={{ color: "var(--lc-text-label)" }}>No active vehicles</div>
                  ) : vehicles.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVehicleId(v.id); setVehicleDropOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                      style={{ borderBottom: "1px solid var(--lc-bg-card)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass-mid)" }}>
                        <Car className="w-3.5 h-3.5" style={{ color: "var(--lc-text-dim)" }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium" style={{ color: "var(--lc-text-secondary)" }}>{v.name}</div>
                        <div className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>{VEHICLE_TYPE_LABEL[v.type] ?? "Vehicle"} · {v.capacity} pax</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Assign button */}
          <button
            type="button"
            disabled={!selectedDriverId || isLoading}
            onClick={() => selectedDriverId && onAssign(selectedDriverId, selectedVehicleId)}
            className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
            onMouseEnter={e => { if (selectedDriverId && !isLoading) (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : "Assign Driver"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Sender Selector ──────────────────────────────────────────────────────────

function SenderSelector({ senders, selected, onChange }: { senders: SenderEmail[]; selected: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = senders.find(s => s.id === selected) ?? senders[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-colors"
        style={{
          background: open ? "var(--lc-bg-glass-mid)" : "var(--lc-bg-glass)",
          border: `1px solid ${open ? "rgba(201,168,124,0.35)" : "var(--lc-border)"}`,
        }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.10)" }}>
          <Mail className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{current?.email ?? "Select sender"}</p>
          {current?.label && <p className="text-[11px] leading-tight" style={{ color: "var(--lc-text-label)" }}>{current.label}</p>}
        </div>
        {current?.isDefault && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
          >
            Default
          </span>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", open && "rotate-180")} style={{ color: "var(--lc-text-muted)" }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-50 overflow-hidden"
          style={{
            background: "var(--lc-bg-surface)",
            border: "1px solid var(--lc-border)",
            borderRadius: "14px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
          }}
        >
          {senders.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onChange(s.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors"
              style={{ borderBottom: "1px solid var(--lc-bg-glass)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: s.id === selected ? "#c9a87c" : "var(--lc-border-medium)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: s.id === selected ? "#c9a87c" : "var(--lc-text-secondary)" }}>{s.email}</p>
                {s.label && <p className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>{s.label}</p>}
              </div>
              {s.isDefault && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}>Default</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Doc type card ────────────────────────────────────────────────────────────

function DocTypeCard({ type, desc, iconBg, iconColor }: { type: string; desc: string; iconBg: string; iconColor: string }) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
      style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <FileText className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>{type}</p>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--lc-text-label)" }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SendEmailModalProps {
  trip: Trip
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultRecipient?: RecipientType
}

export function SendEmailModal({ trip, open, onOpenChange, defaultRecipient = "driver" }: SendEmailModalProps) {
  const [activeTab, setActiveTab] = useState<RecipientType>(defaultRecipient)
  const [senderEmailId, setSenderEmailId] = useState<string>("")
  const [recipientEmailOverride, setRecipientEmailOverride] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: senders = [] } = useSenderEmails()
  const { data: drivers = [] } = useDrivers()
  const { data: vehicles = [] } = useVehicles()
  const sendEmail = useSendTripEmail()

  useEffect(() => {
    const def = senders.find(s => s.isDefault) ?? senders[0]
    if (def && !senderEmailId) setSenderEmailId(def.id)
  }, [senders, senderEmailId])

  useEffect(() => {
    if (open) {
      setStatus("idle")
      setErrorMsg("")
      setRecipientEmailOverride("")
      setActiveTab(defaultRecipient)
    }
  }, [open, defaultRecipient])

  const tab = TABS.find(t => t.key === activeTab)!
  const resolved = tab.getEmail(trip)
  const toEmail = recipientEmailOverride.trim() || resolved
  const hasAffiliate = trip.farmOuts && trip.farmOuts.length > 0

  async function handleSend() {
    if (activeTab === "driver" && !trip.driverId) {
      setShowAssignmentModal(true)
      return
    }
    if (status === "sending") return
    setStatus("sending")
    setErrorMsg("")

    sendEmail.mutate({
      tripId:         trip.id,
      recipientType:  activeTab,
      recipientEmail: recipientEmailOverride.trim() || undefined,
      senderEmailId:  senderEmailId || undefined,
    }, {
      onSuccess: () => setStatus("success"),
      onError: (err) => {
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to send email")
      },
    })
  }

  async function handleAssignDriver(driverId: string, vehicleId?: string) {
    try {
      setIsAssigning(true)
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, vehicleId: vehicleId || null }),
      })
      if (!response.ok) throw new Error("Failed to assign driver")

      setShowAssignmentModal(false)
      setStatus("sending")
      setErrorMsg("")

      sendEmail.mutate({
        tripId:         trip.id,
        recipientType:  "driver",
        recipientEmail: trip.driver?.email || undefined,
        senderEmailId:  senderEmailId || undefined,
      }, {
        onSuccess: () => setStatus("success"),
        onError: (err) => {
          setStatus("error")
          setErrorMsg(err instanceof Error ? err.message : "Failed to send email")
        },
      })
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to assign driver")
      setIsAssigning(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="p-0 max-w-md overflow-hidden"
          showCloseButton={false}
          style={{
            background: "var(--lc-bg-surface)",
            border: "1px solid var(--lc-bg-glass-hover)",
            borderRadius: "20px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.70)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--lc-bg-glass-hover)" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}
              >
                <Send className="w-4 h-4" style={{ color: "#c9a87c" }} />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--lc-text-primary)" }}>Send Reservation Email</h2>
                <p className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>{trip.tripNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--lc-text-muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)"; (e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success state */}
          {status === "success" ? (
            <div className="px-6 py-10 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: "#34d399" }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--lc-text-primary)" }}>Email Sent</h3>
              <p className="text-sm mb-6" style={{ color: "var(--lc-text-dim)" }}>
                The {tab.docType.toLowerCase()} was sent to{" "}
                <span className="font-medium" style={{ color: "var(--lc-text-secondary)" }}>{toEmail}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStatus("idle"); setActiveTab(activeTab) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)", color: "var(--lc-text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
                >
                  Send Another
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                  style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-4">

              {/* Recipient tabs */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-label)" }}>Recipient</p>
                <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-mid)" }}>
                  {TABS.map(({ key, label, Icon }) => {
                    const isDisabled = key === "affiliate" && !hasAffiliate
                    const isActive = activeTab === key
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setActiveTab(key)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={
                          isActive
                            ? { background: "var(--lc-border)", color: "var(--lc-text-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.30)" }
                            : isDisabled
                            ? { color: "var(--lc-text-muted)", cursor: "not-allowed" }
                            : { color: "var(--lc-text-dim)" }
                        }
                        onMouseEnter={e => { if (!isActive && !isDisabled) (e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)" }}
                        onMouseLeave={e => { if (!isActive && !isDisabled) (e.currentTarget as HTMLElement).style.color = "var(--lc-text-dim)" }}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recipient email "To" */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-label)" }}>To</p>
                {resolved ? (
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                    style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden text-[10px] font-bold"
                      style={{ background: "var(--lc-bg-glass-hover)", color: "var(--lc-text-secondary)" }}
                    >
                      {activeTab === "driver" && trip.driver?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.driver.avatarUrl} alt={trip.driver.name} className="w-full h-full object-cover" />
                      ) : activeTab === "driver" ? (
                        trip.driver ? getInitials(trip.driver.name) : <Car className="w-3.5 h-3.5" />
                      ) : activeTab === "affiliate" ? (
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>
                        {activeTab === "driver" ? trip.driver?.name : activeTab === "client" ? (trip.passengerName ?? trip.customer?.name) : "Affiliate"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--lc-text-dim)" }}>{resolved}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#34d399" }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)" }}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(251,191,36,0.85)" }} />
                      <p className="text-xs font-medium" style={{ color: "rgba(251,191,36,0.85)" }}>
                        {activeTab === "driver" ? "No email on driver record" :
                         activeTab === "client"  ? "No email on passenger or customer record" :
                                                   "No accepted affiliate farm-out found"}
                      </p>
                    </div>
                    {activeTab !== "affiliate" && (
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "var(--lc-text-dim)" }}>Enter email address manually</p>
                        <input
                          type="email"
                          placeholder={activeTab === "driver" ? "driver@example.com" : "client@example.com"}
                          value={recipientEmailOverride}
                          onChange={e => setRecipientEmailOverride(e.target.value)}
                          className="w-full h-9 text-sm outline-none rounded-xl px-3 transition-colors"
                          style={{
                            background: "var(--lc-bg-glass)",
                            border: "1px solid var(--lc-border)",
                            color: "var(--lc-text-primary)",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)" }}
                          onBlur={e => { e.currentTarget.style.borderColor = "var(--lc-border)" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attached document */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-label)" }}>Attached Document</p>
                <DocTypeCard type={tab.docType} desc={tab.docDesc} iconBg={tab.iconBg} iconColor={tab.iconColor} />
              </div>

              {/* Sender */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-label)" }}>Sent From (Reply-To)</p>
                {senders.length > 0 ? (
                  <SenderSelector senders={senders} selected={senderEmailId} onChange={setSenderEmailId} />
                ) : (
                  <div
                    className="px-3.5 py-2.5 rounded-xl"
                    style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--lc-text-muted)" }}>Loading sender emails…</p>
                  </div>
                )}
                <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "var(--lc-text-muted)" }}>
                  Replies from recipients will go to this address.
                </p>
              </div>

              {/* Error */}
              {status === "error" && errorMsg && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "rgba(248,113,113,0.85)" }} />
                  <p className="text-sm" style={{ color: "rgba(248,113,113,0.85)" }}>{errorMsg}</p>
                </div>
              )}

              {/* Send button */}
              <button
                type="button"
                disabled={!toEmail || status === "sending"}
                onClick={handleSend}
                className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
                onMouseEnter={e => { if (toEmail && status !== "sending") (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
              >
                {status === "sending" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send {tab.docType} to {tab.label}</>
                )}
              </button>

            </div>
          )}
        </DialogContent>
      </Dialog>

      <DriverAssignmentModal
        trip={trip}
        drivers={drivers.filter(d => d.status === "ACTIVE")}
        vehicles={vehicles.filter(v => v.status === "ACTIVE")}
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        onAssign={handleAssignDriver}
        isLoading={isAssigning}
      />
    </>
  )
}
