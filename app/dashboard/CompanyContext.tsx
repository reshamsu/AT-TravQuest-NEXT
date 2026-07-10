"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser } from "./UserContext";

export interface CompanyEntry {
  slug: string;
  label: string;
}

interface CompanyCtx {
  company: CompanyEntry;
  loading: boolean;
}

function toSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_COMPANY: CompanyEntry = { slug: "main", label: "Main" };

const CompanyContext = createContext<CompanyCtx>({
  company: FALLBACK_COMPANY,
  loading: false,
});

export function useCompany() {
  return useContext(CompanyContext);
}

// This deployment is single-tenant — TravQuest's own dashboard, always
// scoped to TravQuest's own data. It deliberately does NOT offer the
// Atlas template's cross-tenant "developer" switcher (fetching /api/admin/tenants
// and remembering the active tenant in localStorage): that feature assumes
// one shared multi-tenant deployment, but TravQuest and its sibling Atlas
// sites are separate deployed apps that happen to share one Supabase
// project. The bootstrap owner email resolves to the "developer" role
// across every sibling site, and localStorage is shared per browser origin
// — so when two sibling dev servers both run on the same localhost port at
// different times, the switcher's remembered tenant leaks across apps,
// silently pointing this dashboard's queries at another site's company
// (e.g. showing a real-estate inquiry submitted on a sibling site here).
// Pinning unconditionally to this session's own company removes that leak
// at the root, since no UI in this project ever exposed a switcher anyway.
export function CompanyProvider({ children }: { children: ReactNode }) {
  const { company: sessionCompany } = useUser();
  const company: CompanyEntry = { slug: toSlug(sessionCompany), label: sessionCompany };

  return (
    <CompanyContext.Provider value={{ company, loading: false }}>
      {children}
    </CompanyContext.Provider>
  );
}
