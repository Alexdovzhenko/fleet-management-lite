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
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle>Trip Billing</DialogTitle>
              {trip && (
                <p className="text-sm text-gray-500 mt-1">
                  {trip.tripNumber} · {trip.customer?.name}
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="text-white" style={{ backgroundColor: "#2563EB" }}>
              Save & Close
            </Button>
          </div>
        </DialogHeader>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-6 p-6">
            {/* Left pane - line items and adjustments */}
            <div className="flex-1 space-y-6">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="primary" className="flex items-center gap-2">
                    Primary
                    <span className="text-xs font-semibold text-blue-600">
                      {formatCurrency(totals.primaryTotal)}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="secondary" className="flex items-center gap-2">
                    Secondary
                    <span className="text-xs font-semibold text-blue-600">
                      {formatCurrency(totals.secondaryTotal)}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="farmout" className="flex items-center gap-2">
                    Farm-out
                    <span className="text-xs font-semibold text-blue-600">
                      {formatCurrency(totals.farmoutTotal)}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Line items for each tab */}
                {(['primary', 'secondary', 'farmout'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                    {tabItems.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-gray-400">No line items yet</p>
                        <Button onClick={addLineItem} variant="outline" size="sm" className="mt-3">
                          <Plus className="w-4 h-4 mr-1" /> Add first item
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Line item rows */}
                        <div className="space-y-2 bg-white rounded-lg border border-slate-200">
                          <div className="grid grid-cols-[40px_120px_150px_100px_80px_100px_120px_40px] gap-2 p-3 bg-slate-50 border-b text-xs font-semibold text-gray-600">
                            <div></div>
                            <div>Service Type</div>
                            <div>Description</div>
                            <div>Rate</div>
                            <div>Qty</div>
                            <div>Unit</div>
                            <div>Total</div>
                            <div></div>
                          </div>
                          {tabItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-[40px_120px_150px_100px_80px_100px_120px_40px] gap-2 p-3 border-b last:border-b-0 hover:bg-slate-50 items-center">
                              <div className="flex items-center justify-center text-gray-300 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <select
                                value={item.serviceType || ""}
                                onChange={(e) => updateLineItem(item.id, { serviceType: e.target.value })}
                                className="h-8 text-xs border border-gray-300 rounded px-2 bg-white"
                              >
                                <option value="">Select type</option>
                                {SERVICE_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                              />
                              <Input
                                className="h-8 text-xs"
                                type="number"
                                step="0.01"
                                placeholder="Rate"
                                value={item.rate}
                                onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                              />
                              <Input
                                className="h-8 text-xs"
                                type="number"
                                step="0.1"
                                placeholder="Qty"
                                value={item.qty}
                                onChange={(e) => updateLineItem(item.id, { qty: parseFloat(e.target.value) || 1 })}
                              />
                              <select
                                value={item.unit}
                                onChange={(e) => updateLineItem(item.id, { unit: e.target.value as any })}
                                className="h-8 text-xs border border-gray-300 rounded px-2 bg-white"
                              >
                                {UNITS.map((unit) => (
                                  <option key={unit} value={unit}>{unit === 'flat' ? 'Flat' : unit}</option>
                                ))}
                              </select>
                              <div className="font-mono font-semibold text-sm text-gray-900">
                                {formatCurrency(item.rate * item.qty)}
                              </div>
                              <button onClick={() => deleteLineItem(item.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <Button onClick={addLineItem} variant="outline" size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" /> Add line item
                        </Button>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Adjustments section */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-900">Adjustments</h3>
                <div className="space-y-2">
                  {/* Discount */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.discountEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, discountEnabled: e.target.checked },
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 w-24">Discount</span>
                    <div className="flex gap-2 flex-1">
                      <select
                        value={billingData.adjustments.discountType}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountType: e.target.value as 'flat' | 'percent' },
                        }))}
                        className="h-8 text-xs border border-gray-300 rounded px-2 bg-white"
                        disabled={!billingData.adjustments.discountEnabled}
                      >
                        <option value="flat">$</option>
                        <option value="percent">%</option>
                      </select>
                      <Input
                        type="number"
                        className="h-8 text-xs flex-1"
                        placeholder="0"
                        value={billingData.adjustments.discountAmount}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, discountAmount: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.discountEnabled}
                      />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                      -{formatCurrency(totals.discount)}
                    </div>
                  </div>

                  {/* Gratuity */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.gratuityEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, gratuityEnabled: e.target.checked },
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 w-24">Gratuity</span>
                    <div className="flex gap-2 flex-1">
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="0"
                        value={billingData.adjustments.gratuityPercent}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, gratuityPercent: parseFloat(e.target.value) || 0 },
                        }))}
                        disabled={!billingData.adjustments.gratuityEnabled}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                      +{formatCurrency(totals.gratuityAmt)}
                    </div>
                  </div>

                  {/* Tolls */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.tollsEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, tollsEnabled: e.target.checked },
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 w-24">Tolls</span>
                    <Input
                      type="number"
                      className="h-8 text-xs flex-1"
                      placeholder="0"
                      value={billingData.adjustments.tollsAmount}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, tollsAmount: parseFloat(e.target.value) || 0 },
                      }))}
                      disabled={!billingData.adjustments.tollsEnabled}
                    />
                    <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                      +{formatCurrency(totals.adjustmentsTotal > 0 ? billingData.adjustments.tollsAmount : 0)}
                    </div>
                  </div>

                  {/* Parking */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={billingData.adjustments.parkingEnabled}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, parkingEnabled: e.target.checked },
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 w-24">Parking</span>
                    <Input
                      type="number"
                      className="h-8 text-xs flex-1"
                      placeholder="0"
                      value={billingData.adjustments.parkingAmount}
                      onChange={(e) => setBillingData((prev) => ({
                        ...prev,
                        adjustments: { ...prev.adjustments, parkingAmount: parseFloat(e.target.value) || 0 },
                      }))}
                      disabled={!billingData.adjustments.parkingEnabled}
                    />
                    <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                      +{formatCurrency(billingData.adjustments.parkingAmount || 0)}
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-gray-700 w-24">Tax Rate</span>
                    <div className="flex gap-2 flex-1">
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="0"
                        value={billingData.adjustments.taxPercent}
                        onChange={(e) => setBillingData((prev) => ({
                          ...prev,
                          adjustments: { ...prev.adjustments, taxPercent: parseFloat(e.target.value) || 0 },
                        }))}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                      +{formatCurrency(totals.taxAmt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right pane - sticky summary */}
            <div className="w-80 bg-slate-50 rounded-xl border border-slate-200 p-4 h-fit sticky top-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4">BILLING SUMMARY</h3>

              <div className="space-y-3 text-sm">
                {/* Subtotals by tab */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Primary</span>
                    <span className="font-mono">{formatCurrency(totals.primaryTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Secondary</span>
                    <span className="font-mono">{formatCurrency(totals.secondaryTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Farm-out</span>
                    <span className="font-mono">{formatCurrency(totals.farmoutTotal)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 mt-1 flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="space-y-1">
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  {totals.gratuityAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Gratuity {billingData.adjustments.gratuityPercent}%</span>
                      <span className="font-mono">+{formatCurrency(totals.gratuityAmt)}</span>
                    </div>
                  )}
                  {totals.adjustmentsTotal > totals.gratuityAmt && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Tolls & Parking</span>
                      <span className="font-mono">+{formatCurrency(totals.adjustmentsTotal - totals.gratuityAmt)}</span>
                    </div>
                  )}
                  {totals.taxAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Tax {billingData.adjustments.taxPercent}%</span>
                      <span className="font-mono">+{formatCurrency(totals.taxAmt)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-slate-400 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-900">TOTAL</span>
                    <span className="font-mono text-gray-900">{formatCurrency(totals.total)}</span>
                  </div>
                </div>

                {mode === 'edit' && (
                  <>
                    {/* Payments section */}
                    <div className="border-t border-slate-300 pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Payments Made</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>No payments recorded</span>
                          <span className="font-mono">–$0.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="border-t border-slate-300 pt-3 mt-3">
                      <div className={`flex justify-between font-bold text-lg ${totals.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <span>{totals.balance > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}</span>
                        <span className="font-mono">{formatCurrency(totals.balance)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
