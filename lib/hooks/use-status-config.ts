"use client"

import { useStatusActionsStore } from "@/lib/stores/status-actions-store"
import type { TripStatus } from "@/types"

/**
 * Color name → Tailwind class mappings (exhaustive for Tailwind purge)
 * These are the core color system. All status colors resolve through these.
 */
export const COLOR_DOT_MAP: Record<string, string> = {
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
  yellow:  "bg-yellow-500",
  emerald: "bg-emerald-500",
  gray:    "bg-gray-400",
  violet:  "bg-violet-500",
  red:     "bg-red-500",
  teal:    "bg-teal-500",
  pink:    "bg-pink-500",
  indigo:  "bg-indigo-500",
}

export const COLOR_BADGE_MAP: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  amber:   "bg-amber-100 text-amber-700",
  yellow:  "bg-yellow-100 text-yellow-800",
  emerald: "bg-emerald-100 text-emerald-700",
  gray:    "bg-gray-200 text-gray-700",
  violet:  "bg-violet-100 text-violet-700",
  red:     "bg-red-100 text-red-600",
  teal:    "bg-teal-100 text-teal-700",
  pink:    "bg-pink-100 text-pink-700",
  indigo:  "bg-indigo-100 text-indigo-700",
}

export const COLOR_ROW_MAP: Record<string, string> = {
  blue:    "bg-blue-50/60",
  amber:   "bg-amber-50/70",
  yellow:  "bg-yellow-50/70",
  emerald: "bg-emerald-50/70",
  gray:    "bg-gray-50/40",
  violet:  "bg-violet-50/60",
  red:     "bg-red-50/40",
  teal:    "bg-teal-50/60",
  pink:    "bg-pink-50/60",
  indigo:  "bg-indigo-50/60",
}

export const COLOR_BADGE_DARK_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/15",    border: "border-blue-500/30",    text: "text-blue-300",    dot: "bg-blue-400" },
  amber:   { bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-300",   dot: "bg-amber-400" },
  yellow:  { bg: "bg-yellow-500/15",  border: "border-yellow-500/30",  text: "text-yellow-300",  dot: "bg-yellow-400" },
  emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-400" },
  gray:    { bg: "bg-gray-500/15",    border: "border-gray-500/25",    text: "text-gray-300",    dot: "bg-gray-400" },
  violet:  { bg: "bg-violet-500/15",  border: "border-violet-500/30",  text: "text-violet-300",  dot: "bg-violet-400" },
  red:     { bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-300",     dot: "bg-red-400" },
  teal:    { bg: "bg-teal-500/15",    border: "border-teal-500/30",    text: "text-teal-300",    dot: "bg-teal-400" },
  pink:    { bg: "bg-pink-500/15",    border: "border-pink-500/30",    text: "text-pink-300",    dot: "bg-pink-400" },
  indigo:  { bg: "bg-indigo-500/15",  border: "border-indigo-500/30",  text: "text-indigo-300",  dot: "bg-indigo-400" },
}

export const COLOR_BADGE_LIGHT_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:    { bg: "bg-blue-100",    border: "border-blue-300",    text: "text-blue-800",    dot: "bg-blue-500" },
  amber:   { bg: "bg-amber-100",   border: "border-amber-300",   text: "text-amber-800",   dot: "bg-amber-500" },
  yellow:  { bg: "bg-yellow-100",  border: "border-yellow-300",  text: "text-yellow-800",  dot: "bg-yellow-500" },
  emerald: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500" },
  gray:    { bg: "bg-gray-100",    border: "border-gray-300",    text: "text-gray-700",    dot: "bg-gray-500" },
  violet:  { bg: "bg-violet-100",  border: "border-violet-300",  text: "text-violet-800",  dot: "bg-violet-500" },
  red:     { bg: "bg-red-100",     border: "border-red-300",     text: "text-red-800",     dot: "bg-red-500" },
  teal:    { bg: "bg-teal-100",    border: "border-teal-300",    text: "text-teal-800",    dot: "bg-teal-500" },
  pink:    { bg: "bg-pink-100",    border: "border-pink-300",    text: "text-pink-800",    dot: "bg-pink-500" },
  indigo:  { bg: "bg-indigo-100",  border: "border-indigo-300",  text: "text-indigo-800",  dot: "bg-indigo-500" },
}

export const COLOR_ACTIVE_MAP: Record<string, { bg: string; text: string; check: string; leftBar: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    check: "text-blue-500",    leftBar: "bg-blue-400" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   check: "text-amber-500",   leftBar: "bg-amber-400" },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-700",  check: "text-yellow-500",  leftBar: "bg-yellow-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", check: "text-emerald-500", leftBar: "bg-emerald-400" },
  gray:    { bg: "bg-gray-100",   text: "text-gray-600",    check: "text-gray-400",    leftBar: "bg-gray-400" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  check: "text-violet-500",  leftBar: "bg-violet-400" },
  red:     { bg: "bg-red-50",     text: "text-red-700",     check: "text-red-500",     leftBar: "bg-red-400" },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    check: "text-teal-500",    leftBar: "bg-teal-400" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-700",    check: "text-pink-500",    leftBar: "bg-pink-400" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-700",  check: "text-indigo-500",  leftBar: "bg-indigo-400" },
}

/**
 * Central hook that provides all status-related utility functions.
 * Reads from useStatusActionsStore so all changes sync reactively.
 */
export function useStatusConfig() {
  const { actions } = useStatusActionsStore()

  function getAction(status: TripStatus) {
    return actions.find(a => a.dbStatus === status)
  }

  function getStatusColor(status: TripStatus): string {
    return getAction(status)?.color ?? "gray"
  }

  function getStatusLabel(status: TripStatus): string {
    return getAction(status)?.label ?? status
  }

  function isStatusEnabled(status: TripStatus): boolean {
    const action = getAction(status)
    return action?.isEnabled ?? true
  }

  function getEnabledStatuses(): TripStatus[] {
    return actions.filter(a => a.isEnabled).map(a => a.dbStatus as TripStatus)
  }

  function getAllStatuses(): TripStatus[] {
    return actions.map(a => a.dbStatus as TripStatus)
  }

  function getStatusDotClass(status: TripStatus): string {
    const color = getStatusColor(status)
    return COLOR_DOT_MAP[color] ?? "bg-gray-400"
  }

  function getStatusBadgeClasses(status: TripStatus): string {
    const color = getStatusColor(status)
    return COLOR_BADGE_MAP[color] ?? "bg-gray-200 text-gray-700"
  }

  function getStatusRowClass(status: TripStatus): string {
    const color = getStatusColor(status)
    return COLOR_ROW_MAP[color] ?? "bg-gray-50/40"
  }

  function getStatusDarkBadge(status: TripStatus): { bg: string; border: string; text: string; dot: string } {
    const color = getStatusColor(status)
    return COLOR_BADGE_DARK_MAP[color] ?? { bg: "bg-gray-500/15", border: "border-gray-500/25", text: "text-gray-300", dot: "bg-gray-400" }
  }

  function getStatusLightBadge(status: TripStatus): { bg: string; border: string; text: string; dot: string } {
    const color = getStatusColor(status)
    return COLOR_BADGE_LIGHT_MAP[color] ?? { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700", dot: "bg-gray-500" }
  }

  function getStatusActiveStyle(status: TripStatus): { bg: string; text: string; check: string; leftBar: string } {
    const color = getStatusColor(status)
    return COLOR_ACTIVE_MAP[color] ?? { bg: "bg-gray-100", text: "text-gray-600", check: "text-gray-400", leftBar: "bg-gray-400" }
  }

  return {
    actions,
    getAction,
    getStatusColor,
    getStatusLabel,
    isStatusEnabled,
    getEnabledStatuses,
    getAllStatuses,
    getStatusDotClass,
    getStatusBadgeClasses,
    getStatusRowClass,
    getStatusDarkBadge,
    getStatusLightBadge,
    getStatusActiveStyle,
  }
}
