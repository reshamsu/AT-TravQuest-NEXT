import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedEmail, resolveRole } from "@/lib/user-directory";
import { createSessionCookie, SESSION_COOKIE_OPTIONS } from "@/lib/session";
import { DEFAULT_TENANT_COMPANY } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Only allow relative redirects to prevent open-redirect attacks
  const redirectTo =
    state && state.startsWith("/") ? state : "/dashboard";

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=not_configured`);
  }

  // Exchange the authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Fetch the user's Google profile
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  if (!profileRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=profile_failed`);
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    email: string;
    name: string;
    picture: string;
  };

  // Restrict access to the bootstrap owner email or any active ac_users row
  if (!(await isAuthorizedEmail(profile.email))) {
    return NextResponse.redirect(`${origin}/login?error=unauthorized`);
  }

  // Store the signed session cookie (HMAC'd — see lib/session.ts).
  let session: string;
  try {
    session = await createSessionCookie({
      email: profile.email,
      name: profile.name,
      role: await resolveRole(profile.email),
      company: DEFAULT_TENANT_COMPANY,
      provider: "google",
    });
  } catch (err) {
    console.error("Failed to create session cookie:", err);
    return NextResponse.redirect(`${origin}/login?error=session_not_configured`);
  }

  const response = NextResponse.redirect(`${origin}${redirectTo}`);
  response.cookies.set("session", session, SESSION_COOKIE_OPTIONS);

  return response;
}
