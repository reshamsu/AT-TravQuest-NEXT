import { supabase } from "@/lib/supabase";
import { ROLE_DB_TO_KEY, ROLE_RANK, type Role } from "@/lib/permissions";

interface AcUserRow {
  email: string;
  role: string;
  status: string;
  company: string;
}

async function findUserRows(email: string): Promise<AcUserRow[]> {
  const { data } = await supabase
    .from("ac_users")
    .select("email, role, status, company")
    .ilike("email", email);
  return data ?? [];
}

function normalizeRole(raw: string): Role {
  return ROLE_DB_TO_KEY[raw] ?? "staff";
}

/** True if this email may sign in: the bootstrap owner email, or any
 *  non-suspended row already in ac_users. */
export async function isAuthorizedEmail(email: string): Promise<boolean> {
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  if (allowed && email.toLowerCase() === allowed.toLowerCase()) return true;

  const rows = await findUserRows(email);
  return rows.some((r) => r.status !== "Suspended");
}

/** Resolves a signed-in email to its highest-ranked ac_users role. Falls
 *  back to "developer" for the bootstrap email when no row exists yet
 *  (first deploy, before ac_users is seeded). */
export async function resolveRole(email: string): Promise<Role> {
  const rows = await findUserRows(email);
  if (rows.length > 0) {
    return rows
      .map((r) => normalizeRole(r.role))
      .sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0];
  }

  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  if (allowed && email.toLowerCase() === allowed.toLowerCase()) return "developer";

  return "staff";
}
