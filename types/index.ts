export type TripStatus =
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
  status: DriverStatus
  notes?: string
  companyId: string
  defaultVehicleId?: string
  defaultVehicle?: Vehicle
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
  status: VehicleStatus
  notes?: string
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
  driverId?: string
  driver?: Driver
  vehicleId?: string
  vehicle?: Vehicle
  customerId: string
  customer?: Customer
  price?: string
  gratuity?: string
  totalPrice?: string
  pricingNotes?: string
  meetAndGreet: boolean
  childSeat: boolean
  childSeatDetails?: string
  wheelchairAccess: boolean
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
