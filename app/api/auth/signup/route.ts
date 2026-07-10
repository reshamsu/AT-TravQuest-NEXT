import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_TENANT_COMPANY } from "@/lib/tenant";
import { hashPassword } from "@/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, password } = body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const bootstrapOwner = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  if (bootstrapOwner && normalizedEmail === bootstrapOwner.toLowerCase()) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("ac_users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const password_hash = await hashPassword(password);

  const { error } = await supabaseAdmin.from("ac_users").insert([
    {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      role: "Staff",
      status: "Pending",
      company: DEFAULT_TENANT_COMPANY,
      password_hash,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
