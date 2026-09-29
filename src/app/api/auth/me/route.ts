import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/session";
import { db } from "@/db";
import { userAddresses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const address = await db.query.userAddresses.findFirst({
    where: eq(userAddresses.userId, session.userId),
  });

  return NextResponse.json({
    user: {
      ...session,
      address: address
        ? {
            fullName: address.fullName,
            addressLine: address.addressLine,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            mobile: address.mobile,
          }
        : null,
      addressLocked: !!address,
    },
  });
}
