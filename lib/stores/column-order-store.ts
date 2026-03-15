import { create } from "zustand"
import { persist } from "zustand/middleware"

export const DEFAULT_COLUMN_ORDER = [
  "status", "time", "conf", "company", "passenger", "phone", "type",
  "pickup", "dropoff", "driver", "vehicle", "pax", "price", "flags",
]

interface ColumnOrderStore {
  columnOrder: string[]
  setColumnOrder: (order: string[]) => void
  reset: () => void
}

export const useColumnOrderStore = create<ColumnOrderStore>()(
  persist(
    (set) => ({
      columnOrder: DEFAULT_COLUMN_ORDER,
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      reset: () => set({ columnOrder: DEFAULT_COLUMN_ORDER }),
    }),
    { name: "fleet-column-order" }
  )
)
