"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useParams } from "next/navigation"
import { US_CITIES } from "@/lib/us-cities"
import {
  Mail, Phone, MapPin, Globe, Car, ChevronLeft, ChevronRight, X,
  Calendar, ExternalLink, MessageSquare, CheckCircle2, ChevronDown,
  User, Clock, ArrowRight, Users, Plus, Trash2, Plane, PlaneLanding,
  Timer, Route, Check,
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

// ─── Airport / Airline Data ───────────────────────────────────────────────────

const AIRPORT_OPTIONS: { iata: string; name: string; city: string }[] = [
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta" },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles" },
  { iata: "ORD", name: "Chicago O'Hare International", city: "Chicago" },
  { iata: "DFW", name: "Dallas/Fort Worth International", city: "Dallas" },
  { iata: "DEN", name: "Denver International", city: "Denver" },
  { iata: "JFK", name: "John F. Kennedy International", city: "New York" },
  { iata: "SFO", name: "San Francisco International", city: "San Francisco" },
  { iata: "SEA", name: "Seattle-Tacoma International", city: "Seattle" },
  { iata: "LAS", name: "Harry Reid International", city: "Las Vegas" },
  { iata: "MCO", name: "Orlando International", city: "Orlando" },
  { iata: "EWR", name: "Newark Liberty International", city: "Newark" },
  { iata: "MIA", name: "Miami International", city: "Miami" },
  { iata: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix" },
  { iata: "IAH", name: "George Bush Intercontinental", city: "Houston" },
  { iata: "BOS", name: "Boston Logan International", city: "Boston" },
  { iata: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis" },
  { iata: "DTW", name: "Detroit Metropolitan Wayne County", city: "Detroit" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale" },
  { iata: "PHL", name: "Philadelphia International", city: "Philadelphia" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York" },
  { iata: "BWI", name: "Baltimore/Washington International", city: "Baltimore" },
  { iata: "DCA", name: "Ronald Reagan Washington National", city: "Washington DC" },
  { iata: "IAD", name: "Washington Dulles International", city: "Washington DC" },
  { iata: "MDW", name: "Chicago Midway International", city: "Chicago" },
  { iata: "SAN", name: "San Diego International", city: "San Diego" },
  { iata: "TPA", name: "Tampa International", city: "Tampa" },
  { iata: "BNA", name: "Nashville International", city: "Nashville" },
  { iata: "AUS", name: "Austin-Bergstrom International", city: "Austin" },
  { iata: "CLT", name: "Charlotte Douglas International", city: "Charlotte" },
  { iata: "RSW", name: "Southwest Florida International", city: "Fort Myers" },
  { iata: "PBI", name: "Palm Beach International", city: "West Palm Beach" },
  { iata: "MCI", name: "Kansas City International", city: "Kansas City" },
  { iata: "PDX", name: "Portland International", city: "Portland" },
  { iata: "SLC", name: "Salt Lake City International", city: "Salt Lake City" },
  { iata: "MSY", name: "Louis Armstrong New Orleans International", city: "New Orleans" },
  { iata: "HNL", name: "Daniel K. Inouye International", city: "Honolulu" },
  { iata: "SJU", name: "Luis Muñoz Marín International", city: "San Juan" },
  { iata: "JAX", name: "Jacksonville International", city: "Jacksonville" },
  { iata: "SAV", name: "Savannah/Hilton Head International", city: "Savannah" },
  { iata: "RDU", name: "Raleigh-Durham International", city: "Raleigh" },
  { iata: "SRQ", name: "Sarasota Bradenton International", city: "Sarasota" },
  { iata: "PIE", name: "St. Pete-Clearwater International", city: "St. Petersburg" },
  { iata: "YYZ", name: "Toronto Pearson International", city: "Toronto" },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International", city: "Montreal" },
  { iata: "YVR", name: "Vancouver International", city: "Vancouver" },
]

const AIRLINE_OPTIONS: { iata: string; name: string }[] = [
  { iata: "AA", name: "American Airlines" },
  { iata: "DL", name: "Delta Air Lines" },
  { iata: "UA", name: "United Airlines" },
  { iata: "WN", name: "Southwest Airlines" },
  { iata: "B6", name: "JetBlue Airways" },
  { iata: "AS", name: "Alaska Airlines" },
  { iata: "NK", name: "Spirit Airlines" },
  { iata: "F9", name: "Frontier Airlines" },
  { iata: "G4", name: "Allegiant Air" },
  { iata: "HA", name: "Hawaiian Airlines" },
  { iata: "AC", name: "Air Canada" },
  { iata: "WS", name: "WestJet" },
  { iata: "AM", name: "Aeromexico" },
  { iata: "BA", name: "British Airways" },
  { iata: "VS", name: "Virgin Atlantic" },
  { iata: "AF", name: "Air France" },
  { iata: "LH", name: "Lufthansa" },
  { iata: "KL", name: "KLM Royal Dutch Airlines" },
  { iata: "IB", name: "Iberia" },
  { iata: "AZ", name: "ITA Airways" },
  { iata: "EK", name: "Emirates" },
  { iata: "EY", name: "Etihad Airways" },
  { iata: "QR", name: "Qatar Airways" },
  { iata: "TK", name: "Turkish Airlines" },
  { iata: "ET", name: "Ethiopian Airlines" },
  { iata: "JL", name: "Japan Airlines" },
  { iata: "NH", name: "All Nippon Airways" },
  { iata: "KE", name: "Korean Air" },
  { iata: "SQ", name: "Singapore Airlines" },
  { iata: "CX", name: "Cathay Pacific" },
  { iata: "QF", name: "Qantas" },
  { iata: "LA", name: "LATAM Airlines" },
]

function QuoteAirportPicker({ value, onSelect }: {
  value: string
  onSelect: (iata: string, name: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen]   = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref     = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t) && dropRef.current && !dropRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const filtered = query.trim()
    ? AIRPORT_OPTIONS.filter(a =>
        a.iata.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : AIRPORT_OPTIONS.slice(0, 10)

  function openDrop() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      const below = window.innerHeight - r.bottom
      setStyle(below < 260
        ? { position: "fixed", bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: Math.max(r.width, 340), zIndex: 10000 }
        : { position: "fixed", top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 340), zIndex: 10000 }
      )
    }
    setOpen(true)
  }

  const selected = AIRPORT_OPTIONS.find(a => a.iata === value)

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); openDrop() }}
        onFocus={openDrop}
        placeholder="Search airport by name or code…"
        autoComplete="off"
        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      {selected && query === value && (
        <div className="mt-1 px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium flex items-center gap-1.5">
          <Check className="w-3 h-3 flex-shrink-0" />
          <span className="font-bold">{selected.iata}</span> · {selected.name} · {selected.city}
        </div>
      )}
      {open && filtered.length > 0 && createPortal(
        <div ref={dropRef} style={style} className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {filtered.map(a => (
              <button key={a.iata} type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(a.iata, a.name); setQuery(a.iata); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${a.iata === value ? "bg-blue-50" : ""}`}>
                <span className="text-xs font-mono font-bold text-indigo-600 w-9 flex-shrink-0">{a.iata}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 font-medium truncate">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.city}</div>
                </div>
                {a.iata === value && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function QuoteAirlinePicker({ value, onSelect }: {
  value: string
  onSelect: (iata: string, name: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen]   = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref     = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t) && dropRef.current && !dropRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const filtered = query.trim()
    ? AIRLINE_OPTIONS.filter(a =>
        a.iata.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : AIRLINE_OPTIONS.slice(0, 10)

  function openDrop() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      const below = window.innerHeight - r.bottom
      setStyle(below < 260
        ? { position: "fixed", bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: Math.max(r.width, 300), zIndex: 10000 }
        : { position: "fixed", top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 300), zIndex: 10000 }
      )
    }
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); openDrop() }}
        onFocus={openDrop}
        placeholder="Search airline…"
        autoComplete="off"
        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      {open && filtered.length > 0 && createPortal(
        <div ref={dropRef} style={style} className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {filtered.map(a => (
              <button key={a.iata} type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(a.iata, a.name); setQuery(a.name); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${a.iata === value ? "bg-blue-50" : ""}`}>
                <span className="text-xs font-mono font-bold text-indigo-600 w-6 flex-shrink-0">{a.iata}</span>
                <span className="text-sm text-gray-800 font-medium flex-1 truncate">{a.name}</span>
                {a.iata === value && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── City / State Autocomplete ────────────────────────────────────────────────

function CityStatePicker({ cityValue, stateValue, zipValue, onCityChange, onStateChange, onZipChange, fieldCls }: {
  cityValue: string; stateValue: string; zipValue: string
  onCityChange: (v: string) => void; onStateChange: (v: string) => void; onZipChange: (v: string) => void
  fieldCls: string
}) {
  const [open, setOpen]   = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref     = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t) && dropRef.current && !dropRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const filtered = cityValue.trim().length >= 1
    ? US_CITIES.filter(c =>
        c.city.toLowerCase().startsWith(cityValue.toLowerCase()) ||
        c.city.toLowerCase().includes(cityValue.toLowerCase())
      ).slice(0, 10)
    : []

  function openDrop() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom
    setStyle(below < 240
      ? { position: "fixed", bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: Math.max(r.width, 260), zIndex: 10000 }
      : { position: "fixed", top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 260), zIndex: 10000 }
    )
    setOpen(true)
  }

  return (
    <div className="grid grid-cols-[1fr_80px_90px] gap-2">
      <div ref={ref} className="relative">
        <input
          value={cityValue}
          onChange={e => { onCityChange(e.target.value); setTimeout(openDrop, 0) }}
          onFocus={openDrop}
          placeholder="City"
          autoComplete="off"
          className={fieldCls}
        />
        {open && filtered.length > 0 && createPortal(
          <div ref={dropRef} style={style} className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((c, i) => (
                <button key={i} type="button"
                  onMouseDown={e => { e.preventDefault(); onCityChange(c.city); onStateChange(c.state); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-800 font-medium">{c.city}</span>
                  <span className="text-xs font-mono font-bold text-indigo-500 flex-shrink-0">{c.state}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
      <div className="relative">
        <select value={stateValue} onChange={e => onStateChange(e.target.value)}
          className={`${fieldCls} appearance-none pr-6 cursor-pointer`}>
          <option value="">State</option>
          {["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
      </div>
      <input value={zipValue} onChange={e => onZipChange(e.target.value)} placeholder="ZIP" className={fieldCls} maxLength={10} autoComplete="postal-code" />
    </div>
  )
}

// ─── Quote Request Form ────────────────────────────────────────────────────────

const VEHICLE_OPTIONS = [
  { value: "", label: "No preference" },
  { value: "SEDAN",       label: "Sedan" },
  { value: "SUV",         label: "SUV" },
  { value: "STRETCH_LIMO",label: "Stretch Limo" },
  { value: "SPRINTER",    label: "Sprinter Van" },
  { value: "PARTY_BUS",   label: "Party Bus" },
  { value: "COACH",       label: "Coach Bus" },
  { value: "OTHER",       label: "Other" },
]

const SERVICE_OPTIONS = [
  { value: "AIRPORT_PICKUP",  label: "Airport Pickup",  Icon: PlaneLanding },
  { value: "AIRPORT_DROPOFF", label: "Airport Drop-off", Icon: Plane },
  { value: "HOURLY",          label: "Hourly",           Icon: Timer },
  { value: "POINT_TO_POINT",  label: "Point to Point",  Icon: Route },
]

interface QuoteFormProps { companyId: string; companyName: string; vehicles: PublicVehicle[]; onClose: () => void }

function QuoteForm({ companyId, companyName, vehicles, onClose }: QuoteFormProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName]             = useState("")
  const [phone, setPhone]           = useState("")
  const [email, setEmail]           = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [pickupStreet, setPickupStreet] = useState("")
  const [pickupCity,   setPickupCity]   = useState("")
  const [pickupState,  setPickupState]  = useState("")
  const [pickupZip,    setPickupZip]    = useState("")
  const [stops, setStops] = useState<{ type: "address" | "airport"; street: string; city: string; state: string; zip: string; airportCode: string; airportName: string; airlineCode: string; airlineName: string; flightNumber: string }[]>([])
  const [newStop, setNewStop] = useState({ type: "" as "" | "address" | "airport", street: "", city: "", state: "", zip: "", airportCode: "", airportName: "", airlineCode: "", airlineName: "", flightNumber: "" })
  const [showStopInput, setShowStopInput] = useState(false)
  const [dropoffStreet, setDropoffStreet] = useState("")
  const [dropoffCity,   setDropoffCity]   = useState("")
  const [dropoffState,  setDropoffState]  = useState("")
  const [dropoffZip,    setDropoffZip]    = useState("")
  const [airportCode, setAirportCode] = useState("")
  const [airportName, setAirportName] = useState("")
  const [airlineCode, setAirlineCode] = useState("")
  const [airlineName, setAirlineName] = useState("")
  const [flightNumber, setFlightNumber] = useState("")
  const [vehicle, setVehicle]       = useState("")
  const [pax, setPax]               = useState(1)
  const [notes, setNotes]           = useState("")

  function composeAddress(street: string, city: string, state: string, zip: string) {
    const csz = [city.trim(), [state.trim(), zip.trim()].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    return [street.trim(), csz].filter(Boolean).join(", ")
  }

  function addStop() {
    if (newStop.type === "address" && !newStop.street.trim()) return
    if (newStop.type === "airport" && !newStop.airportCode) return
    if (!newStop.type) return
    setStops(prev => [...prev, { ...newStop, type: newStop.type as "address" | "airport" }])
    setNewStop({ type: "", street: "", city: "", state: "", zip: "", airportCode: "", airportName: "", airlineCode: "", airlineName: "", flightNumber: "" })
    setShowStopInput(false)
  }

  function resetNewStop() {
    setNewStop({ type: "", street: "", city: "", state: "", zip: "", airportCode: "", airportName: "", airlineCode: "", airlineName: "", flightNumber: "" })
    setShowStopInput(false)
  }

  function removeStop(i: number) {
    setStops(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isHourly    = serviceType === "HOURLY"
    const isAirPickup = serviceType === "AIRPORT_PICKUP"
    const isAirDrop   = serviceType === "AIRPORT_DROPOFF"

    const needPickupAddr  = !isAirPickup  && !pickupStreet
    const needDropoffAddr = !isHourly && !isAirDrop && !dropoffStreet
    const needPickupAirport  = isAirPickup  && !airportCode
    const needDropoffAirport = isAirDrop    && !airportCode

    if (!name || !phone || !pickupDate || needPickupAddr || needDropoffAddr || needPickupAirport || needDropoffAirport) {
      setError("Please fill in all required fields.")
      return
    }
    setError("")
    setLoading(true)

    const pickupAddress = isAirPickup
      ? `${airportCode} — ${airportName}`
      : composeAddress(pickupStreet, pickupCity, pickupState, pickupZip)

    const dropoffAddress = isAirDrop
      ? `${airportCode} — ${airportName}`
      : isHourly
        ? composeAddress(dropoffStreet, dropoffCity, dropoffState, dropoffZip) || "Hourly — return TBD"
        : composeAddress(dropoffStreet, dropoffCity, dropoffState, dropoffZip)

    // Compose structured notes
    const noteParts: string[] = []
    if (serviceType) {
      const svc = SERVICE_OPTIONS.find(s => s.value === serviceType)
      noteParts.push(`Service: ${svc?.label ?? serviceType}`)
    }
    if ((isAirPickup || isAirDrop) && (airlineName || airlineCode)) {
      noteParts.push(`Airline: ${airlineName || airlineCode}${airlineCode && airlineName ? ` (${airlineCode})` : ""}`)
    }
    if ((isAirPickup || isAirDrop) && flightNumber) {
      noteParts.push(`Flight: ${flightNumber}`)
    }
    if (stops.length > 0) {
      noteParts.push(`Stops: ${stops.map(s => {
        if (s.type === "airport") {
          const airline = s.airlineName || s.airlineCode ? ` [${s.airlineName || s.airlineCode}${s.flightNumber ? " " + s.flightNumber : ""}]` : ""
          return `${s.airportCode} — ${s.airportName}${airline}`
        }
        return composeAddress(s.street, s.city, s.state, s.zip)
      }).join(" → ")}`)
    }
    if (notes.trim()) noteParts.push(notes.trim())

    try {
      const res = await fetch("/api/public/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          clientName:     name,
          clientPhone:    phone,
          clientEmail:    email || undefined,
          pickupDate,
          pickupTime:     pickupTime || undefined,
          pickupAddress,
          dropoffAddress,
          vehicleType:    vehicle || undefined,
          passengerCount: pax,
          notes:          noteParts.length > 0 ? noteParts.join("\n") : undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to submit")
      setStep("success")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fieldCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
  const isHourly    = serviceType === "HOURLY"
  const isAirPickup = serviceType === "AIRPORT_PICKUP"
  const isAirDrop   = serviceType === "AIRPORT_DROPOFF"

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div ref={scrollRef} className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {step === "success" ? (
          <div className="flex flex-col items-center justify-center px-8 py-14 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Request Sent!</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {companyName} will review your request and reach out with pricing shortly.
            </p>
            <button onClick={onClose}
              className="mt-4 w-full h-12 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Request a Quote</h2>
                <p className="text-xs text-gray-400 mt-0.5">{companyName} · No commitment required</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Contact */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3" />Contact Info
                </p>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={fieldCls} autoComplete="name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Phone *</label>
                    <input value={phone} onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                      const fmt = digits.length === 0 ? "" : digits.length <= 3 ? `(${digits}` : digits.length <= 6 ? `(${digits.slice(0,3)}) ${digits.slice(3)}` : `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                      setPhone(fmt)
                    }} type="tel" placeholder="(555) 000-0000" className={fieldCls} autoComplete="tel" />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Optional" className={fieldCls} autoComplete="email" />
                  </div>
                </div>
              </div>

              {/* Trip details */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />Trip Details
                </p>

                {/* Service type */}
                <div>
                  <label className={labelCls}>Service Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_OPTIONS.map(({ value, label, Icon }) => {
                      const active = serviceType === value
                      return (
                        <button key={value} type="button" onClick={() => setServiceType(active ? "" : value)}
                          className="flex items-center gap-2 h-10 px-3 rounded-xl border text-sm font-medium transition-all"
                          style={active
                            ? { background: "linear-gradient(135deg,#eff6ff,#eef2ff)", borderColor: "#6366f1", color: "#4338ca" }
                            : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date *</label>
                    <input value={pickupDate} onChange={e => setPickupDate(e.target.value)} type="date" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Time</label>
                    <input value={pickupTime} onChange={e => setPickupTime(e.target.value)} type="time" className={fieldCls} />
                  </div>
                </div>

                {/* Pickup */}
                {isAirPickup ? (
                  <div className="space-y-2">
                    <label className={labelCls}><Plane className="w-3 h-3 inline mr-1 text-blue-500" />Departure Airport *</label>
                    <QuoteAirportPicker value={airportCode} onSelect={(iata, name) => { setAirportCode(iata); setAirportName(name) }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className={labelCls}><MapPin className="w-3 h-3 inline mr-1 text-green-500" />Pickup Address *</label>
                    <input value={pickupStreet} onChange={e => setPickupStreet(e.target.value)} placeholder="Street address" className={fieldCls} autoComplete="address-line1" />
                    <CityStatePicker cityValue={pickupCity} stateValue={pickupState} zipValue={pickupZip} onCityChange={setPickupCity} onStateChange={setPickupState} onZipChange={setPickupZip} fieldCls={fieldCls} />
                  </div>
                )}

                {/* Airline + Flight for airport services */}
                {(isAirPickup || isAirDrop) && (
                  <div className="space-y-2">
                    <div>
                      <label className={labelCls}>Airline</label>
                      <QuoteAirlinePicker value={airlineCode} onSelect={(iata, name) => { setAirlineCode(iata); setAirlineName(name) }} />
                    </div>
                    <div>
                      <label className={labelCls}>Flight Number</label>
                      <input value={flightNumber} onChange={e => setFlightNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. AA 1234" className={fieldCls} autoComplete="off" />
                    </div>
                  </div>
                )}

                {/* Stops */}
                {stops.map((stop, i) => (
                  <div key={i} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="w-3 h-3" />Stop {i + 1}
                      </span>
                      <button type="button" onClick={() => removeStop(i)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {stop.type === "airport"
                      ? <div className="space-y-0.5">
                          <p className="text-sm text-gray-700 font-medium flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />{stop.airportCode} — {stop.airportName}</p>
                          {(stop.airlineName || stop.airlineCode) && <p className="text-xs text-gray-500 pl-5">{stop.airlineName || stop.airlineCode}{stop.flightNumber ? ` · ${stop.flightNumber}` : ""}</p>}
                        </div>
                      : <p className="text-sm text-gray-700 font-medium">{composeAddress(stop.street, stop.city, stop.state, stop.zip)}</p>
                    }
                  </div>
                ))}

                {showStopInput ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="w-3 h-3" />New Stop
                      </p>
                      <button type="button" onClick={resetNewStop} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Step 1: choose type */}
                    {!newStop.type && (
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setNewStop(s => ({ ...s, type: "address" }))}
                          className="flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
                          <MapPin className="w-3.5 h-3.5" />Address
                        </button>
                        <button type="button" onClick={() => setNewStop(s => ({ ...s, type: "airport" }))}
                          className="flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
                          <Plane className="w-3.5 h-3.5" />Airport
                        </button>
                      </div>
                    )}

                    {/* Address fields */}
                    {newStop.type === "address" && (
                      <>
                        <input value={newStop.street} onChange={e => setNewStop(s => ({ ...s, street: e.target.value }))}
                          placeholder="Street address" autoFocus className={fieldCls} />
                        <CityStatePicker cityValue={newStop.city} stateValue={newStop.state} zipValue={newStop.zip} onCityChange={v => setNewStop(s => ({ ...s, city: v }))} onStateChange={v => setNewStop(s => ({ ...s, state: v }))} onZipChange={v => setNewStop(s => ({ ...s, zip: v }))} fieldCls={fieldCls} />
                      </>
                    )}

                    {/* Airport field */}
                    {newStop.type === "airport" && (
                      <div className="space-y-2">
                        <QuoteAirportPicker
                          value={newStop.airportCode}
                          onSelect={(iata, name) => setNewStop(s => ({ ...s, airportCode: iata, airportName: name }))}
                        />
                        <QuoteAirlinePicker
                          value={newStop.airlineCode}
                          onSelect={(iata, name) => setNewStop(s => ({ ...s, airlineCode: iata, airlineName: name }))}
                        />
                        <input value={newStop.flightNumber}
                          onChange={e => setNewStop(s => ({ ...s, flightNumber: e.target.value.toUpperCase() }))}
                          placeholder="Flight number (e.g. AA 1234)"
                          className={fieldCls} autoComplete="off" />
                      </div>
                    )}

                    {newStop.type && (
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={addStop}
                          className="flex-1 h-10 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
                          Add Stop
                        </button>
                        <button type="button" onClick={() => setNewStop(s => ({ ...s, type: "", street: "", city: "", state: "", zip: "", airportCode: "", airportName: "", airlineCode: "", airlineName: "", flightNumber: "" }))}
                          className="h-10 px-4 rounded-xl text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowStopInput(true)}
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all w-full justify-center">
                    <Plus className="w-3.5 h-3.5" />Add Stop
                  </button>
                )}

                {/* Drop-off */}
                {isAirDrop ? (
                  <>
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="flex-1 h-px bg-gray-200" />
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}><PlaneLanding className="w-3 h-3 inline mr-1 text-blue-500" />Arrival Airport *</label>
                      <QuoteAirportPicker value={airportCode} onSelect={(iata, name) => { setAirportCode(iata); setAirportName(name) }} />
                    </div>
                  </>
                ) : !isHourly ? (
                  <>
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="flex-1 h-px bg-gray-200" />
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}><MapPin className="w-3 h-3 inline mr-1 text-red-400" />Drop-off Address *</label>
                      <input value={dropoffStreet} onChange={e => setDropoffStreet(e.target.value)} placeholder="Street address" className={fieldCls} autoComplete="address-line1" />
                      <CityStatePicker cityValue={dropoffCity} stateValue={dropoffState} zipValue={dropoffZip} onCityChange={setDropoffCity} onStateChange={setDropoffState} onZipChange={setDropoffZip} fieldCls={fieldCls} />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className={labelCls}><Clock className="w-3 h-3 inline mr-1 text-amber-500" />Duration / Return Area</label>
                    <input value={dropoffStreet} onChange={e => setDropoffStreet(e.target.value)} placeholder="e.g. 4 hours, return to pickup area" className={fieldCls} />
                  </div>
                )}
              </div>

              {/* Preferences */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Car className="w-3 h-3" />Preferences
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}><Users className="w-3 h-3 inline mr-1" />Passengers *</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPax(p => Math.max(1, p - 1))}
                        className="w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">−</button>
                      <span className="flex-1 text-center text-sm font-semibold text-gray-900">{pax}</span>
                      <button type="button" onClick={() => setPax(p => p + 1)}
                        className="w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">+</button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <div className="relative">
                      <select value={vehicle} onChange={e => setVehicle(e.target.value)}
                        className={`${fieldCls} appearance-none pr-8 cursor-pointer`}>
                        <option value="">No preference</option>
                        {Array.from(new Set(vehicles.map(v => v.type))).map(type => (
                          <option key={type} value={type}>{VEHICLE_TYPE_LABELS[type] ?? type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}><Clock className="w-3 h-3 inline mr-1" />Special Instructions</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Flight number, special requests, accessibility needs…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </form>

            {/* Submit */}
            <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
              <button onClick={handleSubmit} disabled={loading}
                className="w-full h-13 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)", height: 52 }}>
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <MessageSquare className="w-4 h-4" />}
                {loading ? "Sending…" : "Submit Quote Request"}
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-2.5">No payment required · {companyName} will follow up with pricing</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SlugProfilePage() {
  const params = useParams<{ slug: string }>()
  const profileType = "client"

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [quoteOpen, setQuoteOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/public/profile/${params.slug}?type=${profileType}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => { if (data) setProfile(data) })
      .finally(() => setLoading(false))
  }, [params.slug, profileType])

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

      {quoteOpen && (
        <QuoteForm companyId={profile.id} companyName={profile.name} vehicles={profile.vehicles} onClose={() => setQuoteOpen(false)} />
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
          <div className="flex items-center gap-3">
            {profileType === "client" && (
              <button onClick={() => setQuoteOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
                <MessageSquare className="w-3 h-3" />
                Request a Quote
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: profileType === "client" ? "linear-gradient(135deg,#fef3c7,#fde68a)" : "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                color: profileType === "client" ? "#92400e" : "#1e40af",
              }}>
              {profileType === "client" ? "Client Profile" : "Affiliate Profile"}
            </div>
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

        {/* Request a Quote CTA */}
        {profileType === "client" && (
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Ready to book your ride?</p>
                <p className="text-xs text-gray-400 mt-0.5">Submit a free quote request — no commitment required.</p>
              </div>
              <button onClick={() => setQuoteOpen(true)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
                <MessageSquare className="w-4 h-4" />
                Request a Quote
              </button>
            </div>
          </div>
        )}

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
