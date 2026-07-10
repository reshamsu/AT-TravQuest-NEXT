// Client-side helpers for app/api/dashboard/content/[table] — the protected
// CRUD proxy that replaced direct anon-key writes to CMS content tables.

async function parseResponse<T>(res: Response, dataKey: string): Promise<{ data: T | null; error: string | null }> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { data: null, error: (json as { error?: string }).error ?? `Request failed (${res.status})` };
  return { data: (json as Record<string, unknown>)[dataKey] as T, error: null };
}

export async function apiInsert<T>(table: string, row: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  const res = await fetch(`/api/dashboard/content/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  return parseResponse<T>(res, "data");
}

export async function apiUpdate<T>(
  table: string,
  id: string | number,
  row: Record<string, unknown>,
  matchColumn = "id",
): Promise<{ data: T | null; error: string | null }> {
  const res = await fetch(
    `/api/dashboard/content/${table}?id=${encodeURIComponent(String(id))}&matchColumn=${matchColumn}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) },
  );
  return parseResponse<T>(res, "data");
}

export async function apiDelete(table: string, id: string | number, matchColumn = "id"): Promise<{ error: string | null }> {
  const res = await fetch(
    `/api/dashboard/content/${table}?id=${encodeURIComponent(String(id))}&matchColumn=${matchColumn}`,
    { method: "DELETE" },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: (json as { error?: string }).error ?? `Request failed (${res.status})` };
  return { error: null };
}
