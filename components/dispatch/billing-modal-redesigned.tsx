"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Plus, Copy, Trash2, GripVertical } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { computeBillingTotals } from "@/lib/utils"
import type { BillingData, BillingLineItem, Trip } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface BillingModalRedesignedProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  tripId?: string
  trip?: Trip
  initialData?: BillingData
  onSave?: (data: BillingData) => void
}

const DEFAULT_ADJUSTMENTS = {
  discountEnabled: false,
  discountType: 'flat' as const,
  discountAmount: 0,
  gratuityEnabled: false,
  gratuityPercent: 0,
  tollsEnabled: false,
  tollsAmount: 0,
  parkingEnabled: false,
  parkingAmount: 0,
  miscEnabled: false,
  miscAmount: 0,
  miscLabel: '',
  taxPercent: 0,
}

const SERVICE_TYPES = [
  'Transfer',
  'Hourly',
  'Wait Time',
  'Meet & Greet',
  'Fuel Surcharge',
  'Parking',
  'Cancellation Fee',
  'Other',
]

const UNITS = ['flat', 'hours', 'miles', 'days']

// Emil Kowalski design philosophy: Strong easing curves
const EASE_OUT = 'easeOut' as const

interface Payment {
  id: string
  method: string
  amount: number
  notes?: string
  paidAt: string
}

// Draggable line item component
function DraggableLineItem({
  item,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  item: BillingLineItem
  onUpdate: (updates: Partial<BillingLineItem>) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const lineTotal = item.rate * item.qty

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="group relative flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 transition-colors hover:text-slate-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      {/* Service type */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Service
        </label>
        <select
          value={item.serviceType}
          onChange={(e) => onUpdate({ serviceType: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
        >
          <option value="">Select service</option>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Description
        </label>
        <input
          type="text"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Optional notes"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
        />
      </div>

      {/* Rate */}
      <div className="w-20">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Rate
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-slate-500 text-sm">$</span>
          <input
            type="number"
            value={item.rate}
            onChange={(e) => onUpdate({ rate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
          />
        </div>
      </div>

      {/* Qty */}
      <div className="w-16">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Qty
        </label>
        <input
          type="number"
          value={item.qty}
          onChange={(e) => onUpdate({ qty: parseFloat(e.target.value) || 0 })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
        />
      </div>

      {/* Unit */}
      <div className="w-20">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Unit
        </label>
        <select
          value={item.unit}
          onChange={(e) => onUpdate({ unit: e.target.value as any })}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u === 'flat' ? 'flat' : u}
            </option>
          ))}
        </select>
      </div>

      {/* Total (read-only) */}
      <div className="w-24">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Total
        </label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-semibold text-slate-900 font-mono">
          {formatCurrency(lineTotal)}
        </div>
      </div>

      {/* Actions - hidden until hover */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onClick={onDuplicate}
            className="rounded-full bg-white p-1.5 border border-slate-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition-[background-color,border-color,transform] 150ms ease-out"
            title="Duplicate"
          >
            <Copy size={14} className="text-slate-500 hover:text-blue-600" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-full bg-white p-1.5 border border-slate-200 shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-95 transition-[background-color,border-color,transform] 150ms ease-out"
            title="Delete"
          >
            <Trash2 size={14} className="text-slate-500 hover:text-red-600" />
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export function BillingModalRedesigned({
  open,
  onClose,
  trip,
  initialData,
  onSave,
}: BillingModalRedesignedProps) {
  const [billingData, setBillingData] = useState<BillingData>(
    initialData || {
      lineItems: [],
      adjustments: DEFAULT_ADJUSTMENTS,
    }
  )
  const [payments, setPayments] = useState<Payment[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const totals = useMemo(() => {
    const paymentsList = payments.map(p => ({ amount: p.amount.toString() }))
    return computeBillingTotals(billingData, paymentsList)
  }, [billingData, payments])

  const addLineItem = useCallback(() => {
    const newItem: BillingLineItem = {
      id: Date.now().toString(),
      tab: 'primary',
      order: billingData.lineItems.filter(i => i.tab === 'primary').length,
      serviceType: '',
      description: '',
      rate: 0,
      qty: 1,
      unit: 'flat',
    }
    setBillingData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }))
  }, [billingData.lineItems])

  const updateLineItem = useCallback((id: string, updates: Partial<BillingLineItem>) => {
    setBillingData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }))
  }, [])

  const deleteLineItem = useCallback((id: string) => {
    setBillingData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }))
  }, [])

  const duplicateLineItem = useCallback((id: string) => {
    const item = billingData.lineItems.find(i => i.id === id)
    if (!item) return

    const newItem: BillingLineItem = {
      ...item,
      id: Date.now().toString(),
    }
    setBillingData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }))
  }, [billingData.lineItems])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = billingData.lineItems.find(i => i.id === String(active.id))
    const overItem = billingData.lineItems.find(i => i.id === String(over.id))

    if (!activeItem || !overItem || activeItem.tab !== overItem.tab) return

    const category = activeItem.tab
    const categoryItems = billingData.lineItems.filter(i => i.tab === category)
    const activeIndex = categoryItems.findIndex(i => i.id === String(active.id))
    const overIndex = categoryItems.findIndex(i => i.id === String(over.id))

    const newCategoryItems = arrayMove(categoryItems, activeIndex, overIndex)
    const otherItems = billingData.lineItems.filter(i => i.tab !== category)

    setBillingData(prev => ({
      ...prev,
      lineItems: [...otherItems, ...newCategoryItems],
    }))
  }

  const updateAdjustment = useCallback((key: string, value: any) => {
    setBillingData(prev => ({
      ...prev,
      adjustments: { ...prev.adjustments, [key]: value },
    }))
  }, [])

  const handleSaveAndClose = useCallback(async () => {
    setIsSaving(true)
    try {
      if (onSave) onSave(billingData)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [billingData, onSave, onClose])

  // Get line items for primary section
  const primaryItems = billingData.lineItems.filter(i => i.tab === 'primary')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
        {/* Header - Apple-inspired gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-8 py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Trip Billing</h2>
              {trip && (
                <p className="text-sm text-slate-500 mt-1">
                  Trip #{trip.tripNumber} · {trip.customer?.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-[background-color,color] 150ms ease-out active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
        </motion.div>

        {/* Main content - scrollable */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] px-8 py-6">
          <div className="space-y-8">
            {/* BASE RATE SECTION */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Base Rate
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Base Fare
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-500 font-medium">$</span>
                    <input
                      type="number"
                      value={billingData.adjustments.taxPercent}
                      onChange={(e) => updateAdjustment('taxPercent', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-4 py-3 text-right text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Gratuity
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="number"
                        value={billingData.adjustments.gratuityPercent}
                        onChange={(e) => updateAdjustment('gratuityPercent', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-right text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
                      />
                      <span className="absolute right-4 text-slate-500 font-medium">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* TRIP ADJUSTMENTS SECTION */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.15 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Trip Adjustments
              </h3>
              <div className="space-y-3">
                {/* Stops */}
                <AdjustmentRow
                  label="Extra Stops"
                  enabled={billingData.adjustments.tollsEnabled}
                  amount={billingData.adjustments.tollsAmount}
                  onToggle={() => updateAdjustment('tollsEnabled', !billingData.adjustments.tollsEnabled)}
                  onAmountChange={(val) => updateAdjustment('tollsAmount', val)}
                  isCurrency
                />

                {/* Waiting time */}
                <AdjustmentRow
                  label="Waiting Time"
                  enabled={billingData.adjustments.parkingEnabled}
                  amount={billingData.adjustments.parkingAmount}
                  onToggle={() => updateAdjustment('parkingEnabled', !billingData.adjustments.parkingEnabled)}
                  onAmountChange={(val) => updateAdjustment('parkingAmount', val)}
                  isCurrency
                />

                {/* Tolls */}
                <AdjustmentRow
                  label="Tolls"
                  enabled={billingData.adjustments.discountEnabled}
                  amount={billingData.adjustments.discountAmount}
                  onToggle={() => updateAdjustment('discountEnabled', !billingData.adjustments.discountEnabled)}
                  onAmountChange={(val) => updateAdjustment('discountAmount', val)}
                  isCurrency
                />
              </div>
            </motion.section>

            {/* ADDITIONAL CHARGES SECTION */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Additional Charges
                </h3>
                <button
                  onClick={addLineItem}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-[background-color,color] 150ms ease-out active:scale-95"
                >
                  <Plus size={16} />
                  Add Charge
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={primaryItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {primaryItems.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center"
                        >
                          <p className="text-slate-500 text-sm">
                            No charges yet. Click "Add Charge" to get started.
                          </p>
                        </motion.div>
                      ) : (
                        primaryItems.map((item) => (
                          <DraggableLineItem
                            key={item.id}
                            item={item}
                            onUpdate={(updates) => updateLineItem(item.id, updates)}
                            onDelete={() => deleteLineItem(item.id)}
                            onDuplicate={() => duplicateLineItem(item.id)}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            </motion.section>
          </div>
        </div>

        {/* Summary Section - sticky at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.25 }}
          className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-8 py-6"
        >
          <div className="grid grid-cols-4 gap-4 mb-6">
            <SummaryItem
              label="Subtotal"
              value={formatCurrency(totals.subtotal)}
              isTotal={false}
            />
            <SummaryItem
              label="Adjustments"
              value={formatCurrency(totals.adjustmentsTotal)}
              isTotal={false}
            />
            <SummaryItem
              label="Tax"
              value={formatCurrency(totals.taxAmt)}
              isTotal={false}
            />
            <SummaryItem
              label="Total"
              value={formatCurrency(totals.total)}
              isTotal={true}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 transition-[background-color] 150ms ease-out active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-[background-color,opacity] 150ms ease-out active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Save & Close'}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Adjustment row component - reusable pattern
 */
function AdjustmentRow({
  label,
  enabled,
  amount,
  onToggle,
  onAmountChange,
  isCurrency = true,
}: {
  label: string
  enabled: boolean
  amount: number
  onToggle: () => void
  onAmountChange: (val: number) => void
  isCurrency?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 bg-white transition-[border-color,background-color] hover:border-slate-300 hover:bg-slate-50"
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-[background-color] 200ms ease-out ${
          enabled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform 200ms ease-out ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Label */}
      <span className="flex-1 font-medium text-slate-700">{label}</span>

      {/* Input */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="relative flex items-center"
        >
          {isCurrency && <span className="absolute left-3 text-slate-500">$</span>}
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right w-24 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,ring-color] 150ms ease-out"
          />
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * Summary item component
 */
function SummaryItem({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: string
  isTotal: boolean
}) {
  return (
    <div className={isTotal ? 'bg-blue-50 rounded-lg p-3' : ''}>
      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold font-mono ${
          isTotal
            ? 'text-blue-600'
            : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
