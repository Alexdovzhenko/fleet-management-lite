import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { format } from "date-fns"
import type { Trip } from "@/types"
import { createClient } from "@/lib/supabase/client"

interface TripFilters {
  date?: Date
  status?: string
  driverId?: string
  search?: string
}

async function fetchTrips(filters: TripFilters = {}): Promise<Trip[]> {
  const params = new URLSearchParams()
  if (filters.date) params.set("date", format(filters.date, "yyyy-MM-dd"))
  if (filters.status) params.set("status", filters.status)
  if (filters.driverId) params.set("driverId", filters.driverId)
  if (filters.search) params.set("search", filters.search)
  const res = await fetch(`/api/trips?${params}`)
  if (!res.ok) throw new Error("Failed to fetch trips")
  return res.json()
}

async function fetchTrip(id: string): Promise<Trip> {
  const res = await fetch(`/api/trips/${id}`)
  if (!res.ok) throw new Error("Failed to fetch trip")
  return res.json()
}

async function createTrip(data: Partial<Trip>): Promise<Trip> {
  const res = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    let msg = body.error || "Failed to create trip"

    // Add validation details if available
    if (body.details && Array.isArray(body.details)) {
      const issues = body.details.map((issue: any) => issue.message).join(", ")
      msg = `${msg}: ${issues}`
    } else if (body.detail) {
      msg = `${msg} — ${body.detail}`
    }

    throw new Error(msg)
  }
  return res.json()
}

async function updateTrip({ id, ...data }: Partial<Trip> & { id: string }): Promise<Trip> {
  const res = await fetch(`/api/trips/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    let msg = body.error || "Failed to update trip"

    // Add validation details if available
    if (body.details && Array.isArray(body.details)) {
      const issues = body.details.map((issue: any) => issue.message).join(", ")
      msg = `${msg}: ${issues}`
    } else if (body.detail) {
      msg = `${msg} — ${body.detail}`
    }

    throw new Error(msg)
  }
  return res.json()
}

export function useTripsRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("trips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Trip" }, () => {
        qc.invalidateQueries({ queryKey: ["trips"] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])
}

export function useTrips(filters: TripFilters = {}) {
  useTripsRealtime()
  return useQuery({
    queryKey: ["trips", filters],
    queryFn: () => fetchTrips(filters),
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}

export function useTodayTrips() {
  return useTrips({ date: new Date() })
}

interface CalendarRange { dateFrom: Date; dateTo: Date }

async function fetchCalendarTrips(range: CalendarRange): Promise<Trip[]> {
  const params = new URLSearchParams()
  params.set("dateFrom", format(range.dateFrom, "yyyy-MM-dd"))
  params.set("dateTo", format(range.dateTo, "yyyy-MM-dd"))
  const res = await fetch(`/api/trips?${params}`)
  if (!res.ok) throw new Error("Failed to fetch trips")
  return res.json()
}

export function useCalendarTrips(range: CalendarRange) {
  return useQuery({
    queryKey: ["trips", "calendar", format(range.dateFrom, "yyyy-MM-dd"), format(range.dateTo, "yyyy-MM-dd")],
    queryFn: () => fetchCalendarTrips(range),
    staleTime: 30_000,
  })
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: () => fetchTrip(id),
    enabled: !!id,
  })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  })
}

export function useUpdateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateTrip,
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ["trips"] })
      qc.setQueryData(["trips", trip.id], trip)
    },
  })
}
