export type TripStatus =
  | 'UNASSIGNED'
  | 'QUOTE'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type TripType =
  | 'ONE_WAY'
  | 'ROUND_TRIP'
  | 'HOURLY'
  | 'AIRPORT_PICKUP'
  | 'AIRPORT_DROPOFF'
  | 'MULTI_STOP'
  | 'SHUTTLE'

export type VehicleType =
  | 'SEDAN'
  | 'SUV'
  | 'STRETCH_LIMO'
  | 'SPRINTER'
  | 'PARTY_BUS'
  | 'COACH'
  | 'OTHER'

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
export type UserRole = 'OWNER' | 'DISPATCHER' | 'VIEWER'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  logo?: string
  banner?: string
  website?: string
  slug?: string
  about?: string
  affiliateAbout?: string
  clientAbout?: string
  clientVehicleIds?: string[]
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  xUrl?: string
  linkedinUrl?: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface Driver {
  id: string
  name: string
  email?: string
  phone: string
  licenseNumber?: string
  licenseExpiry?: string
  avatarUrl?: string
  licensePhotoFront?: string
  licensePhotoBack?: string
  document1Url?: string
  document1Name?: string
  document2Url?: string
  document2Name?: string
  status: DriverStatus
  notes?: string
  companyId: string
  defaultVehicleId?: string
  defaultVehicle?: Vehicle
  _count?: { trips: number }
  createdAt: string
  updatedAt: string
}

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  capacity: number
  licensePlate?: string
  color?: string
  year?: number
  make?: string
  model?: string
  photoUrl?: string
  photos?: string[]
  status: VehicleStatus
  notes?: string
  hideFromProfile?: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  customerNumber?: string
  name: string
  email?: string
  phone?: string
  company?: string
  isBillingContact?: boolean
  isPassenger?: boolean
  isBookingContact?: boolean
  homeAddress?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  workAddress?: string
  notes?: string
  specialRequests?: string
  driverNotes?: string
  preferredDriverId?: string
  preferredVehicleType?: VehicleType
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface TripStop {
  id: string
  tripId: string
  order: number
  address: string
  lat?: number
  lng?: number
  notes?: string
  arrivalTime?: string
}

export interface TripAttachment {
  id: string
  tripId: string
  companyId: string
  name: string
  url: string
  mimeType: string
  size: number
  storagePath: string
  createdAt: string
}

export interface PendingFile {
  id: string
  file: File
  localUrl: string
  name: string
  mimeType: string
  size: number
}

export interface BillingLineItem {
  id: string
  tab: 'primary' | 'secondary' | 'farmout'
  order: number
  serviceType: string
  description: string
  rate: number
  qty: number
  unit: 'flat' | 'hours' | 'miles' | 'days'
}

export interface BillingAdjustments {
  discountEnabled: boolean
  discountType: 'flat' | 'percent'
  discountAmount: number
  gratuityEnabled: boolean
  gratuityPercent: number
  tollsEnabled: boolean
  tollsAmount: number
  parkingEnabled: boolean
  parkingAmount: number
  miscEnabled: boolean
  miscAmount: number
  miscLabel: string
  taxPercent: number
}

export interface BillingData {
  lineItems: BillingLineItem[]
  adjustments: BillingAdjustments
}

export interface TripPayment {
  id: string
  tripId: string
  companyId: string
  amount: string
  method: string
  notes?: string
  paidAt: string
  createdAt: string
}

export interface Trip {
  id: string
  tripNumber: string
  status: TripStatus
  tripType: TripType
  pickupDate: string
  pickupTime: string
  pickupAddress: string
  pickupLat?: number
  pickupLng?: number
  pickupNotes?: string
  dropoffAddress: string
  dropoffLat?: number
  dropoffLng?: number
  dropoffNotes?: string
  flightNumber?: string
  flightArrival?: string
  flightStatus?: string
  airportCode?: string
  passengerCount: number
  luggageCount?: number
  passengerName?: string
  passengerPhone?: string
  passengerEmail?: string
  additionalPassengers?: Array<{ firstName: string; lastName: string; phone?: string; email?: string }> | null
  driverId?: string
  driver?: Driver
  vehicleType?: VehicleType
  vehicleId?: string
  vehicle?: Vehicle
  secondaryDriverId?: string
  secondaryDriver?: Driver
  secondaryVehicleId?: string
  secondaryVehicle?: Vehicle
  customerId: string
  customer?: Customer
  price?: string
  gratuity?: string
  totalPrice?: string
  pricingNotes?: string
  billingData?: BillingData | null
  meetAndGreet: boolean
  childSeat: boolean
  childSeatDetails?: string
  curbsidePickup: boolean
  vip: boolean
  clientRef?: string
  notes?: string
  internalNotes?: string
  driverEnRouteAt?: string
  driverArrivedAt?: string
  passengerOnBoardAt?: string
  tripCompletedAt?: string
  companyId: string
  stops?: TripStop[]
  attachments?: TripAttachment[]
  payments?: TripPayment[]
  farmOuts?: Array<{
    id: string
    status: FarmOutStatus
    toCompany?: { id: string; name: string }
    fromCompany?: { id: string; name: string }
  }>
  farmedIn?: { id: string; name: string } | null
  agreedPrice?: string | null
  createdById?: string | null
  createdBy?: { id: string; name: string; role: string } | null
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  customerId: string
  customer?: Customer
  tripId?: string
  trip?: Trip
  subtotal: string
  gratuity?: string
  tax?: string
  total: string
  notes?: string
  dueDate?: string
  paidAt?: string
  paymentMethod?: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  tripsToday: number
  inProgress: number
  needsAttention: number
  revenueToday: number
  upcomingTrips: Trip[]
  weeklyTrips: { day: string; count: number }[]
  alerts: Alert[]
}

export interface Alert {
  type: 'warning' | 'error' | 'info'
  message: string
  link?: string
}

// ============ AFFILIATES ============

export type AffiliateConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

/**
 * How the current company relates to another affiliate from their perspective:
 * NONE          – no relationship
 * SENT          – current company sent a request, waiting
 * RECEIVED      – other company sent a request to us, pending response
 * CONNECTED     – request accepted, both are connected
 * DECLINED_BY_ME    – we declined their incoming request
 * DECLINED_BY_THEM  – they declined our outgoing request
 */
export type ConnectionView =
  | 'NONE'
  | 'SENT'
  | 'RECEIVED'
  | 'CONNECTED'
  | 'DECLINED_BY_ME'
  | 'DECLINED_BY_THEM'

export interface AffiliateVehicle {
  id: string
  name: string
  type: string
  year?: number | null
  make?: string | null
  model?: string | null
  photoUrl?: string | null
  photos?: string[]
}

export interface AffiliateProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  logo?: string | null
  banner?: string | null
  city?: string | null
  state?: string | null
  website?: string | null
  about?: string | null
  vehicles?: AffiliateVehicle[]
  createdAt: string
  connectionId?: string
  connectionStatus: ConnectionView
  affiliateCode?: string | null  // LC-XXXXX — only present when CONNECTED
}

export interface AffiliateConnection {
  id: string
  senderId: string
  receiverId: string
  status: AffiliateConnectionStatus
  affiliateCode?: string | null
  sender: AffiliateProfile
  receiver: AffiliateProfile
  createdAt: string
  updatedAt: string
}

// Affiliate search result used in reservation booking
export interface AffiliateSearchResult {
  connectionId: string
  affiliateCode: string | null
  id: string
  name: string
  email: string | null
  phone: string | null
  logo: string | null
  city: string | null
  state: string | null
}

// ============ FARM-OUT / FARM-IN ============

export type FarmOutStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'

export interface FarmOut {
  id: string
  tripId: string
  trip?: Pick<Trip, 'id' | 'tripNumber' | 'pickupDate' | 'pickupTime' | 'pickupAddress' | 'dropoffAddress' | 'passengerCount' | 'vehicleId' | 'price' | 'totalPrice' | 'notes' | 'vip' | 'meetAndGreet' | 'childSeat' | 'curbsidePickup' | 'passengerName' | 'passengerPhone' | 'flightNumber' | 'airportCode' | 'stops'>
  fromCompanyId: string
  fromCompany?: Pick<Company, 'id' | 'name' | 'phone' | 'email' | 'logo' | 'city' | 'state'>
  toCompanyId: string
  toCompany?: Pick<Company, 'id' | 'name' | 'phone' | 'email' | 'logo' | 'city' | 'state'>
  status: FarmOutStatus
  message?: string
  agreedPrice?: string
  vehicleType?: VehicleType
  parentFarmOutId?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export type QuoteRequestStatus = 'NEW' | 'PENDING' | 'ACCEPTED' | 'DECLINED'

// ============ EMAIL SYSTEM ============

export interface SenderEmail {
  id: string
  companyId: string
  email: string
  label?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type EmailRecipientType = 'driver' | 'client' | 'affiliate'
export type PdfDocumentType = 'job_order' | 'reservation'

export interface SendEmailPayload {
  recipientType: EmailRecipientType
  recipientEmail?: string       // override if no email on record
  senderEmailId?: string        // which SenderEmail to use; defaults to company default
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface QuoteRequest {
  id: string
  companyId: string
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  pickupDate: string
  pickupTime?: string | null
  pickupAddress: string
  dropoffAddress: string
  vehicleType?: VehicleType | null
  passengerCount: number
  notes?: string | null
  status: QuoteRequestStatus
  price?: string | null
  tripId?: string | null
  createdAt: string
  updatedAt: string
}
