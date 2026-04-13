"use client"

import { computeBillingTotals, type BillingData } from "@/lib/billing-calculations"
import { Block1PrimaryCharges } from "./Block1PrimaryCharges"
import { Block2AdditionalCharges } from "./Block2AdditionalCharges"
import { Block3FarmOutCosts } from "./Block3FarmOutCosts"
import { useMemo } from "react"

interface BillingFormBlocksProps {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
}

export function BillingFormBlocks({ data, onChange }: BillingFormBlocksProps) {
  const totals = useMemo(() => computeBillingTotals(data), [data])

  return (
    <div className="space-y-6">
      {/* Block 1 - Primary Charges */}
      <Block1PrimaryCharges
        data={data}
        onChange={onChange}
        subtotal={totals.block1Subtotal}
      />

      {/* Block 2 - Additional Charges */}
      <Block2AdditionalCharges
        data={data}
        onChange={onChange}
        subtotal={totals.block2Subtotal}
      />

      {/* Block 3 - Farm-out Costs */}
      <Block3FarmOutCosts
        data={data}
        onChange={onChange}
        subtotal={totals.block3Subtotal}
      />
    </div>
  )
}
