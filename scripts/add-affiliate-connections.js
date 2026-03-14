// Run with: node scripts/add-affiliate-connections.js
require("dotenv").config({ path: ".env.local" })
const { Pool } = require("pg")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    console.log("Creating AffiliateConnectionStatus enum...")
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AffiliateConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    console.log("Creating AffiliateConnection table...")
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AffiliateConnection" (
        "id"         TEXT NOT NULL,
        "senderId"   TEXT NOT NULL,
        "receiverId" TEXT NOT NULL,
        "status"     "AffiliateConnectionStatus" NOT NULL DEFAULT 'PENDING',
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AffiliateConnection_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log("Creating indexes...")
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateConnection_senderId_receiverId_key"
        ON "AffiliateConnection"("senderId", "receiverId");
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AffiliateConnection_senderId_idx"
        ON "AffiliateConnection"("senderId");
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AffiliateConnection_receiverId_idx"
        ON "AffiliateConnection"("receiverId");
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AffiliateConnection_status_idx"
        ON "AffiliateConnection"("status");
    `)

    console.log("Adding foreign key constraints...")
    // Add FK constraints (ignore if already exist)
    try {
      await client.query(`
        ALTER TABLE "AffiliateConnection"
          ADD CONSTRAINT "AffiliateConnection_senderId_fkey"
          FOREIGN KEY ("senderId") REFERENCES "Company"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      `)
    } catch (e) {
      if (!e.message.includes("already exists")) throw e
    }
    try {
      await client.query(`
        ALTER TABLE "AffiliateConnection"
          ADD CONSTRAINT "AffiliateConnection_receiverId_fkey"
          FOREIGN KEY ("receiverId") REFERENCES "Company"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      `)
    } catch (e) {
      if (!e.message.includes("already exists")) throw e
    }

    console.log("✓ AffiliateConnection table ready.")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
