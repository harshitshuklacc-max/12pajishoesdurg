import { db } from "@/db";
import { orders, products, users, payments } from "@/db/schema";
import { sql, eq, and, gte, isNull } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    [{ totalOrders }],
    [{ totalProducts }],
    [{ totalCustomers }],
    [{ pendingOrders }],
    [{ todaySales }],
    [{ totalSales }],
    recentOrders,
    lowStock,
  ] = await Promise.all([
    db.select({ totalOrders: sql<number>`count(*)::int` }).from(orders),
    db.select({ totalProducts: sql<number>`count(*)::int` }).from(products).where(isNull(products.deletedAt)),
    db.select({ totalCustomers: sql<number>`count(*)::int` }).from(users),
    db.select({ pendingOrders: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")),
    db
      .select({ todaySales: sql<string>`coalesce(sum(${payments.amount}),0)` })
      .from(payments)
      .where(and(eq(payments.status, "success"), gte(payments.paidAt, today))),
    db
      .select({ totalSales: sql<string>`coalesce(sum(${payments.amount}),0)` })
      .from(payments)
      .where(eq(payments.status, "success")),
    db.query.orders.findMany({ limit: 8, orderBy: (o, { desc }) => [desc(o.createdAt)] }),
    db.query.products.findMany({
      where: and(isNull(products.deletedAt), sql`${products.stock} <= ${products.lowStockThreshold}`),
      limit: 8,
    }),
  ]).catch(() => [
    [{ totalOrders: 0 }],
    [{ totalProducts: 0 }],
    [{ totalCustomers: 0 }],
    [{ pendingOrders: 0 }],
    [{ todaySales: "0" }],
    [{ totalSales: "0" }],
    [],
    [],
  ] as const);

  const stats = [
    { label: "Total sales", value: formatPrice(totalSales ?? 0) },
    { label: "Today's sales", value: formatPrice(todaySales ?? 0) },
    { label: "Orders", value: totalOrders },
    { label: "Pending orders", value: pendingOrders },
    { label: "Customers", value: totalCustomers },
    { label: "Products", value: totalProducts },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-paji-orange">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Recent orders</h2>
          <ul className="mt-4 divide-y text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex justify-between py-2">
                <span>{o.orderNumber}</span>
                <span className="text-gray-500">{o.status}</span>
              </li>
            ))}
            {!recentOrders.length && <li className="py-4 text-gray-400">No orders yet</li>}
          </ul>
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Low stock</h2>
          <ul className="mt-4 divide-y text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{p.name}</span>
                <span className="text-red-600">{p.stock} left</span>
              </li>
            ))}
            {!lowStock.length && <li className="py-4 text-gray-400">Stock levels OK</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
