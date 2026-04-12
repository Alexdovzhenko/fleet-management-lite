"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { computeBillingTotals } from "@/lib/utils"
import type { BillingData, Trip } from "@/types"
import { cn } from "@/lib/utils"

interface BillingModalMultistepProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  tripId?: string
  trip?: Trip
  initialData?: BillingData
  onSave?: (data: BillingData) => void
}

type ChargeKey = keyof typeof DEFAULT_CHARGES

const DEFAULT_CHARGES = {
  rate: 0,
  setupFee: 0,
  gratuity: 0,
  gratuityPercent: 0,
  stc: 0,
  stops: 0,
  tolls: 0,
  parking: 0,
  waiting: 0,
  airportFee: 0,
  fuelSurcharge: 0,
  meetGreet: 0,
  phone: 0,
  miscFee1: 0,
  miscFee2: 0,
  miscFee3: 0,
  voucherQty: 0,
  voucherRate: 0,
  perUnitQty: 0,
  perUnitRate: 0,
  perMileQty: 0,
  perMileRate: 0,
  perPassQty: 0,
  perPassRate: 0,
  holidayCharge: 0,
  lateEarlyCharge: 0,
  discountType: 'flat' as const,
  discountAmount: 0,
  stdTax1Percent: 0,
  stateTaxPercent: 0,
}

const STEPS = [
  { id: "base", title: "Base" },
  { id: "adjustments", title: "Adjustments" },
  { id: "additional", title: "Items" },
  { id: "calculated", title: "Calculated" },
  { id: "special", title: "Special" },
  { id: "taxes", title: "Taxes" },
  { id: "review", title: "Review" },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
}

export function BillingModalMultistep({
  open,
  onClose,
  trip,
  initialData,
  onSave,
}: BillingModalMultistepProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [charges, setCharges] = useState(initialData?.adjustments || DEFAULT_CHARGES)

  const totals = computeBillingTotals({ lineItems: [], adjustments: charges }, [])

  const updateCharge = useCallback((key: ChargeKey, value: any) => {
    setCharges(prev => ({ ...prev, [key]: value }))
  }, [])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (onSave) onSave({ lineItems: [], adjustments: charges })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [charges, onSave, onClose])

  const isStepValid = () => {
    // All steps are valid - no required fields blocking progression
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white max-h-[88vh] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-4 flex items-center justify-between"
        >
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
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          className="px-6 py-4 border-b border-slate-200 bg-slate-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between mb-2 gap-2">
            {STEPS.map((step, index) => (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className={cn(
                    "w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-colors duration-300 text-sm font-semibold",
                    index < currentStep
                      ? "bg-blue-600 text-white"
                      : index === currentStep
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-slate-200 text-slate-600",
                  )}
                  onClick={() => setCurrentStep(index)}
                  whileTap={{ scale: 0.95 }}
                >
                  {index < currentStep ? (
                    <Check size={18} />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <motion.span
                  className={cn(
                    "text-xs mt-1 text-center hidden sm:block leading-tight truncate w-full px-1",
                    index === currentStep
                      ? "text-blue-600 font-medium"
                      : "text-slate-600",
                  )}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            ))}
          </div>
          <div className="w-full bg-slate-300 h-1.5 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-8 py-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-4"
              >
                {/* Step 1: Base Charges */}
                {currentStep === 0 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Base Charges</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="rate" className="text-sm font-medium text-slate-700">Rate ($)</Label>
                          <Input
                            id="rate"
                            type="number"
                            placeholder="0.00"
                            value={charges.rate === 0 ? '' : charges.rate}
                            onChange={(e) => updateCharge('rate', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="setupFee">Setup Fee ($)</Label>
                          <Input
                            id="setupFee"
                            type="number"
                            placeholder="0.00"
                            value={charges.setupFee === 0 ? '' : charges.setupFee}
                            onChange={(e) => updateCharge('setupFee', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="gratuity">Gratuity Amount ($)</Label>
                          <Input
                            id="gratuity"
                            type="number"
                            placeholder="0.00"
                            value={charges.gratuity === 0 ? '' : charges.gratuity}
                            onChange={(e) => updateCharge('gratuity', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="gratuityPercent">Gratuity (%)</Label>
                          <Input
                            id="gratuityPercent"
                            type="number"
                            placeholder="0.00"
                            value={charges.gratuityPercent === 0 ? '' : charges.gratuityPercent}
                            onChange={(e) => updateCharge('gratuityPercent', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Adjustments */}
                {currentStep === 1 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Trip Adjustments</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="stc">STC ($)</Label>
                          <Input
                            id="stc"
                            type="number"
                            placeholder="0.00"
                            value={charges.stc === 0 ? '' : charges.stc}
                            onChange={(e) => updateCharge('stc', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="stops">Extra Stops ($)</Label>
                          <Input
                            id="stops"
                            type="number"
                            placeholder="0.00"
                            value={charges.stops === 0 ? '' : charges.stops}
                            onChange={(e) => updateCharge('stops', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="tolls">Tolls ($)</Label>
                          <Input
                            id="tolls"
                            type="number"
                            placeholder="0.00"
                            value={charges.tolls === 0 ? '' : charges.tolls}
                            onChange={(e) => updateCharge('tolls', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="parking">Parking ($)</Label>
                          <Input
                            id="parking"
                            type="number"
                            placeholder="0.00"
                            value={charges.parking === 0 ? '' : charges.parking}
                            onChange={(e) => updateCharge('parking', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="waiting">Waiting Time ($)</Label>
                          <Input
                            id="waiting"
                            type="number"
                            placeholder="0.00"
                            value={charges.waiting === 0 ? '' : charges.waiting}
                            onChange={(e) => updateCharge('waiting', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="airportFee">Airport Fee ($)</Label>
                          <Input
                            id="airportFee"
                            type="number"
                            placeholder="0.00"
                            value={charges.airportFee === 0 ? '' : charges.airportFee}
                            onChange={(e) => updateCharge('airportFee', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Additional Items */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Additional Items</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="fuelSurcharge">Fuel Surcharge ($)</Label>
                          <Input
                            id="fuelSurcharge"
                            type="number"
                            placeholder="0.00"
                            value={charges.fuelSurcharge === 0 ? '' : charges.fuelSurcharge}
                            onChange={(e) => updateCharge('fuelSurcharge', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="meetGreet">Meet & Greet ($)</Label>
                          <Input
                            id="meetGreet"
                            type="number"
                            placeholder="0.00"
                            value={charges.meetGreet === 0 ? '' : charges.meetGreet}
                            onChange={(e) => updateCharge('meetGreet', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="phone">Phone ($)</Label>
                          <Input
                            id="phone"
                            type="number"
                            placeholder="0.00"
                            value={charges.phone === 0 ? '' : charges.phone}
                            onChange={(e) => updateCharge('phone', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="miscFee1">Misc Fee 1 ($)</Label>
                          <Input
                            id="miscFee1"
                            type="number"
                            placeholder="0.00"
                            value={charges.miscFee1 === 0 ? '' : charges.miscFee1}
                            onChange={(e) => updateCharge('miscFee1', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="miscFee2">Misc Fee 2 ($)</Label>
                          <Input
                            id="miscFee2"
                            type="number"
                            placeholder="0.00"
                            value={charges.miscFee2 === 0 ? '' : charges.miscFee2}
                            onChange={(e) => updateCharge('miscFee2', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="miscFee3">Misc Fee 3 ($)</Label>
                          <Input
                            id="miscFee3"
                            type="number"
                            placeholder="0.00"
                            value={charges.miscFee3 === 0 ? '' : charges.miscFee3}
                            onChange={(e) => updateCharge('miscFee3', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4: Calculated Fields */}
                {currentStep === 3 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Calculated Fields (Qty × Rate = Total)</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="space-y-5">
                        <CalculatedField
                          title="Voucher"
                          qtyValue={charges.voucherQty}
                          rateValue={charges.voucherRate}
                          onQtyChange={(v) => updateCharge('voucherQty', v)}
                          onRateChange={(v) => updateCharge('voucherRate', v)}
                        />
                        <CalculatedField
                          title="Per Unit"
                          qtyValue={charges.perUnitQty}
                          rateValue={charges.perUnitRate}
                          onQtyChange={(v) => updateCharge('perUnitQty', v)}
                          onRateChange={(v) => updateCharge('perUnitRate', v)}
                        />
                        <CalculatedField
                          title="Per Mile"
                          qtyValue={charges.perMileQty}
                          rateValue={charges.perMileRate}
                          onQtyChange={(v) => updateCharge('perMileQty', v)}
                          onRateChange={(v) => updateCharge('perMileRate', v)}
                          qtyLabel="Miles"
                        />
                        <CalculatedField
                          title="Per Pass"
                          qtyValue={charges.perPassQty}
                          rateValue={charges.perPassRate}
                          onQtyChange={(v) => updateCharge('perPassQty', v)}
                          onRateChange={(v) => updateCharge('perPassRate', v)}
                          qtyLabel="Passes"
                        />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 5: Special Charges */}
                {currentStep === 4 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Special Charges</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="holidayCharge">Holiday Charge ($)</Label>
                          <Input
                            id="holidayCharge"
                            type="number"
                            placeholder="0.00"
                            value={charges.holidayCharge === 0 ? '' : charges.holidayCharge}
                            onChange={(e) => updateCharge('holidayCharge', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="lateEarlyCharge">Late/Early Charge ($)</Label>
                          <Input
                            id="lateEarlyCharge"
                            type="number"
                            placeholder="0.00"
                            value={charges.lateEarlyCharge === 0 ? '' : charges.lateEarlyCharge}
                            onChange={(e) => updateCharge('lateEarlyCharge', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 6: Taxes & Discount */}
                {currentStep === 5 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Taxes & Discount</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="discountType">Discount Type</Label>
                          <Select
                            value={charges.discountType}
                            onValueChange={(v) => updateCharge('discountType', v)}
                          >
                            <SelectTrigger id="discountType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat Amount ($)</SelectItem>
                              <SelectItem value="percent">Percentage (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="discountAmount">
                            Discount {charges.discountType === 'flat' ? '($)' : '(%)'}
                          </Label>
                          <Input
                            id="discountAmount"
                            type="number"
                            placeholder="0.00"
                            value={charges.discountAmount === 0 ? '' : charges.discountAmount}
                            onChange={(e) => updateCharge('discountAmount', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="stdTax1Percent">Std Tax 1 (%)</Label>
                          <Input
                            id="stdTax1Percent"
                            type="number"
                            placeholder="0.00"
                            value={charges.stdTax1Percent === 0 ? '' : charges.stdTax1Percent}
                            onChange={(e) => updateCharge('stdTax1Percent', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="stateTaxPercent">State Tax (%)</Label>
                          <Input
                            id="stateTaxPercent"
                            type="number"
                            placeholder="0.00"
                            value={charges.stateTaxPercent === 0 ? '' : charges.stateTaxPercent}
                            onChange={(e) => updateCharge('stateTaxPercent', parseFloat(e.target.value) || 0)}
                          />
                        </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 7: Review & Save */}
                {currentStep === 6 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-5 border-l-4 border-blue-500 pl-3">Billing Summary</h3>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                        <div className="grid grid-cols-2 gap-5">
                        <SummaryLine label="Subtotal" value={formatCurrency(totals.subtotal)} />
                        <SummaryLine label="Discount" value={formatCurrency(-totals.discount)} />
                        <SummaryLine label="Gratuity" value={formatCurrency(totals.gratuityAmt)} />
                        <SummaryLine label="Tax" value={formatCurrency(totals.taxAmt)} />
                        <SummaryLine
                          label="TOTAL"
                          value={formatCurrency(totals.total)}
                          bold
                          highlight
                        />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mini Totals Strip */}
        {currentStep < STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-slate-100 bg-slate-50 px-8 py-3 flex items-center gap-4 text-sm"
          >
            <span className="text-slate-500">Subtotal</span>
            <span className="font-mono font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Total</span>
            <span className="font-mono font-semibold text-blue-600">{formatCurrency(totals.total)}</span>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          className="sticky bottom-0 border-t border-slate-200 bg-white px-8 py-4 flex justify-between items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="rounded-2xl"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </motion.div>
          <span className="text-sm text-slate-400 flex-1 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              onClick={currentStep === STEPS.length - 1 ? handleSave : nextStep}
              disabled={!isStepValid() || isSaving}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  {currentStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                  {currentStep === STEPS.length - 1 ? (
                    <Check className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function CalculatedField({
  title,
  qtyValue,
  rateValue,
  onQtyChange,
  onRateChange,
  qtyLabel = "Qty",
}: {
  title: string
  qtyValue: number
  rateValue: number
  onQtyChange: (v: number) => void
  onRateChange: (v: number) => void
  qtyLabel?: string
}) {
  const total = qtyValue * rateValue

  return (
    <motion.div
      className="rounded-lg border border-slate-200 p-4 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h4 className="font-medium text-slate-900">{title}</h4>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">{qtyLabel}</Label>
          <Input
            type="number"
            placeholder="0"
            value={qtyValue === 0 ? '' : qtyValue}
            onChange={(e) => onQtyChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <span className="text-slate-600 font-medium mb-2">×</span>
        <div className="flex-1">
          <Label className="text-xs">Rate ($)</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={rateValue === 0 ? '' : rateValue}
            onChange={(e) => onRateChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <span className="text-slate-600 font-medium mb-2">=</span>
        <div className="flex-1">
          <Label className="text-xs">Total</Label>
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 font-mono text-sm text-right">
            {formatCurrency(total)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SummaryLine({
  label,
  value,
  bold = false,
  highlight = false,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'p-3 rounded-lg',
        highlight && 'bg-blue-50'
      )}
    >
      <p className={cn('text-sm', bold ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
        {label}
      </p>
      <p className={cn('mt-1 font-mono text-lg', bold ? 'text-blue-600' : 'text-slate-900')}>
        {value}
      </p>
    </motion.div>
  )
}
