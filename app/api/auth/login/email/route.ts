import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/user-directory";

const MAX_ATTEMPTS = 3;

function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

async function sendOtpEmail(email: string, otp: string): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "RESEND_API_KEY not set" };

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "TravQuest";
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;">
      <h2>Your sign-in code</h2>
      <p>Enter this code to finish signing in to ${appName}:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;">${otp}</p>
      <p style="color:#888;font-size:12px;">This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || `${appName} <no-reply@example.com>`,
        to: [email],
        subject: `Your ${appName} sign-in code`,
        html,
      }),
    });
    if (!res.ok) return { ok: false, reason: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

export async function POST(request: NextRequest) {
  const lockout = request.cookies.get("tq_lockout")?.value;
  if (lockout === "1") {
    return NextResponse.json(
      { error: "Too many failed attempts. Access denied." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const attemptCount = parseInt(request.cookies.get("tq_attempts")?.value ?? "0", 10);

  const credentialsValid = await verifyCredentials(normalizedEmail, password);

  if (!credentialsValid) {
    const newCount = attemptCount + 1;

    if (newCount >= MAX_ATTEMPTS) {
      const res = NextResponse.json(
        { error: "Too many failed attempts. Access denied." },
        { status: 403 }
      );
      res.cookies.set("tq_lockout", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      res.cookies.delete("tq_attempts");
      return res;
    }

    const remaining = MAX_ATTEMPTS - newCount;
    const res = NextResponse.json(
      { error: `Invalid email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
      { status: 401 }
    );
    res.cookies.set("tq_attempts", String(newCount), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });
    return res;
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1_000; // 5 minutes

  const otpPayload = Buffer.from(
    JSON.stringify({ otp, expiresAt, email: normalizedEmail }),
  ).toString("base64");

  const emailResult = await sendOtpEmail(normalizedEmail, otp);

  const res = NextResponse.json({
    requiresOtp: true,
    hint: maskEmail(normalizedEmail),
    emailSent: emailResult.ok,
    // Fall back to showing the code directly if delivery isn't configured/working,
    // and always in dev so the flow works without a real mail provider.
    ...(process.env.NODE_ENV !== "production" || !emailResult.ok ? { devOtp: otp } : {}),
  });

  res.cookies.set("otp_pending", otpPayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });

  return res;
}
