import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "paji_admin_session";
const CUSTOMER_COOKIE = "paji_customer_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = {
  adminId: number;
  username: string;
  email: string;
  name: string;
  roleId: number | null;
  isSuperAdmin: boolean;
  permissions: string[];
};

export type CustomerSession = {
  userId: number;
  email?: string;
  mobile: string;
  fullName: string;
};

async function sign(payload: object, cookieName: string) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

async function verify<T>(cookieName: string): Promise<T | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as T;
  } catch {
    return null;
  }
}

export async function setAdminSession(session: AdminSession) {
  await sign(session, ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return verify<AdminSession>(ADMIN_COOKIE);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function setCustomerSession(session: CustomerSession) {
  await sign(session, CUSTOMER_COOKIE);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  return verify<CustomerSession>(CUSTOMER_COOKIE);
}

export async function clearCustomerSession() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
}
