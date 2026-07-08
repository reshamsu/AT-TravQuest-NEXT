import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "manager");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...patch } = body as Record<string, unknown>;

  const { error } = await supabaseAdmin.from("ac_users").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "manager");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const { error } = await supabaseAdmin.from("ac_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
