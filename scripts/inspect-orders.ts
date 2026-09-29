import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const orders = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_name = 'orders'
    order by ordinal_position
  `;
  const payments = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_name = 'payments'
    order by ordinal_position
  `;
  console.log("ORDERS", orders.map((r) => r.column_name).join(","));
  console.log("PAYMENTS", payments.map((r) => r.column_name).join(","));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
