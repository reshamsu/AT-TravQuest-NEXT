"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight } from "react-icons/tb";

interface Destination {
  id: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  continent: string[];
  image_urls: string[];
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

const INITIAL_VISIBLE = 4;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (str: string) => str?.trim().toLowerCase();

const allowedUAECities = ["abu dhabi", "dubai", "fujairah", "ras al khaimah"];

const DestinationCard: React.FC<{ dest: Destination; index: number }> = ({
  dest,
  index,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
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
          alt={dest.city}
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
          <motion.p className="text-xs font-extrabold uppercase text-[#f2836f]">
            {dest.continent.join(" · ")}
          </motion.p>
          <motion.h3 className="playfair font-bold text-white text-2xl">
            {dest.city}
          </motion.h3>
          <motion.p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
            {dest.country}
          </motion.p>
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
            transition={{ duration: 0.4, ease: easeOut }}
            style={{ pointerEvents: hovered ? "auto" : "none" }}
          >
            <Link
              href={`/destinations/uae/${slugify(dest.city)}`}
              className="select-none btn-light-sm"
            >
              Explore {dest.city}
            </Link>
          </motion.div>

          {/* Mobile: always-visible arrow button */}
          <div className="flex md:hidden justify-end">
            <Link href={`/destinations/uae/${slugify(dest.city)}`}>
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

const DestinationOther: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    const fetchDestinations = async () => {
      const { data, error } = await supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching destinations:", error.message);
        setDestinations([]);
        return;
      }

      const formatted: Destination[] = [];

      for (const row of data) {
        const country = normalize(row.country);
        const city = normalize(row.city);

        if (
          (country === "uae" || country === "united arab emirates") &&
          allowedUAECities.includes(city)
        ) {
          let images: string[] = [];
          if (Array.isArray(row.image_urls)) images = row.image_urls;
          else if (typeof row.image_urls === "string") {
            try {
              images = JSON.parse(row.image_urls);
            } catch {
              images = [];
            }
          }

          formatted.push({
            id: row.id,
            country: row.country,
            city: row.city,
            tagline: row.tagline,
            description: row.description,
            continent: Array.isArray(row.continent) ? row.continent : [],
            image_urls: images,
          });
        }
      }

      setDestinations(formatted);
    };

    fetchDestinations();
  }, []);

  if (destinations === null) return null;

  const visibleDestinations = destinations.slice(0, visibleCount);
  const hasMore = destinations.length > visibleCount;

  return (
    <div
      className=" bg-linear-to-br from-[#070f19] via-[#0f1e31] to-[#122947] text-white rounded-tl-[3pc] 2xl:rounded-tl-[6pc] rounded-br-[3pc] 2xl:rounded-br-[6pc]"
      id="destinations"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8 py-14 2xl:py-18 px-10 md:px-14 lg:px-10 xl:px-0">
        <motion.div
          className="flex flex-col gap-3 2xl:gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#f2836f]/20 bg-[#f2836f]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]">
            Explore the Emirates
          </p>
          <h3 className="cursive text-3xl 2xl:text-4xl font-bold">
            More to See, More to Love —{" "}
            <span className="text-2xl 2xl:text-3xl text-[#00B5A3]">
              Discover Every Corner of the UAE
            </span>
          </h3>
          <p className="max-w-4xl leading-relaxed text-xs md:text-sm font-medium text-gray-500">
            From the iconic skyline of Dubai to the cultural heart of Abu Dhabi,
            the tranquil shores of Fujairah, and the adventure-filled landscapes
            of Ras Al Khaimah — the UAE offers a world of experiences within one
            extraordinary country.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleDestinations.map((dest, index) => (
            <DestinationCard key={dest.id} dest={dest} index={index} />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setVisibleCount(destinations.length)}
            className="max-w-fit mx-auto select-none btn-orange-outline mt-4"
          >
            Show more Destinations
          </button>
        )}
      </div>
    </div>
  );
};

export default DestinationOther;
