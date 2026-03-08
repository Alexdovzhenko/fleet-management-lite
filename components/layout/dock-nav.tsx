"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import { LayoutGrid, Route, Users, UserCheck, Car, Settings2, Plus, X } from "lucide-react"
import { useDockStore, ALL_DOCK_ITEMS } from "@/lib/stores/dock-store"
import type { DockItem } from "@/lib/stores/dock-store"
import type { LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  Route,
  Users,
  UserCheck,
  Car,
}

export function DockNav() {
  const pathname = usePathname()
  const { items, isEditing, setItems, removeItem, addItem, toggleEditing, resetEditing } = useDockStore()
  const [showAddPanel, setShowAddPanel] = useState(false)

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
    <div className="fixed bottom-0 inset-x-0 flex flex-col items-center pb-5 z-50 pointer-events-none">

      {/* Add panel */}
      <AnimatePresence>
        {isEditing && showAddPanel && available.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="pointer-events-auto mb-2 px-3 py-2 flex items-center gap-2 bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-2xl shadow-xl"
          >
            <span className="text-xs text-gray-400 font-medium pr-1">Add to dock:</span>
            {available.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutGrid
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{item.label}</span>
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
          className="flex items-end gap-2 px-3 py-3 rounded-3xl bg-white/72 backdrop-blur-2xl border border-white/60"
          style={{
            boxShadow:
              "0 12px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Edit mode — draggable */}
          {isEditing ? (
            <Reorder.Group
              axis="x"
              values={items}
              onReorder={setItems}
              className="flex items-end gap-2"
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
                      className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center dock-wobble ${
                        active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1.5 font-medium">{item.label}</span>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          ) : (
            /* Normal mode — links with hover scale */
            <div className="flex items-end gap-2">
              {items.map((item) => {
                const Icon = ICON_MAP[item.iconName] || LayoutGrid
                const active = isActive(item.href)
                return (
                  <Link key={item.id} href={item.href} className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.32, y: -6 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 420, damping: 15 }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        active
                          ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className="text-[10px] text-gray-500 mt-1.5 font-medium">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="active-dot"
                        className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-9 bg-gray-200 self-center mx-0.5 flex-shrink-0" />

          {/* Edit / Done button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 15 }}
              onClick={() => { toggleEditing(); setShowAddPanel(false) }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                isEditing
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Settings2 className="w-5 h-5" />
            </motion.button>
            <span className="text-[10px] text-gray-500 mt-1.5 font-medium">
              {isEditing ? "Done" : "Edit"}
            </span>
          </div>

          {/* Add button — visible only in edit mode */}
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
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddPanel(!showAddPanel)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    showAddPanel
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
                <span className="text-[10px] text-gray-500 mt-1.5 font-medium">Add</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
