import { NextRequest, NextResponse } from "next/server";
import { parseSession, type Session } from "./session";
import { ROLE_RANK, type Role } from "./permissions";

export function getSession(req: NextRequest): Promise<Session | null> {
  return parseSession(req.cookies.get("session")?.value);
}

// Verifies the caller has a session ranked at or above `minRole`. On success
// returns the session; on failure returns the NextResponse to send as-is.
//
//   const auth = await requireRole(req, "admin");
//   if (auth instanceof NextResponse) return auth;
//   const { session } = auth;
export async function requireRole(req: NextRequest, minRole: Role): Promise<{ session: Session } | NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ROLE_RANK[session.role] < ROLE_RANK[minRole]) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { session };
}

// A tenant-scoped request may target another company only if the caller is
// the platform developer (cross-tenant). Everyone else is pinned to their
// own session.company regardless of what the client asks for.
export function resolveCompanyScope(session: Session, requested?: string | null): string {
  if (session.role === "developer" && requested) return requested;
  return session.company;
}
