import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/session";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db.query.orders.findMany({
    where: eq(orders.userId, session.userId),
    orderBy: [desc(orders.createdAt)],
    with: { items: true },
  });

  return NextResponse.json(list);
}
