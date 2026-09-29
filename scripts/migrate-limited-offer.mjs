import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS limited_offer_enabled boolean NOT NULL DEFAULT false
`;
await sql`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS limited_offer_ends_at timestamp
`;

console.log("Added limited_offer columns to products (if missing).");
