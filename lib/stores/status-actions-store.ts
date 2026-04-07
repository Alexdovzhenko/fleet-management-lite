import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { TripStatus } from "@/types"

export interface StatusAction {
  id: string
  label: string
  dbStatus: TripStatus
  color: string
  isEnabled: boolean
  isBuiltIn: boolean
}

export const DEFAULT_STATUS_ACTIONS: StatusAction[] = [
  { id: "unassigned",  label: "Unassigned",  dbStatus: "UNASSIGNED",      color: "gray",    isEnabled: false, isBuiltIn: true },
  { id: "quote",       label: "Quote",       dbStatus: "QUOTE",           color: "gray",    isEnabled: false, isBuiltIn: true },
  { id: "confirmed",   label: "Assigned",    dbStatus: "CONFIRMED",       color: "blue",    isEnabled: true,  isBuiltIn: true },
  { id: "dispatched",  label: "Dispatched",  dbStatus: "DISPATCHED",      color: "violet",  isEnabled: false, isBuiltIn: true },
  { id: "en_route",    label: "On the Way",  dbStatus: "DRIVER_EN_ROUTE", color: "amber",   isEnabled: true,  isBuiltIn: true },
  { id: "arrived",     label: "On Location", dbStatus: "DRIVER_ARRIVED",  color: "yellow",  isEnabled: true,  isBuiltIn: true },
  { id: "in_progress", label: "POB",         dbStatus: "IN_PROGRESS",     color: "emerald", isEnabled: true,  isBuiltIn: true },
  { id: "completed",   label: "Drop",        dbStatus: "COMPLETED",       color: "gray",    isEnabled: true,  isBuiltIn: true },
  { id: "cancelled",   label: "Cancel",      dbStatus: "CANCELLED",       color: "red",     isEnabled: false, isBuiltIn: true },
  { id: "no_show",     label: "No Show",     dbStatus: "NO_SHOW",         color: "red",     isEnabled: false, isBuiltIn: true },
]

export const ALL_COLORS = ["blue", "amber", "yellow", "emerald", "gray", "violet", "red", "teal", "pink", "indigo"] as const
export type ActionColor = typeof ALL_COLORS[number]

export const STATUS_LABEL_MAP: Record<TripStatus, string> = {
  UNASSIGNED:      "Unassigned",
  QUOTE:           "Quote",
  CONFIRMED:       "Confirmed",
  DISPATCHED:      "Dispatched",
  DRIVER_EN_ROUTE: "Driver En Route",
  DRIVER_ARRIVED:  "Driver Arrived",
  IN_PROGRESS:     "In Progress",
  COMPLETED:       "Completed",
  CANCELLED:       "Cancelled",
  NO_SHOW:         "No Show",
}

interface StatusActionsStore {
  actions: StatusAction[]
  setActions: (actions: StatusAction[]) => void
  toggleAction: (id: string) => void
  renameAction: (id: string, label: string) => void
  changeColor: (id: string, color: string) => void
  addAction: (action: Pick<StatusAction, "label" | "dbStatus" | "color">) => void
  removeAction: (id: string) => void
  reset: () => void
}

export const useStatusActionsStore = create<StatusActionsStore>()(
  persist(
    (set) => ({
      actions: DEFAULT_STATUS_ACTIONS,
      setActions: (actions) => set({ actions }),
      toggleAction: (id) =>
        set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, isEnabled: !a.isEnabled } : a)) })),
      renameAction: (id, label) =>
        set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, label } : a)) })),
      changeColor: (id, color) =>
        set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, color } : a)) })),
      addAction: (action) =>
        set((s) => ({
          actions: [...s.actions, { ...action, id: `custom_${Date.now()}`, isEnabled: true, isBuiltIn: false }],
        })),
      removeAction: (id) =>
        set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),
      reset: () => set({ actions: DEFAULT_STATUS_ACTIONS }),
    }),
    {
      name: "fleet-status-actions",
      partialize: (state) => ({ actions: state.actions }),
      migrate: (persistedState: any) => {
        // Migrate: ensure UNASSIGNED and QUOTE are present
        let actions = persistedState.actions || DEFAULT_STATUS_ACTIONS
        const actionIds = new Set(actions.map((a: StatusAction) => a.id))

        // Add missing default statuses at the beginning
        const missing = DEFAULT_STATUS_ACTIONS.filter((a) => !actionIds.has(a.id))
        if (missing.length > 0) {
          actions = [...missing, ...actions]
        }

        return { actions }
      },
    }
  )
)
