import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url);
  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
