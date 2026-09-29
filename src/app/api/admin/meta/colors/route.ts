import { NextResponse } from "next/server";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin("products.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.colors.findMany();
  return NextResponse.json(list);
}
