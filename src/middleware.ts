import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "paji_admin_session";
const CUSTOMER_COOKIE = "paji_customer_session";

async function verifyToken(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

const verifyAdminToken = verifyToken;
const verifyCustomerToken = verifyToken;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token && (await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (pathname === "/checkout" || pathname.startsWith("/api/checkout/")) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!token || !(await verifyCustomerToken(token))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Please log in to place an order." }, { status: 401 });
      }
      const loginUrl = new URL("/account", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/api/checkout/:path*"],
};
