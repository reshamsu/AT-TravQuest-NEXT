"use client";

import { useEffect, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight } from "react-icons/tb";
import { useParams } from "next/navigation";

interface DiscoveryItem {
  id: string | number;
  title: string;
  subtitle: string;
  country: string | string[];
  city: string | string[];
  category: string | string[];
  image_urls: string[] | string;
  tagline?: string;
  source: "airports" | "visas" | "meetings" | "promotions";
}

const SLUG_SOURCE_MAP: Record<string, DiscoveryItem["source"]> = {
  "airport-transfers": "airports",
  "visa-assistance": "visas",
  "meeting-conferences": "meetings",
};

const HIDDEN_SLUGS = new Set([
  "corporate-travels",
  "apartment-for-monthly-stays",
]);

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  }
  return [];
};

const slugify = (text: string | null | undefined) =>
  (text ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

const toStr = (v: string | string[]): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

const easeOut: Transition["ease"] = [0.25, 0.1, 0.25, 1];

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: easeOut },
  }),
};

const DiscoverySkeleton = ({ count }: { count: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-tl-[2pc] rounded-br-[2pc] overflow-hidden bg-white"
      >
        <div className="h-64 bg-gray-200" />
        <div className="p-6 flex flex-col gap-2">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default function Discoveries() {
  const params = useParams();
  const slug = params?.page_type as string;

  if (HIDDEN_SLUGS.has(slug)) return null;

  return <DiscoveriesInner slug={slug} />;
}

function DiscoveriesInner({ slug }: { slug: string }) {
  const activeSource = SLUG_SOURCE_MAP[slug] ?? null;

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const baseQuery = (listingType: string) => {
        let q = supabase
          .from("ac_listings_travel")
          .select("id, title, subtitle, country, city, category, image_urls")
          .eq("listing_type", listingType);
        if (COMPANY) q = q.eq("company", COMPANY);
        return q.limit(5);
      };

      const [airports, visas, meetings, promotions] = await Promise.all([
        baseQuery("Transfers"),
        baseQuery("Visas"),
        baseQuery("Meetings"),
        baseQuery("Promotions"),
      ]);

      const merged: DiscoveryItem[] = [
        ...(airports.data ?? []).map((i) => ({
          ...i,
          source: "airports" as const,
        })),
        ...(visas.data ?? []).map((i) => ({ ...i, source: "visas" as const })),
        ...(meetings.data ?? []).map((i) => ({
          ...i,
          source: "meetings" as const,
        })),
        ...(promotions.data ?? []).map((i) => ({
          ...i,
          source: "promotions" as const,
        })),
      ];

      setItems(merged);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const visibleItems = activeSource
    ? items.filter((item) => item.source === activeSource)
    : items;

  const skeletonCount = activeSource ? 1 : 5;

  const getHref = (item: DiscoveryItem) => {
    const country = slugify(toStr(item.country));
    const city = slugify(toStr(item.city));
    if (item.source === "promotions") {
      return `/destinations/${country}/${city}/promotions`;
    }
    return `/destinations/${country}/${city}/${item.source}`;
  };

  const getSourceLabel = (source: DiscoveryItem["source"]) =>
    source === "promotions"
      ? "Promotions"
      : source.charAt(0).toUpperCase() + source.slice(1);

  if (loading)
    return (
      <div className="bg-gradient-to-b from-gray-300/30 via-gray-100 to-white text-gray-700 rounded-tl-[50px] md:rounded-tl-[80px]">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 py-14 xl:pt-18 px-10 md:px-14 xl:px-0">
          <DiscoverySkeleton count={skeletonCount} />
        </div>
      </div>
    );

  if (!visibleItems.length) return null;

  return (
    <div
      className="bg-gradient-to-b from-gray-200/80 via-gray-100 to-white text-gray-700 rounded-tl-[50px] md:rounded-tl-[80px]"
      id="discoveries"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-10 py-14 2xl:py-18 px-6 md:px-14 xl:px-0">
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="cursive text-3xl 2xl:text-4xl capitalize font-bold">
            Explore our full range of
            <span className="text-[#f2836f]"> travel services</span>
          </h3>
          <p className="leading-relaxed text-xs 2xl:text-sm font-bold text-gray-500">
            From airport transfers to visa assistance, we&apos;ve got every part
            of your journey covered.
          </p>
        </motion.div>

        {/* Desktop: flex expand on hover */}
        {isDesktop ? (
          <div
            className="flex gap-3 w-full"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {visibleItems.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const isCompressed = hoveredIndex !== null && !isHovered;
              const images = normalizeImages(item.image_urls);
              const href = getHref(item);
              const categoryLabel = Array.isArray(item.category)
                ? item.category[0]
                : item.category;

              return (
                <motion.div
                  key={`${item.source}-${item.id}`}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  style={{
                    flex: isHovered
                      ? "1.3 0 0%"
                      : isCompressed
                        ? "0.85 0 0%"
                        : "1 0 0%",
                    transition: "flex 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    minWidth: 0,
                  }}
                  className="rounded-tl-[2pc] rounded-br-[2pc] overflow-hidden group bg-white hover:shadow-xl border border-gray-100 hover:border-[#f2836f]/30 transition-all duration-500"
                >
                  <Link
                    href={href}
                    className="text-base group-hover:text-[#00B5A3] duration-500"
                  >
                    <div className="relative h-64 rounded-tl-4xl rounded-br-4xl overflow-hidden bg-gray-100">
                      <Image
                        src={images[0] || "/assets/banner/property1.webp"}
                        alt={item.title ?? item.source}
                        fill
                        sizes="20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-[#f2836f]/10 shadow-md transition-all duration-700" />
                      {categoryLabel && (
                        <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          {categoryLabel}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col justify-between gap-3 select-none">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-[#f2836f] font-extrabold uppercase tracking-wide">
                          {getSourceLabel(item.source)}
                        </p>
                        <h3 className="text-sm font-extrabold line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {item.subtitle || item.tagline}
                        </p>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-[#00B5A3] group-hover:gap-2 transition-all duration-300">
                          View all <TbArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Mobile / Tablet: grid */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visibleItems.map((item, index) => {
              const images = normalizeImages(item.image_urls);
              const href = getHref(item);
              const categoryLabel = Array.isArray(item.category)
                ? item.category[0]
                : item.category;

              return (
                <motion.div
                  key={`${item.source}-${item.id}`}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  className="rounded-tl-[2pc] rounded-br-[2pc] overflow-hidden group bg-white hover:shadow-lg hover:scale-105 duration-1000 border-b-4 border-[#f2836f]/10 hover:border-[#f2836f]/50"
                >
                  <Link
                    href={href}
                    className="text-base group-hover:text-[#00B5A3] duration-1000"
                  >
                    <div className="relative h-64 rounded-tl-4xl rounded-br-4xl overflow-hidden bg-gray-100">
                      <Image
                        src={images[0] || "/assets/banner/property1.webp"}
                        alt={item.title ?? item.source}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-[#f2836f]/10 shadow-md transition-all duration-1000" />
                      {categoryLabel && (
                        <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          {categoryLabel}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col justify-between gap-3 select-none">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-[#f2836f] font-extrabold uppercase tracking-wide">
                          {getSourceLabel(item.source)}
                        </p>
                        <h3 className="text-sm md:text-base font-extrabold line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {item.subtitle || item.tagline}
                        </p>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-[#00B5A3] group-hover:gap-2 transition-all duration-300">
                          View all <TbArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
