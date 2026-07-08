export type Role = "developer" | "super_admin" | "admin" | "manager" | "agent" | "staff";

export const ROLE_LABELS: Record<Role, string> = {
  developer: "System Admin",
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  staff: "Staff",
};

// Higher = more privilege. `developer` is the platform operator — the only
// rank with cross-tenant access (see /admin and CompanyContext). Every other
// rank is scoped to a single tenant (session.company).
export const ROLE_RANK: Record<Role, number> = {
  developer: 6,
  super_admin: 5,
  admin: 4,
  manager: 3,
  agent: 2,
  staff: 1,
};

// DB display names ↔ internal Role keys
export const ROLE_DB_TO_KEY: Record<string, Role> = {
  "System Admin": "developer",
  "Super Admin": "super_admin",
  Admin: "admin",
  Manager: "manager",
  Agent: "agent",
  Staff: "staff",
  // Legacy
  Developer: "developer",
  Editor: "staff",
  Viewer: "staff",
};

export const ROLE_KEY_TO_DB: Record<Role, string> = {
  developer: "System Admin",
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  staff: "Staff",
};

export function isPlatformDeveloper(role: Role): boolean {
  return role === "developer";
}

// ── Navigation visibility ─────────────────────────────────────────────────────

// Keys from SideLinks that each role may see (main nav) — this project is
// travel only, single vertical: overview, pages (CMS + hero sections +
// discoveries, all switched via a mode toggle inside the page), destinations,
// listings, agents, transactions, markets, analytics.
const INDUSTRY_ALLOWED: Record<Role, string[] | "*"> = {
  developer: "*",
  super_admin: "*",
  admin: "*",
  manager: ["overview", "pages", "destinations", "listings", "agents", "transactions", "markets", "analytics"],
  agent: ["overview", "destinations", "listings", "agents", "transactions", "markets", "analytics"],
  staff: ["overview", "destinations", "listings", "agents", "transactions", "markets", "analytics"],
};

// Keys from Account_Links that each role may see
const ACCOUNT_ALLOWED: Record<Role, string[] | "*"> = {
  developer: "*",
  super_admin: "*",
  admin: ["users", "settings"],
  manager: ["users"],
  agent: [],
  staff: [],
};

export function hasNavAccess(
  role: Role,
  key: string,
  section: "industry" | "account",
): boolean {
  const allowed = section === "industry" ? INDUSTRY_ALLOWED[role] : ACCOUNT_ALLOWED[role];
  if (allowed === "*") return true;
  return (allowed as string[]).includes(key);
}

// ── Route access (used in middleware) ────────────────────────────────────────

// `/admin` is the platform-operator console — cross-tenant, developer-only.
// Every tenant-scoped role (including super_admin, which owns exactly one
// tenant) is blocked from it. This project is travel only and single
// vertical, so the remaining routes are just settings/users/pages.
const BLOCKED_PREFIXES: Record<Role, string[]> = {
  developer: [],
  super_admin: ["/admin"],
  admin: ["/admin"],
  manager: ["/admin", "/dashboard/settings"],
  agent: ["/admin", "/dashboard/settings", "/dashboard/users", "/dashboard/pages"],
  staff: ["/admin", "/dashboard/settings", "/dashboard/users", "/dashboard/pages"],
};

export function canAccess(role: Role, path: string): boolean {
  const blocked = BLOCKED_PREFIXES[role] ?? [];
  return !blocked.some((b) => path === b || path.startsWith(b + "/"));
}

// ── Action-level helpers ──────────────────────────────────────────────────────

export function canManageRole(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}

export function isReadOnly(role: Role): boolean {
  return role === "staff";
}

export function canManageUsers(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK["admin"];
}

export function canViewUsers(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK["manager"];
}

export function canAccessSettings(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK["admin"];
}
