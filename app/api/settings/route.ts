import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/auth-guard";

// Simple key/value overrides table (ac_settings) — lets an admin override any
// .env-driven site setting (contact details, branding) from /dashboard/settings
// without a redeploy. lib/site-settings.ts reads the same table for the
// public site's fallback-to-env behavior.

// ac_settings has no company column — it's shared verbatim across every
// sibling site on this Supabase project. Every key is namespaced with this
// site's company tag before touching the DB so sibling sites can never
// clobber each other's values; the namespace is stripped again before the
// response goes back to the client, so callers only ever see plain keys.
const NAMESPACE = `${process.env.NEXT_PUBLIC_COMPANY ?? "TravQuest"}:`;

// Same keys the public site actually reads (app/api/contact/route.ts, Footer,
// WhatsApp buttons, etc.) — shown here so /dashboard/settings displays the
// real effective value on first load instead of a blank field, until an
// admin overrides it.
const ENV_FALLBACK: Record<string, string | undefined> = {
  app_name:            process.env.NEXT_PUBLIC_APP_NAME,
  contact_email:       process.env.NEXT_PUBLIC_EMAIL,
  contact_phone:       process.env.NEXT_PUBLIC_PHONE,
  whatsapp_number:     process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  whatsapp_message:    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE,
  instagram_url:       process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  facebook_url:        process.env.NEXT_PUBLIC_FACEBOOK_URL,
  linkedin_url:        process.env.NEXT_PUBLIC_LINKEDIN_URL,
  notify_email:        process.env.NOTIFY_EMAIL,
  from_email:          process.env.FROM_EMAIL,
  whatsapp_recipient:  process.env.WHATSAPP_RECIPIENT,
};

export async function GET(req: NextRequest) {
  const keysParam = new URL(req.url).searchParams.get("keys");
  const keys = keysParam ? keysParam.split(",").filter(Boolean) : undefined;

  let query = supabaseAdmin.from("ac_settings").select("key, value");
  if (keys?.length) query = query.in("key", keys.map((k) => `${NAMESPACE}${k}`));
  else query = query.like("key", `${NAMESPACE}%`);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, string> = {};
  (keys ?? Object.keys(ENV_FALLBACK)).forEach((key) => {
    const fallback = ENV_FALLBACK[key];
    if (fallback) result[key] = fallback;
  });
  data?.forEach(({ key, value }: { key: string; value: string }) => {
    result[key.slice(NAMESPACE.length)] = value;
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "admin");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const entries = Object.entries(body as Record<string, string>).filter(([, v]) => typeof v === "string");
  if (entries.length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabaseAdmin
    .from("ac_settings")
    .upsert(entries.map(([key, value]) => ({ key: `${NAMESPACE}${key}`, value })), { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
