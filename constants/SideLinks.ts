import {
  LayoutDashboard,
  FileText,
  Package,
  Map,
  Receipt,
  UserSquare2,
  Globe,
  BarChart3,
  Users,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { hasNavAccess, type Role } from "@/lib/permissions";

export interface SideLink {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  submenu?: { label: string; href: string }[];
}

export const B2C_Links: SideLink[] = [
  { key: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    // Generic CMS editor — pages, each page's hero, and content sections —
    // plus Discoveries, switched via a mode toggle inside the page itself.
    // No separate hero-section or discoveries manager in the sidebar.
    key: "pages", label: "Pages", href: "/dashboard/pages", icon: FileText,
  },
  {
    key: "destinations", label: "Destinations", href: "/dashboard/destinations", icon: Map,
  },
  {
    key: "listings", label: "Travel Products", href: "/dashboard/listings", icon: Package,
    submenu: [
      { label: "All Products", href: "/dashboard/listings" },
      { label: "Hotels", href: "/dashboard/listings?type=Hotels" },
      { label: "Tours", href: "/dashboard/listings?type=Tours" },
      { label: "Packages", href: "/dashboard/listings?type=Packages" },
      { label: "Visas", href: "/dashboard/listings?type=Visas" },
      { label: "Transfers", href: "/dashboard/listings?type=Transfers" },
      { label: "Promotions", href: "/dashboard/listings?type=Promotions" },
      { label: "Meetings", href: "/dashboard/listings?type=Meetings" },
      { label: "Apartments", href: "/dashboard/listings?type=Apartments" },
      { label: "Shop", href: "/dashboard/listings?type=Shop" },
    ],
  },
  { key: "transactions", label: "Bookings", href: "/dashboard/transactions", icon: Receipt },
  { key: "agents", label: "Partners", href: "/dashboard/agents", icon: UserSquare2 },
  { key: "markets", label: "Market Insights", href: "/dashboard/markets", icon: Globe },
  { key: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export const Account_Links: SideLink[] = [
  { key: "users", label: "Team & Access", href: "/dashboard/users", icon: Users },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
  { key: "logout", label: "Logout", href: "/api/auth/logout", icon: LogOut },
];

export function visibleLinks(
  links: SideLink[],
  role: Role | null,
  section: "industry" | "account",
): SideLink[] {
  if (!role) return [];
  return links.filter((l) => hasNavAccess(role, l.key, section));
}
