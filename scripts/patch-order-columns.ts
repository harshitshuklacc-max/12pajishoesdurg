import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method varchar(20) NOT NULL DEFAULT 'online'`;
  await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS method varchar(20) NOT NULL DEFAULT 'online'`;
  await sql`
    UPDATE products p
    SET stock = COALESCE((
      SELECT SUM(v.stock)::int FROM product_variants v WHERE v.product_id = p.id
    ), p.stock)
    WHERE p.has_sizes = true OR p.has_colors = true
  `;
  console.log("schema_patch_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
