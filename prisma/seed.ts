import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Company
  const company = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: {},
    create: {
      id: "demo-company",
      name: "Elite Limo Services",
      email: "dispatch@elitelimo.com",
      phone: "(305) 555-0100",
      address: "1234 Brickell Ave",
      city: "Miami",
      state: "FL",
      zip: "33131",
      timezone: "America/New_York",
    },
  })

  // Drivers
  const mike = await prisma.driver.upsert({
    where: { id: "driver-mike" },
    update: {},
    create: {
      id: "driver-mike",
      name: "Mike Rodriguez",
      email: "mike@elitelimo.com",
      phone: "(305) 555-9876",
      licenseNumber: "D12345678",
      status: "ACTIVE",
      companyId: company.id,
    },
  })

  const sarah = await prisma.driver.upsert({
    where: { id: "driver-sarah" },
    update: {},
    create: {
      id: "driver-sarah",
      name: "Sarah Liu",
      email: "sarah@elitelimo.com",
      phone: "(305) 555-4321",
      licenseNumber: "D87654321",
      status: "ACTIVE",
      companyId: company.id,
    },
  })

  // Vehicles
  const sprinter = await prisma.vehicle.upsert({
    where: { id: "vehicle-sprinter" },
    update: {},
    create: {
      id: "vehicle-sprinter",
      name: "Black Sprinter 1",
      type: "SPRINTER",
      capacity: 14,
      licensePlate: "FLA-7891",
      color: "Black",
      year: 2023,
      make: "Mercedes",
      model: "Sprinter",
      status: "ACTIVE",
      companyId: company.id,
    },
  })

  const sedan = await prisma.vehicle.upsert({
    where: { id: "vehicle-sedan" },
    update: {},
    create: {
      id: "vehicle-sedan",
      name: "Black Sedan 1",
      type: "SEDAN",
      capacity: 4,
      licensePlate: "FLA-1234",
      color: "Black",
      year: 2022,
      make: "Cadillac",
      model: "CT6",
      status: "ACTIVE",
      companyId: company.id,
    },
  })

  // Update driver default vehicles
  await prisma.driver.update({
    where: { id: mike.id },
    data: { defaultVehicleId: sprinter.id },
  })
  await prisma.driver.update({
    where: { id: sarah.id },
    data: { defaultVehicleId: sedan.id },
  })

  // Customers
  const john = await prisma.customer.upsert({
    where: { id: "customer-john" },
    update: { customerNumber: "1001" },
    create: {
      id: "customer-john",
      customerNumber: "1001",
      name: "John Smith",
      email: "john@abccorp.com",
      phone: "(305) 555-1234",
      company: "ABC Corporation",
      homeAddress: "123 Brickell Ave, Miami FL 33131",
      workAddress: "456 Downtown Blvd, Miami FL 33130",
      specialRequests: "Always provide bottled water.",
      preferredDriverId: mike.id,
      companyId: company.id,
    },
  })

  const sarah_c = await prisma.customer.upsert({
    where: { id: "customer-sarah" },
    update: { customerNumber: "1002" },
    create: {
      id: "customer-sarah",
      customerNumber: "1002",
      name: "Sarah Wilson",
      email: "sarah.w@gmail.com",
      phone: "(786) 555-5678",
      homeAddress: "789 Ocean Drive, Miami Beach FL 33139",
      companyId: company.id,
    },
  })

  // Today's trips
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.trip.upsert({
    where: { id: "trip-demo-1" },
    update: {},
    create: {
      id: "trip-demo-1",
      tripNumber: "TRP-000001",
      status: "CONFIRMED",
      tripType: "AIRPORT_PICKUP",
      pickupDate: new Date(today.getTime() + 11 * 60 * 60 * 1000),
      pickupTime: "11:00",
      pickupAddress: "Miami International Airport (MIA), Miami FL",
      dropoffAddress: "123 Brickell Ave, Miami FL 33131",
      passengerCount: 2,
      driverId: mike.id,
      vehicleId: sprinter.id,
      customerId: john.id,
      flightNumber: "AA1234",
      flightStatus: "On Time",
      meetAndGreet: true,
      price: 95,
      gratuity: 19,
      totalPrice: 114,
      vip: true,
      companyId: company.id,
    },
  })

  await prisma.trip.upsert({
    where: { id: "trip-demo-2" },
    update: {},
    create: {
      id: "trip-demo-2",
      tripNumber: "TRP-000002",
      status: "DISPATCHED",
      tripType: "ONE_WAY",
      pickupDate: new Date(today.getTime() + 14 * 60 * 60 * 1000),
      pickupTime: "14:30",
      pickupAddress: "456 Downtown Blvd, Miami FL",
      dropoffAddress: "789 Ocean Drive, Miami Beach FL 33139",
      passengerCount: 1,
      driverId: sarah.id,
      vehicleId: sedan.id,
      customerId: sarah_c.id,
      price: 65,
      gratuity: 13,
      totalPrice: 78,
      companyId: company.id,
    },
  })

  await prisma.trip.upsert({
    where: { id: "trip-demo-3" },
    update: {},
    create: {
      id: "trip-demo-3",
      tripNumber: "TRP-000003",
      status: "QUOTE",
      tripType: "AIRPORT_DROPOFF",
      pickupDate: new Date(today.getTime() + 19 * 60 * 60 * 1000),
      pickupTime: "19:00",
      pickupAddress: "Fontainebleau Hotel, 4441 Collins Ave, Miami Beach FL",
      dropoffAddress: "Miami International Airport (MIA)",
      passengerCount: 4,
      customerId: john.id,
      price: 120,
      gratuity: 24,
      totalPrice: 144,
      companyId: company.id,
    },
  })

  console.log("Seed complete!")
  console.log(`- Company: ${company.name}`)
  console.log(`- Drivers: Mike Rodriguez, Sarah Liu`)
  console.log(`- Vehicles: Black Sprinter 1, Black Sedan 1`)
  console.log(`- Customers: John Smith, Sarah Wilson`)
  console.log(`- Trips: 3 demo trips for today`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
