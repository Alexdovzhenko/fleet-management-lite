import { BillingScreen } from "@/components/billing/BillingScreen"

export const metadata = {
  title: "Billing",
}

export default function BillingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage invoices and track payment status
        </p>
      </div>
      <BillingScreen />
    </div>
  )
}
