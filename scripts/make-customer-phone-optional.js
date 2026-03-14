require("dotenv").config({ path: ".env.local" })
const { Pool } = require("pg")
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    console.log('Making Customer.phone nullable...')
    await client.query(`ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`)
    console.log("Done.")
  } finally {
    client.release()
    await pool.end()
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
