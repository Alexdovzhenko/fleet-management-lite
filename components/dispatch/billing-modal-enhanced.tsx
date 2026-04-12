"use client"

import { useState, useMemo, useCallback } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Copy, Trash2, ChevronDown, GripVertical } from "lucide-react"
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

interface BillingModalEnhancedProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  tripId?: string
  trip?: Trip
  initialData?: BillingData
  onSave?: (data: BillingData) => void
}

type SectionType = 'services' | 'adjustments' | 'payments'

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
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Check', 'Wire Transfer', 'ACH', 'Venmo', 'Other']

interface Payment {
  id: string
  method: string
  amount: number
  notes?: string
  paidAt: string
}

export function BillingModalEnhanced({
  open,
  onClose,
  mode,
  trip,
  initialData,
  onSave,
}: BillingModalEnhancedProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('services')
  const [billingData, setBillingData] = useState<BillingData>(
    initialData || {
      lineItems: [],
      adjustments: DEFAULT_ADJUSTMENTS,
    }
  )
  const [payments, setPayments] = useState<Payment[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [expandedAdjustments, setExpandedAdjustments] = useState<Set<string>>(new Set())
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ method: 'Cash', amount: '', notes: '' })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const totals = useMemo(() => {
    const paymentsList = payments.map(p => ({ amount: p.amount.toString() }))
    return computeBillingTotals(billingData, paymentsList)
  }, [billingData, payments])

  // Line item handlers
  const addLineItem = useCallback((category: 'primary' | 'secondary' | 'farmout') => {
    const newItem: BillingLineItem = {
      id: Date.now().toString(),
      tab: category,
      order: billingData.lineItems.filter(i => i.tab === category).length,
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

  // Adjustment handlers
  const toggleAdjustment = useCallback((key: string) => {
    setExpandedAdjustments(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Payment handlers
  const addPayment = useCallback(() => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) return

    const payment: Payment = {
      id: Date.now().toString(),
      method: newPayment.method,
      amount: parseFloat(newPayment.amount),
      notes: newPayment.notes || undefined,
      paidAt: new Date().toISOString(),
    }

    setPayments(prev => [payment, ...prev])
    setNewPayment({ method: 'Cash', amount: '', notes: '' })
    setShowAddPayment(false)
  }, [newPayment])

  const deletePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (onSave) {
        onSave(billingData)
      } else {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }, [billingData, onSave, onClose])

  // Get line items by category
  const primaryItems = billingData.lineItems.filter(i => i.tab === 'primary')
  const secondaryItems = billingData.lineItems.filter(i => i.tab === 'secondary')
  const farmoutItems = billingData.lineItems.filter(i => i.tab === 'farmout')

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
  }

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  }

  // Sub-section state for Services (Primary, Secondary, Farm-out)
  const [activeServiceTab, setActiveServiceTab] = useState<'primary' | 'secondary' | 'farmout'>('primary')

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[90vw] lg:w-[85vw] max-w-5xl p-0 overflow-hidden flex flex-col bg-white border-l border-slate-200" showCloseButton={true}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-slate-100 px-8 py-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-900">Trip Billing</h1>
            {trip && (
              <p className="text-xs text-slate-500 mt-0.5">
                {trip.tripNumber} · {trip.customer?.name}
              </p>
            )}
          </div>
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-6 text-sm"
            >
              Save & Close
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 70% */}
          <div className="flex-1 overflow-y-auto">
            {/* Section Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-8 py-4 border-b border-slate-100 bg-slate-50"
            >
              <div className="flex gap-1">
                {(['services', 'adjustments', 'payments'] as const).map((section, idx) => (
                  <motion.button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.1 } }}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all text-xs ${
                      activeSection === section
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Content Area */}
            <div className="px-8 py-6">
              <AnimatePresence mode="wait">
                {/* Services Section */}
                {activeSection === 'services' && (
                  <motion.div
                    key="services"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Service Sub-tabs */}
                    <div className="flex gap-1 pb-3 border-b border-slate-200">
                      {[
                        { key: 'primary' as const, label: 'Primary', items: primaryItems },
                        { key: 'secondary' as const, label: 'Secondary', items: secondaryItems },
                        { key: 'farmout' as const, label: 'Farm-out', items: farmoutItems },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveServiceTab(tab.key)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                            activeServiceTab === tab.key
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                          {tab.items.length > 0 && (
                            <span className="ml-1.5 text-xs font-semibold">${totals[tab.key === 'primary' ? 'primaryTotal' : tab.key === 'secondary' ? 'secondaryTotal' : 'farmoutTotal'].toFixed(2)}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Service Category - Only show active tab */}
                    <ServiceCategory
                      title={activeServiceTab === 'primary' ? 'Primary Services' : activeServiceTab === 'secondary' ? 'Secondary Services' : 'Farm-out Costs'}
                      subtitle={activeServiceTab === 'primary' ? 'Main charges for this trip' : activeServiceTab === 'secondary' ? 'Additional charges' : 'Third-party vendor charges'}
                      items={activeServiceTab === 'primary' ? primaryItems : activeServiceTab === 'secondary' ? secondaryItems : farmoutItems}
                      category={activeServiceTab}
                      onAdd={() => addLineItem(activeServiceTab)}
                      onUpdate={updateLineItem}
                      onDelete={deleteLineItem}
                      onDuplicate={duplicateLineItem}
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                      allItems={billingData.lineItems}
                    />
                  </motion.div>
                )}

                {/* Adjustments Section */}
                {activeSection === 'adjustments' && (
                  <motion.div
                    key="adjustments"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-600 mb-3">Toggle each fee to enable, then enter the amount.</p>

                    {/* Discount - Inline */}
                    <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={billingData.adjustments.discountEnabled}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, discountEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-slate-700 block">Discount</label>
                      </div>
                      <select
                        value={billingData.adjustments.discountType}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountType: e.target.value as 'flat' | 'percent' },
                        }))}
                        disabled={!billingData.adjustments.discountEnabled}
                        className="w-20 h-8 text-xs border border-slate-200 rounded px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="flat">Flat ($)</option>
                        <option value="percent">% Pct</option>
                      </select>
                      <Input
                        type="number"
                        value={billingData.adjustments.discountAmount}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.discountEnabled}
                        placeholder="0"
                        className="text-xs h-8 w-20"
                      />
                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(totals.discount)}</span>
                    </div>

                    {/* Gratuity - Inline */}
                    <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={billingData.adjustments.gratuityEnabled}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, gratuityEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-700 block">Gratuity</label>
                      </div>
                      <Input
                        type="number"
                        value={billingData.adjustments.gratuityPercent}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, gratuityPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.gratuityEnabled}
                        placeholder="0"
                        className="text-xs h-8 w-16"
                      />
                      <span className="text-xs text-slate-600 w-6">%</span>
                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(totals.gratuityAmt)}</span>
                    </div>

                    {/* Tolls - Inline */}
                    <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={billingData.adjustments.tollsEnabled}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, tollsEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-700 block">Tolls</label>
                      </div>
                      <Input
                        type="number"
                        value={billingData.adjustments.tollsAmount}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, tollsAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.tollsEnabled}
                        placeholder="0.00"
                        className="text-xs h-8 w-20"
                      />
                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(billingData.adjustments.tollsAmount)}</span>
                    </div>

                    {/* Parking - Inline */}
                    <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={billingData.adjustments.parkingEnabled}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, parkingEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-700 block">Parking</label>
                      </div>
                      <Input
                        type="number"
                        value={billingData.adjustments.parkingAmount}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, parkingAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.parkingEnabled}
                        placeholder="0.00"
                        className="text-xs h-8 w-20"
                      />
                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(billingData.adjustments.parkingAmount)}</span>
                    </div>

                    {/* Tax - Always Enabled */}
                    <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-shrink-0">
                        <div className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-700 block">Tax</label>
                      </div>
                      <Input
                        type="number"
                        value={billingData.adjustments.taxPercent}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, taxPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        placeholder="0"
                        className="text-xs h-8 w-16"
                      />
                      <span className="text-xs text-slate-600 w-6">%</span>
                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(totals.taxAmt)}</span>
                    </div>
                  </motion.div>
                )}

                {/* Payments Section */}
                {activeSection === 'payments' && (
                  <motion.div
                    key="payments"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {mode === 'edit' ? (
                      <>
                        <p className="text-sm text-slate-600">
                          Track payments received for this trip.
                        </p>

                        {/* Payments List */}
                        {payments.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900">Payments Received</h3>
                            <AnimatePresence>
                              {payments.map((payment, idx) => (
                                <motion.div
                                  key={payment.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
                                  exit={{ opacity: 0, x: 20 }}
                                  className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">
                                      {payment.method}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                      {new Date(payment.paidAt).toLocaleDateString()}
                                      {payment.notes && ` • ${payment.notes}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-emerald-600 font-mono">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => deletePayment(payment.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Add Payment Form */}
                        {!showAddPayment ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAddPayment(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Payment
                          </motion.button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div>
                              <label className="text-sm font-medium text-slate-700 block mb-2">Payment Method</label>
                              <select
                                value={newPayment.method}
                                onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                                className="w-full h-10 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {PAYMENT_METHODS.map(method => (
                                  <option key={method} value={method}>{method}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-slate-700 block mb-2">Amount</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newPayment.amount}
                                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-slate-700 block mb-2">Notes (Optional)</label>
                              <Input
                                value={newPayment.notes}
                                onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="e.g., Partial payment, deposit, etc."
                                className="text-sm"
                              />
                            </div>

                            <div className="flex gap-2">
                              <motion.div
                                whileHover="hover"
                                whileTap="tap"
                                variants={buttonVariants}
                                className="flex-1"
                              >
                                <Button
                                  onClick={addPayment}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Add Payment
                                </Button>
                              </motion.div>
                              <Button
                                onClick={() => {
                                  setShowAddPayment(false)
                                  setNewPayment({ method: 'Cash', amount: '', notes: '' })
                                }}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {payments.length === 0 && !showAddPayment && (
                          <div className="text-center py-8 text-slate-500">
                            <p className="text-sm">No payments recorded yet</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center text-blue-700 text-sm">
                        Payments are tracked after the trip is created. You can add payments when editing.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel - Sticky Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-slate-200 p-6 flex flex-col overflow-y-auto"
          >
            <h3 className="text-base font-bold text-slate-900 mb-6">Billing Summary</h3>

            {/* Subtotals Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              className="space-y-2 pb-4 border-b border-slate-300"
            >
              {totals.primaryTotal > 0 && (
                <SummaryRow
                  label="Primary"
                  value={formatCurrency(totals.primaryTotal)}
                  isTotal={false}
                  compact
                />
              )}
              {totals.secondaryTotal > 0 && (
                <SummaryRow
                  label="Secondary"
                  value={formatCurrency(totals.secondaryTotal)}
                  isTotal={false}
                  compact
                />
              )}
              {totals.farmoutTotal > 0 && (
                <SummaryRow
                  label="Farm-out"
                  value={formatCurrency(totals.farmoutTotal)}
                  isTotal={false}
                  compact
                />
              )}
              <div className="pt-1">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(totals.subtotal)}
                  isTotal={true}
                  compact
                />
              </div>
            </motion.div>

            {/* Adjustments Section */}
            <AnimatePresence>
              {(totals.discount > 0 || totals.gratuityAmt > 0 || totals.taxAmt > 0 ||
                (billingData.adjustments.tollsEnabled && billingData.adjustments.tollsAmount > 0) ||
                (billingData.adjustments.parkingEnabled && billingData.adjustments.parkingAmount > 0)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.2 } }}
                  exit={{ opacity: 0 }}
                  className="space-y-1.5 py-3 border-b border-slate-300"
                >
                  {totals.discount > 0 && (
                    <SummaryRow
                      label="Discount"
                      value={`−${formatCurrency(totals.discount)}`}
                      isAdjustment={true}
                      compact
                    />
                  )}
                  {totals.gratuityAmt > 0 && (
                    <SummaryRow
                      label={`Gratuity (${billingData.adjustments.gratuityPercent}%)`}
                      value={`+${formatCurrency(totals.gratuityAmt)}`}
                      isAdjustment={true}
                      compact
                    />
                  )}
                  {billingData.adjustments.tollsEnabled && billingData.adjustments.tollsAmount > 0 && (
                    <SummaryRow
                      label="Tolls"
                      value={`+${formatCurrency(billingData.adjustments.tollsAmount)}`}
                      isAdjustment={true}
                      compact
                    />
                  )}
                  {billingData.adjustments.parkingEnabled && billingData.adjustments.parkingAmount > 0 && (
                    <SummaryRow
                      label="Parking"
                      value={`+${formatCurrency(billingData.adjustments.parkingAmount)}`}
                      isAdjustment={true}
                      compact
                    />
                  )}
                  {totals.taxAmt > 0 && (
                    <SummaryRow
                      label={`Tax (${billingData.adjustments.taxPercent}%)`}
                      value={`+${formatCurrency(totals.taxAmt)}`}
                      isAdjustment={true}
                      compact
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              className="py-3 border-b border-slate-300"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Total</p>
              <motion.div
                key={totals.total}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-slate-900"
              >
                {formatCurrency(totals.total)}
              </motion.div>
            </motion.div>

            {/* Payments Made (Edit Mode) */}
            {mode === 'edit' && payments.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4 } }}
                className="py-3 border-b border-slate-300"
              >
                <p className="text-xs text-slate-600 uppercase tracking-wide font-medium mb-1">Paid</p>
                <p className="text-lg font-bold text-slate-900 font-mono">
                  −{formatCurrency(totals.totalPaid)}
                </p>
              </motion.div>
            )}

            {/* Balance (Edit Mode Only) */}
            {mode === 'edit' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                className={`mt-4 p-3 rounded-lg transition-colors ${
                  totals.balance > 0.01
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                  totals.balance > 0.01 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {totals.balance > 0.01 ? 'Due' : 'Paid'}
                </p>
                <motion.p
                  key={totals.balance}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={`text-xl font-bold ${
                    totals.balance > 0.01 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(Math.abs(totals.balance))}
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Service Category Component
interface ServiceCategoryProps {
  title: string
  subtitle: string
  items: BillingLineItem[]
  category: 'primary' | 'secondary' | 'farmout'
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<BillingLineItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (event: DragEndEvent) => void
  allItems: BillingLineItem[]
}

function ServiceCategory({
  title,
  subtitle,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  sensors,
  onDragEnd,
}: ServiceCategoryProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3"
      >
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"
        >
          <p className="text-xs text-slate-500 mb-3">No services added</p>
          <motion.div whileHover="hover" whileTap="tap" variants={{
            hover: { scale: 1.05 },
            tap: { scale: 0.95 },
          }}>
            <Button
              onClick={onAdd}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Service
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <div className="space-y-2 mb-3">
            <SortableContext
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {items.map((item, idx) => (
                  <ServiceCardWithDnd
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </div>
        </DndContext>
      )}

      {items.length > 0 && (
        <motion.div
          whileHover="hover"
          whileTap="tap"
          variants={{
            hover: { scale: 1.01 },
            tap: { scale: 0.99 },
          }}
        >
          <Button
            onClick={onAdd}
            variant="outline"
            size="sm"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-8"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Another
          </Button>
        </motion.div>
      )}
    </div>
  )
}

// Draggable Service Card Component
interface ServiceCardWithDndProps {
  item: BillingLineItem
  index: number
  onUpdate: (id: string, updates: Partial<BillingLineItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

function ServiceCardWithDnd({
  item,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: ServiceCardWithDndProps) {
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
      exit={{ opacity: 0, x: 20 }}
      className="group"
    >
      <ServiceCard
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragListeners={listeners}
        dragAttributes={attributes}
        isDragging={isDragging}
      />
    </motion.div>
  )
}

// Service Card Component (with Drag Handle)
interface ServiceCardProps {
  item: BillingLineItem
  onUpdate: (id: string, updates: Partial<BillingLineItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  dragListeners?: any
  dragAttributes?: any
  isDragging?: boolean
}

function ServiceCard({
  item,
  onUpdate,
  onDelete,
  onDuplicate,
  dragListeners,
  dragAttributes,
  isDragging,
}: ServiceCardProps) {
  const lineTotal = item.rate * item.qty

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
      className={`group p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all space-y-2 ${
        isDragging ? 'opacity-50 shadow-md' : ''
      }`}
    >
      {/* Row 1: Service Type, Description, Total */}
      <div className="flex items-center gap-2">
        <motion.div
          {...dragAttributes}
          {...dragListeners}
          className="flex-shrink-0 p-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors"
          whileHover={{ scale: 1.1 }}
        >
          <GripVertical className="w-3 h-3" />
        </motion.div>

        <select
          value={item.serviceType || ""}
          onChange={(e) => onUpdate(item.id, { serviceType: e.target.value })}
          className="flex-shrink-0 text-xs font-medium text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 w-32"
        >
          <option value="">Select Type</option>
          {SERVICE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, { description: e.target.value })}
          placeholder="Description"
          className="text-xs flex-1 h-8"
        />

        <motion.span
          key={lineTotal}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-xs font-bold text-slate-900 font-mono whitespace-nowrap w-16 text-right"
        >
          {formatCurrency(lineTotal)}
        </motion.span>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDuplicate(item.id)}
            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(item.id)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Row 2: Rate, Quantity, Unit */}
      <div className="flex items-center gap-2 ml-5">
        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="text-xs text-slate-600">$</label>
          <Input
            type="number"
            step="0.01"
            value={item.rate}
            onChange={(e) => onUpdate(item.id, { rate: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="text-xs h-7 w-16"
          />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="text-xs text-slate-600">×</label>
          <Input
            type="number"
            step="0.1"
            value={item.qty}
            onChange={(e) => onUpdate(item.id, { qty: parseFloat(e.target.value) || 1 })}
            placeholder="1"
            className="text-xs h-7 w-14"
          />
        </div>

        <select
          value={item.unit}
          onChange={(e) => onUpdate(item.id, { unit: e.target.value as any })}
          className="text-xs h-7 border border-slate-200 rounded px-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 w-20"
        >
          {UNITS.map(unit => (
            <option key={unit} value={unit}>
              {unit === 'flat' ? 'Flat' : unit.charAt(0).toUpperCase() + unit.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  )
}

// Adjustment Item Component
interface AdjustmentItemProps {
  label: string
  isExpanded: boolean
  onToggle: () => void
  isEnabled: boolean
  onEnabledChange: (enabled: boolean) => void
  children: React.ReactNode
}

function AdjustmentItem({
  label,
  isExpanded,
  onToggle,
  isEnabled,
  onEnabledChange,
  children,
}: AdjustmentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-slate-200 rounded-xl overflow-hidden"
    >
      <motion.button
        onClick={() => {
          onToggle()
          if (!isEnabled) onEnabledChange(true)
        }}
        whileHover={{ backgroundColor: '#f8fafc' }}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              e.stopPropagation()
              onEnabledChange(e.target.checked)
            }}
            className="w-5 h-5 cursor-pointer accent-blue-600"
          />
          <span className="font-medium text-slate-900">{label}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: { duration: 0.2 } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
            className="px-4 py-4 bg-slate-50 border-t border-slate-200"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Summary Row Component
interface SummaryRowProps {
  label: string
  value: string
  isTotal?: boolean
  isAdjustment?: boolean
  compact?: boolean
}

function SummaryRow({ label, value, isTotal, isAdjustment, compact }: SummaryRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex justify-between items-baseline ${compact ? '' : isTotal ? 'pt-2' : ''}`}
    >
      <span className={`${compact ? 'text-xs' : 'text-sm'} ${isTotal ? 'font-semibold text-slate-900' : isAdjustment ? 'text-slate-600' : 'text-slate-700'}`}>
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={`font-mono ${compact ? 'text-xs font-semibold' : isTotal ? 'text-lg font-bold text-slate-900' : isAdjustment ? 'text-sm text-slate-600' : 'font-medium text-slate-900'} text-slate-900`}
      >
        {value}
      </motion.span>
    </motion.div>
  )
}
