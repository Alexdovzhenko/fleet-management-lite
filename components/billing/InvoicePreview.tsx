"use client"

import { useMemo } from "react"
import { computeBillingTotals, formatCurrency, type BillingData } from "@/lib/billing-calculations"

interface InvoicePreviewProps {
  billingData: Partial<BillingData>
  trip?: {
    tripNumber: string
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
  }
  company?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
}

export function InvoicePreview({
  billingData,
  trip,
  company,
}: InvoicePreviewProps) {
  const totals = useMemo(() => computeBillingTotals(billingData), [billingData])

  const hasLineItems =
    totals.block1Subtotal > 0 || totals.block2Subtotal > 0 || totals.block3Subtotal > 0

  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-xl overflow-hidden">
      {/* Invoice Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col min-h-full">
          {/* Invoice Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-200">
            <div className="flex items-start justify-between mb-6">
              {/* Company Logo & Name */}
              <div className="flex items-center gap-4">
                {company?.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="h-14 w-auto object-contain"
                  />
                ) : (
                  <div className="h-14 w-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xl">
                    {company?.name?.charAt(0) || "C"}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {company?.name || "Company Name"}
                  </h1>
                </div>
              </div>

              {/* Invoice Number */}
              <div className="text-right">
                <div className="text-sm text-slate-500 font-medium">INVOICE</div>
                <div className="text-xl font-bold text-slate-900">
                  INV-{trip?.tripNumber || "0000"}
                </div>
                <div className="text-xs text-slate-500 mt-2">{invoiceDate}</div>
              </div>
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold text-slate-900 mb-2">FROM</div>
                <div className="text-slate-600 space-y-1">
                  {company?.address && <div>{company.address}</div>}
                  {company?.phone && <div>{company.phone}</div>}
                  {company?.email && <div>{company.email}</div>}
                </div>
              </div>

              {/* Bill To */}
              <div className="text-right">
                <div className="font-semibold text-slate-900 mb-2">BILL TO</div>
                <div className="text-slate-600 space-y-1">
                  {trip?.passengerName && <div>{trip.passengerName}</div>}
                  {trip?.passengerEmail && <div className="text-xs">{trip.passengerEmail}</div>}
                  {trip?.passengerPhone && <div className="text-xs">{trip.passengerPhone}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          {hasLineItems ? (
            <div className="px-8 py-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 font-semibold text-slate-900">
                      Description
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-slate-900 w-16">
                      Qty
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-900 w-24">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-900 w-24">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Block 1 Items */}
                  {(billingData.flatRate || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">Base Rate</td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.flatRate || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.flatRate || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.perHourQty || 0) > 0 && (billingData.perHourRate || 0) > 0 ? (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-3 text-slate-700">Per Hour</td>
                        <td className="text-center py-3 px-3">{billingData.perHourQty || 0}</td>
                        <td className="text-right py-3 px-3 font-mono">
                          {formatCurrency(billingData.perHourRate || 0)}
                        </td>
                        <td className="text-right py-3 px-3 font-mono font-semibold">
                          {formatCurrency((billingData.perHourQty || 0) * (billingData.perHourRate || 0))}
                        </td>
                      </tr>
                    ) : null}

                  {(billingData.travelTimeQty || 0) > 0 && (billingData.travelTimeRate || 0) > 0 ? (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-3 text-slate-700">Travel Time</td>
                        <td className="text-center py-3 px-3">{billingData.travelTimeQty || 0}</td>
                        <td className="text-right py-3 px-3 font-mono">
                          {formatCurrency(billingData.travelTimeRate || 0)}
                        </td>
                        <td className="text-right py-3 px-3 font-mono font-semibold">
                          {formatCurrency((billingData.travelTimeQty || 0) * (billingData.travelTimeRate || 0))}
                        </td>
                      </tr>
                    ) : null}

                  {(billingData.waitTimeQty || 0) > 0 && (billingData.waitTimeRate || 0) > 0 ? (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-3 text-slate-700">Wait Time</td>
                        <td className="text-center py-3 px-3">{billingData.waitTimeQty || 0}</td>
                        <td className="text-right py-3 px-3 font-mono">
                          {formatCurrency(billingData.waitTimeRate || 0)}
                        </td>
                        <td className="text-right py-3 px-3 font-mono font-semibold">
                          {formatCurrency((billingData.waitTimeQty || 0) * (billingData.waitTimeRate || 0))}
                        </td>
                      </tr>
                    ) : null}

                  {(billingData.extraStopsQty || 0) > 0 && (billingData.extraStopsRate || 0) > 0 ? (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-3 text-slate-700">Extra Stops</td>
                        <td className="text-center py-3 px-3">{billingData.extraStopsQty || 0}</td>
                        <td className="text-right py-3 px-3 font-mono">
                          {formatCurrency(billingData.extraStopsRate || 0)}
                        </td>
                        <td className="text-right py-3 px-3 font-mono font-semibold">
                          {formatCurrency((billingData.extraStopsQty || 0) * (billingData.extraStopsRate || 0))}
                        </td>
                      </tr>
                    ) : null}

                  {(billingData.airportFee || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">Airport Fee</td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.airportFee || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.airportFee || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.parkingFee || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">Parking Fee</td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.parkingFee || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.parkingFee || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.meetAndGreet || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">Meet & Greet</td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.meetAndGreet || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.meetAndGreet || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.carSeatQty || 0) > 0 && (billingData.carSeatRate || 0) > 0 ? (
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-3 text-slate-700">Car Seat</td>
                        <td className="text-center py-3 px-3">{billingData.carSeatQty || 0}</td>
                        <td className="text-right py-3 px-3 font-mono">
                          {formatCurrency(billingData.carSeatRate || 0)}
                        </td>
                        <td className="text-right py-3 px-3 font-mono font-semibold">
                          {formatCurrency((billingData.carSeatQty || 0) * (billingData.carSeatRate || 0))}
                        </td>
                      </tr>
                    ) : null}

                  {(billingData.lateEarlyCharge || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">Late/Early Charge</td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.lateEarlyCharge || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.lateEarlyCharge || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {/* Block 2 Additional Charges */}
                  {(billingData.miscFee1Amount || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">
                        {billingData.miscFee1Label || "Misc Fee 1"}
                      </td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.miscFee1Amount || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.miscFee1Amount || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.miscFee2Amount || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">
                        {billingData.miscFee2Label || "Misc Fee 2"}
                      </td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.miscFee2Amount || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.miscFee2Amount || 0)}
                      </td>
                    </tr>
                  ) : null}

                  {(billingData.miscFee3Amount || 0) > 0 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-700">
                        {billingData.miscFee3Label || "Misc Fee 3"}
                      </td>
                      <td className="text-center py-3 px-3">1</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatCurrency(billingData.miscFee3Amount || 0)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono font-semibold">
                        {formatCurrency(billingData.miscFee3Amount || 0)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8 py-12">
              <div>
                <div className="text-lg font-semibold text-slate-600 mb-2">No charges added yet</div>
                <div className="text-sm text-slate-500 mb-4">Add your first charge on the left to build your invoice →</div>
                <div className="text-xs text-slate-400">Your invoice will appear here once you add charges</div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {hasLineItems && (
            <div className="px-8 py-6 border-t border-slate-200 mt-auto">
              <div className="space-y-3 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {/* Discount */}
                {totals.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({billingData.discountPct}%)</span>
                    <span className="font-mono font-semibold">
                      -{formatCurrency(totals.discount)}
                    </span>
                  </div>
                )}

                {/* Gratuity */}
                {totals.gratuity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gratuity ({billingData.gratuityPct}%)</span>
                    <span className="font-mono font-semibold text-slate-900">
                      +{formatCurrency(totals.gratuity)}
                    </span>
                  </div>
                )}

                {/* Credit Card Fee */}
                {totals.creditCardFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Credit Card Fee ({billingData.creditCardFeePct}%)
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      +{formatCurrency(totals.creditCardFee)}
                    </span>
                  </div>
                )}

                {/* Farm-out Total */}
                {totals.farmOutTotal > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Farm-out Costs</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(totals.farmOutTotal)}
                    </span>
                  </div>
                )}

                {/* Total Due */}
                <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-4 mt-2">
                  <span className="text-slate-900">TOTAL DUE</span>
                  <span className="font-mono text-slate-900">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
