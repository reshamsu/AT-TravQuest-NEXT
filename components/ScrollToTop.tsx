"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    let reloading = false;
    const onPopState = () => {
      if (reloading) return;
      reloading = true;
      router.refresh();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      reloading = false;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);

  return null;
}
