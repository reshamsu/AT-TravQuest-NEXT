"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Copyright } from "lucide-react";
import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedin,
  FaFacebook,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Image from "next/image";
import { Nav_Links } from "@/constants/NavLinks";
import { supabase } from "@/lib/supabase";
import { useCmsSection } from "@/lib/useCmsSection";

const FALLBACK = {
  tagline: "Discover another destination.",
  newsletterTitle: "Plan Your Next Adventure",
  newsletterBody: "Get exclusive travel deals, destination guides, and holiday inspiration.",
};

const slugify = (text: string) =>
  text?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ?? "";

const moreLinks = Nav_Links.find((l) => l.key === "more")?.submenu ?? [];

type NavItem = { label: string; href: string };

/** Trims whitespace-only env/DB values down to "" so an accidental blank
 *  entry doesn't render a broken social link. */
function clean(v?: string): string {
  return (v ?? "").trim();
}

const ENV_DEFAULTS = {
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  facebook_url:    process.env.NEXT_PUBLIC_FACEBOOK_URL,
  instagram_url:   process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  linkedin_url:    process.env.NEXT_PUBLIC_LINKEDIN_URL,
  contact_email:   process.env.NEXT_PUBLIC_EMAIL,
};

const Footer = () => {
  const [exploreLinks, setExploreLinks] = useState<NavItem[]>(
    Nav_Links.find((l) => l.key === "explore-uae")?.submenu ?? []
  );
  const [destinationLinks, setDestinationLinks] = useState<NavItem[]>(
    Nav_Links.find((l) => l.key === "destinations")?.submenu ?? []
  );
  const [settings, setSettings] = useState(ENV_DEFAULTS);

  const cms = useCmsSection("global", 2);
  const tagline = cms?.title || FALLBACK.tagline;
  const newsletterTitle = cms?.subtitle || FALLBACK.newsletterTitle;
  const newsletterBody = cms?.description || FALLBACK.newsletterBody;

  useEffect(() => {
    fetch(`/api/settings?keys=${Object.keys(ENV_DEFAULTS).join(",")}`)
      .then((r) => r.json())
      .then((d: Record<string, string>) => setSettings((p) => ({ ...p, ...d })))
      .catch(() => {});
  }, []);

  const whatsappNumber = clean(settings.whatsapp_number);
  const facebookUrl    = clean(settings.facebook_url);
  const instagramUrl   = clean(settings.instagram_url);
  const linkedinUrl    = clean(settings.linkedin_url);
  const contactEmail   = clean(settings.contact_email);

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
        const uaeItems: NavItem[] = [];
        const destItems: NavItem[] = [];

        for (const row of data as { country: string; city: string }[]) {
          const countryNorm = (row.country ?? "").trim().toLowerCase();
          const cityNorm = (row.city ?? "").trim().toLowerCase();
          if (countryNorm === "uae" || countryNorm === "united arab emirates") {
            if (cityNorm && UAE_CITIES.has(cityNorm) && !seenUae.has(cityNorm)) {
              seenUae.add(cityNorm);
              uaeItems.push({ href: `/destinations/uae/${slugify(row.city)}`, label: row.city });
            }
          } else {
            // Only use root entries (no city) so hiding a country's root entry removes it from the footer
            if (!cityNorm && !seenCountry.has(countryNorm)) {
              seenCountry.add(countryNorm);
              destItems.push({ href: `/destinations/${slugify(row.country)}`, label: row.country });
            }
          }
        }

        if (uaeItems.length > 0) setExploreLinks(uaeItems);
        if (destItems.length > 0) setDestinationLinks(destItems);
      });
  }, []);

  return (
    <footer className="relative bg-gray-950 text-gray-500 border-t border-white/10 overflow-hidden">
      {/* Background image */}
      <Image
        src="/beach.jpg"
        alt=""
        fill
        className="object-cover object-center opacity-[0.12]"
        priority={false}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-black/90 via-[#00B5A3]/8 to-[#f2836f]/35" />

      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6 sm:px-12 2xl:px-0 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-12 w-full pb-10 border-b border-white/10">
          <div className="flex flex-col items-center text-center md:items-start md:text-start gap-6 w-full md:w-xs">
            <Link
              href="/"
              className="flex flex-col items-center md:items-start gap-4"
            >
              <Image
                src="/favicon.ico"
                alt="X"
                width={64}
                height={20}
                className="object-contain"
              />
              <Image
                src="/tq-logo.png"
                alt="TravQuest"
                width={150}
                height={18}
                className="object-contain"
              />{" "}
              <div>
                <p className="text-[11px] text-white uppercase font-semibold">
                  {tagline}
                </p>
              </div>
            </Link>

            <ul className="flex gap-2 text-lg">
              {[
                { label: "WhatsApp",  href: whatsappNumber ? `https://wa.me/${whatsappNumber}` : null, Icon: FaWhatsapp,  teal: true },
                { label: "Facebook",  href: facebookUrl || null,  Icon: FaFacebook,  teal: false },
                { label: "Instagram", href: instagramUrl || null, Icon: FaInstagram, teal: false },
                { label: "LinkedIn",  href: linkedinUrl || null,  Icon: FaLinkedin,  teal: true },
                { label: "Email",     href: contactEmail ? `mailto:${contactEmail}` : null, Icon: FaEnvelope, teal: false },
              ].filter((s) => s.href).map(({ label, href, Icon, teal }) => (
                <li key={label}>
                  <Link
                    href={href!}
                    target={label === "Email" ? undefined : "_blank"}
                    rel={label === "Email" ? undefined : "noopener noreferrer"}
                    className={`flex rounded-xl bg-white/5 border border-white/10 hover:scale-105 duration-500 text-white/40 p-2 transition-colors ${
                      teal
                        ? "hover:bg-[#00B5A3]/10 hover:border-[#00B5A3]/20 hover:text-[#00B5A3]"
                        : "hover:bg-[#f2836f]/10 hover:border-[#f2836f]/20 hover:text-[#f2836f]"
                    }`}
                  >
                    <Icon size={18} />
                  </Link>
                </li>
              ))}
            </ul>

            <a
              href="https://maps.app.goo.gl/f8BFgTL4j6HWvfk49"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group text-left border border-white/8 hover:border-[#f2836f]/25 bg-white/3 hover:bg-[#f2836f]/5 rounded-xl px-4 py-3 transition-all duration-300"
            >
              <FaMapMarkerAlt size={15} className="text-[#f2836f] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2836f] mb-1">Our Office</p>
                <p className="text-[12px] text-white/70 leading-relaxed group-hover:text-white transition-colors duration-300">
                  PO Box 35195, Meydan Business Center,<br />
                  Meydan, Nad Al Sheba 1, Dubai,<br />
                  UAE, United Arab Emirates
                </p>
              </div>
            </a>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full text-[12px] font-medium">
            {/* Explore UAE */}
            <div>
              <h6 className="text-sm font-semibold mb-3 text-white">
                Explore UAE
              </h6>
              <ul className="flex flex-col gap-2">
                {exploreLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-[#f2836f] hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Destinations */}
            <div>
              <h6 className="text-sm font-semibold mb-3 text-white">
                Destinations
              </h6> 
              <ul className="flex flex-col gap-2">
                {destinationLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-[#f2836f] hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* More */}
            <div>
              <h6 className="text-sm font-semibold mb-3 text-white">More</h6>
              <ul className="flex flex-col gap-2">
                {moreLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-[#f2836f] hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h6 className="text-sm font-semibold mb-3 text-white">Company</h6>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Contact Us", href: "/contact" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms & Conditions", href: "/terms" },
                  { label: "Careers", href: "/contact" },
                  { label: "Travel Tips", href: "/more/visa-assistance" },
                ].map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="hover:text-[#f2836f] hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-white/10">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h6 className="text-white text-sm font-semibold">
              {newsletterTitle}
            </h6>
            <p className="text-xs text-gray-400">
              {newsletterBody}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-2.5 rounded-3xl text-xs bg-white/10 text-white"
            />
            <button className="btn-primary-sm">Subscribe</button>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="flex flex-col sm:flex-row items-center text-center text-xs font-medium w-full">
          <div className="flex items-center gap-1.5">
            <Copyright size={12} />
            <span>2026</span>
            <span className="text-white/20">·</span>
            <span>The TravQuest Travel and Tourism L.L.C-FZ</span>
            <span className="text-white/20">·</span>
            <span>All Rights Reserved.</span>
          </div>
          {/* <div>
            Powered by{" "}
            <Link
              href="https://atlascreate.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline"
            >
              Atlas&apos;Create
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
