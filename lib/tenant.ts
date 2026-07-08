// The single default tenant's `company` value — shared by the auth flow
// (at_users rows) and the content tables (at_heroes/at_sections/at_listings/
// at_contact via CompanyContext). Keeping these in sync means a session's
// `company` field actually lines up with the tenant data it's allowed to see.
export const DEFAULT_TENANT_COMPANY = process.env.NEXT_PUBLIC_COMPANY ?? "Main";
