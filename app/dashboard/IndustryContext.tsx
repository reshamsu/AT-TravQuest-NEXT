"use client";

import { createContext, useContext } from "react";

interface IndustryCtx {
  industryId: string;
  setIndustryId: (id: string) => void;
}

// This project is travel only — no industry switcher. Kept as a context
// (rather than removing it) so components written against useIndustry() for
// other Atlas-ecosystem deployments still work unmodified here.
const IndustryContext = createContext<IndustryCtx>({
  industryId: "travel",
  setIndustryId: () => {},
});

export function IndustryProvider({ children }: { children: React.ReactNode }) {
  return (
    <IndustryContext.Provider value={{ industryId: "travel", setIndustryId: () => {} }}>
      {children}
    </IndustryContext.Provider>
  );
}

export const useIndustry = () => useContext(IndustryContext);
