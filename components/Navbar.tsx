"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Nav_Links } from "@/constants/NavLinks";
import { Menu, X, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

const slugify = (text: string) =>
  text?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ?? "";

const Navbar = () => {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : ""
  );
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [navLinks, setNavLinks] = useState(Nav_Links);
  const [contactPhone, setContactPhone] = useState(process.env.NEXT_PUBLIC_PHONE ?? "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/api/settings?keys=contact_phone")
      .then((r) => r.json())
      .then((d: Record<string, string>) => { if (d.contact_phone) setContactPhone(d.contact_phone); })
      .catch(() => {});
  }, []);

  const telHref = `tel:${contactPhone.replace(/\D/g, "")}`;

  useEffect(() => {
    supabase
      .from("ac_destinations")
      .select("country, city")
      .neq("status", "Hidden")
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data }) => {
        if (!data) return;
        const UAE_CITIES = new Set(["abu dhabi", "dubai", "fujairah", "ras al khaimah"]);
        const seenUae = new Set<string>();
        const seenCountry = new Set<string>();
        const uaeItems: { href: string; label: string }[] = [];
        const destItems: { href: string; label: string }[] = [];

        for (const row of data as { country: string; city: string }[]) {
          const countryNorm = (row.country ?? "").trim().toLowerCase();
          const cityNorm = (row.city ?? "").trim().toLowerCase();

          if (countryNorm === "uae" || countryNorm === "united arab emirates") {
            // Explore UAE: show only city-level entries that are in the allowed set
            if (cityNorm && UAE_CITIES.has(cityNorm) && !seenUae.has(cityNorm)) {
              seenUae.add(cityNorm);
              uaeItems.push({ href: `/destinations/uae/${slugify(row.city)}`, label: row.city });
            }
          } else {
            // Destinations: only use root entries (no city) to control which countries appear
            if (!cityNorm && !seenCountry.has(countryNorm)) {
              seenCountry.add(countryNorm);
              destItems.push({ href: `/destinations/${slugify(row.country)}`, label: row.country });
            }
          }
        }

        setNavLinks((prev) =>
          prev.map((link) => {
            if (link.key === "explore-uae" && uaeItems.length > 0)
              return { key: link.key, label: link.label, submenu: uaeItems };
            if (link.key === "destinations" && destItems.length > 0)
              return { key: link.key, label: link.label, submenu: destItems };
            return link;
          })
        );
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (isOpen) setIsOpen(false);
      setOpenSubmenu(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.getElementById(href.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
        setActiveHash(href);
      }
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header ref={navRef} className="fixed z-40 w-full select-none">
      <nav
        className={`relative max-w-5xl md:max-w-6xl 2xl:max-w-7xl lg:mx-auto select-none lg:rounded-full flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-black/80 md:bg-black/60 py-1.5 px-4 md:px-8 2xl:px-6 lg:mt-2 backdrop-blur-lg lg:backdrop-blur-none lg:mx-12 2xl:mx-auto"
            : "bg-transparent py-1.5 lg:py-4 px-4 md:px-8 2xl:px-0"
        }`}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2 lg:backdrop-blur-2xl lg:border-2 border-white/5 py-2 md:my-0.5 lg:px-4 rounded-full">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="X"
              width={50}
              height={20}
              className="object-contain"
            />
            <Image
              src="/tq-logo.png"
              alt="TravQuest"
              width={125}
              height={20}
              className="object-contain hidden md:block"
            />
          </Link>
        </div>

        {/* Center: Nav links (desktop) */}
        <ul className="hidden lg:flex items-center gap-2.5 text-[11px] backdrop-blur-2xl border-2 border-white/5 py-2 px-4 rounded-full font-medium">
          {navLinks.map((link) => {
            if (link.submenu) {
              const isActive = link.submenu.some((sub) =>
                pathname.startsWith(sub.href),
              );
              const isSubmenuOpen = openSubmenu === link.key;
              return (
                <li
                  key={link.key}
                  className="relative"
                >
                  <button
                    onClick={() => setOpenSubmenu(isSubmenuOpen ? null : link.key)}
                    className={`relative flex items-center gap-1 py-1.5 px-4 rounded-full transition-colors duration-300
                      after:absolute after:bottom-0 after:left-0 after:h-[2px] after:rounded-full
                      after:transition-all after:duration-300 after:ease-in-out
                      ${
                        isActive
                          ? "text-[#f2836f] after:w-full bg-[#f2836f]/10 font-semibold"
                          : "text-white/90 hover:text-white font-semibold hover:bg-black/10"
                      }`}
                  >
                    {link.label}
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isSubmenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <ul className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur-xl border border-white p-2 transition-all duration-200 ${
                    isSubmenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                  }`}>
                    {link.submenu.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          onClick={() => setOpenSubmenu(null)}
                          className={`block px-4 py-2.5 rounded-lg text-[11px] transition-colors duration-150 ${
                            pathname.startsWith(sub.href)
                              ? "text-[#f2836f] after:w-full bg-[#f2836f]/10 font-semibold"
                              : "text-black/90 hover:text-black font-semibold hover:bg-black/10"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            const href = link.href!;
            const isActive = href.startsWith("#")
              ? activeHash === href
              : pathname === href ||
                (href !== "/" && pathname.startsWith(href));

            return (
              <li key={link.key}>
                <Link
                  href={href}
                  onClick={(e) => handleNavClick(e, href)}
                  className={`relative flex items-center py-1.5 px-4 rounded-full transition-colors duration-300
                  after:absolute after:bottom-0 after:left-0 after:h-[2px] after:rounded-full
                  after:transition-all after:duration-300 after:ease-in-out
                  ${
                    isActive
                      ? "text-[#f2836f] after:w-full bg-[#f2836f]/10 font-medium"
                      : "text-white/90 hover:text-white font-medium hover:bg-black/10"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Center: tq-logo (mobile only) */}
        <div className="md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <Link href="/" className="pointer-events-auto">
            <Image
              src="/tq-logo.png"
              alt="TravQuest"
              width={140}
              height={20}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Right: Get in Touch (desktop) + Hamburger (mobile) */}
        <div className="flex items-center gap-3 justify-end text-[12px]">
          <div className="hidden md:flex items-center">
            <Link
              href={telHref}
              target="_blank"
              rel="noopener noreferrer"
              className="select-none btn-primary-base"
            >
              Call Us Now
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <button
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="w-fit h-10 flex items-center justify-center rounded-full transition-all duration-200 text-white"
            >
              {isOpen ? <X size={30} /> : <Menu size={30} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 left-0 lg:hidden"
          onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <div
        className={`absolute top-full left-0 right-0 lg:hidden rounded-b-3xl bg-black/60 backdrop-blur-3xl border border-white/[0.08] overflow-hidden transition-all duration-300 origin-top ${
          isOpen
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="h-px w-full" />

        <ul className="flex flex-col p-4">
          {navLinks.map((link) => {
            if (link.submenu) {
              const isActive = link.submenu.some((sub) =>
                pathname.startsWith(sub.href),
              );
              const isSubmenuOpen = openSubmenu === link.key;
              return (
                <li key={link.key}>
                  <button
                    onClick={() =>
                      setOpenSubmenu(isSubmenuOpen ? null : link.key)
                    }
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13.5px] transition-all duration-150 ${
                      isActive
                        ? "text-[#f2836f] bg-[#f2836f]/10 font-medium"
                        : "text-white/90 hover:text-[#f2836f] font-medium hover:bg-[#f2836f]/10"
                    }`}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${isSubmenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isSubmenuOpen ? `${link.submenu.length * 44 + 24}px` : "0px" }}
                  >
                    <ul className="mt-1.5 mx-2 flex flex-col gap-0.5 max-h-60 overflow-y-auto rounded-xl bg-white/95 backdrop-blur-xl border border-white/20 p-1.5">
                      {link.submenu.map((sub) => {
                        const isSubActive = pathname.startsWith(sub.href);
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-150 ${
                                isSubActive
                                  ? "text-[#f2836f] bg-[#f2836f]/10"
                                  : "text-black/90 hover:text-black hover:bg-black/10"
                              }`}
                            >
                              {sub.label}
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] shrink-0" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            const href = link.href!;
            const isActive = pathname.startsWith(href);
            return (
              <li key={link.key}>
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13.5px] transition-all duration-150 ${
                    isActive
                      ? "text-[#f2836f] bg-[#f2836f]/10 font-medium"
                      : "text-white/90 hover:text-[#f2836f] font-medium hover:bg-[#f2836f]/10"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <div className="flex items-center">
            <Link
              href={telHref}
              className="mt-4 m-2 select-none btn-secondary-base"
            >
              Call Us Now
            </Link>
          </div>
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
