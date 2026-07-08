export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;

    await supabase.from("page_views").insert({ path, country });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
