import { supabaseAdmin } from "@/lib/supabase-admin";
import { ROLE_DB_TO_KEY, ROLE_RANK, type Role } from "@/lib/permissions";
import { verifyPassword } from "@/lib/password";

interface AcUserRow {
  email: string;
  role: string;
  status: string;
  company: string;
  password_hash: string | null;
  name: string | null;
}

async function findUserRows(email: string): Promise<AcUserRow[]> {
  const { data } = await supabaseAdmin
    .from("ac_users")
    .select("email, role, status, company, password_hash, name")
    .ilike("email", email);
  return data ?? [];
}

function normalizeRole(raw: string): Role {
  return ROLE_DB_TO_KEY[raw] ?? "staff";
}

/** True if this email may sign in: the bootstrap owner email, or an Active
 *  row already in ac_users. Pending (awaiting approval) and Inactive rows
 *  are intentionally excluded — only Active grants sign-in. */
export async function isAuthorizedEmail(email: string): Promise<boolean> {
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  if (allowed && email.toLowerCase() === allowed.toLowerCase()) return true;

  const rows = await findUserRows(email);
  return rows.some((r) => r.status === "Active");
}

/** Verifies email + password for the password/OTP login step. Each ac_users
 *  row carries its own PBKDF2 hash (set at signup or via Add/Edit User).
 *  Rows created before per-user passwords existed have no hash yet, so they
 *  fall back to the legacy shared DEMO_PASSWORD until an admin sets a real
 *  one — this keeps pre-existing accounts working without a forced reset.
 *  The bootstrap owner email is checked regardless of row status (or even
 *  if no row exists yet), so the operator can never lock themselves out. */
export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  const isBootstrapOwner = !!allowed && normalized === allowed.toLowerCase();

  const rows = await findUserRows(email);
  const match = isBootstrapOwner
    ? rows.find((r) => r.email.toLowerCase() === normalized)
    : rows.find((r) => r.status === "Active");

  if (match?.password_hash) {
    return verifyPassword(password, match.password_hash);
  }
  if (match || isBootstrapOwner) {
    return password === (process.env.DEMO_PASSWORD ?? "password");
  }
  return false;
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

/** The ac_users.name for this email, if any row has one set. Used at the
 *  OTP/TOTP login step to populate the session's display name — unlike
 *  Google OAuth, that step has no external profile to pull a name from, so
 *  without this the sidebar/header fell back to the email's local part
 *  (e.g. "jane.smith" instead of "Jane Smith"). */
export async function resolveDisplayName(email: string): Promise<string | undefined> {
  const rows = await findUserRows(email);
  return rows.find((r) => r.name)?.name ?? undefined;
}
