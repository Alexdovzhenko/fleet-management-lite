"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import {
  Building2, Phone, Mail, MapPin, Globe, Camera, Settings2, Check,
  ZoomIn, ZoomOut, Plus, Trash2, X, LogOut, Users, Search, Pencil,
  BookMarked, LayoutGrid, Eye, EyeOff, User, Star, Shield, Zap,
  Crown, Briefcase, Package, UserPlus, Copy, Clock,
  Car, Bus, Plane, Train, Ship, Anchor,
  Route, Layers, MapPin as NavPin, Navigation, RefreshCw, ExternalLink,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { useCompany, useUpdateCompany } from "@/lib/hooks/use-company"
import {
  useSenderEmails, useCreateSenderEmail, useUpdateSenderEmail, useDeleteSenderEmail,
} from "@/lib/hooks/use-sender-emails"
import type { SenderEmail } from "@/types"
import { useVehicles, useUpdateVehicle } from "@/lib/hooks/use-vehicles"
import {
  useServiceTypes, useToggleServiceType, useCreateServiceType, useDeleteServiceType,
  type ServiceType,
} from "@/lib/hooks/use-service-types"
import {
  useStatusActionsStore, ALL_COLORS, STATUS_LABEL_MAP, type StatusAction,
} from "@/lib/stores/status-actions-store"
import { cn } from "@/lib/utils"
import {
  useAddresses, useUpsertAddress, useUpdateAddress, useDeleteAddress,
  type CompanyAddress,
} from "@/lib/hooks/use-addresses"
import { useColumnOrderStore, COLUMN_DEFS } from "@/lib/stores/column-order-store"
import type { Company, TripStatus } from "@/types"
import { BillingSettingsForm } from "@/components/billing/BillingSettingsForm"

// ─── Icon map ─────────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, React.ElementType> = {
  Car, Bus, Plane, Train, Ship, Anchor,
  Clock, RefreshCw, Route, Layers, MapPin: NavPin, Navigation,
  Users, User, Star, Shield, Zap, Crown, Briefcase, Package,
}

const ICON_PICKER_OPTIONS = [
  { name: "Route",      Icon: Route },
  { name: "Car",        Icon: Car },
  { name: "Bus",        Icon: Bus },
  { name: "Plane",      Icon: Plane },
  { name: "Train",      Icon: Train },
  { name: "Ship",       Icon: Ship },
  { name: "Anchor",     Icon: Anchor },
  { name: "Clock",      Icon: Clock },
  { name: "RefreshCw",  Icon: RefreshCw },
  { name: "Layers",     Icon: Layers },
  { name: "Navigation", Icon: Navigation },
  { name: "Users",      Icon: Users },
  { name: "User",       Icon: User },
  { name: "Star",       Icon: Star },
  { name: "Shield",     Icon: Shield },
  { name: "Zap",        Icon: Zap },
  { name: "Crown",      Icon: Crown },
  { name: "Briefcase",  Icon: Briefcase },
  { name: "Package",    Icon: Package },
]

const COLOR_OPTIONS = [
  { label: "Gray",   value: "bg-slate-100 text-slate-600" },
  { label: "Blue",   value: "bg-blue-50 text-blue-600" },
  { label: "Indigo", value: "bg-indigo-50 text-indigo-600" },
  { label: "Violet", value: "bg-violet-50 text-violet-600" },
  { label: "Teal",   value: "bg-teal-50 text-teal-600" },
  { label: "Sky",    value: "bg-sky-50 text-sky-600" },
  { label: "Orange", value: "bg-orange-50 text-orange-600" },
  { label: "Rose",   value: "bg-rose-50 text-rose-600" },
  { label: "Purple", value: "bg-purple-50 text-purple-600" },
  { label: "Amber",  value: "bg-amber-50 text-amber-600" },
]

// ─── Phone formatter ──────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return raw
}

// ─── Crop helper ──────────────────────────────────────────────────────────────

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("No canvas context"))
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
      resolve(canvas.toDataURL("image/jpeg", 0.92))
    })
    image.addEventListener("error", reject)
    image.src = imageSrc
  })
}

// ─── Shared section header ────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{description}</p>
    </div>
  )
}

// ─── Service Type components ──────────────────────────────────────────────────

function ServiceTypeRow({ type }: { type: ServiceType }) {
  const toggle = useToggleServiceType()
  const del = useDeleteServiceType()
  const Icon = ICON_MAP[type.iconName] ?? Car

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${type.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{type.label}</p>
          {!type.isBuiltIn && (
            <span className="text-[10px] font-semibold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">Custom</span>
          )}
        </div>
        {type.description && <p className="text-xs text-gray-400 truncate">{type.description}</p>}
      </div>
      <button
        onClick={() => toggle.mutate({ id: type.id, isEnabled: !type.isEnabled })}
        className={cn("w-10 h-6 rounded-full transition-all flex-shrink-0 relative", type.isEnabled ? "bg-blue-500" : "bg-gray-200")}
      >
        <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all", type.isEnabled ? "left-4.5" : "left-0.5")} />
      </button>
      {!type.isBuiltIn && (
        <button onClick={() => del.mutate(type.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 ml-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function CreateServiceTypeDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateServiceType()
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [iconName, setIconName] = useState("Car")
  const [color, setColor] = useState("bg-gray-100 text-gray-600")
  const SelectedIcon = ICON_MAP[iconName] ?? Car

  async function handleCreate() {
    if (!label.trim()) return
    await create.mutateAsync({ label: label.trim(), description: description.trim() || undefined, iconName, color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">New Service Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{label || <span className="text-gray-300">Service name</span>}</p>
              <p className="text-xs text-gray-400">{description || <span className="text-gray-300">Short description</span>}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Service Name *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 text-sm" placeholder="e.g. Executive Transfer" autoFocus />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Short Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 text-sm" placeholder="e.g. Premium VIP service" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-2 block">Icon</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {ICON_PICKER_OPTIONS.map(({ name, Icon }) => (
                <button key={name} onClick={() => setIconName(name)}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    iconName === name ? "bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-1" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map(({ label: clabel, value: cval }) => (
                <button key={cval} onClick={() => setColor(cval)} title={clabel}
                  className={cn("w-7 h-7 rounded-lg transition-all", cval,
                    color === cval ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100"
                  )}>
                  <span className="sr-only">{clabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-4 text-sm">Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={!label.trim() || create.isPending}
            className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white">
            {create.isPending ? "Creating…" : "Create Service Type"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Status Action components ─────────────────────────────────────────────────

const ACTION_DOT: Record<string, string> = {
  blue: "bg-blue-500", amber: "bg-amber-500", yellow: "bg-yellow-400",
  emerald: "bg-emerald-500", gray: "bg-gray-500", violet: "bg-violet-500",
  red: "bg-red-500", teal: "bg-teal-500", pink: "bg-pink-500", indigo: "bg-indigo-500",
}

const ALL_STATUSES: TripStatus[] = [
  "UNASSIGNED", "QUOTE", "CONFIRMED", "DISPATCHED", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED",
  "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW",
]

function StatusActionRow({ action }: { action: StatusAction }) {
  const { toggleAction, renameAction, changeColor, removeAction } = useStatusActionsStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(action.label)
  const inputRef = useRef<HTMLInputElement>(null)

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== action.label) renameAction(action.id, trimmed)
    else setDraft(action.label)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", ACTION_DOT[action.color] ?? "bg-gray-400")} />
        {editing ? (
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setDraft(action.label); setEditing(false) } }}
            className="text-sm font-semibold text-gray-900 bg-transparent border-b border-blue-400 outline-none w-32" autoFocus />
        ) : (
          <button onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 10) }}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left truncate" title="Click to rename">
            {action.label}
          </button>
        )}
        {!action.isBuiltIn && (
          <span className="text-[10px] font-semibold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Custom</span>
        )}
        <span className="text-xs text-gray-400 truncate">{STATUS_LABEL_MAP[action.dbStatus]}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {ALL_COLORS.map((c) => (
          <button key={c} onClick={() => changeColor(action.id, c)}
            className={cn("w-4 h-4 rounded-full transition-transform hover:scale-125", ACTION_DOT[c], action.color === c && "ring-2 ring-offset-1 ring-gray-400 scale-110")} />
        ))}
      </div>
      <button onClick={() => toggleAction(action.id)}
        className={cn("w-10 h-6 rounded-full transition-all flex-shrink-0 relative", action.isEnabled ? "bg-blue-500" : "bg-gray-200")}>
        <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all", action.isEnabled ? "left-4.5" : "left-0.5")} />
      </button>
      {!action.isBuiltIn && (
        <button onClick={() => removeAction(action.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 ml-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function CreateStatusActionDialog({ onClose }: { onClose: () => void }) {
  const { addAction } = useStatusActionsStore()
  const [label, setLabel] = useState("")
  const [dbStatus, setDbStatus] = useState<TripStatus>("CONFIRMED")
  const [color, setColor] = useState("blue")

  function handleCreate() {
    if (!label.trim()) return
    addAction({ label: label.trim(), dbStatus, color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">New Status Action</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <div className={cn("w-2.5 h-2.5 rounded-full", ACTION_DOT[color] ?? "bg-gray-400")} />
            <span className="text-sm font-semibold text-gray-900">{label || <span className="text-gray-300">Button label</span>}</span>
            <span className="text-xs text-gray-400 ml-auto">{STATUS_LABEL_MAP[dbStatus]}</span>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Button Label *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 text-sm" placeholder='"At Hotel"' autoFocus />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Maps to Status</Label>
            <select value={dbStatus} onChange={(e) => setDbStatus(e.target.value as TripStatus)}
              className="w-full h-10 text-sm border border-gray-200 rounded-lg px-3 bg-white text-gray-900 outline-none focus:border-blue-400">
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL_MAP[s]}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("w-7 h-7 rounded-full transition-all", ACTION_DOT[c], color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100")} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-4 text-sm">Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={!label.trim()}
            className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white">Add Action</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Address Book ─────────────────────────────────────────────────────────────

type AddrForm = {
  name: string; address1: string; address2: string
  city: string; state: string; zip: string; country: string
  phone: string; notes: string
}

const EMPTY_ADDR: AddrForm = {
  name: "", address1: "", address2: "", city: "", state: "", zip: "", country: "", phone: "", notes: "",
}

function AddressBookSection() {
  const { data: addresses = [], isLoading } = useAddresses()
  const upsert = useUpsertAddress()
  const update = useUpdateAddress()
  const del = useDeleteAddress()
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<"add" | "edit" | null>(null)
  const [editing, setEditing] = useState<CompanyAddress | null>(null)
  const [form, setForm] = useState<AddrForm>(EMPTY_ADDR)
  const [formError, setFormError] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = addresses.filter(a => {
    const q = search.toLowerCase()
    return !q || a.address1.toLowerCase().includes(q) || (a.name ?? "").toLowerCase().includes(q)
      || (a.city ?? "").toLowerCase().includes(q) || (a.state ?? "").toLowerCase().includes(q)
  })

  function openAdd() { setForm(EMPTY_ADDR); setFormError(""); setEditing(null); setModal("add") }
  function openEdit(addr: CompanyAddress) {
    setForm({ name: addr.name ?? "", address1: addr.address1, address2: addr.address2 ?? "", city: addr.city ?? "", state: addr.state ?? "", zip: addr.zip ?? "", country: addr.country ?? "", phone: addr.phone ?? "", notes: addr.notes ?? "" })
    setFormError(""); setEditing(addr); setModal("edit")
  }
  function fieldSetter(k: keyof AddrForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = k === "phone" ? formatPhone(e.target.value) : e.target.value
      setForm(f => ({ ...f, [k]: value }))
    }
  }

  async function handleSave() {
    if (!form.address1.trim()) { setFormError("Street address is required"); return }
    setFormError("")
    const payload = {
      name: form.name.trim() || undefined, address1: form.address1.trim(),
      address2: form.address2.trim() || undefined, city: form.city.trim() || undefined,
      state: form.state.trim() || undefined, zip: form.zip.trim() || undefined,
      country: form.country.trim() || undefined, phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }
    if (modal === "edit" && editing) await update.mutateAsync({ id: editing.id, ...payload })
    else await upsert.mutateAsync(payload)
    setModal(null)
  }

  const isPending = upsert.isPending || update.isPending

  return (
    <>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookMarked className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">Address Book</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Shared across your entire company</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search addresses…"
                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:bg-white transition-colors w-48" />
            </div>
            <button onClick={openAdd} className="h-8 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" />Add Address
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-gray-200" />
            </div>
            {search ? (
              <p className="text-sm text-gray-400">No addresses match <span className="font-medium text-gray-600">"{search}"</span></p>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-500">No saved addresses yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Addresses are auto-saved when you add stops to reservations</p>
                <button onClick={openAdd} className="text-xs font-semibold text-blue-600 hover:text-blue-700">+ Add one manually</button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(addr => (
              <div key={addr.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", addr.name ? "bg-violet-50" : "bg-blue-50")}>
                  {addr.name ? <Building2 className="w-3.5 h-3.5 text-violet-500" /> : <MapPin className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  {addr.name && <p className="text-[12px] font-semibold text-gray-800 truncate">{addr.name}</p>}
                  <p className={cn("truncate", addr.name ? "text-xs text-gray-500" : "text-sm font-medium text-gray-800")}>
                    {addr.address1}{addr.address2 && <span className="text-gray-400">, {addr.address2}</span>}
                  </p>
                  {(addr.city || addr.state || addr.zip) && (
                    <p className="text-[11px] text-gray-400 truncate">{[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}</p>
                  )}
                </div>
                {addr.useCount > 1 && (
                  <span className="text-[10px] font-semibold text-gray-300 flex-shrink-0 bg-gray-50 px-1.5 py-0.5 rounded-full">{addr.useCount}×</span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(addr)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmId(addr.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{modal === "add" ? "Add Address" : "Edit Address"}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Location Name <span className="text-gray-300">(hotel, venue…)</span></label>
                <input value={form.name} onChange={fieldSetter("name")} placeholder="e.g. Miami International Airport"
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Street Address <span className="text-red-400">*</span></label>
                <input value={form.address1} onChange={fieldSetter("address1")} placeholder="123 Main St"
                  className={cn("w-full h-10 px-3 text-sm border rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300", formError ? "border-red-400" : "border-gray-200")} />
                {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Address 2</label>
                <input value={form.address2} onChange={fieldSetter("address2")} placeholder="Suite, floor, apt…"
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">City</label>
                  <input value={form.city} onChange={fieldSetter("city")} placeholder="Miami"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">State</label>
                  <input value={form.state} onChange={fieldSetter("state")} placeholder="FL"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Zip</label>
                  <input value={form.zip} onChange={fieldSetter("zip")} placeholder="33101"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Country</label>
                  <input value={form.country} onChange={fieldSetter("country")} placeholder="USA"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Phone</label>
                  <input value={form.phone} onChange={fieldSetter("phone")} placeholder="(305) 555-0000" type="tel"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Notes</label>
                <input value={form.notes} onChange={fieldSetter("notes")} placeholder="Gate code, entrance instructions…"
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/40">
              <button onClick={() => setModal(null)} className="h-9 px-4 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isPending}
                className="h-9 px-5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60">
                {isPending ? "Saving…" : modal === "add" ? "Save Address" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Delete address?</h3>
            <p className="text-xs text-gray-400 mb-6">This will remove it from your company address book permanently.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { del.mutate(confirmId); setConfirmId(null) }}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Vehicle helpers ──────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Other",
}

function FleetVehicleCard({ vehicle }: { vehicle: import("@/types").Vehicle }) {
  const updateVehicle = useUpdateVehicle()
  const photo = vehicle.photoUrl || vehicle.photos?.[0]
  const hidden = vehicle.hideFromProfile ?? false

  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden border transition-all",
      hidden ? "border-gray-100 opacity-50" : "border-gray-200 shadow-sm"
    )}>
      <div className="aspect-[4/3] bg-gray-100 relative">
        {photo ? (
          <img src={photo} alt={vehicle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" }}>
            <Car className="w-8 h-8 text-gray-300" />
          </div>
        )}
        {hidden && (
          <div className="absolute inset-0 flex items-end justify-center pb-2 bg-white/20">
            <span className="text-[9px] font-bold text-gray-500 bg-white/90 px-2 py-0.5 rounded-full tracking-wide uppercase">Hidden</span>
          </div>
        )}
        <button
          onClick={() => updateVehicle.mutate({ id: vehicle.id, hideFromProfile: !hidden })}
          disabled={updateVehicle.isPending}
          className={cn(
            "absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-sm",
            hidden
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-white/90 text-gray-500 hover:bg-white hover:text-gray-700"
          )}
          title={hidden ? "Show on profile" : "Hide from profile"}
        >
          {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{vehicle.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
          {[vehicle.year, VEHICLE_TYPE_LABELS[vehicle.type]].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  )
}

// ─── Client Fleet Vehicle Card ────────────────────────────────────────────────

function ClientFleetVehicleCard({
  vehicle, selected, onToggle,
}: { vehicle: import("@/types").Vehicle; selected: boolean; onToggle: () => void }) {
  const photo = vehicle.photoUrl || vehicle.photos?.[0]
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all select-none",
        selected ? "border-blue-500 shadow-sm" : "border-gray-100 opacity-55 hover:opacity-80 hover:border-gray-200"
      )}
      onClick={onToggle}
    >
      <div className="aspect-[4/3] bg-gray-50 relative">
        {photo ? (
          <img src={photo} alt={vehicle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)" }}>
            <Car className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <div className={cn(
          "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow",
          selected ? "bg-blue-600" : "bg-white/90 border border-gray-200"
        )}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-800 truncate">{vehicle.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
          {[vehicle.year, VEHICLE_TYPE_LABELS[vehicle.type]].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  )
}


// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection() {
  const { data: company, isLoading } = useCompany()
  const updateCompany = useUpdateCompany()
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles()
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [profileType, setProfileType] = useState<'affiliate' | 'client'>('affiliate')
  const [form, setFormState] = useState({
    name: '', email: '', phone: '', website: '',
    affiliateAbout: '', clientAbout: '',
    clientVehicleIds: [] as string[],
    address: '', city: '', state: '', zip: '', logo: '', banner: '',
    instagramUrl: '', facebookUrl: '', tiktokUrl: '', xUrl: '', linkedinUrl: '',
  })
  const [saved, setSaved] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [rawBanner, setRawBanner] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!company) return
    setFormState({
      name: company.name ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      affiliateAbout: company.affiliateAbout ?? company.about ?? '',
      clientAbout: company.clientAbout ?? '',
      clientVehicleIds: company.clientVehicleIds ?? [],
      address: company.address ?? '',
      city: company.city ?? '',
      state: company.state ?? '',
      zip: company.zip ?? '',
      logo: company.logo ?? '',
      banner: company.banner ?? '',
      instagramUrl: company.instagramUrl ?? '',
      facebookUrl: company.facebookUrl ?? '',
      tiktokUrl: company.tiktokUrl ?? '',
      xUrl: company.xUrl ?? '',
      linkedinUrl: company.linkedinUrl ?? '',
    })
  }, [company])

  function set(field: string, value: string | string[]) {
    setFormState(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function toggleClientVehicle(id: string) {
    setFormState(f => {
      const ids = f.clientVehicleIds
      const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
      return { ...f, clientVehicleIds: next }
    })
    setSaved(false)
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setRawBanner(ev.target?.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); setCropOpen(true) }
    reader.readAsDataURL(file); e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => { setCroppedAreaPixels(pixels) }, [])

  async function handleCropApply() {
    if (!rawBanner || !croppedAreaPixels) return
    try { const cropped = await getCroppedImg(rawBanner, croppedAreaPixels); set('banner', cropped) }
    finally { setCropOpen(false); setRawBanner(null) }
  }

  function handleSave() {
    updateCompany.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      website: form.website,
      affiliateAbout: form.affiliateAbout,
      clientAbout: form.clientAbout,
      clientVehicleIds: form.clientVehicleIds,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      logo: form.logo,
      banner: form.banner,
      instagramUrl: form.instagramUrl,
      facebookUrl: form.facebookUrl,
      tiktokUrl: form.tiktokUrl,
      xUrl: form.xUrl,
      linkedinUrl: form.linkedinUrl,
    } as Partial<Company>, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })
  }

  function handleShare() {
    if (!company?.id) return
    const identifier = company.slug || company.id
    const url = profileType === 'affiliate'
      ? `${window.location.origin}/${identifier}/affiliate`
      : `${window.location.origin}/${identifier}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse max-w-2xl">
        <div className="h-6 bg-gray-100 rounded w-40" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-36 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  const location = [form.city, form.state].filter(Boolean).join(', ')
  const isClient = profileType === 'client'

  return (
    <>
      {/* Banner crop modal */}
      {cropOpen && rawBanner && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Adjust Banner</p>
              <p className="text-xs text-white/40 mt-0.5">Drag to reposition · Scroll or use slider to zoom</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCropOpen(false); setRawBanner(null) }}
                className="h-8 px-4 text-xs text-white/60 hover:text-white hover:bg-white/10">Cancel</Button>
              <Button size="sm" onClick={handleCropApply}
                className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold">Apply</Button>
            </div>
          </div>
          <div className="relative flex-1">
            <Cropper image={rawBanner} crop={crop} zoom={zoom} aspect={16 / 4}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
              style={{ containerStyle: { background: 'transparent' }, cropAreaStyle: { border: '2px solid rgba(255,255,255,0.6)', borderRadius: 8 } }} />
          </div>
          <div className="px-8 py-6 flex items-center gap-4 border-t border-white/10">
            <button onClick={() => setZoom(z => Math.max(1, z - 0.1))}><ZoomOut className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <span className="text-xs text-white/30 w-8 text-right">{zoom.toFixed(1)}x</span>
          </div>
        </div>
      )}

      <div className="p-8 space-y-6 max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Company Profile</h2>
              <p className="text-sm text-gray-400 mt-0.5">Manage your public presence for partners and clients.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <button
                onClick={handleShare}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  shareCopied
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {shareCopied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={() => { if (company?.id) { const id = company.slug || company.id; const url = profileType === 'affiliate' ? `/${id}/affiliate` : `/${id}`; window.open(url, '_blank') } }}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          </div>

          {/* Profile type toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl w-fit">
            <button
              onClick={() => setProfileType('affiliate')}
              className={cn(
                'flex items-center gap-2 px-4 h-8 rounded-lg text-sm font-semibold transition-all',
                !isClient
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Affiliate Profile
            </button>
            <button
              onClick={() => setProfileType('client')}
              className={cn(
                'flex items-center gap-2 px-4 h-8 rounded-lg text-sm font-semibold transition-all',
                isClient
                  ? 'bg-white text-amber-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <User className="w-3.5 h-3.5" />
              Private Client
            </button>
          </div>

          {/* Active profile indicator */}
          <div className={cn(
            'flex items-center gap-2 mt-3 px-3.5 py-2.5 rounded-xl text-xs font-medium',
            !isClient
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-amber-50 text-amber-700 border border-amber-100'
          )}>
            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', !isClient ? 'bg-blue-500' : 'bg-amber-500')} />
            {!isClient
              ? 'Editing Affiliate Profile — this version is shared with partner companies'
              : 'Editing Private Client Profile — this version is shared with end clients'}
          </div>
        </div>

        {/* ── Banner + Logo (shared) ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
          <div className="relative h-[180px] cursor-pointer group overflow-hidden" onClick={() => bannerRef.current?.click()}>
            {form.banner
              ? <img src={form.banner} alt="banner" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(255,255,255,0.25),transparent_55%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.4),transparent_50%)]" />
                </div>
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Camera className="w-3.5 h-3.5" />{form.banner ? 'Change banner' : 'Upload banner'}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
          </div>
          <div className="px-6 pb-5">
            <div className="-mt-9 mb-2">
              <div className="relative w-[72px] h-[72px] rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0"
                style={{ border: '3px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                onClick={() => logoRef.current?.click()}>
                {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-gray-200" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-all rounded-2xl">
                  <Camera className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {form.name || <span className="text-gray-300">Your Company Name</span>}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {form.email && <span className="flex items-center gap-1 text-xs text-gray-900"><Mail className="w-3 h-3 text-blue-400 flex-shrink-0" />{form.email}</span>}
              {form.phone && <span className="flex items-center gap-1 text-xs text-gray-900"><Phone className="w-3 h-3 text-green-400 flex-shrink-0" />{formatPhone(form.phone)}</span>}
              {location && <span className="flex items-center gap-1 text-xs text-gray-900"><MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />{location}</span>}
            </div>
          </div>
        </div>

        {/* ── Company Information (shared) ────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-blue-600" /></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Company Information</span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Shared</span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Company Name</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} className="h-10 text-sm" placeholder="Apex Limousine Service" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-10 text-sm" placeholder="info@company.com" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Phone</Label>
              <Input type="tel" value={formatPhone(form.phone)} onChange={(e) => set('phone', e.target.value.replace(/D/g, ''))} className="h-10 text-sm" placeholder="(305) 555-0100" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
              <Input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className="h-10 text-sm" placeholder="https://company.com" />
            </div>
          </div>
        </div>

        {/* ── Social Media (shared) ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Social Media</span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Shared</span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 gap-3">
            {([
              { field: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: 'text-pink-500', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
              { field: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/yourpage', color: 'text-blue-600', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
              { field: 'tiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle', color: 'text-gray-900', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
              { field: 'xUrl', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle', color: 'text-gray-900', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { field: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany', color: 'text-blue-700', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
            ] as { field: keyof typeof form; label: string; placeholder: string; color: string; icon: React.ReactNode }[]).map(({ field, label, placeholder, color, icon }) => (
              <div key={field} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100', color)}>
                  {icon}
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-400 mb-1 block">{label}</Label>
                  <Input
                    type="url"
                    value={form[field] as string}
                    onChange={(e) => set(field, e.target.value)}
                    className="h-9 text-sm"
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── About (profile-specific) ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', !isClient ? 'bg-blue-50' : 'bg-amber-50')}>
              <Briefcase className={cn('w-3.5 h-3.5', !isClient ? 'text-blue-500' : 'text-amber-500')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">About</span>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                  !isClient ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50')}>
                  {!isClient ? 'Affiliate Profile' : 'Client Profile'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {!isClient ? 'Tell partner companies about your business' : 'Tell private clients about your services'}
              </p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              key={profileType}
              value={isClient ? form.clientAbout : form.affiliateAbout}
              onChange={(e) => set(isClient ? 'clientAbout' : 'affiliateAbout', e.target.value)}
              placeholder={isClient
                ? 'Write about your premium service, experience, and what clients can expect…'
                : 'Write about your company, fleet, and what partners can expect when working with you…'
              }
              rows={5}
              maxLength={1000}
              className="w-full text-sm text-gray-900 placeholder:text-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                {!isClient ? 'Visible on your affiliate profile' : 'Visible on your client profile'}
              </p>
              <span className="text-xs text-gray-300">
                {(isClient ? form.clientAbout : form.affiliateAbout).length}/1000
              </span>
            </div>
          </div>
        </div>

        {/* ── Fleet (profile-specific) ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', !isClient ? 'bg-sky-50' : 'bg-amber-50')}>
                <Car className={cn('w-3.5 h-3.5', !isClient ? 'text-sky-500' : 'text-amber-500')} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">Fleet</span>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                    !isClient ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50')}>
                    {!isClient ? 'Affiliate Profile' : 'Client Profile'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {!isClient ? 'Toggle which vehicles appear on your affiliate profile' : 'Select which vehicles to show private clients'}
                </p>
              </div>
            </div>
            {!vehiclesLoading && vehicles.length > 0 && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {isClient ? `${form.clientVehicleIds.length} selected` : `${vehicles.filter(v => !v.hideFromProfile).length} visible`}
              </span>
            )}
          </div>
          {vehiclesLoading ? (
            <div className="p-5 grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Car className="w-5 h-5 text-gray-200" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No vehicles added yet</p>
              <p className="text-xs text-gray-300 mt-1">Add vehicles in the Fleet section to showcase your fleet</p>
            </div>
          ) : isClient ? (
            <div className="p-5 grid grid-cols-3 gap-3">
              {vehicles.map(vehicle => (
                <ClientFleetVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={form.clientVehicleIds.includes(vehicle.id)}
                  onToggle={() => toggleClientVehicle(vehicle.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-5 grid grid-cols-3 gap-3">
              {vehicles.map(vehicle => (
                <FleetVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>

        {/* ── Address (shared) ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-rose-500" /></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Address</span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Shared</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Street Address</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} className="h-10 text-sm" placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-[1fr_100px_80px] gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">City</Label>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} className="h-10 text-sm" placeholder="Miami" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">State</Label>
                <Input value={form.state} onChange={(e) => set('state', e.target.value)} className="h-10 text-sm" placeholder="FL" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">ZIP</Label>
                <Input value={form.zip} onChange={(e) => set('zip', e.target.value)} className="h-10 text-sm" placeholder="33101" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateCompany.isPending}
            className={cn('h-10 px-6 text-sm font-semibold gap-2 rounded-xl transition-all',
              saved ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}>
            {saved ? <><Check className="w-4 h-4" /> Saved</> : updateCompany.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  )
}


// ─── Section: Service Types ───────────────────────────────────────────────────

function ServiceTypesSection() {
  const { data: serviceTypes = [], isLoading } = useServiceTypes()
  const [createOpen, setCreateOpen] = useState(false)
  const enabledCount = serviceTypes.filter(t => t.isEnabled).length

  return (
    <>
      {createOpen && <CreateServiceTypeDialog onClose={() => setCreateOpen(false)} />}
      <div className="p-8 space-y-6 max-w-2xl mx-auto">
        <SectionHeader title="Service Types" description="Enable or disable trip service categories. Enabled types appear when booking a reservation." />
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><Settings2 className="w-3.5 h-3.5 text-violet-600" /></div>
              <span className="text-sm font-semibold text-gray-800">Service Types</span>
            </div>
            <div className="flex items-center gap-2">
              {!isLoading && <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{enabledCount} enabled</span>}
              <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Custom
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><div className="h-3.5 bg-gray-100 rounded w-32" /><div className="h-2.5 bg-gray-100 rounded w-48" /></div>
                  <div className="w-10 h-6 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {serviceTypes.map(type => <ServiceTypeRow key={type.id} type={type} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Section: Status Actions ──────────────────────────────────────────────────

function StatusActionsSection() {
  const { actions: statusActions, reset: resetStatusActions } = useStatusActionsStore()
  const [createOpen, setCreateOpen] = useState(false)
  const enabledCount = statusActions.filter(a => a.isEnabled).length

  return (
    <>
      {createOpen && <CreateStatusActionDialog onClose={() => setCreateOpen(false)} />}
      <div className="p-8 space-y-6 max-w-2xl mx-auto">
        <SectionHeader title="Trip Status Actions" description="Customize the quick-action buttons shown in the dispatch popup when managing a trip." />
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-emerald-600" /></div>
              <span className="text-sm font-semibold text-gray-800">Status Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{enabledCount} enabled</span>
              <Button size="sm" variant="ghost" onClick={resetStatusActions} className="h-8 px-3 text-xs text-gray-400 hover:text-gray-600">Reset</Button>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Custom
              </Button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {statusActions.map(action => <StatusActionRow key={action.id} action={action} />)}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Section: Grid Columns ────────────────────────────────────────────────────

function GridColumnsSection() {
  const { hiddenColumns, toggleColumnVisibility, reset } = useColumnOrderStore()
  const visibleCount = COLUMN_DEFS.length - hiddenColumns.length

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <SectionHeader title="Grid Columns" description="Choose which columns are visible in the dispatch grid. Drag column headers directly in the grid to reorder them." />
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center"><LayoutGrid className="w-3.5 h-3.5 text-sky-600" /></div>
            <span className="text-sm font-semibold text-gray-800">Visible Columns</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{visibleCount} visible</span>
            {hiddenColumns.length > 0 && (
              <Button size="sm" variant="ghost" onClick={reset} className="h-8 px-3 text-xs text-gray-400 hover:text-gray-600">Reset</Button>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {COLUMN_DEFS.map((col) => {
            const isVisible = !hiddenColumns.includes(col.key)
            const isLast = isVisible && visibleCount === 1
            return (
              <div key={col.key}
                className={cn("flex items-center gap-4 px-5 py-3 transition-colors", isLast ? "opacity-40" : "hover:bg-gray-50/60 cursor-pointer")}
                onClick={() => !isLast && toggleColumnVisibility(col.key)}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors", isVisible ? "bg-sky-50 text-sky-500" : "bg-gray-100 text-gray-300")}>
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold transition-colors", isVisible ? "text-gray-900" : "text-gray-400")}>{col.label}</p>
                  <p className="text-xs text-gray-400 truncate">{col.description}</p>
                </div>
                <div className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", isVisible ? "bg-blue-500" : "bg-gray-200")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all", isVisible ? "left-4.5" : "left-0.5")} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Personal ────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "OWNER",      label: "Admin",      description: "Full access to all settings" },
  { value: "DISPATCHER", label: "Dispatcher", description: "Manage trips and drivers" },
] as const

type EditableRole = "OWNER" | "DISPATCHER"

function RoleSelect({
  value,
  onChange,
}: {
  value: EditableRole
  onChange: (v: EditableRole) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const current = ROLE_OPTIONS.find(r => r.value === value) ?? ROLE_OPTIONS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full h-10 px-3 flex items-center justify-between gap-2 rounded-lg border text-sm transition-all",
          open
            ? "border-blue-400 ring-2 ring-blue-500/15 bg-white"
            : "border-gray-200 bg-white hover:border-gray-300"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
            current.value === "OWNER" ? "bg-indigo-50" : "bg-sky-50"
          )}>
            {current.value === "OWNER"
              ? <Shield className="w-3 h-3 text-indigo-600" />
              : <Zap className="w-3 h-3 text-sky-600" />
            }
          </div>
          <span className="font-medium text-gray-800">{current.label}</span>
        </div>
        <ChevronRight className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-900/8 overflow-hidden">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-gray-50",
                opt.value === value && "bg-blue-50/60"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                opt.value === "OWNER" ? "bg-indigo-50" : "bg-sky-50"
              )}>
                {opt.value === "OWNER"
                  ? <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  : <Zap className="w-3.5 h-3.5 text-sky-600" />
                }
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
              </div>
              {opt.value === value && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function getStrength(pw: string): { level: 0|1|2|3|4; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" }
  let s = 0
  if (pw.length >= 8)  s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { level: 1, label: "Weak",   color: "#ef4444" }
  if (s === 2) return { level: 2, label: "Fair",   color: "#f59e0b" }
  if (s === 3) return { level: 3, label: "Good",   color: "#3b82f6" }
  return             { level: 4, label: "Strong",  color: "#10b981" }
}

const RESEND_COOLDOWN_S = 60

function ChangePasswordSection() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"form"|"otp"|"success">("form")

  // Form fields
  const [currentPw,  setCurrentPw]  = useState("")
  const [newPw,      setNewPw]      = useState("")
  const [confirmPw,  setConfirmPw]  = useState("")
  const [showCurrent,setShowCurrent]= useState(false)
  const [showNew,    setShowNew]    = useState(false)
  const [showConfirm,setShowConfirm]= useState(false)

  // OTP
  const [digits, setDigits] = useState(["","","","","",""])
  const digitRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ]
  const [maskedEmail, setMaskedEmail] = useState("")
  const [cooldown, setCooldown]     = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // State
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [otpError, setOtpError] = useState("")

  const strength  = getStrength(newPw)
  const mismatch  = confirmPw.length > 0 && newPw !== confirmPw
  const otpCode   = digits.join("")

  function reset() {
    setOpen(false); setStep("form")
    setCurrentPw(""); setNewPw(""); setConfirmPw("")
    setDigits(["","","","","",""])
    setError(""); setOtpError(""); setMaskedEmail("")
    setShowCurrent(false); setShowNew(false); setShowConfirm(false)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldown(0)
  }

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldown(RESEND_COOLDOWN_S)
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // Step 1 → request OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (newPw.length < 8)      { setError("New password must be at least 8 characters."); return }
    if (newPw !== confirmPw)   { setError("New passwords don't match."); return }
    if (strength.level < 2)    { setError("Please choose a stronger password."); return }
    if (!currentPw)            { setError("Please enter your current password."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to send code"); return }
      setMaskedEmail(data.email || "")
      setStep("otp")
      startCooldown()
      setTimeout(() => digitRefs[0].current?.focus(), 100)
    } catch { setError("Something went wrong. Please try again.") }
    finally  { setLoading(false) }
  }

  // OTP digit input handling
  function handleDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setOtpError("")
    if (char && index < 5) digitRefs[index + 1].current?.focus()
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs[index - 1].current?.focus()
    }
    if (e.key === "ArrowLeft"  && index > 0) digitRefs[index - 1].current?.focus()
    if (e.key === "ArrowRight" && index < 5) digitRefs[index + 1].current?.focus()
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(""))
      digitRefs[5].current?.focus()
    }
  }

  // Step 2 → verify OTP and update password
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length < 6) { setOtpError("Enter all 6 digits."); return }
    setLoading(true); setOtpError("")
    try {
      const res = await fetch("/api/auth/change-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPw, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.expired) { setStep("form"); setError("Code expired. Please try again."); return }
        setOtpError(data.error || "Incorrect code")
        setDigits(["","","","","",""])
        setTimeout(() => digitRefs[0].current?.focus(), 50)
        return
      }
      setStep("success")
    } catch { setOtpError("Something went wrong. Please try again.") }
    finally  { setLoading(false) }
  }

  // Resend OTP
  async function handleResend() {
    if (cooldown > 0 || loading) return
    setLoading(true); setOtpError("")
    try {
      const res = await fetch("/api/auth/change-password/resend", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setOtpError(data.error || "Failed to resend"); return }
      startCooldown()
      setDigits(["","","","","",""])
      setTimeout(() => digitRefs[0].current?.focus(), 50)
    } catch { setOtpError("Failed to resend. Please try again.") }
    finally  { setLoading(false) }
  }

  const inputCls = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 placeholder:text-gray-300"

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => { if (open) reset(); else setOpen(true) }}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Change Password</div>
            <div className="text-xs text-gray-400 mt-0.5">Update your account password with email verification</div>
          </div>
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0",
          open ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-400"
        )}>
          {open
            ? <X className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100">

          {/* ── Success ── */}
          {step === "success" && (
            <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">Password changed successfully</div>
                <div className="text-sm text-gray-500 mt-1">Your account is now secured with the new password.</div>
              </div>
              <button
                onClick={reset}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Step 1: Password form ── */}
          {step === "form" && (
            <form onSubmit={handleRequestOtp} className="px-6 py-5 space-y-4">
              {error && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Current password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-400 block">Current Password</Label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={e => { setCurrentPw(e.target.value); setError("") }}
                    placeholder="Your current password"
                    autoComplete="current-password"
                    required
                    className={cn(inputCls, "pr-10")}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowCurrent(s=>!s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    {showCurrent ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-400 block">New Password</Label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setError("") }}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    className={cn(inputCls, "pr-10")}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowNew(s=>!s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    {showNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {/* Strength meter */}
                {newPw.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-200"
                          style={{ background: i <= strength.level ? strength.color : "#e5e7eb" }} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                      <div className="flex gap-1.5">
                        {[
                          { label: "8+",  met: newPw.length >= 8 },
                          { label: "A-Z", met: /[A-Z]/.test(newPw) },
                          { label: "0-9", met: /[0-9]/.test(newPw) },
                          { label: "#@!", met: /[^A-Za-z0-9]/.test(newPw) },
                        ].map(r => (
                          <span key={r.label} className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all",
                            r.met ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                          )}>{r.met ? "✓" : ""} {r.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-400 block">Confirm New Password</Label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setError("") }}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    required
                    className={cn(inputCls, "pr-10", mismatch && "border-red-300 focus:border-red-400 focus:ring-red-500/15")}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s=>!s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    {showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {mismatch && <p className="text-[11px] text-red-500 font-medium">Passwords don&apos;t match</p>}
                {confirmPw.length > 0 && !mismatch && <p className="text-[11px] text-emerald-600 font-medium">✓ Passwords match</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={reset}
                  className="flex-1 h-9 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)" }}>
                  {loading ? "Sending code…" : "Send Verification Code"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerify} className="px-6 py-5">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-semibold text-gray-900">Check your email</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                  We sent a 6-digit code to {maskedEmail || "your email"}.<br/>
                  It expires in <strong>5 minutes</strong>.
                </div>
              </div>

              {otpError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-4 text-center">
                  {otpError}
                </div>
              )}

              {/* 6-digit OTP cells */}
              <div className="flex gap-2 justify-center mb-5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={digitRefs[i]}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handleDigitPaste : undefined}
                    className={cn(
                      "w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-150",
                      "text-gray-900 bg-gray-50 tabular-nums",
                      d
                        ? "border-blue-500 bg-white shadow-sm shadow-blue-500/10"
                        : "border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                    )}
                    style={{ height: "52px" }}
                  />
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => { setStep("form"); setOtpError(""); setDigits(["","","","","",""]) }}
                  className="flex-1 h-9 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                  ← Back
                </button>
                <button type="submit" disabled={loading || otpCode.length < 6}
                  className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)" }}>
                  {loading ? "Verifying…" : "Verify & Change Password"}
                </button>
              </div>

              {/* Resend */}
              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend available in <span className="tabular-nums font-semibold text-gray-600">{cooldown}s</span>
                  </p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                    {loading ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function PersonalSection() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "DISPATCHER" as EditableRole,
  })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user) {
        const parts = (data.user.name ?? "").trim().split(/\s+/)
        const firstName = parts[0] ?? ""
        const lastName  = parts.slice(1).join(" ")
        const role: EditableRole = data.user.role === "OWNER" ? "OWNER" : "DISPATCHER"
        setProfile({
          firstName,
          lastName,
          email: data.user.email ?? "",
          phone: data.user.phone ?? "",
          role,
        })
      }
    }).catch(() => {})
  }, [])

  function markDirty() { setProfileSaved(false) }

  async function handleProfileSave() {
    const fullName = [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(" ")
    if (!fullName) return
    setProfileSaving(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, phone: profile.phone.trim() || undefined, role: profile.role }),
      })
      if (res.ok) { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    } finally { setProfileSaving(false) }
  }

  const initials = [profile.firstName[0], profile.lastName[0]].filter(Boolean).join("").toUpperCase() || "?"

  return (
    <div className="p-8 space-y-5 max-w-2xl mx-auto">
      <SectionHeader title="Personal Details" description="Manage your own account name and credentials." />

      {/* Avatar + identity strip */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/60 to-white rounded-t-2xl">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-sm font-bold text-white tracking-wide">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 leading-tight">
              {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your Account"}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</div>
          </div>
          <div className={cn(
            "ml-auto flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold",
            profile.role === "OWNER" ? "bg-indigo-50 text-indigo-700" : "bg-sky-50 text-sky-700"
          )}>
            {profile.role === "OWNER" ? "Admin" : "Dispatcher"}
          </div>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-4">
          {/* Row 1: First + Last */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-400 block">First Name</Label>
              <Input
                value={profile.firstName}
                onChange={e => { setProfile(p => ({ ...p, firstName: e.target.value })); markDirty() }}
                placeholder="Alex"
                className="h-10 text-sm transition-shadow focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-400 block">Last Name</Label>
              <Input
                value={profile.lastName}
                onChange={e => { setProfile(p => ({ ...p, lastName: e.target.value })); markDirty() }}
                placeholder="Johnson"
                className="h-10 text-sm transition-shadow focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Row 2: Phone + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-400 block">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={e => { setProfile(p => ({ ...p, phone: formatPhone(e.target.value) })); markDirty() }}
                  placeholder="(305) 000-0000"
                  className="h-10 text-sm pl-9 transition-shadow focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-400 block">Role</Label>
              <RoleSelect value={profile.role} onChange={v => { setProfile(p => ({ ...p, role: v })); markDirty() }} />
            </div>
          </div>

          {/* Row 3: Email (read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium text-gray-400 block">Email Address</Label>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">read-only</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <Input
                value={profile.email}
                readOnly
                className="h-10 text-sm pl-9 bg-gray-50 text-gray-400 cursor-default select-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleProfileSave}
          disabled={profileSaving || !profile.firstName.trim()}
          className={cn(
            "h-10 px-6 text-sm font-semibold gap-2 rounded-xl transition-all duration-200",
            profileSaved
              ? "bg-emerald-500 hover:bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {profileSaved
            ? <><Check className="w-4 h-4" /> Saved</>
            : profileSaving
            ? "Saving…"
            : "Save Changes"
          }
        </Button>
      </div>

      {/* Change Password */}
      <ChangePasswordSection />
    </div>
  )
}

// ─── Section: Team ────────────────────────────────────────────────────────────

type TeamUser = { id: string; name: string; email: string; role: "OWNER" | "DISPATCHER" | "VIEWER"; avatarUrl: string | null; createdAt: string }
type Invite = { id: string; email: string; role: "DISPATCHER" | "VIEWER"; createdAt: string; expiresAt: string }

const ROLE_LABELS: Record<string, string> = { OWNER: "Owner", DISPATCHER: "Dispatcher", VIEWER: "Viewer" }
const ROLE_COLORS: Record<string, string> = { OWNER: "bg-violet-100 text-violet-700", DISPATCHER: "bg-blue-100 text-blue-700", VIEWER: "bg-gray-100 text-gray-600" }

function TeamSection() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isOwner = user?.role === "OWNER"
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"DISPATCHER" | "VIEWER">("DISPATCHER")
  const [inviteUrl, setInviteUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team")
      if (!res.ok) throw new Error("Failed to load team")
      return res.json() as Promise<{ users: TeamUser[]; invites: Invite[] }>
    },
  })

  const invite = useMutation({
    mutationFn: async (body: { email: string; role: string }) => {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Failed to send invite")
      return d
    },
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["team"] }); setInviteUrl(d.inviteUrl); setEmail(""); setFormError("") },
    onError: (err: Error) => setFormError(err.message),
  })

  async function handleCopy() { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader title="Team Members" description="Manage who has access to your company workspace." />
        {isOwner && !showInviteForm && (
          <Button size="sm" onClick={() => { setShowInviteForm(true); setInviteUrl("") }}
            className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0 mt-1">
            <UserPlus className="w-3.5 h-3.5" />Invite Member
          </Button>
        )}
      </div>

      {isOwner && showInviteForm && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><UserPlus className="w-3.5 h-3.5 text-blue-600" /></div>
              <span className="text-sm font-semibold text-gray-900">Invite Team Member</span>
            </div>
            <button onClick={() => { setShowInviteForm(false); setInviteUrl(""); setFormError("") }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-6">
            {inviteUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 flex-shrink-0" />Invite created! Share this link with your team member.
                </div>
                <div className="flex items-center gap-2">
                  <Input value={inviteUrl} readOnly className="h-9 text-xs font-mono text-gray-500 bg-gray-50" />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="h-9 px-3 flex-shrink-0 gap-1.5 text-xs">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setInviteUrl(""); setEmail("") }} className="text-xs h-8">Send another invite</Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setFormError(""); invite.mutate({ email, role }) }} className="space-y-4">
                {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Email address *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@yourlimo.com" required className="h-10 text-sm" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["DISPATCHER", "VIEWER"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={cn("flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all",
                          role === r ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}>
                        <span className="text-xs font-semibold text-gray-900">{ROLE_LABELS[r]}</span>
                        <span className="text-[10px] text-gray-400">{r === "DISPATCHER" ? "Can create & manage trips" : "Read-only access"}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowInviteForm(false); setFormError("") }} className="h-9 text-sm">Cancel</Button>
                  <Button type="submit" size="sm" disabled={!email || invite.isPending} className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-1">
                    {invite.isPending ? "Sending…" : "Generate Invite Link"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-blue-600" /></div>
          <span className="text-sm font-semibold text-gray-800">Team Members</span>
          {data && <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{data.users.length} {data.users.length === 1 ? "member" : "members"}</span>}
        </div>
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3.5 bg-gray-100 rounded w-36" /><div className="h-2.5 bg-gray-100 rounded w-48" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.users.map(member => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                {member.avatarUrl
                  ? <img src={member.avatarUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}</span>
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                    {member.id === user?.id && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">You</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-500")}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-amber-500" /></div>
            <span className="text-sm font-semibold text-gray-800">Pending Invites</span>
            <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{data.invites.length} pending</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data.invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-gray-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", ROLE_COLORS[inv.role] ?? "bg-gray-100 text-gray-500")}>{ROLE_LABELS[inv.role] ?? inv.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && data?.users.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No team members yet</p>
        </div>
      )}
    </div>
  )
}

// ─── Sender Emails Section ────────────────────────────────────────────────────

function SenderEmailsSection() {
  const { data: senders = [], isLoading } = useSenderEmails()
  const createSender  = useCreateSenderEmail()
  const updateSender  = useUpdateSenderEmail()
  const deleteSender  = useDeleteSenderEmail()

  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [formEmail, setFormEmail]   = useState("")
  const [formLabel, setFormLabel]   = useState("")
  const [formDefault, setFormDefault] = useState(false)
  const [formError, setFormError]   = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditId(null)
    setFormEmail("")
    setFormLabel("")
    setFormDefault(false)
    setFormError("")
    setShowForm(true)
  }

  function openEdit(s: SenderEmail) {
    setEditId(s.id)
    setFormEmail(s.email)
    setFormLabel(s.label ?? "")
    setFormDefault(s.isDefault)
    setFormError("")
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setFormError("")
  }

  function handleSave() {
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setFormError("Enter a valid email address")
      return
    }
    setFormError("")

    if (editId) {
      updateSender.mutate({ id: editId, email: formEmail.trim(), label: formLabel.trim() || null, isDefault: formDefault }, {
        onSuccess: () => cancelForm(),
        onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to update"),
      })
    } else {
      createSender.mutate({ email: formEmail.trim(), label: formLabel.trim() || undefined, isDefault: formDefault }, {
        onSuccess: () => cancelForm(),
        onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to create"),
      })
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <SectionHeader
        title="Sender Emails"
        description="Choose which email addresses replies will go to when sending reservation emails. Add or remove addresses as needed."
      />

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          senders.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.email}</p>
                {s.label && <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.isDefault ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    Default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateSender.mutate({ id: s.id, isDefault: true })}
                    className="text-[10px] font-semibold text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {confirmDeleteId === s.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { deleteSender.mutate(s.id); setConfirmDeleteId(null) }}
                      className="text-[11px] font-semibold text-red-600 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit form */}
      {showForm ? (
        <div className="mt-4 p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-4">
          <p className="text-sm font-semibold text-gray-900">{editId ? "Edit Email Address" : "Add Email Address"}</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                placeholder="dispatch@yourcompany.com"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Label <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Dispatch, Billing"
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                className="h-9"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setFormDefault(v => !v)}
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                  formDefault ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                )}
              >
                {formDefault && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-sm text-gray-700">Set as default sender email</span>
            </label>
          </div>
          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
              onClick={handleSave}
              disabled={createSender.isPending || updateSender.isPending}
            >
              {createSender.isPending || updateSender.isPending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="h-9 text-sm" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Email Address
        </button>
      )}

      <div className="mt-6 px-4 py-4 rounded-xl bg-blue-50 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">How this works</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Reservation emails are delivered from Livery Connect's platform address. Your selected sender email is set as the <strong>Reply-To</strong> so replies from drivers or clients land directly in your inbox.
        </p>
      </div>
    </div>
  )
}

// ─── PDF Branding Section ─────────────────────────────────────────────────────

function PdfBrandingSection() {
  const { data: company, isLoading } = useCompany()
  const updateCompany = useUpdateCompany()

  const [form, setForm] = useState({
    name:    "",
    phone:   "",
    address: "",
    city:    "",
    state:   "",
    zip:     "",
    website: "",
    email:   "",
  })
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  useEffect(() => {
    if (company) {
      setForm({
        name:    company.name    ?? "",
        phone:   company.phone   ?? "",
        address: company.address ?? "",
        city:    company.city    ?? "",
        state:   company.state   ?? "",
        zip:     company.zip     ?? "",
        website: company.website ?? "",
        email:   company.email   ?? "",
      })
    }
  }, [company])

  function handleSave() {
    setSaving(true)
    setError("")
    updateCompany.mutate({
      name:    form.name    || undefined,
      phone:   form.phone   || undefined,
      address: form.address || undefined,
      city:    form.city    || undefined,
      state:   form.state   || undefined,
      zip:     form.zip     || undefined,
      website: form.website || undefined,
    }, {
      onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000) },
      onError: (e) => { setSaving(false); setError(e instanceof Error ? e.message : "Failed to save") },
    })
  }

  const addressPreview = [form.address, form.city, form.state, form.zip].filter(Boolean).join(", ")
  const logoLetter     = form.name ? form.name.charAt(0).toUpperCase() : "C"

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <SectionHeader
        title="PDF Branding"
        description="Company information shown on all generated PDFs — Job Orders, Reservation Confirmations, and Affiliate copies."
      />

      {/* Preview card */}
      <div className="mb-6 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-[#1e3a8a] px-5 py-4">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img src={company.logo} alt="logo" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {logoLetter}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{form.name || "Company Name"}</p>
              <p className="text-blue-200 text-xs mt-0.5">
                {[form.phone ? formatPhone(form.phone) : null, form.email, form.website].filter(Boolean).join("  ·  ") || "Contact info"}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.18em] mt-3">
            Reservation Confirmation
          </p>
        </div>
        <div className="bg-white px-5 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {addressPreview || "Company address"}{addressPreview && " · "}
            {form.website || ""}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Company Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Phone</Label>
            <Input value={formatPhone(form.phone)} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))} className="h-9" placeholder="(555) 000-0000" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Website</Label>
            <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="h-9" placeholder="www.yourcompany.com" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Street Address</Label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="h-9" placeholder="123 Main St" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">City</Label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="h-9" placeholder="NY" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">ZIP</Label>
              <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="h-9" placeholder="10001" />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "h-9 px-6 font-semibold text-sm transition-all",
            saved
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {saving ? "Saving…" : saved ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved</> : "Save Branding"}
        </Button>
      </div>

      <div className="mt-6 px-4 py-4 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-1">Logo on PDFs</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your company logo is uploaded in the <button type="button" className="text-blue-500 hover:underline">Profile</button> section and automatically appears on all PDFs. Use a square or horizontally-compact image for best results.
        </p>
      </div>
    </div>
  )
}

// ─── Section type definition ──────────────────────────────────────────────────

type Section = "profile" | "address-book" | "service-types" | "status-actions" | "grid-columns" | "personal" | "team" | "sender-emails" | "pdf-branding" | "billing"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const sectionParam = section as Section

  // Validate section parameter
  const validSections: Section[] = ["profile", "address-book", "service-types", "status-actions", "grid-columns", "personal", "team", "sender-emails", "pdf-branding", "billing"]
  if (!validSections.includes(sectionParam)) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Invalid settings section.</p>
      </div>
    )
  }

  // Render appropriate section based on URL parameter
  return (
    <>
      {sectionParam === "profile"        && <ProfileSection />}
      {sectionParam === "address-book"   && (
        <div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
          <SectionHeader title="Address Book" description="Saved pickup and dropoff locations, shared across your entire company." />
          <AddressBookSection />
        </div>
      )}
      {sectionParam === "service-types"  && <ServiceTypesSection />}
      {sectionParam === "status-actions" && <StatusActionsSection />}
      {sectionParam === "grid-columns"   && <GridColumnsSection />}
      {sectionParam === "sender-emails"  && <SenderEmailsSection />}
      {sectionParam === "pdf-branding"   && <PdfBrandingSection />}
      {sectionParam === "billing"        && (
        <div className="p-8 space-y-6 w-full h-[calc(100vh-140px)]">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure invoice details and company information</p>
          </div>
          <BillingSettingsForm />
        </div>
      )}
      {sectionParam === "personal"       && <PersonalSection />}
      {sectionParam === "team"           && <TeamSection />}
    </>
  )
}
