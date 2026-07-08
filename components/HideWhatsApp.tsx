"use client";

import { usePathname } from "next/navigation";
import WhatsAppButton from "./WhatsAppButton";

const HIDE_PREFIXES = ["/login", "/signup", "/dashboard"];

const HideWhatsApp = () => {
  const pathname = usePathname();

  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return <WhatsAppButton />;
};

export default HideWhatsApp;
