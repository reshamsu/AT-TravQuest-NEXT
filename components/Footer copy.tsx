"use client";

import Link from "next/link";
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import { TbMail } from "react-icons/tb";
import Image from "next/image";
import { Nav_Links } from "@/constants/NavLinks";
import { Copyright } from "lucide-react";

const exploreLinks = [
  { label: "Abu Dhabi", href: "/destinations/uae/abu-dhabi" },
  { label: "Dubai", href: "destinations/uae/dubai" },
  { label: "Fujairah", href: "/destinations/uae/fujairah" },
  { label: "Ras Al Khaimah", href: "/destinations/uae/ras-al-khaimah" },
];

const destinationLinks = [
  { label: "Sri Lanka", href: "/destinations/sri-lanka" },
  { label: "Maldives", href: "/destinations/maldives" },
  { label: "Singapore", href: "/destinations/singapore" },
  { label: "Thailand", href: "/destinations/thailand" },
  { label: "Malaysia", href: "/destinations/malaysia" },
  { label: "Georgia", href: "/destinations/georgia" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  // { label: "Resource and Policy", href: "/policy" },
  // { label: "Careers", href: "/careers" },
  // { label: "Trust and Safety", href: "/trust-and-safety" },
  { label: "Contact Us", href: "/contact" },
];

const moreNavLink = Nav_Links.find((link) => link.key === "more");
const moreLinks = moreNavLink?.submenu || [];

const Footer = () => {
  return (
    <footer className="relative text-gray-400 border-t border-black/10 overflow-hidden">
      <Image
        src="/beach.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center -z-10"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-black/95 via-[#0f1e31]/90 to-[#f2836f]/70" />

      <div className="max-w-6xl mx-auto py-16 px-6 sm:px-12 2xl:px-0 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-12 w-full pb-10 border-b border-white/10">
          <div className="flex flex-col items-center text-center md:items-start md:text-start gap-6 w-full md:w-sm">
            <Link
              href="/"
              className="flex flex-col items-center md:items-start gap-4"
            >
              <Image
                src="/favicon.ico"
                alt="TQ"
                width={60}
                height={30}
                className="object-contain"
              />
              <Image
                src="/tq-logo.png"
                alt="TQ"
                width={160}
                height={130}
                className="object-contain"
              />
            </Link>

            <ul className="flex gap-2 text-xl">
              <li>
                <Link
                  href="https://wa.me/971529991223"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with us on WhatsApp"
                  className="flex rounded-xl bg-white/10 hover:bg-[#00B5A3]/10 border border-white/10 p-2 hover:border-[#00B5A3]/20 hover:scale-105 duration-500 text-gray-400 hover:text-[#00B5A3]"
                >
                  <FaWhatsapp aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.facebook.com/The-TravQuest-Travel-and-Tourism-LLC-61575280895213"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Facebook"
                  className="flex rounded-xl bg-white/10 hover:bg-[#00B5A3]/10 border border-white/10 p-2 hover:border-[#00B5A3]/20 hover:scale-105 duration-500 text-gray-400 hover:text-[#00B5A3]"
                >
                  <FaFacebook aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.instagram.com/trav.quest/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="flex rounded-xl bg-white/10 hover:bg-[#00B5A3]/10 border border-white/10 p-2 hover:border-[#00B5A3]/20 hover:scale-105 duration-500 text-gray-400 hover:text-[#00B5A3]"
                >
                  <FaInstagram aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect with us on LinkedIn"
                  className="flex rounded-xl bg-white/10 hover:bg-[#00B5A3]/10 border border-white/10 p-2 hover:border-[#00B5A3]/20 hover:scale-105 duration-500 text-gray-400 hover:text-[#00B5A3]"
                >
                  <FaLinkedin aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:info@thetravquest.com"
                  aria-label="Email us"
                  className="flex rounded-xl bg-white/10 hover:bg-[#00B5A3]/10 border border-white/10 p-2 hover:border-[#00B5A3]/20 hover:scale-105 duration-500 text-gray-400 hover:text-[#00B5A3]"
                >
                  <TbMail aria-hidden="true" />
                </Link>
              </li>
            </ul>

            <address className="flex flex-col gap-1 text-sm not-italic">
              <a
                href="tel:+971529991223"
                className="hover:underline hover:scale-105 duration-500 inline-block"
              >
                +971 52 999 1223
              </a>
              <a
                href="mailto:info@thetravquest.com"
                className="hover:underline hover:scale-105 duration-500 inline-block"
              >
                info@thetravquest.com
              </a>
              <p className="select-none">
                PO Box 35195, Meydan, Dubai, United Arab Emirates
              </p>
            </address>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col items-center md:items-end justify-center md:justify-between gap-8 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full text-xs">
              <div className="ml-0 lg:ml-16 xl:ml-10">
                <h6 className="text-sm font-semibold mb-4 text-white">
                  Explore UAE
                </h6>
                <ul className="flex flex-col gap-2">
                  {exploreLinks.map(({ label, href }) => (
                    <li key={label}>
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

              <div className="ml-0 lg:ml-8">
                <h6 className="text-sm font-semibold mb-4 text-white">
                  Destinations
                </h6>
                <ul className="flex flex-col gap-2.5">
                  {destinationLinks.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="hover:text-[#f2836f] hover:underline text-left"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ml-0 xl:ml-4">
                <h6 className="text-sm font-semibold mb-4 text-white">More</h6>
                <ul className="flex flex-col gap-2.5">
                  {moreLinks.map(({ label, href }) => (
                    <li key={label}>
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

              <div className="ml-0 xl:ml-10">
                <h6 className="text-sm font-semibold mb-4 text-white">
                  TravQuest
                </h6>
                <ul className="flex flex-col gap-2.5">
                  {companyLinks.map(({ label, href }) => (
                    <li key={label}>
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
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-white/10 w-full">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h6 className="text-white text-sm font-semibold">
              Stay in the loop
            </h6>
            <p className="text-xs text-gray-500">
              Subscribe for tourism deals, updates, and exclusive offers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-2.5 rounded-3xl text-sm bg-white/10 text-white"
            />
            <button className="btn-primary-sm">Subscribe</button>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-semibold w-full">
          <div className="flex items-start sm:items-center gap-1.5">
            <Copyright size={12} />
            <span className="text-center">
              2026 The TravQuest Travel & Tourism LLC. <br className="block sm:hidden"/> All Rights Reserved.
            </span>
          </div>
          <div>
            Powered by{" "}
            <Link
              href="https://atlascreate.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline"
            >
              Atlas&apos;Create
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
