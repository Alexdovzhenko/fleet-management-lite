"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import { LayoutGrid, Users, UserCheck, Car, Settings, Settings2, Plus, X, Network, Bell, Receipt } from "lucide-react"
import { useDockStore, ALL_DOCK_ITEMS } from "@/lib/stores/dock-store"
import type { DockItem } from "@/lib/stores/dock-store"
import type { LucideIcon } from "lucide-react"
import { useAffiliatePendingCount } from "@/lib/hooks/use-affiliates"
import { useUnreadCount } from "@/lib/hooks/use-notifications"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  Users,
  UserCheck,
  Car,
  Network,
  Bell,
  Settings,
  Receipt,
}

const glassPanel = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.35)",
  boxShadow:
    "0 12px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), " +
    "inset 0 0.5px 0 rgba(255,255,255,0.80), inset 0 -0.5px 0 rgba(0,0,0,0.03)",
} as const

const iconBase = {
  background: "rgba(0,0,0,0.045)",
  border: "0.5px solid rgba(0,0,0,0.07)",
  borderRadius: "16px",
} as const

const iconActive = {
  background: "rgba(37,99,235,0.90)",
  border: "0.5px solid rgba(37,99,235,0.55)",
  borderRadius: "16px",
  boxShadow: "0 2px 14px rgba(37,99,235,0.30), inset 0 0.5px 0 rgba(255,255,255,0.22)",
} as const

function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 600, damping: 28 }}
      className="absolute -top-1.5 -right-1.5 z-20 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full"
      style={{
        background: "rgba(239,68,68,0.92)",
        boxShadow: "0 1px 6px rgba(239,68,68,0.40), inset 0 0.5px 0 rgba(255,255,255,0.25)",
      }}
    >
      <span className="text-[9px] font-bold text-white leading-none">
        {count > 9 ? "9+" : count}
      </span>
    </motion.div>
  )
}

export function DockNav() {
  const pathname = usePathname()
  const { items, isEditing, setItems, removeItem, addItem, toggleEditing, resetEditing } = useDockStore()
  const [showAddPanel, setShowAddPanel] = useState(false)
  const { data: pendingData } = useAffiliatePendingCount()
  const pendingCount = pendingData?.count ?? 0
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? 0

  useEffect(() => {
    resetEditing()
  }, [resetEditing])

  const available = ALL_DOCK_ITEMS.filter((i) => !items.find((di) => di.id === i.id))

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  function handleAddItem(item: DockItem) {
    addItem(item)
    if (available.length <= 1) setShowAddPanel(false)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 flex flex-col items-center z-50 pointer-events-none" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>

      {/* Add panel */}
      <AnimatePresence>
        {isEditing && showAddPanel && available.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="pointer-events-auto mb-2 px-3 py-2 flex items-center gap-2 rounded-2xl"
            style={glassPanel}
          >
            <span className="text-xs text-gray-400/80 font-medium pr-1 tracking-tight">Add</span>
            {available.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutGrid
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-black/[0.05]"
                >
                  <div className="w-10 h-10 flex items-center justify-center text-gray-500" style={iconBase}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium tracking-tight">{item.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="pointer-events-auto">
        <motion.div
          layout
          className="flex items-end gap-1.5 px-3 py-3 rounded-3xl"
          style={glassPanel}
        >
          {/* Edit mode — draggable */}
          {isEditing ? (
            <Reorder.Group
              axis="x"
              values={items}
              onReorder={setItems}
              className="flex items-end gap-1.5"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {items.map((item) => {
                const Icon = ICON_MAP[item.iconName] || LayoutGrid
                const active = isActive(item.href)
                return (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    className="relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
                    style={{ listStyle: "none" }}
                  >
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 z-20 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors"
                      style={{ background: "rgba(220,38,38,0.90)", boxShadow: "0 1px 6px rgba(220,38,38,0.35)" }}
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                    <div
                      className="w-12 h-12 flex items-center justify-center dock-wobble"
                      style={active ? iconActive : { ...iconBase, color: "rgb(107,114,128)" }}
                    >
                      <Icon className="w-5 h-5" style={active ? { color: "white" } : undefined} />
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-tight">{item.label}</span>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          ) : (
            /* Normal mode */
            <div className="flex items-end gap-1.5">
              {items.map((item) => {
                const Icon = ICON_MAP[item.iconName] || LayoutGrid
                const active = isActive(item.href)
                const showBadge =
                  (item.id === "affiliates" && pendingCount > 0) ||
                  (item.id === "notifications" && unreadCount > 0)
                const badgeCount = item.id === "affiliates" ? pendingCount : unreadCount

                return (
                  <Link key={item.id} href={item.href} className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.28, y: -5 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16 }}
                      className="relative w-12 h-12 flex items-center justify-center"
                      style={active ? iconActive : iconBase}
                    >
                      <Icon className="w-5 h-5" style={{ color: active ? "white" : "rgb(100,116,139)" }} />
                      <AnimatePresence>
                        {showBadge && <PendingBadge count={badgeCount} />}
                      </AnimatePresence>
                    </motion.div>
                    <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-tight">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="active-dot"
                        className="w-1 h-1 rounded-full mt-0.5"
                        style={{ background: "rgba(37,99,235,0.7)" }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <div
            className="w-px h-8 self-center mx-1 flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.08)" }}
          />

          {/* Edit / Done button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.18, y: -3 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}
              onClick={() => { toggleEditing(); setShowAddPanel(false) }}
              className="w-12 h-12 flex items-center justify-center"
              style={isEditing ? iconActive : iconBase}
            >
              <Settings2
                className="w-5 h-5"
                style={{ color: isEditing ? "white" : "rgb(100,116,139)" }}
              />
            </motion.button>
            <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-tight">
              {isEditing ? "Done" : "Edit"}
            </span>
          </div>

          {/* Add button */}
          <AnimatePresence>
            {isEditing && available.length > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="flex flex-col items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.18, y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowAddPanel(!showAddPanel)}
                  className="w-12 h-12 flex items-center justify-center"
                  style={showAddPanel
                    ? { background: "rgba(22,163,74,0.88)", border: "0.5px solid rgba(22,163,74,0.55)", borderRadius: "16px", boxShadow: "0 2px 14px rgba(22,163,74,0.28), inset 0 0.5px 0 rgba(255,255,255,0.22)" }
                    : iconBase
                  }
                >
                  <Plus className="w-5 h-5" style={{ color: showAddPanel ? "white" : "rgb(100,116,139)" }} />
                </motion.button>
                <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-tight">Add</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
