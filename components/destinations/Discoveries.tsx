"use client";

import { useEffect, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { TbArrowUpRight } from "react-icons/tb";

interface Discover {
  id: string;
  category: string[];
  country: string[];
  city: string[];
  tagline: string;
  description: string;
  intro_title: string;
  image_urls: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ABBREVIATIONS = ["uae", "usa", "uk", "ksa", "gcc"];

const formatParam = (slug: string) =>
  slug
    .split("-")
    .map((w) =>
      ABBREVIATIONS.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");

const CATEGORY_ROUTE_MAP: Record<string, string> = {
  // hotels table
  stay: "hotels",
  hotel: "hotels",
  hotels: "hotels",

  // tours table
  play: "tours",
  tour: "tours",
  tours: "tours",
  "tours & sightseeing": "tours",
  "sightseeing tours": "tours",
  "city tours": "tours",
  "adventure tours": "tours",
  "culture & attractions": "tours",
  "food & beverages": "tours",
  "dhow cruise": "tours",
  "theme parks": "tours",
  "nature & wildlife": "tours",
  "water activities": "tours",
  "desert safari": "tours",
  "premium tours": "tours",
  "yacht charter": "tours",
  "hot air balloon": "tours",
  "helicopter tour": "tours",

  // packages table
  packages: "packages",
  "package tours": "packages",
  "city breaks": "packages",
  "family packages": "packages",
  "adventure packages": "packages",
  "budget packages": "packages",
  "weekend getaways": "packages",
  "luxury packages": "packages",
  "honeymoon packages": "packages",
  "group packages": "packages",

  // meetings table
  meeting: "meetings",
  meetings: "meetings",

  // apartments table
  apartment: "apartments",
  apartments: "apartments",
  "service apartment": "apartments",
  "service apartments": "apartments",

  // airports table
  airport: "airports",
  airports: "airports",
  "airport transfer": "airports",
  "airport transfers": "airports",

  // visas table
  visa: "visas",
  visas: "visas",
  "visa assistance": "visas",

  // promotions table
  promotion: "promotions",
  promotions: "promotions",
  deals: "promotions",

  // shopping table
  shop: "shopping",
  shopping: "shopping",
};

function getCategoryRoute(categories: string[]): string | null {
  for (const cat of categories) {
    const key = cat.toLowerCase().trim();

    if (CATEGORY_ROUTE_MAP[key]) return CATEGORY_ROUTE_MAP[key];

    if (key.includes("package")) return "packages";
    if (key.includes("tour") || key.includes("sightseeing")) return "tours";
    if (key.includes("hotel") || key.includes("stay")) return "hotels";
    if (key.includes("apartment")) return "apartments";
    if (key.includes("visa")) return "visas";
    if (key.includes("airport") || key.includes("transfer")) return "airports";
    if (key.includes("corporate")) return "corporate";
    if (key.includes("promotion") || key.includes("deals")) return "promotions";
    if (key.includes("shop")) return "shopping";
    if (key.includes("meet")) return "meetings";
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[Discoveries] No route mapping for categories: [${categories.join(", ")}]. Card will be hidden.`,
    );
  }
  return null;
}

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ── Animation ─────────────────────────────────────────────────────────────────

const easeOut: Transition["ease"] = [0.25, 0.1, 0.25, 1];

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: easeOut },
  }),
};

const CATEGORY_ORDER: Record<string, number> = {
  hotels:     0,
  tours:      1,
  packages:   2,
  meetings:   3,
  apartments: 4,
  airports:   5,
  visas:      6,
  promotions: 7,
  shopping:   8,
  corporate:  9,
};

const INITIAL_VISIBLE = 10;
const CHUNK_SIZE = 5;

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Discoveries() {
  const params = useParams<{ country: string; city?: string }>();
  const country = params.country;
  const city = params.city;

  const [discoveries, setDiscoveries] = useState<Discover[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!city) {
      Promise.resolve().then(() => {
        setDiscoveries([]);
        setLoading(false);
      });
      return;
    }

    const fetchDiscoveries = async () => {
      setLoading(true);
      const formattedCity = formatParam(city);

      const [discoveriesRes, promotionsRes] = await Promise.all([
        supabase
          .from("ac_discoveries")
          .select("*")
          .contains("city", [formattedCity])
          .order("created_at", { ascending: true }),
        supabase
          .from("ac_listings_travel")
          .select("id, title, subtitle, country, city, category, image_urls")
          .eq("listing_type", "Promotions")
          .contains("city", [formattedCity])
          .limit(1),
      ]);

      if (discoveriesRes.error) {
        console.error("Discoveries fetch failed:", discoveriesRes.error);
      }

      const baseDiscoveries: Discover[] = discoveriesRes.data ?? [];

      // Inject a synthetic Promotions card if any promos exist for this city
      // and there isn't already a promotions entry from the discoveries table
      const hasPromoEntry = baseDiscoveries.some((d) =>
        (d.category ?? []).some(
          (c) =>
            c.toLowerCase().includes("promot") ||
            c.toLowerCase().includes("deal"),
        ),
      );

      const promoRow = promotionsRes.data?.[0];
      const extraPromo: Discover[] =
        promoRow && !hasPromoEntry
          ? [
              {
                id: "promo-fallback",
                category: ["Promotions"],
                country: Array.isArray(promoRow.country)
                  ? promoRow.country
                  : [promoRow.country],
                city: Array.isArray(promoRow.city)
                  ? promoRow.city
                  : [promoRow.city],
                tagline: "Exclusive deals & limited-time offers",
                description: promoRow.subtitle ?? "",
                intro_title: "Promotions",
                image_urls: normalizeImages(promoRow.image_urls).filter(
                  Boolean,
                ),
              },
            ]
          : [];

      setDiscoveries([...baseDiscoveries, ...extraPromo]);
      setLoading(false);
    };

    fetchDiscoveries();
  }, [city]);

  if (!city || loading) return null;

  const routableDiscoveries = discoveries
    .filter((d) => getCategoryRoute(d.category ?? []) !== null)
    .sort((a, b) => {
      const ai = CATEGORY_ORDER[getCategoryRoute(a.category ?? [])!] ?? 99;
      const bi = CATEGORY_ORDER[getCategoryRoute(b.category ?? [])!] ?? 99;
      return ai - bi;
    });

  if (!routableDiscoveries.length) return null;

  const displayName = formatParam(city);
  const visibleDiscoveries = routableDiscoveries.slice(0, visibleCount);
  const hasMore = routableDiscoveries.length > visibleCount;

  return (
    <div
      className="bg-linear-to-b from-gray-200/80 via-gray-100 to-white text-gray-700 rounded-tl-[50px] md:rounded-tl-[80px]"
      id="discoveries"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-12 py-14 px-10 md:px-14 lg:px-10 xl:px-0">
        <motion.div
          className="flex flex-col items-center text-center gap-4 2xl:gap-5"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="cursive text-3xl 2xl:text-4xl font-bold">
            Find Everything You Need for Your Journey in{" "}
            <span className="text-[#f2836f]">{displayName}</span>
          </h3>
          <p className="leading-relaxed text-sm 2xl:text-base font-medium text-gray-500 max-w-3xl">
            Search and access exclusive hotel deals, curated tours, shopping
            experiences, visa support, transfers, and more—all in one place
          </p>
        </motion.div>

        {/* Desktop: flex rows with hover expand — Mobile/Tablet: grid */}
        {isDesktop ? (
          <div className="flex flex-col gap-3">
            {chunkArray(visibleDiscoveries, CHUNK_SIZE).map(
              (chunk, chunkIndex) => {
                const chunkHasHovered = chunk.some((d) => d.id === hoveredId);
                return (
                  <div
                    key={chunkIndex}
                    className="flex gap-3 w-full justify-center"
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {chunk.map((disc, itemIndex) => {
                      const isHovered = disc.id === hoveredId;
                      const isCompressed = chunkHasHovered && !isHovered;
                      const routeSegment = getCategoryRoute(
                        disc.category ?? [],
                      )!;
                      const href = `/destinations/${country}/${city}/${routeSegment}`;
                      const globalIndex = chunkIndex * CHUNK_SIZE + itemIndex;

                      return (
                        <motion.div
                          key={disc.id}
                          custom={globalIndex}
                          variants={rowVariants}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, amount: 0.15 }}
                          onMouseEnter={() => setHoveredId(disc.id)}
                          style={{
                            flex: isHovered
                              ? "1.6 0 0%"
                              : isCompressed
                                ? "0.8 0 0%"
                                : "1 0 0%",
                            transition:
                              "flex 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                            minWidth: 0,
                          }}
                          className="relative rounded-3xl overflow-hidden h-64 group shadow-lg border-2 border-gray-300 hover:border-[#f2836f]/30 hover:shadow-xl transition-all duration-500"
                        >
                          <Image
                            src={
                              disc.image_urls?.[0] ||
                              "/assets/banner/property1.webp"
                            }
                            alt={disc.category?.[0] ?? "discovery"}
                            fill
                            sizes="(max-width: 1280px) 25vw, 20vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-linear-to-b from-[#f2836f]/20 to-black/80 group-hover:to-black/70 transition-all duration-700" />

                          <div className="relative flex flex-col justify-between h-full text-white p-5">
                            <div className="flex items-start justify-between">
                              <h3 className="cursive font-bold text-white text-2xl 2xl:text-3xl">
                                {disc.category?.[0]}
                              </h3>
                              <Link
                                href={href}
                                className="w-9 h-9 bg-white/15 group-hover:bg-[#f2836f]/80 border border-white/20 hover:border-[#f2836f]/40 group-hover:scale-110 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-500 shrink-0"
                              >
                                <TbArrowUpRight
                                  size={22}
                                  className="text-white"
                                />
                              </Link>
                            </div>
                            <p className="text-xs font-medium capitalize text-gray-300 group-hover:text-[#f2836f] duration-500">
                              {disc.tagline}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {visibleDiscoveries.map((disc, index) => {
              const routeSegment = getCategoryRoute(disc.category ?? [])!;
              const href = `/destinations/${country}/${city}/${routeSegment}`;

              return (
                <motion.div
                  key={disc.id}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  className="relative rounded-3xl p-5 border-2 border-gray-300 overflow-hidden h-[15vh] md:h-[10vh] group shadow-lg"
                >
                  <Image
                    src={
                      disc.image_urls?.[0] || "/assets/banner/property1.webp"
                    }
                    alt={disc.category?.[0] ?? "discovery"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-[#f2836f]/20 to-black/80 group-hover:bg-black/64 transition-all duration-1000" />

                  <div className="relative flex flex-col justify-between h-full text-white">
                    <h3 className="cursive font-bold text-white text-2xl 2xl:text-3xl mb-2">
                      {disc.category?.[0]}
                    </h3>
                    <p className="text-xs font-medium capitalize text-gray-300 group-hover:text-[#f2836f] duration-500">
                      {disc.tagline}
                    </p>

                    <Link
                      href={href}
                      className="absolute right-0 top-0 w-9 h-9 bg-white/15 group-hover:bg-[#f2836f]/80 border border-white/20 hover:border-[#f2836f]/40 group-hover:scale-110 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-500"
                    >
                      <TbArrowUpRight size={22} className="text-white" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setVisibleCount(discoveries.length)}
            className="self-center select-none btn-green-outline"
          >
            Show more discoveries
          </button>
        )}
      </div>
    </div>
  );
}
