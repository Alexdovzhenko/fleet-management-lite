"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  Mail, Phone, MapPin, Globe, Car, ChevronLeft, ChevronRight, X,
  Calendar, ExternalLink, Bus, Plane, Train, Ship, Anchor, Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicVehicle {
  id: string
  name: string
  type: string
  year?: number | null
  make?: string | null
  model?: string | null
  capacity: number
  photoUrl?: string | null
  photos: string[]
}

interface PublicProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  logo?: string | null
  banner?: string | null
  about?: string | null
  createdAt: string
  vehicles: PublicVehicle[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter",
  PARTY_BUS: "Party Bus",
  COACH: "Coach",
  OTHER: "Other",
}

const VEHICLE_TYPE_ICONS: Record<string, React.ElementType> = {
  SEDAN: Car, SUV: Car, STRETCH_LIMO: Car,
  SPRINTER: Bus, PARTY_BUS: Bus,
  COACH: Bus, OTHER: Car,
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return raw
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

interface PhotoEntry { url: string; vehicleName: string; vehicleType: string }

function Lightbox({
  photos, index, onClose, onNav,
}: { photos: PhotoEntry[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onNav((index - 1 + photos.length) % photos.length)
      if (e.key === "ArrowRight") onNav((index + 1) % photos.length)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [index, photos.length, onClose, onNav])

  const photo = photos[index]
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, background: "rgba(0,0,0,0.93)" }}
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,0.12)" }}
        onClick={onClose}
      >
        <X className="w-5 h-5 text-white" />
      </button>
      {photos.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.12)" }}>
          {index + 1} / {photos.length}
        </div>
      )}
      <div className="flex flex-col items-center mx-16 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <img
          src={photo.url} alt={photo.vehicleName}
          className="max-h-[75vh] max-w-full object-contain rounded-2xl"
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        />
        <div className="mt-4 text-center">
          <p className="text-white font-semibold text-sm">{photo.vehicleName}</p>
          {photo.vehicleType && (
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-wider font-medium">{photo.vehicleType}</p>
          )}
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onClick={e => { e.stopPropagation(); onNav((index - 1 + photos.length) % photos.length) }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onClick={e => { e.stopPropagation(); onNav((index + 1) % photos.length) }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Contact Row ──────────────────────────────────────────────────────────────

function ContactRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string; href?: string
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-30 group-hover:opacity-60" />
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams<{ companyId: string }>()
  const searchParams = useSearchParams()
  const profileType = searchParams.get("type") ?? "affiliate"

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/public/profile/${params.companyId}?type=${profileType}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => { if (data) setProfile(data) })
      .finally(() => setLoading(false))
  }, [params.companyId, profileType])

  const { allPhotos, vehiclePhotoStart } = useMemo(() => {
    const allPhotos: PhotoEntry[] = []
    const vehiclePhotoStart: Record<string, number> = {}
    for (const v of (profile?.vehicles ?? [])) {
      vehiclePhotoStart[v.id] = allPhotos.length
      const seen = new Set<string>()
      for (const url of [v.photoUrl, ...(v.photos ?? [])]) {
        if (url && !seen.has(url)) {
          allPhotos.push({ url, vehicleName: v.name, vehicleType: VEHICLE_TYPE_LABELS[v.type] || v.type })
          seen.add(url)
        }
      }
    }
    return { allPhotos, vehiclePhotoStart }
  }, [profile?.vehicles])

  const initials = profile?.name
    ? profile.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?"

  const location = [profile?.city, profile?.state].filter(Boolean).join(", ")
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center animate-pulse">
            <Car className="w-5 h-5 text-gray-200" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Loading profile…</p>
        </div>
      </div>
    )
  }

  // ── Not Found ──
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
        <div className="text-center max-w-xs px-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-gray-200" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-sm text-gray-400">This profile link may be invalid or no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Lightbox */}
      {lightboxIdx !== null && allPhotos.length > 0 && (
        <Lightbox
          photos={allPhotos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}

      {/* Top bar */}
      <div className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0" style={{ zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Livery Connect</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: profileType === "client"
                ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                : "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              color: profileType === "client" ? "#92400e" : "#1e40af",
            }}>
            {profileType === "client" ? "Client Profile" : "Affiliate Profile"}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* ── Hero Card ─────────────────────────────────────────────────────── */}
        <div className="relative bg-white rounded-3xl border border-gray-100/80 shadow-[0_4px_32px_rgba(0,0,0,0.08)] overflow-visible">
          {/* Banner */}
          <div
            className="h-52 sm:h-64 w-full overflow-hidden rounded-tl-3xl rounded-tr-3xl"
            style={{
              background: profile.banner
                ? `url(${profile.banner}) center/cover no-repeat`
                : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 55%, #fce7f3 100%)",
            }}
          />
          {/* Logo */}
          <div className="absolute top-40 sm:top-48 left-6 sm:left-8 z-20">
            {profile.logo ? (
              <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden"
                style={{ border: "5px solid white", boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
                <img src={profile.logo} alt={profile.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)",
                  border: "5px solid white",
                  boxShadow: "0 8px 32px rgba(37,99,235,0.28)",
                }}>
                {initials}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="px-6 sm:px-8 pt-16 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
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
          </div>
        </div>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        {profile.about && (
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 pt-6 pb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.about}</p>
            </div>
          </div>
        )}

        {/* ── Fleet + Contact ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

          {/* Fleet */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Fleet</p>
                <p className="text-xl font-bold text-gray-900">
                  {profile.vehicles.length}{" "}
                  <span className="text-gray-400 font-semibold text-base">
                    {profile.vehicles.length === 1 ? "vehicle" : "vehicles"}
                  </span>
                </p>
              </div>
            </div>
            <div className="p-5 pt-4">
              {profile.vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
                  style={{ background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-3">
                    <Car className="w-5 h-5 text-gray-200" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">No vehicles listed</p>
                </div>
              ) : profile.vehicles.length === 1 ? (() => {
                const v = profile.vehicles[0]
                const photo = v.photoUrl || v.photos?.[0]
                const typeLabel = VEHICLE_TYPE_LABELS[v.type] || v.type
                const TypeIcon = VEHICLE_TYPE_ICONS[v.type] || Car
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div
                      className={photo ? "cursor-zoom-in overflow-hidden" : "overflow-hidden"}
                      style={{ aspectRatio: "16/8" }}
                      onClick={photo ? () => setLightboxIdx(vehiclePhotoStart[v.id] ?? 0) : undefined}
                    >
                      {photo
                        ? <img src={photo} alt={v.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg,#f1f5f9,#e2e8f0)" }}>
                            <TypeIcon className="w-14 h-14 text-slate-300" />
                          </div>
                      }
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {[v.year, typeLabel].filter(Boolean).join(" · ")}
                          {v.capacity ? ` · ${v.capacity} pax` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg flex-shrink-0 uppercase tracking-wider">
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                )
              })() : (
                <div className={`grid gap-3 ${profile.vehicles.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {profile.vehicles.map(v => {
                    const photo = v.photoUrl || v.photos?.[0]
                    const typeLabel = VEHICLE_TYPE_LABELS[v.type] || v.type
                    const TypeIcon = VEHICLE_TYPE_ICONS[v.type] || Car
                    return (
                      <div key={v.id} className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div
                          className={`aspect-[4/3] overflow-hidden ${photo ? "cursor-zoom-in" : ""}`}
                          onClick={photo ? () => setLightboxIdx(vehiclePhotoStart[v.id] ?? 0) : undefined}
                        >
                          {photo
                            ? <img src={photo} alt={v.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg,#f1f5f9,#e2e8f0)" }}>
                                <TypeIcon className="w-8 h-8 text-slate-300" />
                              </div>
                          }
                        </div>
                        <div className="px-3.5 pt-3 pb-3.5">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{v.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
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

          {/* Contact */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
            </div>
            <div className="px-6 pb-6">
              {profile.email && (
                <ContactRow icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />
              )}
              {profile.phone && (
                <ContactRow icon={Phone} label="Phone" value={formatPhone(profile.phone)} href={`tel:${profile.phone}`} />
              )}
              {location && (
                <ContactRow icon={MapPin} label="Location" value={location} />
              )}
              {profile.website && (
                <ContactRow
                  icon={Globe}
                  label="Website"
                  value={profile.website.replace(/^https?:\/\//, "")}
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <a
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
              <Car className="w-2.5 h-2.5 text-white" />
            </div>
            Powered by <span className="font-semibold text-gray-500">Livery Connect</span>
          </a>
        </div>
      </div>
    </div>
  )
}
