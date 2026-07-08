"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, ChevronDown } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import NotificationBell from "@/components/NotificationBell";
import { IndustryProvider } from "./IndustryContext";
import { CompanyProvider } from "./CompanyContext";
import { UserProvider } from "./UserContext";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Role } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/permissions";

export default function DashboardShell({
  children,
  userName,
  role,
  company,
  agentCode,
}: {
  children: React.ReactNode;
  userName: string;
  role: Role;
  company: string;
  agentCode?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Same company-wide setting Settings > Profile Information uploads to —
  // keeps the sidebar/topbar avatar in sync with whatever's set there.
  useEffect(() => {
    fetch("/api/settings?keys=avatar_url")
      .then((r) => r.json())
      .then((d: Record<string, string>) => { if (d.avatar_url) setAvatarUrl(d.avatar_url); })
      .catch(() => {});
  }, []);

  return (
    <ThemeProvider>
    <UserProvider value={{ userName, initials, role, company, agentCode, avatarUrl }}>
      <CompanyProvider>
      <IndustryProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-dk-surface flex transition-colors duration-300">
          <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-dk-surface/90 backdrop-blur-md border-b border-gray-100 dark:border-dk-stroke px-5 py-3 flex items-center justify-between lg:justify-end gap-4 transition-colors duration-300">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-500 dark:text-gray-400 transition-colors"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2.5">
                <ThemeToggle />

                <NotificationBell />

                <div className="flex items-center gap-2 cursor-pointer group pl-1">
                  <div className="relative w-8 h-8 rounded-full bg-[#f2836f] flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                    ) : (
                      <span className="text-white text-[11px] font-bold">{initials}</span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                      {userName}
                    </span>
                    <span className="text-[10px] font-medium text-[#00B5A3]">
                      {ROLE_LABELS[role]}
                      {agentCode ? ` · ${agentCode}` : ""}
                    </span>
                  </div>
                  <ChevronDown size={13} className="hidden md:block text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </IndustryProvider>
      </CompanyProvider>
    </UserProvider>
    </ThemeProvider>
  );
}
