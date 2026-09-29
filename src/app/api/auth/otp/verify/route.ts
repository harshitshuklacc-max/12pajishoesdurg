import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";

const schema = z.object({
  mobile: z.string().min(10),
  otp: z.string().length(6),
  fullName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid OTP data" }, { status: 400 });
    }
    const result = await verifyOtp(parsed.data.mobile, parsed.data.otp, parsed.data.fullName);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
