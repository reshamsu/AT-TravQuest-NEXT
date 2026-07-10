import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "manager");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const { password, ...patch } = body as Record<string, unknown> & { password?: string };

  if (typeof password === "string" && password.length > 0) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    (patch as Record<string, unknown>).password_hash = await hashPassword(password);
  }

  const { error } = await supabaseAdmin.from("ac_users").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Deleting a user is admin+ only — manager/agent/staff may approve or
  // reject/edit, but not permanently remove an account.
  const auth = await requireRole(req, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const { error } = await supabaseAdmin.from("ac_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
