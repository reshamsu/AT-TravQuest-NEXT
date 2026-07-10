"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { B2C_Links, Account_Links, visibleLinks, type SideLink } from "@/constants/SideLinks";
import { useUser } from "@/app/dashboard/UserContext";
import { ROLE_LABELS } from "@/lib/permissions";

interface Props {
  open: boolean;
  onClose: () => void;
}

const appName = process.env.NEXT_PUBLIC_APP_NAME || "";

export default function DashboardSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { userName, initials, role, avatarUrl } = useUser();

  const mainLinks = visibleLinks(B2C_Links, role, "industry");
  const accountLinks = visibleLinks(Account_Links, role, "account").filter((l) => l.key !== "logout");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const autoOpen: Record<string, boolean> = {};
    [...mainLinks, ...accountLinks].forEach((link) => {
      if (link.submenu?.some((s) => isActive(s.href))) {
        autoOpen[link.key] = true;
      }
    });
    setOpenMenus(autoOpen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleMenu = (key: string) =>
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderNavItem = (link: SideLink) => {
    const { icon: Icon, label, href, key, submenu } = link;
    const hasSubmenu = Boolean(submenu?.length);
    const isOpen = openMenus[key];
    const childActive = hasSubmenu && (submenu ?? []).some((s) => isActive(s.href));
    const active = isActive(href);
    const parentHighlight = active || childActive;

    if (hasSubmenu) {
      return (
        <div key={key}>
          <button
            onClick={() => toggleMenu(key)}
            className={`
              group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium
              transition-all duration-200 w-full
              ${parentHighlight
                ? "bg-[#f2836f] text-white shadow-[0_4px_16px_-2px_rgba(242,131,111,0.5)]"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dk-raised hover:text-gray-900 dark:hover:text-gray-100"}
            `}
          >
            <Icon
              size={15}
              className={parentHighlight ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}
            />
            <span className="flex-1 text-left">{label}</span>
            {isOpen
              ? <ChevronDown size={12} className={parentHighlight ? "text-white/70" : "text-gray-300 dark:text-gray-600"} />
              : <ChevronRight size={12} className={parentHighlight ? "text-white/70" : "text-gray-300 dark:text-gray-600"} />
            }
          </button>

          {isOpen && (
            <div className="ml-7 mt-0.5 mb-1 flex flex-col gap-0.5 border-l-2 border-gray-100 dark:border-dk-stroke pl-3">
              {(submenu ?? []).map((sub) => {
                const subActive = isActive(sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`
                      flex items-center px-2.5 py-2 rounded-lg text-[11.5px] font-medium
                      transition-all duration-200
                      ${subActive
                        ? "bg-blue-50 dark:bg-dk-raised text-[#00B5A3] font-semibold"
                        : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-dk-raised hover:text-gray-700 dark:hover:text-gray-300"}
                    `}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={key}
        href={href}
        className={`
          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium
          transition-all duration-200 w-full
          ${active
            ? "bg-[#f2836f] text-white shadow-[0_4px_16px_-2px_rgba(242,131,111,0.5)]"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dk-raised hover:text-gray-900 dark:hover:text-gray-100"}
        `}
      >
        <Icon
          size={15}
          className={active ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}
        />
        {label}
      </Link>
    );
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-dk-surface border-r border-gray-100 dark:border-dk-stroke
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
      `}
    >
      <div className="h-0.5 w-full bg-[#f2836f]" />

      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dk-stroke">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.ico" alt={appName} width={40} height={14} className="object-contain" />
          <Image src="/tq-logo.png" alt={appName} width={110} height={14} className="object-contain" />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 tracking-[0.18em] uppercase px-3 mb-3">
          Main Menu
        </p>

        {mainLinks.map(renderNavItem)}

        {accountLinks.length > 0 && (
          <div className="mt-6">
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 tracking-[0.18em] uppercase px-3 mb-3">
              Account
            </p>
            {accountLinks.map(renderNavItem)}
          </div>
        )}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-gray-100 dark:border-dk-stroke">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dk-raised cursor-pointer transition-all duration-200 group">
          <div className="relative w-8 h-8 rounded-full bg-[#f2836f] flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="32px" />
            ) : (
              <span className="text-white text-[11px] font-bold">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate">{userName}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{ROLE_LABELS[role]}</p>
          </div>
          <button
            onClick={() => router.push("/api/auth/logout")}
            className="shrink-0 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}
