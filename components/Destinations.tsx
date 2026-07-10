"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight, TbChevronLeft, TbChevronRight } from "react-icons/tb";
import type { DestinationRow } from "@/lib/useHomeData";

interface Destination {
  id: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  continent: string[];
  image_urls: string[];
  displayLabel: string;
  slug: string;
  isCity: boolean;
}

const easeOut: Transition["ease"] = [0.25, 0.1, 0.25, 1];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOut },
  }),
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (str: string) => str?.trim().toLowerCase();

// UAE cities allowed for display & routing
const allowedUAECities = ["abu dhabi", "dubai", "fujairah", "ras al khaimah"];

const DestinationCard: React.FC<{ dest: Destination; index: number }> = ({
  dest,
  index,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      key={dest.id}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-tl-4xl rounded-br-4xl overflow-hidden h-[50vh] shadow-lg shadow-white/5"
      style={{
        border: hovered
          ? "2px solid rgba(242,131,111,0.5)"
          : "2px solid rgba(255,255,255,0.15)",
        transition: "border-color 0.6s ease",
      }}
    >
      {/* Image */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          scale: hovered ? 1.12 : 1,
          x: hovered ? -6 : 0,
          y: hovered ? -6 : 0,
        }}
        transition={{ duration: 1.1, ease: easeOut }}
      >
        <Image
          src={dest.image_urls?.[0] || "/assets/banner/property1.webp"}
          alt={dest.displayLabel}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </motion.div>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: hovered
            ? "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.75) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%, rgba(242,131,111,0.38) 100%)",
        }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-7 text-white">
        <div className="flex flex-col gap-2">
          <motion.p className="text-xs font-bold uppercase text-[#f2836f]">
            {dest.continent.join(" · ")}
          </motion.p>

          <motion.h3 className="cursive font-extrabold text-white text-3xl group-hover:text-3xl duration-600">
            {dest.displayLabel}
          </motion.h3>

          {/* City cards: show country as context label */}
          {dest.isCity && (
            <motion.p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
              {dest.country}
            </motion.p>
          )}

          {dest.tagline && (
            <motion.p className="text-xs font-semibold text-white/80 leading-snug">
              {dest.tagline}
            </motion.p>
          )}

          {dest.description && (
            <motion.p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
              {dest.description}
            </motion.p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Desktop: hover-reveal See More button */}
          <motion.div
            className="hidden md:block"
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 12 }}
            style={{ pointerEvents: hovered ? "auto" : "none" }}
          >
            <Link
              href={`/destinations/${dest.slug}`}
              className="select-none btn-light-sm"
            >
              Explore {dest.displayLabel}
            </Link>
          </motion.div>

          {/* Mobile: always-visible arrow button */}
          <div className="flex md:hidden justify-end">
            <Link href={`/destinations/${dest.slug}`}>
              <motion.div
                animate={{
                  backgroundColor: hovered
                    ? "rgba(242,131,111,0.9)"
                    : "rgba(255,255,255,0.1)",
                  borderColor: hovered
                    ? "rgba(242,131,111,0.6)"
                    : "rgba(255,255,255,0.2)",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 border backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <TbArrowUpRight size={26} className="text-white" />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const processDestinations = (raw: DestinationRow[]): Destination[] => {
  const seenUae = new Set<string>();
  const seenCountry = new Set<string>();
  const processed: Destination[] = [];

  for (const row of raw) {
    const country = normalize(row.country);
    const city = normalize(row.city ?? "");

    if (country === "uae" || country === "united arab emirates") {
      if (city && allowedUAECities.includes(city) && !seenUae.has(city)) {
        seenUae.add(city);
        processed.push({
          ...row,
          displayLabel: row.city,
          slug: `uae/${slugify(row.city)}`,
          isCity: true,
        });
      }
      continue;
    }

    // Only use root entries (no city) so hiding the country-level row removes it from the carousel
    if (!city && !seenCountry.has(country)) {
      seenCountry.add(country);
      processed.push({
        ...row,
        displayLabel: row.country,
        slug: slugify(row.country),
        isCity: false,
      });
    }
  }

  const continentOrder = (dest: Destination): number => {
    const continents = dest.continent.map((c) => c.trim().toLowerCase());
    if (continents.some((c) => c.includes("asia"))) return 0;
    if (continents.some((c) => c.includes("middle east") || c.includes("uae"))) return 1;
    return 2;
  };

  return processed.sort((a, b) => continentOrder(a) - continentOrder(b));
};

const Destination: React.FC<{ initialData?: DestinationRow[] }> = ({ initialData }) => {
  const [destinations, setDestinations] = useState<Destination[] | null>(
    initialData?.length ? processDestinations(initialData) : null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 16 : 300;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  useEffect(() => {
    if (initialData?.length) return;

    const fetchDestinations = async () => {
      const { data, error } = await supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setDestinations([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: DestinationRow[] = data.map((row: any) => ({
        id: row.id,
        country: row.country,
        city: row.city,
        tagline: row.tagline,
        description: row.description,
        continent: Array.isArray(row.continent) ? row.continent : [],
        image_urls: Array.isArray(row.image_urls)
          ? row.image_urls
          : (() => { try { return JSON.parse(row.image_urls); } catch { return []; } })(),
      }));

      setDestinations(processDestinations(formatted));
    };

    fetchDestinations();
  }, [initialData]);

  if (destinations !== null && destinations.length === 0) return null;

  if (!destinations) return (
    <div className="bg-gradient-to-br from-[#070f19] via-[#0f1e31] to-[#122947] rounded-tl-[3pc] 2xl:rounded-tl-[6pc] rounded-br-[3pc] 2xl:rounded-br-[6pc]">
      <div className="max-w-6xl mx-auto py-14 px-10 md:px-14 lg:px-10 xl:px-0 flex flex-col gap-8 animate-pulse">
        {/* Header row */}
        <div className="flex flex-col gap-4">
          <div className="h-7 w-52 bg-white/10 rounded-full" />
          <div className="h-9 w-80 bg-white/10 rounded-lg" />
          <div className="h-4 w-64 bg-white/5 rounded-full" />
        </div>
        {/* Cards */}
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-none w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] h-[50vh] bg-white/5 rounded-tl-4xl rounded-br-4xl" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#070f19] via-[#0f1e31] to-[#122947] text-white rounded-tl-[3pc] 2xl:rounded-tl-[6pc] rounded-br-[3pc] 2xl:rounded-br-[6pc]" id="destinations">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 py-14 2xl:py-22 px-10 md:px-14 lg:px-10 xl:px-0">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-2 text-[11px] 2xl:text-sm w-fit font-extrabold uppercase border border-[#f2836f]/20 bg-[#f2836f]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] animate-pulse" />{" "}
              Where dreams take flight
            </p>
            <h3 className="cursive text-3xl 2xl:text-4xl font-bold">
              Let&apos;s Travel Around the Globe…{" "}
              <span className="text-[#00B5A3]">
                One Destination at a Time
              </span>
            </h3>
            <p className="max-w-2xl leading-relaxed text-xs md:text-sm font-medium text-gray-500">
              Explore destinations across the world with curated highlights.
            </p>
          </div>
        </motion.div>

        {/* Horizontal slider with floating arrows */}
        <div className="relative">
          {/* Left floating arrow */}
          <motion.button
            onClick={() => scroll("left")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 border border-white/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#f2836f] hover:border-[#f2836f] shadow-lg transition-colors duration-300"
          >
            <TbChevronLeft size={22} />
          </motion.button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {destinations.map((dest, index) => (
              <div
                key={dest.id}
                className="flex-none snap-start w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
              >
                <DestinationCard dest={dest} index={index} />
              </div>
            ))}
          </div>

          {/* Right floating arrow */}
          <motion.button
            onClick={() => scroll("right")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 border border-white/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#f2836f] hover:border-[#f2836f] shadow-lg transition-colors duration-300"
          >
            <TbChevronRight size={22} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Destination;
