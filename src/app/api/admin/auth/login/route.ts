import { NextResponse } from "next/server";
import { z } from "zod";
import { loginAdmin } from "@/lib/auth/admin-auth";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }
    const result = await loginAdmin(parsed.data.username.trim(), parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json(
      {
        error:
          "Database not ready. In the project folder run: npm run db:push then restart the dev server.",
      },
      { status: 503 }
    );
  }
}
