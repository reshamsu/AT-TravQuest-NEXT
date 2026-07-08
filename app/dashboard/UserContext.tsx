"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/permissions";
import { DEFAULT_TENANT_COMPANY } from "@/lib/tenant";

interface UserCtx {
  userName: string;
  initials: string;
  role: Role;
  company: string;
  agentCode?: string;
  avatarUrl?: string;
}

const UserContext = createContext<UserCtx>({
  userName: "",
  initials: "",
  role: "admin",
  company: DEFAULT_TENANT_COMPANY,
  avatarUrl: "",
});

export function useUser() {
  return useContext(UserContext);
}

export const UserProvider = UserContext.Provider;
