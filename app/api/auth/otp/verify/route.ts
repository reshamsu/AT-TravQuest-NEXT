import { NextRequest, NextResponse } from "next/server";
import { resolveRole, resolveDisplayName } from "@/lib/user-directory";
import { createSessionCookie, SESSION_COOKIE_OPTIONS } from "@/lib/session";
import { DEFAULT_TENANT_COMPANY } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { otp, method } = body as { otp?: string; method?: string };

  if (!otp || !/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "Enter a valid 6-digit code." },
      { status: 400 },
    );
  }

  let email: string;

  if (method === "totp") {
    const totpEmail = await verifyTotp(otp);
    if (!totpEmail) {
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 401 },
      );
    }
    email = totpEmail;
  } else {
    const pendingCookie = req.cookies.get("otp_pending")?.value;
    if (!pendingCookie) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 },
      );
    }

    let pending: { otp: string; expiresAt: number; email: string };
    try {
      pending = JSON.parse(Buffer.from(pendingCookie, "base64").toString("utf8"));
    } catch {
      return NextResponse.json(
        { error: "Invalid session. Please sign in again." },
        { status: 401 },
      );
    }

    if (Date.now() > pending.expiresAt) {
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 401 },
      );
    }

    if (otp !== pending.otp) {
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 401 },
      );
    }

    email = pending.email;
  }

  let session: string;
  try {
    const [role, name] = await Promise.all([resolveRole(email), resolveDisplayName(email)]);
    session = await createSessionCookie({
      email,
      name,
      role,
      company: DEFAULT_TENANT_COMPANY,
      provider: method === "totp" ? "totp" : "email_otp",
    });
  } catch (err) {
    console.error("Failed to create session cookie:", err);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again shortly." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("session", session, SESSION_COOKIE_OPTIONS);

  res.cookies.delete("otp_pending");
  res.cookies.delete("tq_attempts");
  res.cookies.delete("tq_lockout");

  return res;
}

// ── TOTP (RFC 6238) using Web Crypto — no external library ──────────────────

async function verifyTotp(token: string): Promise<string | null> {
  const secret = process.env.TOTP_SECRET;
  if (!secret) return null;

  const epoch = Math.floor(Date.now() / 1000);

  for (const offset of [-1, 0, 1]) {
    const step = Math.floor(epoch / 30) + offset;
    const expected = await computeTotp(secret, step);
    if (expected === token) {
      return process.env.NEXT_PUBLIC_ALLOWED_EMAIL ?? "user";
    }
  }

  return null;
}

async function computeTotp(base32Secret: string, timeStep: number): Promise<string> {
  const decoded = decodeBase32(base32Secret);
  // Copy into a concrete ArrayBuffer so crypto.subtle.importKey accepts it
  const keyBytes = new Uint8Array(new ArrayBuffer(decoded.length));
  keyBytes.set(decoded);

  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, 0, false);
  view.setUint32(4, timeStep, false);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, buf);
  const hash = new Uint8Array(sig);

  const offset = hash[hash.length - 1] & 0xf;
  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

function decodeBase32(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}
