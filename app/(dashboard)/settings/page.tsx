"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import {
  Building2, Phone, Mail, MapPin, Globe, Camera, Settings2, Check,
  ZoomIn, ZoomOut, Plus, Trash2, X, LogOut, Users, Search, Pencil,
  BookMarked, LayoutGrid, Eye, EyeOff, User, Star, Shield, Zap,
  Crown, Briefcase, Package, UserPlus, Copy, Clock, Calendar, Hash,
  Car, Bus, Plane, Train, Ship, Anchor,
  Route, Layers, MapPin as NavPin, Navigation, RefreshCw, ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { useCompany, useUpdateCompany } from "@/lib/hooks/use-company"
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
  "QUOTE", "CONFIRMED", "DISPATCHED", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED",
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
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
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

// ─── Profile Preview Modal ────────────────────────────────────────────────────

type ProfileForm = {
  name: string; email: string; phone: string; website: string; about: string
  address: string; city: string; state: string; zip: string
  logo: string; banner: string
}

function generateAffiliateId(name: string, createdAt?: string): string {
  const seed = name + (createdAt || "")
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const num = Math.abs(hash) % 90000 + 10000
  return `LC-${num}`
}

function PreviewContactRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string; href?: string
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />
          </a>
        ) : (
          <p className="text-[13px] font-medium text-gray-800 truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

function ProfilePreviewModal({ form, createdAt, onClose }: {
  form: ProfileForm; createdAt?: string; onClose: () => void
}) {
  const { data: vehicles = [] } = useVehicles()
  const visibleVehicles = vehicles.filter(v => !v.hideFromProfile)
  const location = [form.city, form.state].filter(Boolean).join(", ")
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null
  const affiliateId = generateAffiliateId(form.name, createdAt)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const initials = form.name
    ? form.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-8 overflow-y-auto"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(10,15,30,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-4xl mb-8">
        {/* Modal chrome bar */}
        <div className="flex items-center justify-between px-4 py-3 mb-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs font-semibold text-white/60 tracking-wide">Affiliate Preview</span>
            <span className="text-[11px] text-white/30">— how partners see your company</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden mb-4">
          {/* Banner */}
          <div
            className="relative h-60"
            style={{
              background: form.banner
                ? `url(${form.banner}) center/cover no-repeat`
                : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 55%, #fce7f3 100%)",
            }}
          >
            {/* Action buttons — bottom-right of banner */}
            <div className="absolute bottom-4 right-5 flex items-center gap-2 pointer-events-none select-none">
              <div className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-emerald-300 bg-white shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600">Connected</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-gray-200 bg-white shadow-sm">
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Remove</span>
              </div>
            </div>
          </div>

          {/* Hero: logo + name + meta */}
          <div className="px-6 pt-4 pb-5">
            <div className="-mt-8 mb-4">
              {form.logo ? (
                <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden"
                  style={{ border: "4px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                  <img src={form.logo} alt={form.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)",
                    border: "4px solid white",
                    boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
                  }}>
                  {initials}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {form.name || <span className="text-gray-300">Your Company Name</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {location && (
                <span className="text-sm text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{location}
                </span>
              )}
              {memberSince && (
                <span className="text-sm text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Member since {memberSince}
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white">
              <Hash className="w-3 h-3 text-blue-600" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Affiliate ID</span>
              <span className="text-sm font-bold text-blue-600">{affiliateId}</span>
            </div>
          </div>
        </div>

        {/* ── Fleet + Contact ────────────────────────────────────────────────── */}
        <div className="rounded-3xl mb-4 grid grid-cols-5 gap-2 p-2" style={{ background: "rgba(226,232,240,0.55)" }}>

          {/* Fleet card */}
          <div className="col-span-3 bg-white rounded-[20px] overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Fleet</p>
              <p className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">
                {visibleVehicles.length} <span className="text-gray-400 font-semibold text-lg">{visibleVehicles.length === 1 ? "vehicle" : "vehicles"}</span>
              </p>
            </div>
            <div className="p-6 pt-4">
              {visibleVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-3">
                    <Car className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">No vehicles listed</p>
                </div>
              ) : visibleVehicles.length === 1 ? (() => {
                const v = visibleVehicles[0]
                const photo = v.photoUrl || v.photos?.[0]
                const typeLabel = VEHICLE_TYPE_LABELS[v.type]
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="overflow-hidden" style={{ aspectRatio: "16/8" }}>
                      {photo
                        ? <img src={photo} alt={v.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 100%)" }}>
                            <Car className="w-14 h-14 text-slate-300" />
                          </div>
                      }
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{v.name}</p>
                        <p className="text-[11px] font-medium text-gray-400 mt-0.5 truncate">{[v.year, typeLabel].filter(Boolean).join(" · ")}</p>
                      </div>
                      {typeLabel && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg flex-shrink-0 uppercase tracking-wider">
                          {typeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })() : (
                <div className={cn("grid gap-3", visibleVehicles.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {visibleVehicles.map(v => {
                    const photo = v.photoUrl || v.photos?.[0]
                    const typeLabel = VEHICLE_TYPE_LABELS[v.type]
                    return (
                      <div key={v.id} className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="aspect-[4/3] overflow-hidden">
                          {photo
                            ? <img src={photo} alt={v.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 100%)" }}>
                                <Car className="w-8 h-8 text-slate-300" />
                              </div>
                          }
                        </div>
                        <div className="px-3.5 pt-3 pb-3.5">
                          <p className="text-[13px] font-semibold text-gray-900 truncate leading-snug">{v.name}</p>
                          <p className="text-[11px] font-medium text-gray-400 mt-0.5 truncate">
                            {[v.year, typeLabel].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Contact card */}
          <div className="col-span-2 bg-white rounded-[20px] overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
            </div>
            <div className="px-6 pb-6 divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
              {form.email && (
                <PreviewContactRow icon={Mail} label="Email" value={form.email} href={`mailto:${form.email}`} />
              )}
              {form.phone && (
                <PreviewContactRow icon={Phone} label="Phone" value={formatPhone(form.phone)} href={`tel:${form.phone}`} />
              )}
              {location && (
                <PreviewContactRow icon={MapPin} label="Location" value={location} />
              )}
              {form.website && (
                <PreviewContactRow
                  icon={Globe}
                  label="Website"
                  value={form.website.replace(/^https?:\/\//, "")}
                  href={form.website.startsWith("http") ? form.website : `https://${form.website}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        {form.about && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About</p>
            </div>
            <div className="px-6 pt-3 pb-5">
              <p className="text-sm text-gray-600 leading-relaxed">{form.about}</p>
            </div>
          </div>
        )}
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
  const [form, setFormState] = useState({
    name: "", email: "", phone: "", website: "", about: "", address: "", city: "", state: "", zip: "", logo: "", banner: "",
  })
  const [saved, setSaved] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rawBanner, setRawBanner] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!company) return
    setFormState({
      name: company.name ?? "", email: company.email ?? "", phone: company.phone ?? "",
      website: company.website ?? "", about: company.about ?? "",
      address: company.address ?? "", city: company.city ?? "", state: company.state ?? "",
      zip: company.zip ?? "", logo: company.logo ?? "", banner: company.banner ?? "",
    })
  }, [company])

  function set(field: string, value: string) { setFormState(f => ({ ...f, [field]: value })); setSaved(false) }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set("logo", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setRawBanner(ev.target?.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); setCropOpen(true) }
    reader.readAsDataURL(file); e.target.value = ""
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => { setCroppedAreaPixels(pixels) }, [])

  async function handleCropApply() {
    if (!rawBanner || !croppedAreaPixels) return
    try { const cropped = await getCroppedImg(rawBanner, croppedAreaPixels); set("banner", cropped) }
    finally { setCropOpen(false); setRawBanner(null) }
  }

  function handleSave() {
    updateCompany.mutate(form as Partial<Company>, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
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

  const location = [form.city, form.state].filter(Boolean).join(", ")

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
              style={{ containerStyle: { background: "transparent" }, cropAreaStyle: { border: "2px solid rgba(255,255,255,0.6)", borderRadius: 8 } }} />
          </div>
          <div className="px-8 py-6 flex items-center gap-4 border-t border-white/10">
            <button onClick={() => setZoom(z => Math.max(1, z - 0.1))}><ZoomOut className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <span className="text-xs text-white/30 w-8 text-right">{zoom.toFixed(1)}×</span>
          </div>
        </div>
      )}

      {previewOpen && <ProfilePreviewModal form={form} createdAt={company?.createdAt} onClose={() => setPreviewOpen(false)} />}

      <div className="p-8 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Company Profile" description="Your company's public identity, contact details, and address." />
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex-shrink-0 mt-0.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        {/* Banner + Logo hero */}
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
                <Camera className="w-3.5 h-3.5" />{form.banner ? "Change banner" : "Upload banner"}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
          </div>
          <div className="px-6 pb-5">
            {/* Logo — overlaps banner */}
            <div className="-mt-9 mb-2">
              <div className="relative w-[72px] h-[72px] rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0"
                style={{ border: "3px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                onClick={() => logoRef.current?.click()}>
                {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-gray-200" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-all rounded-2xl">
                  <Camera className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
            </div>
            {/* Name + contact — fully below banner */}
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

        {/* Company info */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-blue-600" /></div>
            <span className="text-sm font-semibold text-gray-800">Company Information</span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Company Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-10 text-sm" placeholder="Apex Limousine Service" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-10 text-sm" placeholder="info@company.com" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-10 text-sm" placeholder="(305) 555-0100" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
              <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className="h-10 text-sm" placeholder="https://company.com" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Briefcase className="w-3.5 h-3.5 text-amber-500" /></div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800">About</span>
              <p className="text-xs text-gray-400 mt-0.5">Tell partners and customers about your company and values</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Write about your company, mission, and values…"
              rows={5}
              maxLength={1000}
              className="w-full text-sm text-gray-900 placeholder:text-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Shown on your public affiliate profile</p>
              <span className="text-xs text-gray-300">{form.about.length}/1000</span>
            </div>
          </div>
        </div>

        {/* Fleet */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                <Car className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">Fleet</span>
                <p className="text-xs text-gray-400 mt-0.5">Select which vehicles appear on your affiliate profile</p>
              </div>
            </div>
            {!vehiclesLoading && vehicles.length > 0 && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {vehicles.filter(v => !v.hideFromProfile).length} visible
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
          ) : (
            <div className="p-5 grid grid-cols-3 gap-3">
              {vehicles.map(vehicle => (
                <FleetVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-rose-500" /></div>
            <span className="text-sm font-semibold text-gray-800">Address</span>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Street Address</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="h-10 text-sm" placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-[1fr_100px_80px] gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} className="h-10 text-sm" placeholder="Miami" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">State</Label>
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} className="h-10 text-sm" placeholder="FL" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">ZIP</Label>
                <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} className="h-10 text-sm" placeholder="33101" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateCompany.isPending}
            className={cn("h-10 px-6 text-sm font-semibold gap-2 rounded-xl transition-all",
              saved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            )}>
            {saved ? <><Check className="w-4 h-4" /> Saved</> : updateCompany.isPending ? "Saving…" : "Save Changes"}
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

function PersonalSection() {
  const [profile, setProfile] = useState({ name: "", email: "" })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user) setProfile({ name: data.user.name ?? "", email: data.user.email ?? "" })
    }).catch(() => {})
  }, [])

  async function handleProfileSave() {
    if (!profile.name.trim()) return
    setProfileSaving(true)
    try {
      const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name.trim() }) })
      if (res.ok) { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    } finally { setProfileSaving(false) }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <SectionHeader title="Personal Details" description="Manage your own account name and credentials." />
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><User className="w-3.5 h-3.5 text-indigo-600" /></div>
          <span className="text-sm font-semibold text-gray-800">Your Account</span>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name</Label>
            <Input value={profile.name} onChange={(e) => { setProfile(p => ({ ...p, name: e.target.value })); setProfileSaved(false) }} className="h-10 text-sm" placeholder="Your full name" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</Label>
            <Input value={profile.email} readOnly className="h-10 text-sm bg-gray-50 text-gray-500 cursor-default" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleProfileSave} disabled={profileSaving || !profile.name.trim()}
          className={cn("h-10 px-6 text-sm font-semibold gap-2 rounded-xl transition-all",
            profileSaved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          )}>
          {profileSaved ? <><Check className="w-4 h-4" /> Saved</> : profileSaving ? "Saving…" : "Save"}
        </Button>
      </div>
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

// ─── Navigation config ────────────────────────────────────────────────────────

type Section = "profile" | "address-book" | "service-types" | "status-actions" | "grid-columns" | "personal" | "team"

const NAV_GROUPS: { label: string; items: { key: Section; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "Company",
    items: [
      { key: "profile",      label: "Profile",      icon: Building2 },
      { key: "address-book", label: "Address Book",  icon: BookMarked },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { key: "service-types",   label: "Service Types",   icon: Settings2 },
      { key: "status-actions",  label: "Status Actions",  icon: Zap },
      { key: "grid-columns",    label: "Grid Columns",    icon: LayoutGrid },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "personal", label: "Personal",     icon: User },
      { key: "team",     label: "Team",         icon: Users },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("profile")
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden min-h-[calc(100vh-10rem)]">

        {/* ── Sidebar ── */}
        <aside className="w-[200px] shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/40">
          <div className="px-5 py-[18px] border-b border-gray-100">
            <p className="text-[13px] font-bold text-gray-900 tracking-tight">Settings</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2.5 mb-1.5">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSection(item.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all text-left",
                        section === item.key
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-500 hover:bg-gray-100/80 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("w-[15px] h-[15px] flex-shrink-0", section === item.key ? "text-blue-600" : "text-gray-400")} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <LogOut className="w-[15px] h-[15px] flex-shrink-0 text-gray-400" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {section === "profile"        && <ProfileSection />}
          {section === "address-book"   && (
            <div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
              <SectionHeader title="Address Book" description="Saved pickup and dropoff locations, shared across your entire company." />
              <AddressBookSection />
            </div>
          )}
          {section === "service-types"  && <ServiceTypesSection />}
          {section === "status-actions" && <StatusActionsSection />}
          {section === "grid-columns"   && <GridColumnsSection />}
          {section === "personal"       && <PersonalSection />}
          {section === "team"           && <TeamSection />}
        </div>
      </div>
    </div>
  )
}
