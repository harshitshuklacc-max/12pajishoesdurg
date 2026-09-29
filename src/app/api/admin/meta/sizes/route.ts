import { NextResponse } from "next/server";
import { db } from "@/db";
import { sizes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin("products.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.sizes.findMany({ orderBy: [asc(sizes.sortOrder)] });
  return NextResponse.json(list);
}
