import { create } from "zustand"
import { persist } from "zustand/middleware"

export const DEFAULT_COLUMN_ORDER = [
  "status", "time", "conf", "company", "passenger", "phone", "type",
  "pickup", "dropoff", "driver", "vehicle-type", "vehicle", "pax", "price", "flags",
]

export const DEFAULT_HIDDEN_COLUMNS: string[] = []

// Canonical column definitions — shared by grid and settings
export const COLUMN_DEFS = [
  { key: "status",    label: "Status",       description: "Trip status badge" },
  { key: "time",      label: "Pickup Time",  description: "Scheduled pickup time" },
  { key: "conf",      label: "Conf #",       description: "Confirmation number" },
  { key: "passenger", label: "Passenger",    description: "Passenger or customer name" },
  { key: "company",   label: "Company",      description: "Customer company name" },
  { key: "phone",     label: "Phone",        description: "Passenger phone number" },
  { key: "type",      label: "Service",      description: "Trip type (one way, hourly…)" },
  { key: "pickup",    label: "Pickup",       description: "Pickup address" },
  { key: "dropoff",   label: "Dropoff",      description: "Dropoff address" },
  { key: "driver",    label: "Driver",       description: "Assigned driver" },
  { key: "vehicle-type", label: "Type", description: "Booked vehicle type/category" },
  { key: "vehicle",   label: "Vehicle",      description: "Assigned vehicle" },
  { key: "affiliate", label: "Affiliate",    description: "Farm-out partner company" },
  { key: "pax",       label: "Pax",          description: "Passenger count" },
  { key: "price",     label: "Price",        description: "Trip price" },
  { key: "flags",     label: "Flags",        description: "VIP, flight, accessibility icons" },
] as const

interface ColumnOrderStore {
  columnOrder: string[]
  hiddenColumns: string[]
  setColumnOrder: (order: string[]) => void
  toggleColumnVisibility: (key: string) => void
  reset: () => void
}

export const useColumnOrderStore = create<ColumnOrderStore>()(
  persist(
    (set, get) => ({
      columnOrder: DEFAULT_COLUMN_ORDER,
      hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      toggleColumnVisibility: (key: string) => {
        const { hiddenColumns, columnOrder } = get()
        const isHidden = hiddenColumns.includes(key)
        // Prevent hiding the last visible column
        const visibleCount = columnOrder.filter((k) => !hiddenColumns.includes(k)).length
        if (!isHidden && visibleCount <= 1) return
        set({
          hiddenColumns: isHidden
            ? hiddenColumns.filter((k) => k !== key)
            : [...hiddenColumns, key],
        })
      },
      reset: () => set({ columnOrder: DEFAULT_COLUMN_ORDER, hiddenColumns: DEFAULT_HIDDEN_COLUMNS }),
    }),
    { name: "fleet-column-order" }
  )
)
