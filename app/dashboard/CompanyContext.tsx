"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useUser } from "./UserContext";

export interface CompanyEntry {
  id?: string; // at_tenants row id — only set for developer-visible tenants
  slug: string;
  label: string;
  industry?: string; // remembered per company
}

interface CompanyCtx {
  company: CompanyEntry;
  companies: CompanyEntry[];
  setCompany: (entry: CompanyEntry) => void;
  addCompany: (label: string, industry?: string) => Promise<CompanyEntry>;
  renameCompany: (entry: CompanyEntry, newLabel: string) => Promise<boolean>;
  deleteCompany: (entry: CompanyEntry) => Promise<boolean>;
  loading: boolean;
}

function toSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_COMPANY: CompanyEntry = { slug: "main", label: "Main" };

const CompanyContext = createContext<CompanyCtx>({
  company: FALLBACK_COMPANY,
  companies: [FALLBACK_COMPANY],
  setCompany: () => {},
  addCompany: async () => FALLBACK_COMPANY,
  renameCompany: async () => false,
  deleteCompany: async () => false,
  loading: false,
});

export function useCompany() {
  return useContext(CompanyContext);
}

const industryKey = (slug: string) => `ac_company_industry_${slug}`;
const LS_DEVELOPER_TENANT = "ac_developer_selected_tenant";

interface TenantRow {
  id: string;
  slug: string;
  label: string;
  industry_default?: string;
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { role, company: sessionCompany } = useUser();
  const isDeveloper = role === "developer";

  const ownEntry: CompanyEntry = { slug: toSlug(sessionCompany), label: sessionCompany };

  const [companies, setCompanies] = useState<CompanyEntry[]>([ownEntry]);
  const [company, setCompanyState] = useState<CompanyEntry>(ownEntry);
  const [loading, setLoading] = useState(isDeveloper);

  // Real tenant list for the platform developer, from at_tenants — everyone
  // else is pinned to their own session.company and never fetches anything.
  const loadTenants = useCallback(async () => {
    if (!isDeveloper) {
      setCompanies([ownEntry]);
      setCompanyState(ownEntry);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants");
      const body = res.ok ? (await res.json() as { tenants: TenantRow[] }) : { tenants: [] };

      const entries: CompanyEntry[] = body.tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        label: t.label,
        industry: localStorage.getItem(industryKey(t.slug)) ?? t.industry_default ?? undefined,
      }));
      const list = entries.length ? entries : [ownEntry];
      setCompanies(list);

      const savedSlug = localStorage.getItem(LS_DEVELOPER_TENANT);
      const restored = savedSlug ? list.find((e) => e.slug === savedSlug) : null;
      setCompanyState(restored ?? list[0]);
    } catch {
      setCompanies([ownEntry]);
      setCompanyState(ownEntry);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeveloper, sessionCompany]);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  function setCompany(entry: CompanyEntry) {
    if (!isDeveloper) return; // tenant-scoped roles can't switch — locked to their own company
    setCompanyState(entry);
    localStorage.setItem(LS_DEVELOPER_TENANT, entry.slug);
  }

  // Developer-only: tag an existing tenant's industry, or create a new one — both persist server-side.
  async function addCompany(label: string, industry?: string): Promise<CompanyEntry> {
    if (!isDeveloper) return company;

    const existing = companies.find((c) => c.slug === toSlug(label));
    if (existing) {
      const updated = { ...existing, industry: industry ?? existing.industry };
      if (industry) {
        localStorage.setItem(industryKey(existing.slug), industry);
        if (existing.id) {
          await fetch(`/api/admin/tenants/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ industryDefault: industry }),
          });
        }
      }
      setCompanies((prev) => prev.map((c) => c.slug === existing.slug ? updated : c));
      setCompany(updated);
      return updated;
    }

    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, industryDefault: industry }),
    });
    const body = res.ok ? (await res.json() as { tenant: TenantRow }) : null;

    const entry: CompanyEntry = body
      ? { id: body.tenant.id, slug: body.tenant.slug, label: body.tenant.label, industry: industry ?? body.tenant.industry_default }
      : { slug: toSlug(label), label, industry };

    if (industry) localStorage.setItem(industryKey(entry.slug), industry);
    setCompanies((prev) => [...prev, entry]);
    setCompany(entry);
    return entry;
  }

  // Developer-only: rename a tenant. `slug` is a stable identifier set at
  // creation and never changes — only the display `label` is editable.
  async function renameCompany(entry: CompanyEntry, newLabel: string): Promise<boolean> {
    if (!isDeveloper || !entry.id) return false;
    const label = newLabel.trim();
    if (!label || label === entry.label) return false;

    const res = await fetch(`/api/admin/tenants/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (!res.ok) return false;

    const updated = { ...entry, label };
    setCompanies((prev) => prev.map((c) => c.id === entry.id ? updated : c));
    if (company.id === entry.id) setCompanyState(updated);
    return true;
  }

  // Developer-only: remove a tenant from the roster. Does not touch its
  // underlying content (at_listings_*/at_users/etc are tagged by company
  // label, not FK-linked to at_tenants) — this only removes the tenant record.
  async function deleteCompany(entry: CompanyEntry): Promise<boolean> {
    if (!isDeveloper || !entry.id) return false;

    const res = await fetch(`/api/admin/tenants/${entry.id}`, { method: "DELETE" });
    if (!res.ok) return false;

    const next = companies.filter((c) => c.id !== entry.id);
    setCompanies(next);
    if (company.id === entry.id) {
      const fallback = next[0] ?? ownEntry;
      setCompanyState(fallback);
      localStorage.setItem(LS_DEVELOPER_TENANT, fallback.slug);
    }
    return true;
  }

  return (
    <CompanyContext.Provider value={{ company, companies, setCompany, addCompany, renameCompany, deleteCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  );
}
