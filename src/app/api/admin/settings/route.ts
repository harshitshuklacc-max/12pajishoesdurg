import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getStoreSettings, setStoreSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { db } from "@/db";
import { homepageSections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin("settings.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const settings = await getStoreSettings();
  const hero = await db.query.homepageSections.findFirst({ where: eq(homepageSections.key, "hero") });
  const glimpses = await db.query.homepageSections.findFirst({ where: eq(homepageSections.key, "glimpses") });
  return NextResponse.json({ settings, hero, glimpses });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin("settings.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();

  if (body.settings) {
    await setStoreSettings(body.settings);
    await logAudit({
      adminId: auth.session!.adminId,
      action: "settings.updated",
      entityType: "settings",
    });
  }

  if (body.hero) {
    await db
      .insert(homepageSections)
      .values({ key: "hero", title: "Hero", content: body.hero, isEnabled: true })
      .onConflictDoUpdate({
        target: homepageSections.key,
        set: { content: body.hero, updatedAt: new Date() },
      });
  }

  if (body.glimpses) {
    await db
      .insert(homepageSections)
      .values({
        key: "glimpses",
        title: body.glimpses.title || "OUR GLIMPSES",
        isEnabled: body.glimpses.isEnabled ?? true,
      })
      .onConflictDoUpdate({
        target: homepageSections.key,
        set: {
          title: body.glimpses.title,
          isEnabled: body.glimpses.isEnabled,
          updatedAt: new Date(),
        },
      });
  }

  return NextResponse.json({ ok: true });
}
