"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Nav_Links } from "@/constants/NavLinks";
import {
  TbMenu,
  TbX,
  TbChevronDown,
  TbArrowUpRight,
} from "react-icons/tb";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 50);
        if (y > 50) setIsOpen(false);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed z-40 w-full select-none">
      <nav
        className={`max-w-5xl md:max-w-6xl 2xl:max-w-7xl lg:mt-2 2xl:mt-3 lg:mx-auto select-none lg:rounded-full flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-black/80 md:bg-black/40 py-4 px-4 md:px-8 2xl:px-0 backdrop-blur-lg lg:backdrop-blur-none lg:mx-12 2xl:mx-auto"
            : "bg-transparent py-4 px-4 md:px-8 2xl:px-0"
        }`}
      >
        <div className="hidden md:flex items-center gap-2 lg:backdrop-blur-2xl lg:border-2 border-white/5 2xl:py-1 md:my-2 px-4 rounded-full">
          <Link href="/" className="flex items-center">
            <Image
              src="/favicon.ico"
              alt="TQ"
              width={15}
              height={15}
              className="object-contain w-12 h-12"
            />
          </Link>

          <Link href="/" className="flex items-center">
            <Image
              src="/tq-logo.png"
              alt="TQ"
              width={140}
              height={140}
              className="object-contain w-30 h-10"
            />
          </Link>
        </div>

        <div className="block md:hidden">
          <Link href="/" className="flex items-center">
            <Image
              src="/favicon.ico"
              alt="TQ"
              width={50}
              height={50}
              className="object-contain"
            />
          </Link>
        </div>

        <div className="block md:hidden">
          <Link href="/" className="flex items-center">
            <Image
              src="/tq-logo.png"
              alt="TQ"
              width={150}
              height={150}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden h-full gap-1 lg:flex text-[12px] 2xl:text-[11px] backdrop-blur-2xl border-2 border-white/5 py-1.5 px-4 rounded-full">
          {Nav_Links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(link.href + "/");

            return (
              <li key={link.key} className="relative group">
                {link.submenu ? (
                  <button
                    className={`flex items-center cursor-pointer font-semibold transition-all duration-500 rounded-full py-2 px-4
                      ${
                        isActive
                          ? "bg-white font-extrabold"
                          : "hover:font-bold text-white hover:text-black hover:bg-white/60"
                      }`}
                  >
                    {link.label}
                    <TbChevronDown size={16} className="ml-1" />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={`flex items-center cursor-pointer font-semibold transition-all duration-500 rounded-full py-2 px-4
                      ${
                        isActive
                          ? "bg-white font-extrabold"
                          : "hover:font-bold text-white hover:text-black hover:bg-white/60"
                      }`}
                  >
                    {link.label}
                  </Link>
                )}

                {link.submenu && (
                  <ul className="absolute top-full left-0 mt-2 w-[200px] p-2 bg-white border border-gray-100 backdrop-blur-xl font-semibold rounded-2xl shadow-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    {link.submenu.map((sublink) => (
                      <li key={sublink.label}>
                        <Link
                          href={sublink.href}
                          className="flex items-center justify-between py-2 px-4 rounded-xl text-[12.5px] text-gray-800 hover:text-[#f2836f] hover:bg-[#f2836f]/8 transition-all duration-150 group/item"
                        > 
                          {sublink.label}
                          <TbArrowUpRight size={13} className="opacity-0 group-hover/item:opacity-100 text-[#f2836f] transition-opacity duration-150 shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 text-sm select-none">
          <div className="hidden md:flex gap-2 md:ml-6 2xl:ml-8">
            <Link
              href="https://wa.me/971529991223"
              target="_blank"
              rel="noopener noreferrer"
              className="select-none btn-orange-sm btn-dynamic"
            >
              Get in Touch
            </Link>
          </div>
          <button
            aria-label="Open menu"
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
            onClick={() => { setIsOpen(!isOpen); setOpenSubmenu(null); }}
          >
            {isOpen ? (
              <TbX className="w-5 h-5 text-white" />
            ) : (
              <TbMenu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </nav>

      <div
        className={`absolute top-full left-0 w-full overflow-hidden xl:hidden select-none transition-all duration-300 ease-out ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-3 mb-3 bg-[#06101d]/40 backdrop-blur-2xl rounded-3xl border border-white/8 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Links */}
          <ul className="flex flex-col gap-0.5 p-3">
            {Nav_Links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <li key={link.key}>
                  {link.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenSubmenu(openSubmenu === link.key ? null : link.key)}
                        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-3xl text-[13.5px] font-semibold transition-all duration-200 ${
                          isActive ? "text-white bg-white/6" : "text-white/65 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {link.label}
                        <TbChevronDown
                          size={15}
                          className={`opacity-50 transition-transform duration-300 ${openSubmenu === link.key ? "rotate-180 opacity-100" : ""}`}
                        />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${openSubmenu === link.key ? "max-h-64" : "max-h-0"}`}>
                        <div className="ml-4 pl-4 border-l border-white/8 py-1 flex flex-col gap-0.5 mb-1">
                          {link.submenu.map((sublink) => (
                            <Link
                              key={sublink.href}
                              href={sublink.href}
                              onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
                              className="flex items-center justify-between px-3 py-2.5 rounded-3xl text-[13px] text-white/45 hover:text-white hover:bg-white/5 transition-all duration-150 group/sub"
                            >
                              {sublink.label}
                              <TbArrowUpRight size={13} className="opacity-0 group-hover/sub:opacity-100 text-[#f2836f] transition-opacity duration-150 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-3xl text-[13.5px] font-semibold transition-all duration-200 ${
                        isActive ? "text-white bg-white/6" : "text-white/65 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] shrink-0" />}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* CTA */}
          <div className="px-3 pb-3">
            <Link
              href="https://wa.me/971529991223"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-3xl bg-[#f2836f] hover:bg-[#e86f5c] text-white text-[13.5px] font-bold shadow-lg shadow-[#f2836f]/25 active:scale-[0.98] transition-all duration-200"
            >
              Get in Touch <TbArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;