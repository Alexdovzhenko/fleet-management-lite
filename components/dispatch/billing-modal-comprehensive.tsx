"use client"

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { computeBillingTotals } from "@/lib/utils"
import type { BillingData, Trip } from "@/types"
import { motion, AnimatePresence } from "framer-motion"

interface BillingModalComprehensiveProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  tripId?: string
  trip?: Trip
  initialData?: BillingData
  onSave?: (data: BillingData) => void
}

type TabType = 'primary' | 'secondary' | 'farmout'

const DEFAULT_CHARGES = {
  // Base
  rate: 0,
  setupFee: 0,
  gratuity: 0,
  gratuityPercent: 0,

  // Adjustments
  stc: 0,
  stops: 0,
  tolls: 0,
  parking: 0,
  waiting: 0,
  airportFee: 0,
  fuelSurcharge: 0,
  meetGreet: 0,
  phone: 0,

  // Additional
  miscFee1: 0,
  miscFee2: 0,
  miscFee3: 0,

  // Calculated
  voucherQty: 0,
  voucherRate: 0,
  perUnitQty: 0,
  perUnitRate: 0,
  perMileQty: 0,
  perMileRate: 0,
  perPassQty: 0,
  perPassRate: 0,

  // Special
  holidayCharge: 0,
  lateEarlyCharge: 0,

  // Discount & Tax
  discountType: 'flat' as const,
  discountAmount: 0,
  stdTax1Percent: 0,
  stateTaxPercent: 0,
}

export function BillingModalComprehensive({
  open,
  onClose,
  trip,
  initialData,
  onSave,
}: BillingModalComprehensiveProps) {
  const [activeTab, setActiveTab] = useState<TabType>('primary')
  const [charges, setCharges] = useState(initialData?.adjustments || DEFAULT_CHARGES)
  const [isSaving, setIsSaving] = useState(false)

  const totals = useMemo(() => {
    return computeBillingTotals({ lineItems: [], adjustments: charges }, [])
  }, [charges])

  const updateCharge = useCallback((key: string, value: any) => {
    setCharges(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveAndClose = useCallback(async () => {
    setIsSaving(true)
    try {
      if (onSave) onSave({ lineItems: [], adjustments: charges })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [charges, onSave, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Trip Billing</h2>
              {trip && (
                <p className="text-sm text-slate-500 mt-1">
                  Trip #{trip.tripNumber} · {trip.customer?.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 flex gap-1">
          {(['primary', 'secondary', 'farmout'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'primary' && 'Primary'}
              {tab === 'secondary' && 'Secondary'}
              {tab === 'farmout' && 'Farm-out Costs'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Base Rate Section */}
              <Section title="Base Rate">
                <ChargeInput
                  label="Rate"
                  value={charges.rate}
                  onChange={(v) => updateCharge('rate', v)}
                  currency
                />
                <ChargeInput
                  label="Setup Fee"
                  value={charges.setupFee}
                  onChange={(v) => updateCharge('setupFee', v)}
                  currency
                />
              </Section>

              {/* Gratuity Section */}
              <Section title="Gratuity">
                <ChargeInput
                  label="Gratuity Amount"
                  value={charges.gratuity}
                  onChange={(v) => updateCharge('gratuity', v)}
                  currency
                />
                <ChargeInput
                  label="Gratuity %"
                  value={charges.gratuityPercent}
                  onChange={(v) => updateCharge('gratuityPercent', v)}
                  currency={false}
                />
              </Section>

              {/* Adjustments Section */}
              <Section title="Adjustments">
                <ChargeInput
                  label="STC"
                  value={charges.stc}
                  onChange={(v) => updateCharge('stc', v)}
                  currency
                />
                <ChargeInput
                  label="Extra Stops"
                  value={charges.stops}
                  onChange={(v) => updateCharge('stops', v)}
                  currency
                />
                <ChargeInput
                  label="Tolls"
                  value={charges.tolls}
                  onChange={(v) => updateCharge('tolls', v)}
                  currency
                />
              </Section>

              {/* Additional Adjustments */}
              <Section title="More Adjustments">
                <ChargeInput
                  label="Parking"
                  value={charges.parking}
                  onChange={(v) => updateCharge('parking', v)}
                  currency
                />
                <ChargeInput
                  label="Waiting Time"
                  value={charges.waiting}
                  onChange={(v) => updateCharge('waiting', v)}
                  currency
                />
                <ChargeInput
                  label="Airport Fee"
                  value={charges.airportFee}
                  onChange={(v) => updateCharge('airportFee', v)}
                  currency
                />
              </Section>

              {/* Surcharges & Fees */}
              <Section title="Surcharges & Fees">
                <ChargeInput
                  label="Fuel Surcharge"
                  value={charges.fuelSurcharge}
                  onChange={(v) => updateCharge('fuelSurcharge', v)}
                  currency
                />
                <ChargeInput
                  label="Meet & Greet"
                  value={charges.meetGreet}
                  onChange={(v) => updateCharge('meetGreet', v)}
                  currency
                />
                <ChargeInput
                  label="Phone"
                  value={charges.phone}
                  onChange={(v) => updateCharge('phone', v)}
                  currency
                />
              </Section>

              {/* Misc Fees */}
              <Section title="Miscellaneous Fees">
                <ChargeInput
                  label="Misc Fee 1"
                  value={charges.miscFee1}
                  onChange={(v) => updateCharge('miscFee1', v)}
                  currency
                />
                <ChargeInput
                  label="Misc Fee 2"
                  value={charges.miscFee2}
                  onChange={(v) => updateCharge('miscFee2', v)}
                  currency
                />
                <ChargeInput
                  label="Misc Fee 3"
                  value={charges.miscFee3}
                  onChange={(v) => updateCharge('miscFee3', v)}
                  currency
                />
              </Section>

              {/* Calculated Fields - Voucher */}
              <Section title="Voucher">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ChargeInput
                      label="Qty"
                      value={charges.voucherQty}
                      onChange={(v) => updateCharge('voucherQty', v)}
                      currency={false}
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">×</span>
                  <div className="flex-1">
                    <ChargeInput
                      label="Rate"
                      value={charges.voucherRate}
                      onChange={(v) => updateCharge('voucherRate', v)}
                      currency
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">=</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600 mb-2">Total</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency((charges.voucherQty ?? 0) * (charges.voucherRate ?? 0))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Per Unit */}
              <Section title="Per Unit">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ChargeInput
                      label="Qty"
                      value={charges.perUnitQty}
                      onChange={(v) => updateCharge('perUnitQty', v)}
                      currency={false}
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">×</span>
                  <div className="flex-1">
                    <ChargeInput
                      label="Rate"
                      value={charges.perUnitRate}
                      onChange={(v) => updateCharge('perUnitRate', v)}
                      currency
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">=</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600 mb-2">Total</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency((charges.perUnitQty ?? 0) * (charges.perUnitRate ?? 0))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Per Mile */}
              <Section title="Per Mile">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ChargeInput
                      label="Miles"
                      value={charges.perMileQty}
                      onChange={(v) => updateCharge('perMileQty', v)}
                      currency={false}
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">×</span>
                  <div className="flex-1">
                    <ChargeInput
                      label="Rate"
                      value={charges.perMileRate}
                      onChange={(v) => updateCharge('perMileRate', v)}
                      currency
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">=</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600 mb-2">Total</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency((charges.perMileQty ?? 0) * (charges.perMileRate ?? 0))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Per Pass */}
              <Section title="Per Pass">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ChargeInput
                      label="Passes"
                      value={charges.perPassQty}
                      onChange={(v) => updateCharge('perPassQty', v)}
                      currency={false}
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">×</span>
                  <div className="flex-1">
                    <ChargeInput
                      label="Rate"
                      value={charges.perPassRate}
                      onChange={(v) => updateCharge('perPassRate', v)}
                      currency
                    />
                  </div>
                  <span className="text-slate-600 font-medium mb-2">=</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600 mb-2">Total</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency((charges.perPassQty ?? 0) * (charges.perPassRate ?? 0))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Special Charges */}
              <Section title="Special Charges">
                <ChargeInput
                  label="Holiday Charge"
                  value={charges.holidayCharge}
                  onChange={(v) => updateCharge('holidayCharge', v)}
                  currency
                />
                <ChargeInput
                  label="Late/Early Charge"
                  value={charges.lateEarlyCharge}
                  onChange={(v) => updateCharge('lateEarlyCharge', v)}
                  currency
                />
              </Section>

              {/* Discount */}
              <Section title="Discount">
                <select
                  value={charges.discountType}
                  onChange={(e) => updateCharge('discountType', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="flat">Flat Amount ($)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
                <ChargeInput
                  label="Discount"
                  value={charges.discountAmount}
                  onChange={(v) => updateCharge('discountAmount', v)}
                  currency={charges.discountType === 'flat'}
                />
              </Section>

              {/* Taxes */}
              <Section title="Taxes">
                <ChargeInput
                  label="Std Tax 1 %"
                  value={charges.stdTax1Percent}
                  onChange={(v) => updateCharge('stdTax1Percent', v)}
                  currency={false}
                />
                <ChargeInput
                  label="State Tax %"
                  value={charges.stateTaxPercent}
                  onChange={(v) => updateCharge('stateTaxPercent', v)}
                  currency={false}
                />
              </Section>
            </div>
          </motion.div>
        </div>

        {/* Summary Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-6 space-y-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Subtotal" value={formatCurrency(totals.subtotal)} />
            <SummaryItem label="Discount" value={formatCurrency(-totals.discount)} />
            <SummaryItem label="Tax" value={formatCurrency(totals.taxAmt)} />
            <SummaryItem label="Total" value={formatCurrency(totals.total)} isTotal />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
 * Section component for grouping related fields
 */
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50"
    >
      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </motion.div>
  )
}

/**
 * Input component for charge fields
 */
function ChargeInput({
  label,
  value,
  onChange,
  currency = true,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  currency?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        {currency && <span className="absolute left-3 text-slate-500">$</span>}
        <input
          type="number"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
            currency ? 'pl-8' : ''
          }`}
        />
      </div>
    </div>
  )
}

/**
 * Summary item display
 */
function SummaryItem({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: string
  isTotal?: boolean
}) {
  return (
    <div className={isTotal ? 'bg-blue-50 rounded-lg p-3' : ''}>
      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`font-semibold font-mono text-sm ${
          isTotal ? 'text-blue-600 text-lg' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
