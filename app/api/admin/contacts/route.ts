import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole, resolveCompanyScope } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "staff");
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const company = resolveCompanyScope(session, req.nextUrl.searchParams.get("company"));

  const { data, error } = await supabaseAdmin
    .from("ac_contact")
    .select("*")
    .eq("company", company)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}
