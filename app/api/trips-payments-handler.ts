// This is a helper file - payments are handled by updating trips via billingData
// For now, we store payments in a separate TripPayment table and sync through the main trip routes

export const paymentsNote = "Use /api/trips/[tripId] with billingData for payments integration"
