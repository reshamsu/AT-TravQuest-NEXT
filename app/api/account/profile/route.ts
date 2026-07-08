import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/auth-guard";

// ac_users has no job_title/company_details columns (no DDL access to add
// them), so those two fields are stored as a JSON blob in the ac_settings
// key/value table, keyed per-user. name/email still come from ac_users.
function profileKey(email: string): string {
  return `profile:${email.toLowerCase()}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: userRow }, { data: settingsRow }] = await Promise.all([
    supabaseAdmin.from("ac_users").select("name, email").ilike("email", session.email).maybeSingle(),
    supabaseAdmin.from("ac_settings").select("value").eq("key", profileKey(session.email)).maybeSingle(),
  ]);

  let extra: { job_title?: string; company_details?: Record<string, string> } = {};
  if (settingsRow?.value) {
    try { extra = JSON.parse(settingsRow.value); } catch { /* ignore malformed blob */ }
  }

  return NextResponse.json({
    profile: {
      name: userRow?.name ?? session.name ?? "",
      email: userRow?.email ?? session.email,
      job_title: extra.job_title ?? "",
      company_details: extra.company_details ?? {},
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, jobTitle, companyDetails } = body as { name?: string; jobTitle?: string; companyDetails?: Record<string, string> };

  await Promise.all([
    name ? supabaseAdmin.from("ac_users").update({ name }).ilike("email", session.email) : Promise.resolve(),
    supabaseAdmin
      .from("ac_settings")
      .upsert(
        [{ key: profileKey(session.email), value: JSON.stringify({ job_title: jobTitle ?? "", company_details: companyDetails ?? {} }) }],
        { onConflict: "key" },
      ),
  ]);

  return NextResponse.json({ ok: true });
}
