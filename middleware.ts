import { NextRequest, NextResponse } from "next/server";
import { parseSession } from "@/lib/session";

const PROTECTED = /^\/dashboard(\/|$)/;
const AUTH_ROUTES = ["/login", "/signup"];

// Paths we don't want to count as page views
const SKIP = /^\/(api|_next|favicon|assets|.*\..*)/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await parseSession(request.cookies.get("session")?.value);

  if (PROTECTED.test(pathname) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ROUTES.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Fire-and-forget page view tracking for public pages
  if (!SKIP.test(pathname)) {
    const trackUrl = new URL("/api/track", request.url);
    fetch(trackUrl.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/((?!_next/static|_next/image).*)"],
};
