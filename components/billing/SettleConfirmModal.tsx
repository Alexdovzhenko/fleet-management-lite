"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Invoice } from "@/types"

interface SettleConfirmModalProps {
  isOpen: boolean
  invoice: Invoice | null
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SettleConfirmModal({
  isOpen,
  invoice,
  isLoading,
  onConfirm,
  onCancel,
}: SettleConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl p-6 max-w-sm w-[90vw]"
          >
            <div className="space-y-4">
              {invoice && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Mark invoice as settled?
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Invoice <span className="font-medium">{invoice.invoiceNumber}</span>{" "}
                      for <span className="font-medium">{invoice.customer?.name}</span> will be marked as settled and moved to the Settled tab.
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    This indicates the invoice has been paid.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onCancel}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">◌</span>
                          Settling...
                        </>
                      ) : (
                        "Mark as Settled"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
