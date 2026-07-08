import type { Role } from "./permissions";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface Session {
  email: string;
  name?: string;
  picture?: string;
  provider?: string;
  role: Role;
  company: string;
  agentCode?: string;
  iat: number;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set — required to sign session cookies.");
  return s;
}

// Uses the Web Crypto API (not Node's `crypto` module) so this works
// identically in both the Node.js runtime (API routes) and the Edge runtime
// (middleware) — Node's `crypto.createHmac`/`timingSafeEqual` are not
// available in the Edge runtime.
function base64url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return base64url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Builds the signed "body.signature" cookie value. Callers pass everything
// except `iat`, which is stamped here.
export async function createSessionCookie(payload: Omit<Session, "iat">): Promise<string> {
  const full: Session = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${await sign(body)}`;
}

export async function parseSession(value: string | undefined): Promise<Session | null> {
  if (!value) return null;

  const sep = value.lastIndexOf(".");
  if (sep === -1) return null;
  const body = value.slice(0, sep);
  const providedSig = value.slice(sep + 1);

  try {
    const expected = await sign(body);
    if (!timingSafeEqual(expected, providedSig)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<Session>;
    if (typeof parsed.email !== "string" || typeof parsed.iat !== "number") return null;
    if (Math.floor(Date.now() / 1000) - parsed.iat > SESSION_MAX_AGE_SECONDS) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};
