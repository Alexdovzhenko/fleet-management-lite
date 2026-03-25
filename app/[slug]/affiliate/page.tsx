"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  Mail, Phone, MapPin, Globe, Car, ChevronLeft, ChevronRight, X,
  Calendar, ExternalLink,
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
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  xUrl?: string | null
  linkedinUrl?: string | null
  createdAt: string
  vehicles: PublicVehicle[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Other",
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return raw
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

interface PhotoEntry { url: string; vehicleName: string; vehicleType: string }

function Lightbox({ photos, index, onClose, onNav }: {
  photos: PhotoEntry[]; index: number; onClose: () => void; onNav: (i: number) => void
}) {
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
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999, background: "rgba(0,0,0,0.93)" }} onClick={onClose}>
      <button className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }} onClick={onClose}>
        <X className="w-5 h-5 text-white" />
      </button>
      {photos.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-medium" style={{ background: "rgba(255,255,255,0.12)" }}>
          {index + 1} / {photos.length}
        </div>
      )}
      <div className="flex flex-col items-center mx-16 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <img src={photo.url} alt={photo.vehicleName} className="max-h-[75vh] max-w-full object-contain rounded-2xl" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} />
        <div className="mt-4 text-center">
          <p className="text-white font-semibold text-sm">{photo.vehicleName}</p>
          {photo.vehicleType && <p className="text-white/40 text-xs mt-0.5 uppercase tracking-wider font-medium">{photo.vehicleType}</p>}
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }} onClick={e => { e.stopPropagation(); onNav((index - 1 + photos.length) % photos.length) }}>
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }} onClick={e => { e.stopPropagation(); onNav((index + 1) % photos.length) }}>
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
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
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

// ─── Social Icons ─────────────────────────────────────────────────────────────

function SocialIcons({ instagram, facebook, tiktok, x, linkedin }: {
  instagram?: string | null; facebook?: string | null; tiktok?: string | null
  x?: string | null; linkedin?: string | null
}) {
  const links = [
    { href: instagram, label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, color: "hover:text-pink-500" },
    { href: facebook, label: "Facebook", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, color: "hover:text-blue-600" },
    { href: tiktok, label: "TikTok", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, color: "hover:text-gray-900" },
    { href: x, label: "X", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, color: "hover:text-gray-900" },
    { href: linkedin, label: "LinkedIn", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, color: "hover:text-blue-700" },
  ].filter(l => !!l.href)

  if (links.length === 0) return null
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {links.map(({ href, label, icon, color }) => (
        <a key={label} href={href!} target="_blank" rel="noopener noreferrer" aria-label={label}
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 transition-colors ${color}`}
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {icon}
        </a>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateProfilePage() {
  const params = useParams<{ slug: string }>()
  const profileType = "affiliate"

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/public/profile/${params.slug}?type=${profileType}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => { if (data) setProfile(data) })
      .finally(() => setLoading(false))
  }, [params.slug])

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
      {lightboxIdx !== null && allPhotos.length > 0 && (
        <Lightbox photos={allPhotos} index={lightboxIdx} onClose={() => setLightboxIdx(null)} onNav={setLightboxIdx} />
      )}

      {/* Top bar */}
      <div className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0" style={{ zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Livery Connect</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e40af" }}>
            Affiliate Profile
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Hero */}
        <div className="relative bg-white rounded-3xl border border-gray-100/80 shadow-[0_4px_32px_rgba(0,0,0,0.08)] overflow-visible">
          <div className="h-52 sm:h-64 w-full overflow-hidden rounded-tl-3xl rounded-tr-3xl"
            style={{ background: profile.banner ? `url(${profile.banner}) center/cover no-repeat` : "linear-gradient(135deg,#dbeafe 0%,#ede9fe 55%,#fce7f3 100%)" }} />
          <div className="absolute top-40 sm:top-48 left-6 sm:left-8 z-20">
            {profile.logo ? (
              <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden" style={{ border: "5px solid white", boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
                <img src={profile.logo} alt={profile.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg,rgb(37,99,235),rgb(79,70,229))", border: "5px solid white", boxShadow: "0 8px 32px rgba(37,99,235,0.28)" }}>
                {initials}
              </div>
            )}
          </div>
          <div className="px-6 sm:px-8 pt-16 pb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {location && <span className="text-sm text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{location}</span>}
                {memberSince && <span className="text-sm text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Member since {memberSince}</span>}
              </div>
            </div>
            <SocialIcons instagram={profile.instagramUrl} facebook={profile.facebookUrl} tiktok={profile.tiktokUrl} x={profile.xUrl} linkedin={profile.linkedinUrl} />
          </div>
        </div>

        {/* About */}
        {profile.about && (
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 pt-6 pb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.about}</p>
            </div>
          </div>
        )}

        {/* Fleet + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Fleet</p>
              <p className="text-xl font-bold text-gray-900">
                {profile.vehicles.length} <span className="text-gray-400 font-semibold text-base">{profile.vehicles.length === 1 ? "vehicle" : "vehicles"}</span>
              </p>
            </div>
            <div className="p-5 pt-4">
              {profile.vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl" style={{ background: "linear-gradient(160deg,#f8fafc,#f1f5f9)" }}>
                  <Car className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm font-medium text-gray-300">No vehicles listed</p>
                </div>
              ) : profile.vehicles.length === 1 ? (() => {
                const v = profile.vehicles[0]
                const photo = v.photoUrl || v.photos?.[0]
                const typeLabel = VEHICLE_TYPE_LABELS[v.type] || v.type
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className={photo ? "cursor-zoom-in overflow-hidden" : "overflow-hidden"} style={{ aspectRatio: "16/8" }} onClick={photo ? () => setLightboxIdx(vehiclePhotoStart[v.id] ?? 0) : undefined}>
                      {photo ? <img src={photo} alt={v.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg,#f1f5f9,#e2e8f0)" }}><Car className="w-14 h-14 text-slate-300" /></div>}
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{[v.year, typeLabel].filter(Boolean).join(" · ")}{v.capacity ? ` · ${v.capacity} pax` : ""}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg flex-shrink-0 uppercase tracking-wider">{typeLabel}</span>
                    </div>
                  </div>
                )
              })() : (
                <div className={`grid gap-3 ${profile.vehicles.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {profile.vehicles.map(v => {
                    const photo = v.photoUrl || v.photos?.[0]
                    const typeLabel = VEHICLE_TYPE_LABELS[v.type] || v.type
                    return (
                      <div key={v.id} className="rounded-2xl overflow-hidden" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className={`aspect-[4/3] overflow-hidden ${photo ? "cursor-zoom-in" : ""}`} onClick={photo ? () => setLightboxIdx(vehiclePhotoStart[v.id] ?? 0) : undefined}>
                          {photo ? <img src={photo} alt={v.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg,#f1f5f9,#e2e8f0)" }}><Car className="w-8 h-8 text-slate-300" /></div>}
                        </div>
                        <div className="px-3.5 pt-3 pb-3.5">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{v.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{[v.year, typeLabel].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
            </div>
            <div className="px-6 pb-6">
              {profile.email && <ContactRow icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />}
              {profile.phone && <ContactRow icon={Phone} label="Phone" value={formatPhone(profile.phone)} href={`tel:${profile.phone}`} />}
              {location && <ContactRow icon={MapPin} label="Location" value={location} />}
              {profile.website && (
                <ContactRow icon={Globe} label="Website" value={profile.website.replace(/^https?:\/\//, "")}
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg viewBox="0 0 44 30" className="h-4 w-auto" fill="currentColor" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" />
            </svg>
            Powered by <span className="font-semibold text-gray-500">Livery Connect</span>
          </div>
        </div>
      </div>
    </div>
  )
}
