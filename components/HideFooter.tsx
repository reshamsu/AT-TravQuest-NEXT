"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const HIDE_PREFIXES = ["/login", "/signup", "/not-found", "/dashboard"];

const HideFooter = () => {
  const pathname = usePathname();

  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return <Footer />;
};

export default HideFooter;
