"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import {
  Building2, Phone, Mail, MapPin, Globe, Camera,
  Settings2, Check, ZoomIn, ZoomOut, Plus, Trash2, X, LogOut, Users,
  // Icon picker options
  Car, Bus, Plane, Train, Ship, Anchor,
  Clock, RefreshCw, Route, Layers, MapPin as NavPin, Navigation,
  User, Star, Shield, Zap, Crown, Briefcase, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCompany, useUpdateCompany } from "@/lib/hooks/use-company"
import {
  useServiceTypes,
  useToggleServiceType,
  useCreateServiceType,
  useDeleteServiceType,
  type ServiceType,
} from "@/lib/hooks/use-service-types"
import { cn } from "@/lib/utils"
import type { Company } from "@/types"

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

// ─── Service Type Row ─────────────────────────────────────────────────────────

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

      {/* Toggle */}
      <button
        onClick={() => toggle.mutate({ id: type.id, isEnabled: !type.isEnabled })}
        className={cn(
          "w-10 h-6 rounded-full transition-all flex-shrink-0 relative",
          type.isEnabled ? "bg-blue-500" : "bg-gray-200"
        )}
      >
        <span className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all",
          type.isEnabled ? "left-4.5 translate-x-0" : "left-0.5"
        )} />
      </button>

      {/* Delete (custom only) */}
      {!type.isBuiltIn && (
        <button
          onClick={() => del.mutate(type.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Create Service Type Dialog ───────────────────────────────────────────────

function CreateServiceTypeDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateServiceType()
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [iconName, setIconName] = useState("Car")
  const [color, setColor] = useState("bg-gray-100 text-gray-600")

  const selectedIcon = ICON_MAP[iconName] ?? Car

  async function handleCreate() {
    if (!label.trim()) return
    await create.mutateAsync({ label: label.trim(), description: description.trim() || undefined, iconName, color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">New Service Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Preview */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              {(() => { const I = selectedIcon; return <I className="w-5 h-5" /> })()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{label || <span className="text-gray-300">Service name</span>}</p>
              <p className="text-xs text-gray-400">{description || <span className="text-gray-300">Short description</span>}</p>
            </div>
          </div>

          {/* Fields */}
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Service Name *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 text-sm" placeholder="e.g. Executive Transfer" autoFocus />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Short Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 text-sm" placeholder="e.g. Premium VIP service" />
          </div>

          {/* Icon picker */}
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-2 block">Icon</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {ICON_PICKER_OPTIONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  onClick={() => setIconName(name)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    iconName === name
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-1"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map(({ label: clabel, value: cval }) => (
                <button
                  key={cval}
                  onClick={() => setColor(cval)}
                  title={clabel}
                  className={cn(
                    "w-7 h-7 rounded-lg transition-all",
                    cval,
                    color === cval ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <span className="sr-only">{clabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-4 text-sm">Cancel</Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!label.trim() || create.isPending}
            className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            {create.isPending ? "Creating…" : "Create Service Type"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const { data: company, isLoading } = useCompany()
  const updateCompany = useUpdateCompany()
  const { data: serviceTypes = [], isLoading: typesLoading } = useServiceTypes()
  const logoRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const [form, setForm] = useState({
    name: "", email: "", phone: "", website: "", address: "", city: "", state: "", zip: "", logo: "", banner: "",
  })
  const [saved, setSaved] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Personal details (User table)
  const [profile, setProfile] = useState({ name: "", email: "" })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setProfile({ name: data.user.name ?? "", email: data.user.email ?? "" })
      })
      .catch(() => {})
  }, [])

  async function handleProfileSave() {
    if (!profile.name.trim()) return
    setProfileSaving(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name.trim() }),
      })
      if (res.ok) {
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      }
    } finally {
      setProfileSaving(false)
    }
  }

  // Crop state
  const [rawBanner, setRawBanner] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!company) return
    setForm({
      name:    company.name    ?? "",
      email:   company.email   ?? "",
      phone:   company.phone   ?? "",
      address: company.address ?? "",
      city:    company.city    ?? "",
      state:   company.state   ?? "",
      zip:     company.zip     ?? "",
      logo:    company.logo    ?? "",
      banner:  company.banner  ?? "",
      website: company.website ?? "",
    })
  }, [company])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set("logo", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRawBanner(ev.target?.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropApply() {
    if (!rawBanner || !croppedAreaPixels) return
    try {
      const cropped = await getCroppedImg(rawBanner, croppedAreaPixels)
      set("banner", cropped)
    } finally {
      setCropOpen(false)
      setRawBanner(null)
    }
  }

  function handleSave() {
    updateCompany.mutate(form as Partial<Company>, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })
  }

  const location = [form.city, form.state].filter(Boolean).join(", ")
  const enabledCount = serviceTypes.filter((t) => t.isEnabled).length

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-56 rounded-3xl bg-gray-200" />
        <div className="h-40 rounded-3xl bg-gray-100" />
        <div className="h-40 rounded-3xl bg-gray-100" />
      </div>
    )
  }

  return (
    <>
      {/* ── Banner Crop Modal ───────────────────────────────────────────────── */}
      {cropOpen && rawBanner && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Adjust Banner</p>
              <p className="text-xs text-white/40 mt-0.5">Drag to reposition · Scroll or use slider to zoom</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCropOpen(false); setRawBanner(null) }} className="h-8 px-4 text-xs text-white/60 hover:text-white hover:bg-white/10">Cancel</Button>
              <Button size="sm" onClick={handleCropApply} className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold">Apply</Button>
            </div>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={rawBanner}
              crop={crop}
              zoom={zoom}
              aspect={16 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { background: "transparent" }, cropAreaStyle: { border: "2px solid rgba(255,255,255,0.6)", borderRadius: 8 } }}
            />
          </div>
          <div className="px-8 py-6 flex items-center gap-4 border-t border-white/10">
            <button onClick={() => setZoom((z) => Math.max(1, z - 0.1))}><ZoomOut className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4 text-white/50 hover:text-white transition-colors" /></button>
            <span className="text-xs text-white/30 w-8 text-right">{zoom.toFixed(1)}×</span>
          </div>
        </div>
      )}

      {/* ── Create Service Type Dialog ──────────────────────────────────────── */}
      {createOpen && <CreateServiceTypeDialog onClose={() => setCreateOpen(false)} />}

      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Profile Hero ───────────────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden border border-gray-200/80 bg-white shadow-sm">
          <div className="relative h-[184px] cursor-pointer group overflow-hidden" onClick={() => bannerRef.current?.click()}>
            {form.banner ? (
              <img src={form.banner} alt="banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(255,255,255,0.25),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.4),transparent_50%)]" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Camera className="w-3.5 h-3.5" />
                {form.banner ? "Change banner" : "Upload banner"}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
          </div>

          <div className="px-7 pb-7">
            <div className="flex items-end justify-between -mt-12 mb-5">
              <div className="relative w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0" onClick={() => logoRef.current?.click()}>
                {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <Building2 className="w-9 h-9 text-gray-200" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-all">
                  <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
              <Button onClick={handleSave} disabled={updateCompany.isPending} size="sm" className={cn("h-9 px-5 text-sm font-semibold gap-2 rounded-xl transition-all mb-1", saved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-[#2563EB] hover:bg-blue-700 text-white")}>
                {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : updateCompany.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{form.name || <span className="text-gray-300">Your Company Name</span>}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5">
              {form.email && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3 h-3 text-blue-500" />
                  </span>
                  {form.email}
                </span>
              )}
              {form.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 text-green-500" />
                  </span>
                  {form.phone}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-rose-500" />
                  </span>
                  {location}
                </span>
              )}
              {form.website && (
                <a
                  href={form.website.startsWith("http") ? form.website : `https://${form.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-violet-600 transition-colors group"
                >
                  <span className="w-5 h-5 rounded-md bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                    <Globe className="w-3 h-3 text-violet-500" />
                  </span>
                  {form.website}
                </a>
              )}
              {!form.email && !form.phone && !location && !form.website && <span className="text-sm text-gray-300">No contact info yet</span>}
            </div>
          </div>
        </div>

        {/* ── Edit Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-blue-600" /></div>
              <span className="text-sm font-semibold text-gray-800">Company Information</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Company Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-10 text-sm" placeholder="Apex Limousine Service" />
              </div>
              <div className="col-span-1">
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-10 text-sm" placeholder="info@company.com" />
              </div>
              <div className="col-span-1">
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-10 text-sm" placeholder="(305) 555-0100" />
              </div>
              <div className="col-span-1">
                <Label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
                <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className="h-10 text-sm" placeholder="https://company.com" />
              </div>
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-rose-500" /></div>
              <span className="text-sm font-semibold text-gray-800">Address</span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Street Address</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="h-10 text-sm" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-[1fr_130px_90px] gap-3">
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
        </div>

        {/* ── Service Types ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Settings2 className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">Service Types</span>
                <p className="text-xs text-gray-400 mt-0.5">Enabled types appear in the reservation window</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!typesLoading && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {enabledCount} enabled
                </span>
              )}
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom
              </Button>
            </div>
          </div>

          {typesLoading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-48" />
                  </div>
                  <div className="w-10 h-6 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {serviceTypes.map((type) => (
                <ServiceTypeRow key={type.id} type={type} />
              ))}
            </div>
          )}
        </div>

        {/* ── Personal Details ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Personal Details</span>
            </div>
            <Button
              onClick={handleProfileSave}
              disabled={profileSaving || !profile.name.trim()}
              size="sm"
              className={cn(
                "h-8 px-4 text-xs font-semibold gap-1.5 rounded-xl transition-all",
                profileSaved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {profileSaved ? <><Check className="w-3 h-3" /> Saved</> : profileSaving ? "Saving…" : "Save"}
            </Button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name</Label>
              <Input
                value={profile.name}
                onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileSaved(false) }}
                className="h-10 text-sm"
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</Label>
              <Input
                value={profile.email}
                readOnly
                className="h-10 text-sm bg-gray-50 text-gray-500 cursor-default"
              />
            </div>
          </div>
        </div>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Account</span>
          </div>
          <div className="divide-y divide-gray-50">
            <Link
              href="/settings/team"
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <Users className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Team Members</span>
              <span className="ml-auto text-gray-300 group-hover:text-gray-400">→</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-colors group text-left"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="text-sm text-gray-700 group-hover:text-red-600">Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
