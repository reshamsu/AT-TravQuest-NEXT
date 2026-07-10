import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSiteSettings } from "@/lib/site-settings";

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  destination?: string;
  service: string;
  message?: string;
}

// ac_contact's columns are shared across the Atlas ecosystem in a B2B shape
// (business_name/industry/challenge/intent) — this travel site's public form
// collects different fields, mapped onto that shape below rather than
// requiring new columns (no DDL access to this shared Supabase project).
function toChallenge(d: ContactPayload): string {
  const parts = [
    d.destination && `Destination: ${d.destination}`,
    d.message,
  ].filter(Boolean);
  return parts.join("\n") || "No additional details provided.";
}

async function sendWhatsApp(d: ContactPayload, settings: Record<string, string>) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = settings.whatsapp_recipient || process.env.WHATSAPP_RECIPIENT;
  if (!token || !phoneId || !recipient || token === "your_whatsapp_access_token_here") return;

  const appName = settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || "Travel Team";
  const body = [
    `🔔 *New Travel Inquiry — ${appName}*`,
    ``,
    `👤 *Name:* ${d.name}`,
    `📧 *Email:* ${d.email}`,
    d.phone ? `📱 *Phone:* ${d.phone}` : null,
    `🎯 *Interested in:* ${d.service}`,
    d.destination ? `📍 *Destination:* ${d.destination}` : null,
    d.message ? `\n💬 *Notes:*\n${d.message}` : null,
  ].filter((line) => line !== null).join("\n");

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "text", text: { body } }),
  }).catch(() => {});
}

async function sendEmail(d: ContactPayload, settings: Record<string, string>): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = settings.notify_email || process.env.NOTIFY_EMAIL;
  if (!apiKey) return { ok: false, reason: "RESEND_API_KEY not set" };
  if (!notifyEmail) return { ok: false, reason: "NOTIFY_EMAIL not set" };

  const appName = settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || "Travel Team";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2>New Travel Inquiry</h2>
      <p><b>${d.name}</b> — <a href="mailto:${d.email}">${d.email}</a>${d.phone ? ` — ${d.phone}` : ""}</p>
      <p><b>Interested in:</b> ${d.service}</p>
      ${d.destination ? `<p><b>Destination:</b> ${d.destination}</p>` : ""}
      ${d.message ? `<p><b>Notes:</b><br/>${d.message.replace(/\n/g, "<br/>")}</p>` : ""}
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: settings.from_email || process.env.FROM_EMAIL || `${appName} <no-reply@example.com>`,
        to: [notifyEmail],
        subject: `New Inquiry · ${d.name} — ${d.service}`,
        html,
      }),
    });
    if (!res.ok) return { ok: false, reason: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ContactPayload;
  const { name, email, phone, service } = body;

  if (!name || !email || !service) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("ac_contact").insert({
    name,
    email,
    phone: phone || null,
    business_name: body.destination || "Individual",
    industry: "travel",
    intent: service,
    challenge: toChallenge(body),
    website: null,
    company: process.env.NEXT_PUBLIC_COMPANY || "TravQuest",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = await getSiteSettings(["notify_email", "from_email", "whatsapp_recipient", "app_name"]);
  const [, emailResult] = await Promise.allSettled([sendWhatsApp(body, settings), sendEmail(body, settings)]);
  const emailStatus = emailResult.status === "fulfilled" ? emailResult.value : { ok: false, reason: String(emailResult.reason) };

  return NextResponse.json({ ok: true, email: emailStatus });
}
