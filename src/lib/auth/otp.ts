import bcrypt from "bcryptjs";
import { db } from "@/db";
import { customerOtps, users } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { setCustomerSession } from "./session";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(-10);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(mobile: string): Promise<{ ok: true; displayOtp: string } | { ok: false; error: string }> {
  const normalized = normalizeMobile(mobile);
  if (normalized.length !== 10) {
    return { ok: false, error: "Enter a valid 10-digit mobile number" };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(customerOtps).values({
    mobile: normalized,
    otpHash,
    expiresAt,
  });

  // On-screen OTP for store demo (no SMS gateway required)
  return { ok: true, displayOtp: otp };
}

export async function verifyOtp(
  mobile: string,
  otp: string,
  fullName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeMobile(mobile);
  if (normalized.length !== 10 || otp.length !== 6) {
    return { ok: false, error: "Invalid mobile or OTP" };
  }

  const record = await db.query.customerOtps.findFirst({
    where: and(
      eq(customerOtps.mobile, normalized),
      eq(customerOtps.verified, false),
      gt(customerOtps.expiresAt, new Date())
    ),
    orderBy: [desc(customerOtps.createdAt)],
  });

  if (!record) {
    return { ok: false, error: "OTP expired or not found. Request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new OTP." };
  }

  const valid = await bcrypt.compare(otp, record.otpHash);
  if (!valid) {
    await db
      .update(customerOtps)
      .set({ attempts: record.attempts + 1 })
      .where(eq(customerOtps.id, record.id));
    return { ok: false, error: "Incorrect OTP" };
  }

  await db.update(customerOtps).set({ verified: true }).where(eq(customerOtps.id, record.id));

  let user = await db.query.users.findFirst({ where: eq(users.mobile, normalized) });
  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        mobile: normalized,
        fullName: fullName?.trim() || `Customer ${normalized.slice(-4)}`,
      })
      .returning();
    user = created;
  } else if (fullName?.trim()) {
    await db.update(users).set({ fullName: fullName.trim(), updatedAt: new Date() }).where(eq(users.id, user.id));
    user = { ...user, fullName: fullName.trim() };
  }

  await setCustomerSession({
    userId: user.id,
    mobile: user.mobile,
    fullName: user.fullName,
    email: user.email ?? undefined,
  });

  return { ok: true };
}
