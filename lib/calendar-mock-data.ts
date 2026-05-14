import type { TripStatus } from "@/types"

export interface CalendarEvent {
  id: string
  tripNumber: string
  clientName: string
  clientLastName: string
  status: TripStatus
  vehicleType: string
  vehicleId?: string
  driverName?: string
  driverInitials?: string
  pickupAddress: string
  dropoffAddress: string
  pickupDate: string   // "YYYY-MM-DD"
  pickupTime: string   // "7:00 AM"
  durationMinutes: number
  passengerCount: number
  notes?: string
}

function initials(name?: string): string {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// Anchor everything to the current week so mock data is always relevant
function dateStr(dayOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString().split("T")[0]
}

const RAW: Omit<CalendarEvent, "clientLastName" | "driverInitials">[] = [
  // ── Today ─────────────────────────────────────────────────────
  { id: "cal_001", tripNumber: "LC-2001", clientName: "Sarah Patterson",  status: "CONFIRMED",       vehicleType: "SPRINTER",     vehicleId: "VH-01", driverName: "Marcus Reid",       pickupAddress: "Fort Lauderdale Executive Airport (FXE)", dropoffAddress: "1 Hotel South Beach, Miami Beach",      pickupDate: dateStr(0),  pickupTime: "7:00 AM",  durationMinutes: 90,  passengerCount: 6,  notes: "VIP client, meet & greet with sign" },
  { id: "cal_002", tripNumber: "LC-2002", clientName: "James Wilson",     status: "IN_PROGRESS",     vehicleType: "SEDAN",        vehicleId: "VH-02", driverName: "Carlos Mendez",     pickupAddress: "Miami International Airport (MIA)",       dropoffAddress: "Brickell City Centre, Miami",           pickupDate: dateStr(0),  pickupTime: "11:00 AM", durationMinutes: 45,  passengerCount: 2  },
  { id: "cal_003", tripNumber: "LC-2003", clientName: "Emily Chen",       status: "CONFIRMED",       vehicleType: "SUV",          vehicleId: "VH-03", driverName: "David Thompson",    pickupAddress: "The Setai Hotel, South Beach",            dropoffAddress: "Miami Cruise Terminal",                 pickupDate: dateStr(0),  pickupTime: "5:00 PM",  durationMinutes: 60,  passengerCount: 4,  notes: "4 large suitcases" },
  // ── Yesterday ─────────────────────────────────────────────────
  { id: "cal_004", tripNumber: "LC-2004", clientName: "Robert Kim",       status: "COMPLETED",       vehicleType: "SEDAN",        vehicleId: "VH-02", driverName: "Carlos Mendez",     pickupAddress: "Fontainebleau Miami Beach",                dropoffAddress: "Miami International Airport (MIA)",     pickupDate: dateStr(-1), pickupTime: "9:30 AM",  durationMinutes: 50,  passengerCount: 1  },
  { id: "cal_005", tripNumber: "LC-2005", clientName: "Angela Morrison",  status: "COMPLETED",       vehicleType: "SUV",          vehicleId: "VH-03", driverName: "David Thompson",    pickupAddress: "Wynwood Walls, Miami",                    dropoffAddress: "Downtown Miami Marriott",               pickupDate: dateStr(-1), pickupTime: "3:00 PM",  durationMinutes: 35,  passengerCount: 3  },
  // ── Tomorrow ──────────────────────────────────────────────────
  { id: "cal_006", tripNumber: "LC-2006", clientName: "Natasha Williams", status: "CONFIRMED",       vehicleType: "COACH",        vehicleId: "VH-04", driverName: "Antoine Brown",     pickupAddress: "Miami Beach Convention Center",           dropoffAddress: "Port of Miami — Terminal G",            pickupDate: dateStr(1),  pickupTime: "8:00 AM",  durationMinutes: 30,  passengerCount: 28 },
  { id: "cal_007", tripNumber: "LC-2007", clientName: "Michael Torres",   status: "DISPATCHED",      vehicleType: "STRETCH_LIMO", vehicleId: "VH-05", driverName: "Jerome Jackson",    pickupAddress: "Bayside Marketplace, Miami",              dropoffAddress: "LIV Nightclub, Fontainebleau",         pickupDate: dateStr(1),  pickupTime: "9:00 PM",  durationMinutes: 30,  passengerCount: 8,  notes: "Wedding party — champagne on ice" },
  // ── +2 days ───────────────────────────────────────────────────
  { id: "cal_008", tripNumber: "LC-2008", clientName: "Jennifer Adams",   status: "CONFIRMED",       vehicleType: "SPRINTER",     vehicleId: "VH-01", driverName: "Marcus Reid",       pickupAddress: "Fort Lauderdale Airport (FLL)",           dropoffAddress: "Turnberry Isle Resort, Aventura",      pickupDate: dateStr(2),  pickupTime: "10:00 AM", durationMinutes: 45,  passengerCount: 10 },
  { id: "cal_009", tripNumber: "LC-2009", clientName: "David Zhang",      status: "UNASSIGNED",      vehicleType: "SEDAN",        vehicleId: undefined, driverName: undefined,         pickupAddress: "Miami International Airport (MIA)",       dropoffAddress: "Mandarin Oriental Miami",               pickupDate: dateStr(2),  pickupTime: "2:00 PM",  durationMinutes: 40,  passengerCount: 2  },
  // ── +3 days ───────────────────────────────────────────────────
  { id: "cal_010", tripNumber: "LC-2010", clientName: "Lisa Anderson",    status: "CONFIRMED",       vehicleType: "SUV",          vehicleId: "VH-03", driverName: "David Thompson",    pickupAddress: "Coconut Grove Marina",                    dropoffAddress: "Key Biscayne Beach Club",               pickupDate: dateStr(3),  pickupTime: "4:00 PM",  durationMinutes: 25,  passengerCount: 3  },
  // ── +4 days ───────────────────────────────────────────────────
  { id: "cal_011", tripNumber: "LC-2011", clientName: "Omar Hassan",      status: "CONFIRMED",       vehicleType: "SEDAN",        vehicleId: "VH-02", driverName: "Carlos Mendez",     pickupAddress: "Miami Beach — Collins Ave",                dropoffAddress: "Miami International Airport (MIA)",     pickupDate: dateStr(4),  pickupTime: "6:00 AM",  durationMinutes: 50,  passengerCount: 1  },
  { id: "cal_012", tripNumber: "LC-2012", clientName: "Rachel Green",     status: "CONFIRMED",       vehicleType: "SPRINTER",     vehicleId: "VH-01", driverName: "Marcus Reid",       pickupAddress: "Wyndham Grand Resort, Clearwater",        dropoffAddress: "Tampa International Airport (TPA)",     pickupDate: dateStr(4),  pickupTime: "3:00 PM",  durationMinutes: 70,  passengerCount: 8  },
  // ── +5 days ───────────────────────────────────────────────────
  { id: "cal_013", tripNumber: "LC-2013", clientName: "Brian Lewis",      status: "CANCELLED",       vehicleType: "SEDAN",        vehicleId: undefined, driverName: undefined,         pickupAddress: "Brickell City Centre",                    dropoffAddress: "Miami Beach",                          pickupDate: dateStr(5),  pickupTime: "11:00 AM", durationMinutes: 30,  passengerCount: 1  },
  // ── +6 days ───────────────────────────────────────────────────
  { id: "cal_014", tripNumber: "LC-2014", clientName: "Stephanie Moore",  status: "CONFIRMED",       vehicleType: "SUV",          vehicleId: "VH-03", driverName: "David Thompson",    pickupAddress: "Wynwood Walls, Miami",                    dropoffAddress: "Midtown Miami Hotel",                  pickupDate: dateStr(6),  pickupTime: "7:00 AM",  durationMinutes: 25,  passengerCount: 2  },
  { id: "cal_015", tripNumber: "LC-2015", clientName: "Carlos Reyes",     status: "CONFIRMED",       vehicleType: "PARTY_BUS",    vehicleId: "VH-06", driverName: "Derek Washington",  pickupAddress: "South Beach — Ocean Drive",                dropoffAddress: "Club Space, Downtown Miami",            pickupDate: dateStr(6),  pickupTime: "9:00 PM",  durationMinutes: 45,  passengerCount: 20, notes: "Birthday party" },
  // ── +7 days ───────────────────────────────────────────────────
  { id: "cal_016", tripNumber: "LC-2016", clientName: "Amy Nelson",       status: "CONFIRMED",       vehicleType: "SEDAN",        vehicleId: "VH-02", driverName: "Carlos Mendez",     pickupAddress: "Miami International Airport (MIA)",       dropoffAddress: "The Biltmore Hotel, Coral Gables",     pickupDate: dateStr(7),  pickupTime: "8:30 AM",  durationMinutes: 35,  passengerCount: 1  },
  // ── +8 days ───────────────────────────────────────────────────
  { id: "cal_017", tripNumber: "LC-2017", clientName: "Kevin Park",       status: "CONFIRMED",       vehicleType: "SPRINTER",     vehicleId: "VH-01", driverName: "Marcus Reid",       pickupAddress: "Hard Rock Stadium, Miami Gardens",        dropoffAddress: "Fort Lauderdale Airport (FLL)",         pickupDate: dateStr(8),  pickupTime: "7:00 AM",  durationMinutes: 45,  passengerCount: 12 },
  { id: "cal_018", tripNumber: "LC-2018", clientName: "Tiffany Brooks",   status: "CONFIRMED",       vehicleType: "STRETCH_LIMO", vehicleId: "VH-05", driverName: "Jerome Jackson",    pickupAddress: "Pérez Art Museum Miami",                  dropoffAddress: "The Ritz-Carlton Key Biscayne",         pickupDate: dateStr(8),  pickupTime: "6:30 PM",  durationMinutes: 40,  passengerCount: 6,  notes: "Wedding anniversary dinner" },
  // ── +10 days ──────────────────────────────────────────────────
  { id: "cal_019", tripNumber: "LC-2019", clientName: "Daniel Foster",    status: "CONFIRMED",       vehicleType: "SUV",          vehicleId: "VH-03", driverName: "David Thompson",    pickupAddress: "Aventura Mall",                           dropoffAddress: "Fort Lauderdale-Hollywood Airport",    pickupDate: dateStr(10), pickupTime: "9:00 AM",  durationMinutes: 40,  passengerCount: 3  },
  { id: "cal_020", tripNumber: "LC-2020", clientName: "Steven Clark",     status: "CONFIRMED",       vehicleType: "COACH",        vehicleId: "VH-04", driverName: "Antoine Brown",     pickupAddress: "Marlins Park, Miami",                     dropoffAddress: "Miami International Airport (MIA)",     pickupDate: dateStr(10), pickupTime: "9:00 PM",  durationMinutes: 60,  passengerCount: 35, notes: "Corporate group — 35 pax" },
]

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = RAW.map(e => ({
  ...e,
  clientLastName: e.clientName.split(" ").pop() ?? e.clientName,
  driverInitials: initials(e.driverName),
}))

export const STATUS_COLORS: Record<string, {
  bg: string; border: string; text: string; dot: string; label: string
}> = {
  CONFIRMED:       { bg:"rgba(59,130,246,0.14)",  border:"rgba(59,130,246,0.30)",  text:"rgba(147,197,253,0.95)", dot:"#60a5fa", label:"Confirmed" },
  DISPATCHED:      { bg:"rgba(99,102,241,0.14)",  border:"rgba(99,102,241,0.30)",  text:"rgba(165,180,252,0.95)", dot:"#818cf8", label:"Dispatched" },
  DRIVER_EN_ROUTE: { bg:"rgba(20,184,166,0.14)",  border:"rgba(20,184,166,0.30)",  text:"rgba(94,234,212,0.95)",  dot:"#2dd4bf", label:"En Route" },
  DRIVER_ARRIVED:  { bg:"rgba(59,130,246,0.14)",  border:"rgba(59,130,246,0.30)",  text:"rgba(147,197,253,0.95)", dot:"#60a5fa", label:"Arrived" },
  IN_PROGRESS:     { bg:"rgba(16,185,129,0.14)",  border:"rgba(16,185,129,0.30)",  text:"rgba(110,231,183,0.95)", dot:"#34d399", label:"In Progress" },
  COMPLETED:       { bg:"rgba(100,116,139,0.14)", border:"rgba(100,116,139,0.30)", text:"rgba(200,212,228,0.70)", dot:"#94a3b8", label:"Completed" },
  CANCELLED:       { bg:"rgba(239,68,68,0.12)",   border:"rgba(239,68,68,0.25)",   text:"rgba(252,165,165,0.90)", dot:"#f87171", label:"Cancelled" },
  NO_SHOW:         { bg:"rgba(239,68,68,0.12)",   border:"rgba(239,68,68,0.25)",   text:"rgba(252,165,165,0.90)", dot:"#f87171", label:"No Show" },
  UNASSIGNED:      { bg:"rgba(245,158,11,0.12)",  border:"rgba(245,158,11,0.25)",  text:"rgba(252,211,77,0.90)",  dot:"#fbbf24", label:"Unassigned" },
  QUOTE:           { bg:"rgba(139,92,246,0.12)",  border:"rgba(139,92,246,0.25)",  text:"rgba(196,181,253,0.90)", dot:"#a78bfa", label:"Quote" },
}

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS["CONFIRMED"]
}

/** Parse "7:00 AM" → { hours: 7, minutes: 0 } */
export function parsePickupTime(t: string): { hours: number; minutes: number } {
  const m = t?.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return { hours: 0, minutes: 0 }
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const isPM = m[3].toUpperCase() === "PM"
  if (isPM && h < 12) h += 12
  if (!isPM && h === 12) h = 0
  return { hours: h, minutes: min }
}

/** Build a Date from "YYYY-MM-DD" + "7:00 AM" */
export function buildEventDate(pickupDate: string, pickupTime: string): Date {
  const datePart = pickupDate.includes("T") ? pickupDate.split("T")[0] : pickupDate
  const { hours, minutes } = parsePickupTime(pickupTime)
  const d = new Date(datePart + "T00:00:00")
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function eventStartDate(e: CalendarEvent): Date {
  return buildEventDate(e.pickupDate, e.pickupTime)
}

export function eventEndDate(e: CalendarEvent): Date {
  const start = eventStartDate(e)
  return new Date(start.getTime() + e.durationMinutes * 60_000)
}
