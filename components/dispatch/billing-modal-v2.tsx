"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Copy, Trash2, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { computeBillingTotals } from "@/lib/utils"
import type { BillingData, BillingLineItem, Trip } from "@/types"

interface BillingModalV2Props {
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

export function BillingModalV2({
  open,
  onClose,
  mode,
  trip,
  initialData,
  onSave,
}: BillingModalV2Props) {
  const [activeSection, setActiveSection] = useState<SectionType>('services')
  const [billingData, setBillingData] = useState<BillingData>(
    initialData || {
      lineItems: [],
      adjustments: DEFAULT_ADJUSTMENTS,
    }
  )
  const [isSaving, setIsSaving] = useState(false)
  const [expandedAdjustments, setExpandedAdjustments] = useState<Set<string>>(new Set())

  const totals = useMemo(() => computeBillingTotals(billingData, []), [billingData])

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

  // Adjustment handlers
  const toggleAdjustment = useCallback((key: string) => {
    setExpandedAdjustments(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Trip Billing</h1>
            {trip && (
              <p className="text-sm text-slate-500 mt-1">
                {trip.tripNumber} · {trip.customer?.name}
              </p>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-8"
          >
            Save & Close
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 70% */}
          <div className="flex-1 overflow-y-auto">
            {/* Section Navigation */}
            <div className="px-8 py-6 border-b border-slate-100">
              <div className="flex gap-2">
                {(['services', 'adjustments', 'payments'] as const).map(section => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      activeSection === section
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-6 space-y-8">
              {/* Services Section */}
              {activeSection === 'services' && (
                <div className="space-y-8">
                  {/* Primary Services */}
                  <ServiceCategory
                    title="Primary Services"
                    subtitle="Main charges for this trip"
                    items={primaryItems}
                    category="primary"
                    onAdd={() => addLineItem('primary')}
                    onUpdate={updateLineItem}
                    onDelete={deleteLineItem}
                    onDuplicate={duplicateLineItem}
                    totals={totals}
                  />

                  {/* Secondary Services */}
                  <ServiceCategory
                    title="Secondary Services"
                    subtitle="Additional charges"
                    items={secondaryItems}
                    category="secondary"
                    onAdd={() => addLineItem('secondary')}
                    onUpdate={updateLineItem}
                    onDelete={deleteLineItem}
                    onDuplicate={duplicateLineItem}
                    totals={totals}
                  />

                  {/* Farm-out Costs */}
                  <ServiceCategory
                    title="Farm-out Costs"
                    subtitle="Third-party vendor charges"
                    items={farmoutItems}
                    category="farmout"
                    onAdd={() => addLineItem('farmout')}
                    onUpdate={updateLineItem}
                    onDelete={deleteLineItem}
                    onDuplicate={duplicateLineItem}
                    totals={totals}
                  />
                </div>
              )}

              {/* Adjustments Section */}
              {activeSection === 'adjustments' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-6">
                    Fees, discounts, taxes, and gratuity. Toggle each item to enable.
                  </p>

                  {/* Discount */}
                  <AdjustmentItem
                    label="Discount"
                    isExpanded={expandedAdjustments.has('discount')}
                    onToggle={() => toggleAdjustment('discount')}
                    isEnabled={billingData.adjustments.discountEnabled}
                    onEnabledChange={(enabled) => setBillingData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, discountEnabled: enabled },
                    }))}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Type</label>
                        <select
                          value={billingData.adjustments.discountType}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, discountType: e.target.value as 'flat' | 'percent' },
                          }))}
                          disabled={!billingData.adjustments.discountEnabled}
                          className="w-full h-10 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="flat">Flat Amount ($)</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Amount</label>
                        <Input
                          type="number"
                          value={billingData.adjustments.discountAmount}
                          onChange={(e) => setBillingData(prev => ({
                            ...prev,
                            adjustments: { ...prev.adjustments, discountAmount: parseFloat(e.target.value) || 0 },
                          }))}
                          disabled={!billingData.adjustments.discountEnabled}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          Amount: <span className="font-semibold text-slate-900">{formatCurrency(totals.discount)}</span>
                        </p>
                      </div>
                    </div>
                  </AdjustmentItem>

                  {/* Gratuity */}
                  <AdjustmentItem
                    label="Gratuity"
                    isExpanded={expandedAdjustments.has('gratuity')}
                    onToggle={() => toggleAdjustment('gratuity')}
                    isEnabled={billingData.adjustments.gratuityEnabled}
                    onEnabledChange={(enabled) => setBillingData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, gratuityEnabled: enabled },
                    }))}
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Percentage (%)</label>
                      <Input
                        type="number"
                        value={billingData.adjustments.gratuityPercent}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, gratuityPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.gratuityEnabled}
                        placeholder="0"
                        className="text-sm"
                      />
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          Amount: <span className="font-semibold text-slate-900">{formatCurrency(totals.gratuityAmt)}</span>
                        </p>
                      </div>
                    </div>
                  </AdjustmentItem>

                  {/* Tolls */}
                  <AdjustmentItem
                    label="Tolls"
                    isExpanded={expandedAdjustments.has('tolls')}
                    onToggle={() => toggleAdjustment('tolls')}
                    isEnabled={billingData.adjustments.tollsEnabled}
                    onEnabledChange={(enabled) => setBillingData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, tollsEnabled: enabled },
                    }))}
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Amount</label>
                      <Input
                        type="number"
                        value={billingData.adjustments.tollsAmount}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, tollsAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.tollsEnabled}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  </AdjustmentItem>

                  {/* Parking */}
                  <AdjustmentItem
                    label="Parking"
                    isExpanded={expandedAdjustments.has('parking')}
                    onToggle={() => toggleAdjustment('parking')}
                    isEnabled={billingData.adjustments.parkingEnabled}
                    onEnabledChange={(enabled) => setBillingData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, parkingEnabled: enabled },
                    }))}
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Amount</label>
                      <Input
                        type="number"
                        value={billingData.adjustments.parkingAmount}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, parkingAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.parkingEnabled}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  </AdjustmentItem>

                  {/* Tax */}
                  <AdjustmentItem
                    label="Tax"
                    isExpanded={expandedAdjustments.has('tax')}
                    onToggle={() => toggleAdjustment('tax')}
                    isEnabled={true}
                    onEnabledChange={() => {}}
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Tax Rate (%)</label>
                      <Input
                        type="number"
                        value={billingData.adjustments.taxPercent}
                        onChange={(e) => setBillingData(prev => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, taxPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        placeholder="0"
                        className="text-sm"
                      />
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          Amount: <span className="font-semibold text-slate-900">{formatCurrency(totals.taxAmt)}</span>
                        </p>
                      </div>
                    </div>
                  </AdjustmentItem>
                </div>
              )}

              {/* Payments Section */}
              {activeSection === 'payments' && (
                <div className="space-y-6">
                  {mode === 'edit' ? (
                    <>
                      <p className="text-sm text-slate-600">
                        Track payments received for this trip. Outstanding balance is shown in the summary panel on the right.
                      </p>
                      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 text-center text-slate-600 text-sm">
                        Payment tracking coming soon. Outstanding balance shown in summary.
                      </div>
                    </>
                  ) : (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center text-blue-700 text-sm">
                      Payments are tracked after the trip is created.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - 30% Sticky Summary */}
          <div className="w-96 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-slate-200 p-8 flex flex-col overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Billing Summary</h3>

            {/* Subtotals Section */}
            <div className="space-y-3 pb-6 border-b border-slate-300">
              <SummaryRow
                label="Primary"
                value={formatCurrency(totals.primaryTotal)}
                isTotal={false}
              />
              <SummaryRow
                label="Secondary"
                value={formatCurrency(totals.secondaryTotal)}
                isTotal={false}
              />
              <SummaryRow
                label="Farm-out"
                value={formatCurrency(totals.farmoutTotal)}
                isTotal={false}
              />
              <div className="pt-2">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(totals.subtotal)}
                  isTotal={true}
                />
              </div>
            </div>

            {/* Adjustments Section */}
            {(totals.discount > 0 || totals.gratuityAmt > 0 || totals.taxAmt > 0 ||
              (billingData.adjustments.tollsEnabled && billingData.adjustments.tollsAmount > 0) ||
              (billingData.adjustments.parkingEnabled && billingData.adjustments.parkingAmount > 0)) && (
              <div className="space-y-3 py-6 border-b border-slate-300">
                {totals.discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`−${formatCurrency(totals.discount)}`}
                    isAdjustment={true}
                  />
                )}
                {totals.gratuityAmt > 0 && (
                  <SummaryRow
                    label={`Gratuity (${billingData.adjustments.gratuityPercent}%)`}
                    value={`+${formatCurrency(totals.gratuityAmt)}`}
                    isAdjustment={true}
                  />
                )}
                {billingData.adjustments.tollsEnabled && billingData.adjustments.tollsAmount > 0 && (
                  <SummaryRow
                    label="Tolls"
                    value={`+${formatCurrency(billingData.adjustments.tollsAmount)}`}
                    isAdjustment={true}
                  />
                )}
                {billingData.adjustments.parkingEnabled && billingData.adjustments.parkingAmount > 0 && (
                  <SummaryRow
                    label="Parking"
                    value={`+${formatCurrency(billingData.adjustments.parkingAmount)}`}
                    isAdjustment={true}
                  />
                )}
                {totals.taxAmt > 0 && (
                  <SummaryRow
                    label={`Tax (${billingData.adjustments.taxPercent}%)`}
                    value={`+${formatCurrency(totals.taxAmt)}`}
                    isAdjustment={true}
                  />
                )}
              </div>
            )}

            {/* Total */}
            <div className="py-6 border-b border-slate-300">
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(totals.total)}
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-medium">Total Amount</p>
            </div>

            {/* Balance (Edit Mode Only) */}
            {mode === 'edit' && (
              <div className={`mt-6 p-4 rounded-xl transition-colors ${
                totals.balance > 0.01
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${
                  totals.balance > 0.01 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {totals.balance > 0.01 ? 'Balance Due' : 'Paid in Full'}
                </p>
                <p className={`text-2xl font-bold ${
                  totals.balance > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Math.abs(totals.balance))}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  totals: ReturnType<typeof computeBillingTotals>
}

function ServiceCategory({
  title,
  subtitle,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
}: ServiceCategoryProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-sm text-slate-500 mb-4">No services added yet</p>
          <Button
            onClick={onAdd}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {items.map(item => (
            <ServiceCard
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Button
          onClick={onAdd}
          variant="outline"
          size="sm"
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Another Service
        </Button>
      )}
    </div>
  )
}

// Service Card Component
interface ServiceCardProps {
  item: BillingLineItem
  onUpdate: (id: string, updates: Partial<BillingLineItem>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

function ServiceCard({ item, onUpdate, onDelete, onDuplicate }: ServiceCardProps) {
  const lineTotal = item.rate * item.qty

  return (
    <div className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all space-y-4">
      {/* Header with actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <select
            value={item.serviceType || ""}
            onChange={(e) => onUpdate(item.id, { serviceType: e.target.value })}
            className="text-sm font-medium text-slate-900 bg-white border-0 p-0 focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="">Select Service Type</option>
            {['Transfer', 'Hourly', 'Wait Time', 'Meet & Greet', 'Fuel Surcharge', 'Parking', 'Cancellation Fee', 'Other'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(item.id)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">Description</label>
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, { description: e.target.value })}
          placeholder="e.g., Downtown to Airport"
          className="text-sm"
        />
      </div>

      {/* Rate, Quantity, Unit */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Rate</label>
          <Input
            type="number"
            step="0.01"
            value={item.rate}
            onChange={(e) => onUpdate(item.id, { rate: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Quantity</label>
          <Input
            type="number"
            step="0.1"
            value={item.qty}
            onChange={(e) => onUpdate(item.id, { qty: parseFloat(e.target.value) || 1 })}
            placeholder="1"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Unit</label>
          <select
            value={item.unit}
            onChange={(e) => onUpdate(item.id, { unit: e.target.value as any })}
            className="w-full h-10 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['flat', 'hours', 'miles', 'days'].map(unit => (
              <option key={unit} value={unit}>
                {unit === 'flat' ? 'Flat' : unit.charAt(0).toUpperCase() + unit.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Total */}
      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
        <span className="text-sm text-slate-600">Line Total</span>
        <span className="text-lg font-bold text-slate-900 font-mono">{formatCurrency(lineTotal)}</span>
      </div>
    </div>
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
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => {
          onToggle()
          if (!isEnabled) onEnabledChange(true)
        }}
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
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && isEnabled && (
        <div className="px-4 py-4 bg-slate-50 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  )
}

// Summary Row Component
interface SummaryRowProps {
  label: string
  value: string
  isTotal?: boolean
  isAdjustment?: boolean
}

function SummaryRow({ label, value, isTotal, isAdjustment }: SummaryRowProps) {
  return (
    <div className={`flex justify-between items-baseline ${isTotal ? 'pt-2' : ''}`}>
      <span className={isTotal ? 'font-semibold text-slate-900' : isAdjustment ? 'text-sm text-slate-600' : 'text-sm text-slate-700'}>
        {label}
      </span>
      <span className={`font-mono ${isTotal ? 'text-lg font-bold text-slate-900' : isAdjustment ? 'text-sm text-slate-600' : 'font-medium text-slate-900'}`}>
        {value}
      </span>
    </div>
  )
}
