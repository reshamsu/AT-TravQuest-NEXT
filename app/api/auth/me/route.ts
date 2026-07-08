import { NextRequest, NextResponse } from "next/server";
import { parseSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await parseSession(req.cookies.get("session")?.value);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      email: session.email,
      name:  session.name ?? null,
      role:  session.role,
      company: session.company,
    },
  });
}
