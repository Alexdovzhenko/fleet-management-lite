import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DockItem {
  id: string
  label: string
  href: string
  iconName: string
}

export const ALL_DOCK_ITEMS: DockItem[] = [
  { id: "dispatch",       label: "Dispatch",       href: "/dispatch",       iconName: "LayoutGrid" },
  { id: "customers",      label: "Customers",      href: "/customers",      iconName: "Users" },
  { id: "drivers",        label: "Drivers",        href: "/drivers",        iconName: "UserCheck" },
  { id: "vehicles",       label: "Vehicles",       href: "/vehicles",       iconName: "Car" },
  { id: "earnings",       label: "Earnings",       href: "/earnings",       iconName: "TrendingUp" },
  { id: "billing",        label: "Billing",        href: "/billing",        iconName: "Receipt" },
  { id: "affiliates",     label: "Affiliates",     href: "/affiliates",     iconName: "Network" },
  { id: "notifications",  label: "Notifications",  href: "/notifications",  iconName: "Bell" },
  { id: "settings",       label: "Settings",       href: "/settings",       iconName: "Settings" },
]

interface DockStore {
  items: DockItem[]
  isEditing: boolean
  setItems: (items: DockItem[]) => void
  removeItem: (id: string) => void
  addItem: (item: DockItem) => void
  toggleEditing: () => void
  resetEditing: () => void
}

export const useDockStore = create<DockStore>()(
  persist(
    (set) => ({
      items: ALL_DOCK_ITEMS,
      isEditing: false,
      setItems: (items) => set({ items }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      toggleEditing: () => set((s) => ({ isEditing: !s.isEditing })),
      resetEditing: () => set({ isEditing: false }),
    }),
    {
      name: "fleet-dock",
      partialize: (state) => ({ items: state.items }),
    }
  )
)
