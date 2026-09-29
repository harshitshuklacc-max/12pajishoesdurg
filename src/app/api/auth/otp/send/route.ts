import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";

const schema = z.object({
  mobile: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }
    const result = await sendOtp(parsed.data.mobile);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      message: "OTP generated successfully",
      displayOtp: result.displayOtp,
    });
  } catch {
    return NextResponse.json({ error: "Unable to send OTP" }, { status: 500 });
  }
}
