"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, GripVertical } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { computeBillingTotals } from "@/lib/utils"
import type { BillingData, BillingLineItem, Trip } from "@/types"

interface BillingModalProps {
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
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Check', 'Wire Transfer', 'ACH', 'Venmo', 'Other']

export function BillingModal({
  open,
  onClose,
  mode,
  trip,
  initialData,
  onSave,
}: BillingModalProps) {
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary' | 'farmout'>('primary')
  const [billingData, setBillingData] = useState<BillingData>(
    initialData || {
      lineItems: [],
      adjustments: DEFAULT_ADJUSTMENTS,
    }
  )
  const [isSaving, setIsSaving] = useState(false)

  // Compute totals
  const totals = useMemo(() => computeBillingTotals(billingData, []), [billingData])

  // Handle line item changes
  const updateLineItem = useCallback((id: string, updates: Partial<BillingLineItem>) => {
    setBillingData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }))
  }, [])

  const addLineItem = useCallback(() => {
    const newItem: BillingLineItem = {
      id: Date.now().toString(),
      tab: activeTab,
      order: billingData.lineItems.filter((i) => i.tab === activeTab).length,
      serviceType: '',
      description: '',
      rate: 0,
      qty: 1,
      unit: 'flat',
    }
    setBillingData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }))
  }, [activeTab, billingData.lineItems])

  const deleteLineItem = useCallback((id: string) => {
    setBillingData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }))
  }, [])

  const tabItems = billingData.lineItems.filter((item) => item.tab === activeTab)

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // In edit mode, would save to API here
      // In create mode, call onSave callback
      if (onSave) {
        onSave(billingData)
      } else {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }, [billingData, onSave, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[92vh] p-0 overflow-hidden flex flex-col">
        {/* Header - refined with better spacing */}
        <div className="border-b border-slate-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Trip Billing</h2>
              {trip && (
                <p className="text-sm text-slate-500 mt-1.5">
                  {trip.tripNumber} · {trip.customer?.name}
                </p>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-6"
            >
              Save & Close
            </Button>
          </div>
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full">
            {/* Left pane - line items and adjustments */}
            <div className="flex-1 px-8 py-6 space-y-8 border-r border-slate-200">
              {/* Tabs section */}
              <div>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-3 gap-2 bg-white p-1">
                    <TabsTrigger
                      value="primary"
                      className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=inactive]:text-slate-600"
                    >
                      <span>Primary</span>
                      <span className="ml-2 font-mono text-xs font-semibold text-blue-600">
                        {formatCurrency(totals.primaryTotal)}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="secondary"
                      className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=inactive]:text-slate-600"
                    >
                      <span>Secondary</span>
                      <span className="ml-2 font-mono text-xs font-semibold text-blue-600">
                        {formatCurrency(totals.secondaryTotal)}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="farmout"
                      className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=inactive]:text-slate-600"
                    >
                      <span>Farm-out</span>
                      <span className="ml-2 font-mono text-xs font-semibold text-blue-600">
                        {formatCurrency(totals.farmoutTotal)}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Line items for each tab */}
                  {(['primary', 'secondary', 'farmout'] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="space-y-3 mt-5">
                      {tabItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-sm text-slate-500 mb-4">No line items yet</p>
                          <Button
                            onClick={addLineItem}
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add first item
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Line item table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[48px_140px_160px_110px_90px_110px_130px_48px] gap-0 bg-slate-50 border-b border-slate-200 px-4 py-3">
                              <div className="text-xs font-semibold text-slate-500 uppercase"></div>
                              <div className="text-xs font-semibold text-slate-600">Service</div>
                              <div className="text-xs font-semibold text-slate-600">Description</div>
                              <div className="text-xs font-semibold text-slate-600">Rate</div>
                              <div className="text-xs font-semibold text-slate-600">Qty</div>
                              <div className="text-xs font-semibold text-slate-600">Unit</div>
                              <div className="text-xs font-semibold text-slate-600 text-right">Total</div>
                              <div className="text-xs font-semibold text-slate-500 uppercase"></div>
                            </div>

                            {/* Table rows */}
                            {tabItems.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-[48px_140px_160px_110px_90px_110px_130px_48px] gap-0 items-center px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center justify-center text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <select
                                  value={item.serviceType || ""}
                                  onChange={(e) => updateLineItem(item.id, { serviceType: e.target.value })}
                                  className="h-9 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select type</option>
                                  {SERVICE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                                <Input
                                  className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                                />
                                <Input
                                  className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.rate}
                                  onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                                />
                                <Input
                                  className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                                  type="number"
                                  step="0.1"
                                  placeholder="1"
                                  value={item.qty}
                                  onChange={(e) => updateLineItem(item.id, { qty: parseFloat(e.target.value) || 1 })}
                                />
                                <select
                                  value={item.unit}
                                  onChange={(e) => updateLineItem(item.id, { unit: e.target.value as any })}
                                  className="h-9 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {UNITS.map((unit) => (
                                    <option key={unit} value={unit}>{unit === 'flat' ? 'Flat' : unit}</option>
                                  ))}
                                </select>
                                <div className="text-sm font-mono font-semibold text-slate-900 text-right">
                                  {formatCurrency(item.rate * item.qty)}
                                </div>
                                <button
                                  onClick={() => deleteLineItem(item.id)}
                                  className="flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                                  aria-label="Delete line item"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add line item button */}
                          <Button
                            onClick={addLineItem}
                            variant="outline"
                            size="sm"
                            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add line item
                          </Button>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Adjustments section with refined spacing */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Adjustments</h3>

                <div className="space-y-3">
                  {/* Discount row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.discountEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, discountEnabled: e.target.checked },
                      }))}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                      aria-label="Enable discount"
                    />
                    <span className="text-sm font-medium text-slate-700 w-20">Discount</span>
                    <div className="flex gap-2 flex-1">
                      <select
                        value={billingData.adjustments.discountType}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountType: e.target.value as 'flat' | 'percent' },
                        }))}
                        className="h-9 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!billingData.adjustments.discountEnabled}
                      >
                        <option value="flat">Flat ($)</option>
                        <option value="percent">Percent (%)</option>
                      </select>
                      <Input
                        type="number"
                        className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                        placeholder="0"
                        value={billingData.adjustments.discountAmount}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.discountEnabled}
                      />
                    </div>
                    <div className="text-sm font-mono font-semibold text-slate-900 w-28 text-right">
                      −{formatCurrency(totals.discount)}
                    </div>
                  </div>

                  {/* Gratuity row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.gratuityEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, gratuityEnabled: e.target.checked },
                      }))}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                      aria-label="Enable gratuity"
                    />
                    <span className="text-sm font-medium text-slate-700 w-20">Gratuity</span>
                    <div className="flex gap-2 flex-1 items-center">
                      <Input
                        type="number"
                        className="h-9 text-sm border-slate-200 focus:ring-blue-500 w-24"
                        placeholder="0"
                        value={billingData.adjustments.gratuityPercent}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, gratuityPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.gratuityEnabled}
                      />
                      <span className="text-sm text-slate-600 font-medium">%</span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-slate-900 w-28 text-right">
                      +{formatCurrency(totals.gratuityAmt)}
                    </div>
                  </div>

                  {/* Tolls row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.tollsEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, tollsEnabled: e.target.checked },
                      }))}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                      aria-label="Enable tolls"
                    />
                    <span className="text-sm font-medium text-slate-700 w-20">Tolls</span>
                    <div className="flex gap-2 flex-1">
                      <Input
                        type="number"
                        className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                        placeholder="0.00"
                        value={billingData.adjustments.tollsAmount}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, tollsAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.tollsEnabled}
                      />
                    </div>
                    <div className="text-sm font-mono font-semibold text-slate-900 w-28 text-right">
                      +{formatCurrency(billingData.adjustments.tollsEnabled ? billingData.adjustments.tollsAmount : 0)}
                    </div>
                  </div>

                  {/* Parking row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.parkingEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, parkingEnabled: e.target.checked },
                      }))}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                      aria-label="Enable parking"
                    />
                    <span className="text-sm font-medium text-slate-700 w-20">Parking</span>
                    <div className="flex gap-2 flex-1">
                      <Input
                        type="number"
                        className="h-9 text-sm border-slate-200 focus:ring-blue-500"
                        placeholder="0.00"
                        value={billingData.adjustments.parkingAmount}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, parkingAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.parkingEnabled}
                      />
                    </div>
                    <div className="text-sm font-mono font-semibold text-slate-900 w-28 text-right">
                      +{formatCurrency(billingData.adjustments.parkingEnabled ? billingData.adjustments.parkingAmount : 0)}
                    </div>
                  </div>

                  {/* Tax row - distinct style */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm font-medium text-slate-700 w-20">Tax Rate</span>
                    <div className="flex gap-2 flex-1 items-center">
                      <Input
                        type="number"
                        className="h-9 text-sm border-blue-300 bg-white focus:ring-blue-500 w-24"
                        placeholder="0"
                        value={billingData.adjustments.taxPercent}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, taxPercent: parseFloat(e.target.value) || 0 },
                        }))}
                      />
                      <span className="text-sm text-slate-600 font-medium">%</span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-slate-900 w-28 text-right">
                      +{formatCurrency(totals.taxAmt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right pane - sticky summary with refined spacing */}
            <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">Billing Summary</h3>

                {/* Subtotals section */}
                <div className="space-y-2 text-sm pb-4 border-b border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Primary</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totals.primaryTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Secondary</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totals.secondaryTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Farm-out</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totals.farmoutTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold pt-2 mt-2 border-t border-slate-200">
                    <span className="text-slate-900">Subtotal</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totals.subtotal)}</span>
                  </div>
                </div>

                {/* Adjustments section */}
                <div className="space-y-2 text-sm py-4 border-b border-slate-200">
                  {totals.discount > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Discount</span>
                      <span className="font-mono text-slate-900">−{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  {totals.gratuityAmt > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Gratuity {billingData.adjustments.gratuityPercent}%</span>
                      <span className="font-mono text-slate-900">+{formatCurrency(totals.gratuityAmt)}</span>
                    </div>
                  )}
                  {billingData.adjustments.tollsEnabled && billingData.adjustments.tollsAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Tolls</span>
                      <span className="font-mono text-slate-900">+{formatCurrency(billingData.adjustments.tollsAmount)}</span>
                    </div>
                  )}
                  {billingData.adjustments.parkingEnabled && billingData.adjustments.parkingAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Parking</span>
                      <span className="font-mono text-slate-900">+{formatCurrency(billingData.adjustments.parkingAmount)}</span>
                    </div>
                  )}
                  {totals.taxAmt > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Tax {billingData.adjustments.taxPercent}%</span>
                      <span className="font-mono text-slate-900">+{formatCurrency(totals.taxAmt)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="space-y-3 pt-4 border-b border-slate-200 pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">TOTAL</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payments and Balance (edit mode only) */}
              {mode === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Payments</h4>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span>No payments recorded</span>
                        <span className="font-mono">$0.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className={`flex flex-col gap-2 p-4 rounded-xl ${
                      totals.balance > 0.01
                        ? 'bg-rose-50 border border-rose-200'
                        : 'bg-emerald-50 border border-emerald-200'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        {totals.balance > 0.01 ? 'Balance Due' : 'Paid in Full'}
                      </div>
                      <div className={`font-mono text-2xl font-bold ${
                        totals.balance > 0.01 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(Math.abs(totals.balance))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
