// Web Crypto (PBKDF2) rather than Node's crypto.scrypt — this needs to run
// in both the Node.js runtime (most API routes) and the Edge runtime
// (app/api/auth/login/email/route.ts declares `export const runtime =
// "edge"`), and Node's crypto module isn't available on Edge. Same reasoning
// as lib/session.ts's HMAC implementation.

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function randomSaltHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // Concrete ArrayBuffer (not ArrayBufferLike) so this satisfies BufferSource
  // for crypto.subtle.deriveBits — same pattern as otp/verify/route.ts.
  const bytes = new Uint8Array<ArrayBuffer>(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function bytesToHex(bits: ArrayBuffer): string {
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deriveHex(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS,
  );
  return bytesToHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomSaltHex();
  const hash = await deriveHex(password, salt);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const candidate = await deriveHex(password, salt);
  if (candidate.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}
