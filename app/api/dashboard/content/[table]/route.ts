import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth-guard";
import type { Role } from "@/lib/permissions";

// Generic protected CRUD proxy for the dashboard's CMS content tables.
// The public anon key can no longer write to these tables directly (RLS
// blocks it) — every write goes through here, using the service-role key
// after checking the caller's session cookie. minRole mirrors the existing
// page-level gates in lib/permissions.ts BLOCKED_PREFIXES, so API-level
// access matches what the UI already allowed (destinations/listings are
// open to staff+; pages/heroes/sections/discoveries require manager+, same
// as the /dashboard/pages route itself).
const TABLE_CONFIG: Record<string, { minRole: Role; hasCompany: boolean }> = {
  ac_destinations:    { minRole: "staff",   hasCompany: true },
  ac_listings_travel: { minRole: "staff",   hasCompany: true },
  ac_discoveries:     { minRole: "manager", hasCompany: true },
  ac_heroes:          { minRole: "manager", hasCompany: true },
  ac_sections:        { minRole: "manager", hasCompany: true },
  ac_pages:           { minRole: "manager", hasCompany: false },
};

function getConfig(table: string) {
  return TABLE_CONFIG[table] ?? null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const config = getConfig(table);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });

  const auth = await requireRole(req, config.minRole);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const row: Record<string, unknown> = { ...body };
  if (config.hasCompany) row.company = auth.session.company;

  const { data, error } = await supabaseAdmin.from(table).insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const config = getConfig(table);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });

  const auth = await requireRole(req, config.minRole);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const matchColumn = url.searchParams.get("matchColumn") || "id";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const row: Record<string, unknown> = { ...body };
  if (config.hasCompany) row.company = auth.session.company;

  let q = supabaseAdmin.from(table).update(row).eq(matchColumn, id);
  if (config.hasCompany) q = q.eq("company", auth.session.company);

  const { data, error } = await q.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const config = getConfig(table);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });

  const auth = await requireRole(req, config.minRole);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const matchColumn = url.searchParams.get("matchColumn") || "id";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let q = supabaseAdmin.from(table).delete().eq(matchColumn, id);
  if (config.hasCompany) q = q.eq("company", auth.session.company);

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
