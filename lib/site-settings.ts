import { supabaseAdmin } from "@/lib/supabase-admin";

// ac_settings is a flat, global key/value table with NO company column —
// it's shared verbatim across every sibling site on this Supabase project
// (D-Link, TravQuest, TitaniumPro, ...). Writing a bare key like
// "contact_email" would silently overwrite another site's value for the
// same key. Every key this project reads/writes is namespaced with its own
// company tag below so sibling sites can never collide.
const NAMESPACE = `${process.env.NEXT_PUBLIC_COMPANY ?? "TravQuest"}:`;

// Server-only. Reads overridable config from the ac_settings key/value table
// (service-role — bypasses RLS). Callers should fall back to process.env
// when a key is missing, since rows only exist once an admin saves a value
// from /dashboard/settings.
export async function getSiteSettings(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const { data } = await supabaseAdmin
    .from("ac_settings")
    .select("key, value")
    .in("key", keys.map((k) => `${NAMESPACE}${k}`));

  const result: Record<string, string> = {};
  data?.forEach(({ key, value }: { key: string; value: string }) => {
    result[key.slice(NAMESPACE.length)] = value;
  });
  return result;
}
