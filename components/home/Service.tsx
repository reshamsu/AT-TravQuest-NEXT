"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight } from "react-icons/tb";
import type { ServiceRow } from "@/lib/useHomeData";
import Link from "next/link";

interface ServiceData {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
}

const SERVICE_PAGES = [
  { id: "meeting-conferences", label: "Meeting Conferences" },
  { id: "visa-assistance",     label: "Visa Assistance" },
  { id: "airport-transfers",   label: "Airport Transfers" },
  { id: "corporate-travels",   label: "Corporate Travels" },
];

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

const seededRand = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

const COLS = 9;
const ROWS = 11;

const PixelReveal = ({ reveal }: { reveal: boolean }) => {
  const delays = useMemo(
    () => Array.from({ length: COLS * ROWS }, (_, i) => seededRand(i) * 0.75),
    [],
  );

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {delays.map((delay, i) => (
        <motion.div
          key={i}
          className="bg-[#0e1e32]"
          initial={{ opacity: 1 }}
          animate={{ opacity: reveal ? 0 : 1 }}
          transition={{ duration: 0.2, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
};

// Visual content of a card — no layout logic here
const CardVisual = ({
  item,
  index,
  sectionInView,
  isFeatured,
  alwaysShow = false,
}: {
  item: ServiceData;
  index: number;
  sectionInView: boolean;
  isFeatured: boolean;
  alwaysShow?: boolean;
}) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (sectionInView) {
      const t = setTimeout(() => setRevealed(true), index * 140);
      return () => clearTimeout(t);
    }
  }, [sectionInView, index]);

  return (
    <div className="relative z-20 w-full h-full rounded-tl-[2pc] rounded-br-[2pc] overflow-hidden shadow-2xl cursor-pointer border-2 border-[#f2836f]/50">
      {/* Image */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: isFeatured ? 1.06 : 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={item.image_urls?.[0] || FALLBACK_IMAGE}
          alt={item.hero_title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </motion.div>

      {/* Pixel dissolve entrance */}
      <PixelReveal reveal={revealed} />

      {/* Gradient — deeper when featured */}
      <motion.div
        className="absolute inset-0 z-30"
        animate={{
          background: isFeatured
            ? "linear-gradient(to top, rgba(7,15,25,0.95) 0%, rgba(7,15,25,0.5) 50%, rgba(0,181,163,0.06) 100%)"
            : "linear-gradient(to top, rgba(7,15,25,0.85) 0%, rgba(7,15,25,0.3) 60%, transparent 100%)",
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Top sweep line */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px z-40"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(0,181,163,0.6), transparent)",
        }}
        animate={{ scaleX: isFeatured ? 1 : 0, opacity: isFeatured ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Index badge */}
      <motion.div
        className="absolute top-4 right-4 z-40"
        animate={{ opacity: isFeatured ? 0.7 : 0.3 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-[10px] font-mono text-white/60 border border-white/10 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {String(index + 1).padStart(2, "0")}
        </span>
      </motion.div>

      {/* Bottom content */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-40 p-8"
        animate={{
          y: isFeatured ? 0 : 4,
          opacity: isFeatured || alwaysShow ? 1 : 0.85,
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {item.page_type?.[0] && (
          <motion.div
            className="mb-2"
            animate={{
              opacity: isFeatured || alwaysShow ? 1 : 0,
              y: isFeatured || alwaysShow ? 0 : 6,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest bg-[#00B5A3]/20 border border-[#00B5A3]/40 text-[#00B5A3] px-3 py-1 rounded-lg backdrop-blur-sm">
              {item.page_type[0]}
            </span>
          </motion.div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {item.hero_title && (
              <motion.h3
                className="font-bold leading-snug"
                animate={{
                  fontSize: isFeatured
                    ? "1.5rem"
                    : alwaysShow
                      ? "1.1rem"
                      : "1rem",
                }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.hero_title}
              </motion.h3>
            )}
            {item.hero_subtitle && (
              <motion.p
                className="text-[11px] text-white/60 mt-1 leading-relaxed"
                animate={{
                  opacity: isFeatured || alwaysShow ? 0.8 : 0,
                  y: isFeatured || alwaysShow ? 0 : 5,
                  height: isFeatured || alwaysShow ? "auto" : 0,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                {item.hero_subtitle}
              </motion.p>
            )}
          </div>

          <Link href={`/more/${slugify(item.page_type[0])}`}>
            <motion.div
              animate={{
                scale: isFeatured ? 1.1 : 1,
                backgroundColor: isFeatured
                  ? "rgba(242,131,111,0.9)"
                  : "rgba(255,255,255,0.1)",
                borderColor: isFeatured
                  ? "rgba(242,131,111,0.6)"
                  : "rgba(255,255,255,0.2)",
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 w-10 h-10 border backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: isFeatured ? 0 : -15 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <TbArrowUpRight size={24} className="text-white" />
              </motion.div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="relative w-full h-full rounded-tl-[2pc] rounded-br-[2pc] overflow-hidden bg-white/5 animate-pulse">
    <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
      <div className="h-4 w-3/4 bg-white/10 rounded-full" />
      <div className="h-3 w-1/2 bg-white/5 rounded-full" />
    </div>
  </div>
);

const MICE: React.FC<{ initialData?: ServiceRow[] }> = ({ initialData }) => {
  const [services, setServices] = useState<ServiceData[] | null>(
    initialData?.length ? initialData : null
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (initialData?.length) return;

    const fetchServices = async () => {
      const rows = await Promise.all(
        SERVICE_PAGES.map(({ id, label }) =>
          supabase.from("ac_heroes").select("id, title, subtitle, images")
            .eq("page_id", id).maybeSingle()
            .then(({ data }) => data ? {
              id: 0,
              hero_title: data.title ?? "",
              hero_subtitle: data.subtitle ?? "",
              page_type: [label],
              image_urls: normalizeImages(data.images),
            } : null)
        ),
      );

      setServices(rows.filter((r): r is ServiceData => r !== null));
    };

    fetchServices();
  }, [initialData]);

  if (services !== null && services.length === 0) return null;

  const items = services ?? SERVICE_PAGES.map((_, i) => i);

  return (
    <div className=" bg-[#f9f0ee] text-white  rounded-tl-[3pc] 2xl:rounded-tl-[6pc] rounded-br-[3pc] 2xl:rounded-br-[6pc] overflow-hidden">
      <div
        ref={ref}
        className="max-w-6xl mx-auto flex flex-col gap-8 py-14 2xl:py-18 px-10 md:px-12 2xl:px-0"
      >
        {/* Header */}
        <motion.div
          className="flex flex-col gap-3 2xl:gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="inline-flex items-center gap-2 text-[11px] 2xl:text-sm w-fit font-extrabold uppercase border border-[#f2836f]/30 bg-[#f2836f]/10 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] animate-pulse" />
            Service
          </motion.p>
          <h3 className="cursive text-4xl 2xl:text-5xl font-bold text-gray-800">
            Meetings,{" "}
            <span className="text-[#f2836f]">
              Incentives & Conferences
            </span>
          </h3>
          <p className="max-w-2xl leading-relaxed text-sm md:text-base font-medium text-gray-500">
            Find your perfect long-term accommodation in the UAE with our
            curated selection of apartments.
          </p>
        </motion.div>

        {/* Mobile / tablet layout — equal cards, always show text */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 flex-col gap-4">
          {items.map((item, index) => (
            <div key={index} className="h-52">
              {services ? (
                <CardVisual
                  item={item as ServiceData}
                  index={index}
                  sectionInView={isInView}
                  isFeatured={false}
                  alwaysShow={true}
                />
              ) : (
                <SkeletonCard />
              )}
            </div>
          ))}
        </div>

        {/* Desktop layout — fixed featured left, expandable stack right */}
        <div className="hidden lg:flex gap-4" style={{ height: "58vh" }}>
          {/* Featured card — always card 0, always left */}
          <div className="flex-2 h-full min-w-0">
            {services ? (
              <CardVisual
                item={items[0] as ServiceData}
                index={0}
                sectionInView={isInView}
                isFeatured={true}
              />
            ) : (
              <SkeletonCard />
            )}
          </div>

          {/* Right stack — cards expand vertically in place on hover */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {items.slice(1).map((item, i) => {
              const index = i + 1;
              const isHov = hoveredIndex === index;
              return (
                <motion.div
                  key={index}
                  animate={{ flex: isHov ? 3 : 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ minHeight: 0 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  {services ? (
                    <CardVisual
                      item={item as ServiceData}
                      index={index}
                      sectionInView={isInView}
                      isFeatured={isHov}
                    />
                  ) : (
                    <SkeletonCard />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MICE;
