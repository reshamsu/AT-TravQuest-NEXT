"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const HIDE_PREFIXES = ["/login", "/signup", "/dashboard"];

const HideNavbar = () => {
  const pathname = usePathname();

  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return <Navbar />;
};

export default HideNavbar;
