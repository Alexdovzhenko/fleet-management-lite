// Run with: node scripts/add-client-ref.js
require("dotenv").config({ path: ".env.local" })
const { Pool } = require("pg")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    console.log('Adding "clientRef" column to Trip table...')
    await client.query(`
      ALTER TABLE "Trip"
      ADD COLUMN IF NOT EXISTS "clientRef" TEXT;
    `)
    console.log("Done.")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
