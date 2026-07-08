"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight } from "react-icons/tb";
import Link from "next/link";
import type { ApartRow } from "@/lib/useHomeData";

interface ServiceData {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
}

const APART_PAGE_ID = "apartment-for-monthly-stays";
const APART_LABEL = "Apartment for Monthly Stays";

const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }
  return [];
};

const FALLBACK_IMAGE = "/assets/service.webp";

const ApartCard: React.FC<{
  item: ServiceData;
  index: number;
}> = ({ item, index }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative w-full h-[45vh] md:h-[35vh] lg:h-[48vh] rounded-4xl overflow-hidden shadow-lg cursor-pointer outline-4 outline-offset-8 outline-[#f2836f]/60"
    >
      {/* Image */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: hovered ? 1.05 : 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={item.image_urls?.[0] || FALLBACK_IMAGE}
          alt={item.hero_title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 72rem"
          className="object-cover"
        />
      </motion.div>

      {/* Gradient overlay */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{
          background: hovered
            ? "linear-gradient(to top, rgba(7,15,25,0.92) 0%, rgba(7,15,25,0.45) 55%, transparent 100%)"
            : "linear-gradient(to top, rgba(7,15,25,0.75) 0%, rgba(7,15,25,0.2) 60%, transparent 100%)",
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Left teal accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#f2836f] z-20 origin-bottom rounded-r-full"
        animate={{ scaleY: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 2xl:p-10">
        {item.page_type?.[0] && (
          <div className="mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest bg-[#f2836f]/20 border border-[#f2836f]/40 text-[#f2836f] px-3 py-1 rounded-lg backdrop-blur-sm">
              {item.page_type[0]}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold leading-snug text-white text-xl 2xl:text-3xl">
              {item.hero_title}
            </h3>
            {item.hero_subtitle && (
              <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                {item.hero_subtitle}
              </p>
            )}
          </div>

          <Link href={`/more/${slugify(item.page_type?.[0] ?? "")}`}>
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
              className="shrink-0 w-16 h-16 border backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <TbArrowUpRight size={30} className="text-white" />
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const Apart: React.FC<{ initialData?: ApartRow[] }> = ({ initialData }) => {
  const [services, setServices] = useState<ServiceData[] | null>(
    initialData?.length ? initialData : null
  );

  useEffect(() => {
    if (initialData?.length) return;

    const fetchServices = async () => {
      const { data: row, error } = await supabase
        .from("ac_heroes")
        .select("id, title, subtitle, images")
        .eq("page_id", APART_PAGE_ID)
        .maybeSingle();

      if (error) {
        console.error("Error fetching services:", error.message);
        setServices([]);
        return;
      }

      setServices(row ? [{
        id: 0,
        hero_title: row.title ?? "",
        hero_subtitle: row.subtitle ?? "",
        page_type: [APART_LABEL],
        image_urls: normalizeImages(row.images),
      }] : []);
    };

    fetchServices();
  }, [initialData]);

  if (services !== null && services.length === 0) return null;

  if (services === null) return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-8 md:px-12 xl:px-0 py-16 flex flex-col items-center gap-12 animate-pulse">
        <div className="flex flex-col items-center gap-3 w-full max-w-lg">
          <div className="h-5 w-1/3 bg-gray-200 rounded-full" />
          <div className="h-8 w-2/3 bg-gray-200 rounded-full" />
          <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
        </div>
        <div className="flex flex-col gap-6 w-full">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="w-full h-[45vh] bg-gray-100 rounded-4xl" />
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <section className="bg-white text-gray-700">
      <div className="max-w-6xl mx-auto px-8 md:px-12 xl:px-0 py-16 2xl:py-20 flex flex-col items-center gap-12">
        {/* Heading */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#00B5A3]/20 bg-[#00B5A3]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#00B5A3]">
            Your home away from home
          </p>
          <h2 className="cursive text-4xl 2xl:text-5xl font-bold text-center leading-tight text-gray-800">
            Stay Longer in <i className="text-[#f2836f]">Comfort & Style</i>
          </h2>
         <p className="leading-relaxed text-xs md:text-sm 2xl:text-base font-medium text-gray-500">
            Discover fully furnished apartments for monthly stays across the UAE
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:flex lg:flex-col gap-6 w-full">
          {services.map((item, index) => (
            <ApartCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Apart;
