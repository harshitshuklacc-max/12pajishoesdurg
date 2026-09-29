import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { setStoreSettings, getStoreSettings } from "@/lib/settings";
import { faviconFromLogo } from "@/lib/cloudinary-url";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request) {
  const auth = await requireAdmin("branding.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const updates: Record<string, string> = {};

  if (body.logoUrl) updates.logoUrl = body.logoUrl;
  if (body.logoPublicId) {
    updates.logoPublicId = body.logoPublicId;
    updates.faviconUrl = faviconFromLogo(body.logoPublicId, 32);
  }
  if (body.logoLightUrl) updates.logoLightUrl = body.logoLightUrl;
  if (body.logoDarkUrl) updates.logoDarkUrl = body.logoDarkUrl;
  if (body.logoMobileUrl) updates.logoMobileUrl = body.logoMobileUrl;
  if (body.faviconUrl) updates.faviconUrl = body.faviconUrl;

  const settings = await setStoreSettings(updates);
  await logAudit({ adminId: auth.session!.adminId, action: "branding.updated", entityType: "branding" });
  return NextResponse.json(settings);
}

export async function GET() {
  const auth = await requireAdmin("branding.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(await getStoreSettings());
}
