import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerSession } from "@/lib/auth/session";
import { db } from "@/db";
import { userAddresses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  fullName: z.string().min(2),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
});

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await db.query.userAddresses.findFirst({
    where: eq(userAddresses.userId, session.userId),
  });

  return NextResponse.json({ address, locked: !!address });
}

/** Save address once at registration — cannot be updated later. */
export async function POST(req: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.query.userAddresses.findFirst({
    where: eq(userAddresses.userId, session.userId),
  });
  if (existing) {
    return NextResponse.json({ error: "Address is already saved and cannot be changed." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill all address fields correctly." }, { status: 400 });
  }

  const [address] = await db
    .insert(userAddresses)
    .values({
      userId: session.userId,
      fullName: parsed.data.fullName,
      mobile: session.mobile,
      addressLine: parsed.data.addressLine,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      isDefault: true,
    })
    .returning();

  await db
    .update(users)
    .set({ fullName: parsed.data.fullName, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ address, locked: true });
}
