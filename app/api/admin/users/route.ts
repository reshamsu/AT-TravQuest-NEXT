import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "manager");
  if (auth instanceof NextResponse) return auth;

  const company = new URL(req.url).searchParams.get("company") || auth.session.company;

  const { data, error } = await supabaseAdmin
    .from("ac_users")
    .select("id, name, email, phone, role, status, agent_code, created_at")
    .eq("company", company)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data, me: { email: auth.session.email, role: auth.session.role } });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "manager");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const { password, company, ...rest } = body as Record<string, unknown> & { company?: string; password?: string };
  const { name, email, role } = rest as { name?: string; email?: string; phone?: string; role?: string; status?: string };
  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email and role are required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const password_hash = await hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from("ac_users")
    .insert([{ ...rest, password_hash, company: company || auth.session.company }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
