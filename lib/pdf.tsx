// This file runs only on the server (Next.js API routes).
// @react-pdf/renderer uses its own reconciler and must never be imported client-side.

import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer"

// ─── Data shapes ─────────────────────────────────────────────────────────────

export interface PdfCompanyBranding {
  name: string
  logo?: string | null     // URL
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  email?: string | null
}

export interface PdfTripData {
  tripNumber: string
  status: string
  tripType: string
  pickupDate: string      // formatted display string e.g. "Mon, Jun 16 2025"
  pickupTime: string      // formatted display string e.g. "10:30 AM"
  pickupAddress: string
  pickupNotes?: string | null
  dropoffAddress: string
  dropoffNotes?: string | null
  passengerName?: string | null
  passengerPhone?: string | null
  passengerEmail?: string | null
  passengerCount: number
  luggageCount?: number | null
  flightNumber?: string | null
  airportCode?: string | null
  driverName?: string | null
  driverPhone?: string | null
  vehicleType?: string | null
  vehicleName?: string | null
  meetAndGreet: boolean
  childSeat: boolean
  curbsidePickup: boolean
  vip: boolean
  notes?: string | null
  internalNotes?: string | null
  price?: string | null
  gratuity?: string | null
  totalPrice?: string | null
  clientRef?: string | null
  stops?: Array<{ order: number; address: string; notes?: string | null }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTripType(t: string) {
  const map: Record<string, string> = {
    ONE_WAY: "One-Way", ROUND_TRIP: "Round-Trip", HOURLY: "Hourly",
    AIRPORT_PICKUP: "Airport Pickup", AIRPORT_DROPOFF: "Airport Drop-Off",
    MULTI_STOP: "Multi-Stop", SHUTTLE: "Shuttle",
  }
  return map[t] ?? t
}

function formatVehicleType(t: string) {
  const map: Record<string, string> = {
    SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limousine",
    SPRINTER: "Sprinter Van", PARTY_BUS: "Party Bus",
    COACH: "Motor Coach", OTHER: "Other",
  }
  return map[t] ?? t
}

function formatPhoneNumber(phone?: string | null): string | null {
  if (!phone) return null
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Format as (XXX) XXX-XXXX if it's 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  // Return original if not 10 digits
  return phone
}

// ─── DRIVER JOB ORDER PDF ────────────────────────────────────────────────────

const JO = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", backgroundColor: "#ffffff" },
  header:      { backgroundColor: "#0f172a", padding: "16 24 16 24", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#ffffff", fontSize: 15, fontFamily: "Helvetica-Bold" },
  headerBadge: { backgroundColor: "#1e3a8a", borderRadius: 3, padding: "3 8" },
  headerBadgeTxt: { color: "#93c5fd", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  body:        { padding: "20 24" },
  confirmRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 },
  confirmLabel:{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 },
  confirmNum:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a", letterSpacing: 2 },
  dateBadge:   { backgroundColor: "#f0f9ff", borderRadius: 6, border: "1 solid #bae6fd", padding: "6 12", alignItems: "center" },
  dateMain:    { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0369a1" },
  dateTime:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0284c7", marginTop: 2 },
  divider:     { borderBottom: "1 solid #e2e8f0", marginVertical: 14 },
  sectionLabel:{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  row2:        { flexDirection: "row", gap: 16 },
  col:         { flex: 1 },
  card:        { backgroundColor: "#f8fafc", borderRadius: 6, border: "1 solid #e2e8f0", padding: "10 14", marginBottom: 12 },
  cardIcon:    { fontSize: 8, color: "#64748b", marginBottom: 4, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1 },
  cardAddr:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: 1.4 },
  cardNote:    { fontSize: 8.5, color: "#64748b", marginTop: 4, lineHeight: 1.4 },
  pilsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  pil:         { backgroundColor: "#f1f5f9", borderRadius: 4, padding: "3 8", flexDirection: "row", alignItems: "center" },
  pilTxt:      { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569" },
  accent:      { backgroundColor: "#fef3c7", border: "1 solid #fde68a" },
  accentTxt:   { color: "#92400e" },
  notesBox:    { backgroundColor: "#fffbeb", border: "1 solid #fde68a", borderRadius: 6, padding: "10 14", marginTop: 4 },
  notesTxt:    { fontSize: 9, color: "#78350f", lineHeight: 1.5 },
  footer:      { backgroundColor: "#0f172a", padding: "10 24", flexDirection: "row", justifyContent: "space-between", alignItems: "center", position: "absolute", bottom: 0, left: 0, right: 0 },
  footerTxt:   { color: "#64748b", fontSize: 7.5 },
})

function DriverJobOrderDoc({ trip, company }: { trip: PdfTripData; company: PdfCompanyBranding }) {
  const services = [
    trip.vip          && "VIP",
    trip.meetAndGreet && "Meet & Greet",
    trip.childSeat    && "Child Seat",
    trip.curbsidePickup && "Wheelchair",
  ].filter(Boolean) as string[]

  return (
    <Document title={`Job Order ${trip.tripNumber}`} author={company.name}>
      <Page size="LETTER" style={JO.page}>

        {/* Header */}
        <View style={JO.header}>
          <Text style={JO.headerTitle}>{company.name}</Text>
          <View style={JO.headerBadge}>
            <Text style={JO.headerBadgeTxt}>JOB ORDER</Text>
          </View>
        </View>

        <View style={JO.body}>
          {/* Confirmation + Date */}
          <View style={JO.confirmRow}>
            <View>
              <Text style={JO.confirmLabel}>Trip Number</Text>
              <Text style={JO.confirmNum}>{trip.tripNumber}</Text>
              <Text style={{ fontSize: 8.5, color: "#64748b", marginTop: 3 }}>{formatTripType(trip.tripType)}</Text>
            </View>
            <View style={JO.dateBadge}>
              <Text style={JO.dateMain}>{trip.pickupDate}</Text>
              <Text style={JO.dateTime}>{trip.pickupTime}</Text>
            </View>
          </View>

          <View style={JO.divider} />

          {/* Locations */}
          <Text style={JO.sectionLabel}>Route</Text>
          <View style={JO.card}>
            <Text style={JO.cardIcon}>↑  Pickup</Text>
            <Text style={JO.cardAddr}>{trip.pickupAddress}</Text>
            {trip.flightNumber && (
              <Text style={JO.cardNote}>Flight: {trip.flightNumber}{trip.airportCode ? ` · ${trip.airportCode}` : ""}</Text>
            )}
            {trip.pickupNotes && <Text style={JO.cardNote}>Note: {trip.pickupNotes}</Text>}
          </View>

          {/* Multi-stop stops */}
          {trip.stops && trip.stops.length > 2 && trip.stops.slice(1, -1).map((stop) => (
            <View key={stop.order} style={[JO.card, { marginBottom: 8 }]}>
              <Text style={JO.cardIcon}>◆  Stop {stop.order}</Text>
              <Text style={JO.cardAddr}>{stop.address}</Text>
              {stop.notes && <Text style={JO.cardNote}>Note: {stop.notes}</Text>}
            </View>
          ))}

          <View style={[JO.card, { marginBottom: 16 }]}>
            <Text style={JO.cardIcon}>↓  Drop-off</Text>
            <Text style={JO.cardAddr}>{trip.dropoffAddress}</Text>
            {trip.dropoffNotes && <Text style={JO.cardNote}>Note: {trip.dropoffNotes}</Text>}
          </View>

          <View style={JO.divider} />

          {/* Passenger + Vehicle */}
          <View style={JO.row2}>
            <View style={JO.col}>
              <Text style={JO.sectionLabel}>Passenger</Text>
              <View style={JO.card}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>
                  {trip.passengerName || "Not specified"}
                </Text>
                <Text style={{ fontSize: 8.5, color: "#64748b", marginBottom: 2 }}>
                  {trip.passengerCount} pax{trip.luggageCount ? ` · ${trip.luggageCount} bags` : ""}
                </Text>
                {trip.passengerPhone && (
                  <Text style={{ fontSize: 8.5, color: "#3b82f6" }}>{trip.passengerPhone}</Text>
                )}
              </View>
            </View>
            <View style={JO.col}>
              <Text style={JO.sectionLabel}>Vehicle</Text>
              <View style={JO.card}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>
                  {trip.vehicleName ?? (trip.vehicleType ? formatVehicleType(trip.vehicleType) : "Not assigned")}
                </Text>
                {trip.vehicleType && trip.vehicleName && (
                  <Text style={{ fontSize: 8.5, color: "#64748b" }}>{formatVehicleType(trip.vehicleType)}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Special services */}
          {services.length > 0 && (
            <>
              <Text style={[JO.sectionLabel, { marginTop: 4 }]}>Special Services</Text>
              <View style={JO.pilsRow}>
                {services.map((s) => (
                  <View key={s} style={[JO.pil, JO.accent]}>
                    <Text style={[JO.pilTxt, JO.accentTxt]}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Client ref */}
          {trip.clientRef && (
            <Text style={{ fontSize: 8.5, color: "#64748b", marginBottom: 10 }}>Client Ref: {trip.clientRef}</Text>
          )}

          {/* Trip notes */}
          {trip.notes && (
            <>
              <Text style={[JO.sectionLabel, { marginTop: 4 }]}>Notes</Text>
              <View style={JO.notesBox}>
                <Text style={JO.notesTxt}>{trip.notes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={JO.footer} fixed>
          <Text style={JO.footerTxt}>{company.name}{company.phone ? ` · ${company.phone}` : ""}</Text>
          <Text style={JO.footerTxt}>Job Order · For Driver Use Only</Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── CLIENT / AFFILIATE RESERVATION PDF ──────────────────────────────────────

const RP = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", backgroundColor: "#ffffff" },
  header:       { backgroundColor: "#1e3a8a", padding: "20 28 20 28" },
  headerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoBox:      { width: 52, height: 52, borderRadius: 8, backgroundColor: "#1e40af", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  companyBlock: { flex: 1, marginLeft: 14 },
  companyName:  { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 4 },
  companyMeta:  { fontSize: 8, color: "#93c5fd", lineHeight: 1.7 },
  docTitle:     { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#bfdbfe", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 14 },
  body:         { padding: "22 28" },
  confirmBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  confirmLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 },
  confirmNum:   { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#1e3a8a", letterSpacing: 2 },
  statusBadge:  { borderRadius: 20, padding: "4 10", backgroundColor: "#dcfce7" },
  statusTxt:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#166534", letterSpacing: 0.5 },
  sectionHead:  { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 16 },
  sectionLine:  { flex: 1, borderBottom: "1 solid #e2e8f0" },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginHorizontal: 0, marginBottom: 0, paddingRight: 10 },
  row2:         { flexDirection: "row", gap: 14 },
  col:          { flex: 1 },
  fieldLabel:   { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  fieldValue:   { fontSize: 10, color: "#0f172a", lineHeight: 1.4 },
  fieldValueBold:{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: 1.4 },
  locCard:      { backgroundColor: "#f8fafc", borderRadius: 6, border: "1 solid #e2e8f0", padding: "10 14" },
  locType:      { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  locAddr:      { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: 1.4 },
  locNote:      { fontSize: 8.5, color: "#64748b", marginTop: 4, lineHeight: 1.4 },
  pricingBox:   { backgroundColor: "#f8fafc", borderRadius: 8, border: "1 solid #e2e8f0", padding: "14 16", marginTop: 8 },
  priceRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  priceLabel:   { fontSize: 9, color: "#64748b" },
  priceAmt:     { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTop: "1 solid #e2e8f0", paddingTop: 8, marginTop: 4 },
  totalLabel:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  totalAmt:     { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  pilsRow:      { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  pil:          { borderRadius: 4, border: "1 solid #e2e8f0", padding: "3 10", backgroundColor: "#f1f5f9" },
  pilTxt:       { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569" },
  notesBox:     { backgroundColor: "#fffbeb", border: "1 solid #fde68a", borderRadius: 6, padding: "10 14", marginTop: 4 },
  notesTxt:     { fontSize: 9, color: "#78350f", lineHeight: 1.6 },
  footer:       { backgroundColor: "#f8fafc", borderTop: "1 solid #e2e8f0", padding: "12 28", flexDirection: "row", justifyContent: "space-between", position: "absolute", bottom: 0, left: 0, right: 0 },
  footerLeft:   { fontSize: 7.5, color: "#94a3b8" },
  footerRight:  { fontSize: 7.5, color: "#94a3b8" },
})

function ReservationDoc({ trip, company, isAffiliate = false }: { trip: PdfTripData; company: PdfCompanyBranding; isAffiliate?: boolean }) {
  const services = [
    trip.vip          && "VIP",
    trip.meetAndGreet && "Meet & Greet",
    trip.childSeat    && "Child Seat",
    trip.curbsidePickup && "Wheelchair Accessible",
  ].filter(Boolean) as string[]

  const companyAddress = [company.address, company.city, company.state, company.zip].filter(Boolean).join(", ")

  return (
    <Document title={`Reservation ${trip.tripNumber}`} author={company.name}>
      <Page size="LETTER" style={RP.page}>

        {/* Header */}
        <View style={RP.header}>
          <View style={RP.headerTop}>
            {company.logo ? (
              <View style={RP.logoBox}>
                <Image src={company.logo} style={{ width: 52, height: 52, objectFit: "cover" }} />
              </View>
            ) : (
              <View style={[RP.logoBox, { backgroundColor: "#2563eb" }]}>
                <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
                  {company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={RP.companyBlock}>
              <Text style={RP.companyName}>{company.name}</Text>
              <Text style={RP.companyMeta}>
                {[companyAddress, company.phone, company.email, company.website].filter(Boolean).join("  ·  ")}
              </Text>
            </View>
          </View>
          <Text style={RP.docTitle}>
            {isAffiliate ? "Affiliate Reservation Details" : "Reservation Confirmation"}
          </Text>
        </View>

        <View style={RP.body}>
          {/* Confirmation number + status */}
          <View style={RP.confirmBlock}>
            <View>
              <Text style={RP.confirmLabel}>Confirmation Number</Text>
              <Text style={RP.confirmNum}>{trip.tripNumber}</Text>
              {trip.clientRef && (
                <Text style={{ fontSize: 8.5, color: "#64748b", marginTop: 3 }}>Client Ref: {trip.clientRef}</Text>
              )}
            </View>
            <View style={RP.statusBadge}>
              <Text style={RP.statusTxt}>{trip.status.replace(/_/g, " ")}</Text>
            </View>
          </View>

          {/* Trip Info */}
          <Text style={RP.sectionTitle}>Trip Details</Text>
          <View style={[RP.row2, { marginBottom: 14 }]}>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Date</Text>
              <Text style={RP.fieldValueBold}>{trip.pickupDate}</Text>
            </View>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Pickup Time</Text>
              <Text style={RP.fieldValueBold}>{trip.pickupTime}</Text>
            </View>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Service Type</Text>
              <Text style={RP.fieldValue}>{formatTripType(trip.tripType)}</Text>
            </View>
          </View>

          {/* Locations */}
          <View style={[RP.row2, { marginBottom: 16 }]}>
            <View style={[RP.locCard, RP.col]}>
              <Text style={RP.locType}>↑  Pickup</Text>
              <Text style={RP.locAddr}>{trip.pickupAddress}</Text>
              {trip.flightNumber && (
                <Text style={RP.locNote}>Flight: {trip.flightNumber}{trip.airportCode ? ` · ${trip.airportCode}` : ""}</Text>
              )}
              {trip.pickupNotes && <Text style={RP.locNote}>{trip.pickupNotes}</Text>}
            </View>
            <View style={[RP.locCard, RP.col]}>
              <Text style={RP.locType}>↓  Drop-off</Text>
              <Text style={RP.locAddr}>{trip.dropoffAddress}</Text>
              {trip.dropoffNotes && <Text style={RP.locNote}>{trip.dropoffNotes}</Text>}
            </View>
          </View>

          {/* Passenger */}
          <Text style={RP.sectionTitle}>Passenger Information</Text>
          <View style={[RP.row2, { marginBottom: 16 }]}>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Name</Text>
              <Text style={RP.fieldValueBold}>{trip.passengerName || "Not specified"}</Text>
            </View>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Passengers</Text>
              <Text style={RP.fieldValue}>{trip.passengerCount} passenger{trip.passengerCount !== 1 ? "s" : ""}{trip.luggageCount ? `, ${trip.luggageCount} bags` : ""}</Text>
            </View>
            {!isAffiliate && (
              <View style={RP.col}>
                <Text style={RP.fieldLabel}>Contact</Text>
                {trip.passengerPhone && <Text style={RP.fieldValue}>{trip.passengerPhone}</Text>}
                {trip.passengerEmail && <Text style={{ fontSize: 9, color: "#3b82f6" }}>{trip.passengerEmail}</Text>}
              </View>
            )}
          </View>

          {/* Vehicle */}
          <Text style={RP.sectionTitle}>Vehicle & Driver</Text>
          <View style={[RP.row2, { marginBottom: 16 }]}>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Vehicle</Text>
              <Text style={RP.fieldValueBold}>{trip.vehicleName ?? (trip.vehicleType ? formatVehicleType(trip.vehicleType) : "To be assigned")}</Text>
              {trip.vehicleType && trip.vehicleName && (
                <Text style={{ fontSize: 8.5, color: "#64748b", marginTop: 2 }}>{formatVehicleType(trip.vehicleType)}</Text>
              )}
            </View>
            <View style={RP.col}>
              <Text style={RP.fieldLabel}>Driver</Text>
              <Text style={RP.fieldValueBold}>{trip.driverName ?? "To be assigned"}</Text>
              {trip.driverPhone && <Text style={{ fontSize: 8.5, color: "#3b82f6", marginTop: 2 }}>{trip.driverPhone}</Text>}
            </View>
          </View>

          {/* Pricing — only for client (not affiliate) */}
          {!isAffiliate && (trip.price || trip.totalPrice) && (
            <>
              <Text style={RP.sectionTitle}>Pricing</Text>
              <View style={RP.pricingBox}>
                {trip.price && (
                  <View style={RP.priceRow}>
                    <Text style={RP.priceLabel}>Base Rate</Text>
                    <Text style={RP.priceAmt}>${parseFloat(trip.price).toFixed(2)}</Text>
                  </View>
                )}
                {trip.gratuity && (
                  <View style={RP.priceRow}>
                    <Text style={RP.priceLabel}>Gratuity</Text>
                    <Text style={RP.priceAmt}>${parseFloat(trip.gratuity).toFixed(2)}</Text>
                  </View>
                )}
                {trip.totalPrice && (
                  <View style={RP.totalRow}>
                    <Text style={RP.totalLabel}>Total</Text>
                    <Text style={RP.totalAmt}>${parseFloat(trip.totalPrice).toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Special services */}
          {services.length > 0 && (
            <>
              <Text style={[RP.sectionTitle, { marginTop: 14 }]}>Special Services</Text>
              <View style={RP.pilsRow}>
                {services.map((s) => (
                  <View key={s} style={RP.pil}>
                    <Text style={RP.pilTxt}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Notes */}
          {trip.notes && (
            <>
              <Text style={[RP.sectionTitle, { marginTop: 14 }]}>Notes</Text>
              <View style={RP.notesBox}>
                <Text style={RP.notesTxt}>{trip.notes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={RP.footer} fixed>
          <Text style={RP.footerLeft}>{company.name}{company.phone ? ` · ${company.phone}` : ""}{company.website ? ` · ${company.website}` : ""}</Text>
          <Text style={RP.footerRight}>Generated by Livery Connect</Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── Public generators ───────────────────────────────────────────────────────

export async function generateDriverJobOrderPdf(trip: PdfTripData, company: PdfCompanyBranding): Promise<Buffer> {
  return renderToBuffer(<DriverJobOrderDoc trip={trip} company={company} />)
}

export async function generateReservationPdf(trip: PdfTripData, company: PdfCompanyBranding, isAffiliate = false): Promise<Buffer> {
  return renderToBuffer(<ReservationDoc trip={trip} company={company} isAffiliate={isAffiliate} />)
}

// ─── INVOICE PDF ────────────────────────────────────────────────────────────────

export interface PdfInvoiceLineItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
}

export interface PdfInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  billTo: {
    name: string
    email?: string
    phone?: string
  }
  company: {
    name: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
  lineItems: PdfInvoiceLineItem[]
  summary: {
    subtotal: number
    farmOutTotal: number
    discount: number
    creditCardFee: number
    gratuity: number
    subtotalWithAdjustments: number
    tax: number
    total: number
  }
  paymentTerms: string
  footerNote?: string
}

const INV = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", backgroundColor: "#ffffff" },
  header: { padding: "24 32", borderBottom: "1 solid #e2e8f0" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  logoArea: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 16 },
  logoText: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 },
  companyDetail: { fontSize: 9, color: "#64748b", lineHeight: 1.4, marginBottom: 2 },
  invoiceNumber: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  invoiceDate: { fontSize: 9, color: "#64748b" },
  billToSection: { marginTop: 16, paddingTop: 16, borderTop: "1 solid #e2e8f0" },
  billToLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  billToDetail: { fontSize: 9, color: "#64748b", lineHeight: 1.4 },
  body: { padding: "24 32" },
  lineItemsTable: { marginBottom: 24 },
  tableHeader: { flexDirection: "row", borderBottom: "2 solid #e2e8f0", paddingBottom: 8, marginBottom: 8 },
  headerCell: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  descCol: { flex: 2 },
  qtyCol: { flex: 0.8, textAlign: "right" },
  priceCol: { flex: 1, textAlign: "right" },
  amountCol: { flex: 1, textAlign: "right" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "1 solid #f1f5f9" },
  descCell: { flex: 2, fontSize: 10, color: "#0f172a", lineHeight: 1.4 },
  qtyCell: { flex: 0.8, fontSize: 10, color: "#0f172a", textAlign: "right" },
  priceCell: { flex: 1, fontSize: 10, color: "#0f172a", textAlign: "right" },
  amountCell: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  summarySection: { marginLeft: "auto", marginTop: 16, width: "40%", paddingLeft: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: "1 solid #f1f5f9" },
  summaryLabel: { fontSize: 9, color: "#64748b" },
  summaryValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTop: "2 solid #e2e8f0", marginTop: 8 },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  totalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  footer: { padding: "16 32", borderTop: "1 solid #e2e8f0" },
  paymentTerms: { fontSize: 9, color: "#64748b", marginBottom: 8 },
  footerNote: { fontSize: 8, color: "#94a3b8", fontStyle: "italic" },
})

function InvoiceDoc({ invoice }: { invoice: PdfInvoiceData }) {
  const farmOutTotal = invoice.summary.farmOutTotal || 0
  const hasAdjustments = farmOutTotal > 0 || invoice.summary.discount > 0 || invoice.summary.creditCardFee > 0 || invoice.summary.gratuity > 0

  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`} author={invoice.company.name}>
      <Page size="LETTER" style={INV.page}>
        {/* Header */}
        <View style={INV.header}>
          <View style={INV.headerTop}>
            {/* Company info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row" }}>
                <View style={INV.logoArea}>
                  {invoice.company.logoUrl ? (
                    <Image src={invoice.company.logoUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <Text style={INV.logoText}>{invoice.company.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={INV.companyInfo}>
                  <Text style={INV.companyName}>{invoice.company.name}</Text>
                  {invoice.company.address && <Text style={INV.companyDetail}>{invoice.company.address}</Text>}
                  {invoice.company.phone && <Text style={INV.companyDetail}>{invoice.company.phone}</Text>}
                  {invoice.company.email && <Text style={INV.companyDetail}>{invoice.company.email}</Text>}
                </View>
              </View>
            </View>

            {/* Invoice details */}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={INV.invoiceNumber}>Invoice {invoice.invoiceNumber}</Text>
              <Text style={INV.invoiceDate}>{invoice.invoiceDate}</Text>
            </View>
          </View>

          {/* Bill To */}
          <View style={INV.billToSection}>
            <Text style={INV.billToLabel}>Bill To</Text>
            <Text style={INV.billToName}>{invoice.billTo.name}</Text>
            {invoice.billTo.email && <Text style={INV.billToDetail}>{invoice.billTo.email}</Text>}
            {invoice.billTo.phone && <Text style={INV.billToDetail}>{formatPhoneNumber(invoice.billTo.phone)}</Text>}
          </View>
        </View>

        {/* Body */}
        <View style={INV.body}>
          {/* Line Items Table */}
          <View style={INV.lineItemsTable}>
            <View style={INV.tableHeader}>
              <Text style={[INV.headerCell, INV.descCol]}>Description</Text>
              <Text style={[INV.headerCell, INV.qtyCol]}>Qty</Text>
              <Text style={[INV.headerCell, INV.priceCol]}>Unit Price</Text>
              <Text style={[INV.headerCell, INV.amountCol]}>Amount</Text>
            </View>

            {/* Primary charges */}
            {invoice.lineItems.map((item, idx) => (
              <View key={idx} style={INV.tableRow}>
                <Text style={INV.descCell}>{item.description}</Text>
                <Text style={INV.qtyCell}>{item.qty}</Text>
                <Text style={INV.priceCell}>${item.unitPrice.toFixed(2)}</Text>
                <Text style={INV.amountCell}>${item.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Summary section */}
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }} />
            <View style={INV.summarySection}>
              {/* Subtotal */}
              <View style={INV.summaryRow}>
                <Text style={INV.summaryLabel}>Subtotal</Text>
                <Text style={INV.summaryValue}>${invoice.summary.subtotal.toFixed(2)}</Text>
              </View>

              {/* Discount */}
              {invoice.summary.discount > 0 && (
                <View style={INV.summaryRow}>
                  <Text style={INV.summaryLabel}>Discount</Text>
                  <Text style={INV.summaryValue}>-${invoice.summary.discount.toFixed(2)}</Text>
                </View>
              )}

              {/* Gratuity */}
              {invoice.summary.gratuity > 0 && (
                <View style={INV.summaryRow}>
                  <Text style={INV.summaryLabel}>Gratuity</Text>
                  <Text style={INV.summaryValue}>${invoice.summary.gratuity.toFixed(2)}</Text>
                </View>
              )}

              {/* Credit Card Fee */}
              {invoice.summary.creditCardFee > 0 && (
                <View style={INV.summaryRow}>
                  <Text style={INV.summaryLabel}>Credit Card Fee</Text>
                  <Text style={INV.summaryValue}>${invoice.summary.creditCardFee.toFixed(2)}</Text>
                </View>
              )}

              {/* Farm-out Total */}
              {farmOutTotal > 0 && (
                <View style={INV.summaryRow}>
                  <Text style={INV.summaryLabel}>Farm-Out Cost</Text>
                  <Text style={INV.summaryValue}>${farmOutTotal.toFixed(2)}</Text>
                </View>
              )}

              {/* Tax */}
              {invoice.summary.tax > 0 && (
                <View style={INV.summaryRow}>
                  <Text style={INV.summaryLabel}>Tax</Text>
                  <Text style={INV.summaryValue}>${invoice.summary.tax.toFixed(2)}</Text>
                </View>
              )}

              {/* Total */}
              <View style={INV.totalRow}>
                <Text style={INV.totalLabel}>TOTAL DUE</Text>
                <Text style={INV.totalValue}>${invoice.summary.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Payment terms and footer note */}
          <View style={{ marginTop: 32, paddingTop: 16, borderTop: "1 solid #e2e8f0" }}>
            <Text style={INV.paymentTerms}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment Terms: </Text>
              {invoice.paymentTerms}
            </Text>
            {invoice.footerNote && (
              <Text style={[INV.footerNote, { marginTop: 8 }]}>{invoice.footerNote}</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePdf(invoice: PdfInvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDoc invoice={invoice} />)
}
