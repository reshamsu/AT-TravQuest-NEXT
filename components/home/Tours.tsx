"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants, Transition } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TbStar, TbStarFilled } from "react-icons/tb";
import type { TourRow } from "@/lib/useHomeData";

interface Tour {
  id: string | number;
  title: string;
  subtitle: string;
  country: string[];
  city: string[];
  category: string[];
  is_recom: boolean;
  description: string;
  price: string;
  image_urls: string[];
}

const slugify = (text: string) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const CATEGORY_ROUTE_MAP: Record<string, string> = {
  hotels: "hotels", hotel: "hotels", stay: "hotels",
  tours: "tours", tour: "tours", play: "tours",
  "tours & sightseeing": "tours", "sightseeing tours": "tours",
  "city tours": "tours", "adventure tours": "tours",
  "culture & attractions": "tours", "food & beverages": "tours",
  "dhow cruise": "tours", "theme parks": "tours",
  "nature & wildlife": "tours", "water activities": "tours",
  "desert safari": "tours", "premium tours": "tours",
  "yacht charter": "tours", "hot air balloon": "tours",
  "helicopter tour": "tours",
  packages: "packages", "package tours": "packages",
  "family packages": "packages", "honeymoon packages": "packages",
  "adventure packages": "packages", "luxury packages": "packages",
  "budget packages": "packages", "weekend getaways": "packages",
  "city breaks": "packages", "group packages": "packages",
  apartments: "apartments", apartment: "apartments",
  "service apartment": "apartments", "service apartments": "apartments",
  promotions: "promotions", promotion: "promotions", deals: "promotions",
  visas: "visas", visa: "visas",
  shopping: "shopping", shop: "shopping",
  airports: "airports", airport: "airports",
  "airport transfer": "airports", "airport transfers": "airports",
  meetings: "meetings", meeting: "meetings",
  corporate: "corporate", "corporate travel": "corporate",
};

const getCategoryRoute = (categories: string[]): string => {
  for (const cat of categories) {
    const key = cat.toLowerCase().trim();
    if (CATEGORY_ROUTE_MAP[key]) return CATEGORY_ROUTE_MAP[key];
    if (key.includes("hotel") || key.includes("stay")) return "hotels";
    if (key.includes("package")) return "packages";
    if (key.includes("tour") || key.includes("safari") || key.includes("sightseeing")) return "tours";
    if (key.includes("apartment")) return "apartments";
    if (key.includes("visa")) return "visas";
    if (key.includes("airport") || key.includes("transfer")) return "airports";
    if (key.includes("corporate")) return "corporate";
    if (key.includes("promot") || key.includes("deal")) return "promotions";
    if (key.includes("shop")) return "shopping";
    if (key.includes("meet")) return "meetings";
  }
  return "tours";
};

const easeOut: Transition["ease"] = [0.25, 0.1, 0.25, 1];

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: easeOut },
  }),
};

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

export default function Packages({ initialData }: { initialData?: TourRow[] }) {
  const router = useRouter();
  const [activeCity, setActiveCity] = useState<"Dubai" | "Abu Dhabi">("Dubai");
  const [allPackages, setAllPackages] = useState<Tour[] | null>(initialData?.length ? initialData : null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );

  const navigateToTour = (pack: Tour) => {
    const country = slugify(pack.country[0]);
    const city = slugify(pack.city[0]);
    const category = getCategoryRoute(pack.category);
    window.history.pushState(null, "", `/destinations/${country}/${city}`);
    window.history.pushState(null, "", `/destinations/${country}/${city}/${category}`);
    router.push(`/destinations/${country}/${city}/${category}`);
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (initialData?.length) return;

    const fetchPackages = async () => {
      let q = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", "Tours");
      if (COMPANY) q = q.eq("company", COMPANY);
      const { data, error } = await q.order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching packages:", error.message);
        setAllPackages([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Tour[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        country: row.country,
        city: row.city,
        category: row.category,
        is_recom: row.is_recom,
        description: row.description,
        price: row.price,
        image_urls: normalizeImages(row.image_urls),
      }));

      setAllPackages(formatted);
    };

    fetchPackages();
  }, [initialData]);

  if (allPackages !== null && allPackages.length === 0) return null;

  if (allPackages === null) return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto py-14 px-5 md:px-10 xl:px-0 flex flex-col items-center gap-4 animate-pulse">
        {/* Badge pill */}
        <div className="h-7 w-64 bg-gray-100 rounded-full" />
        {/* Heading */}
        <div className="h-10 w-80 bg-gray-200 rounded-lg" />
        {/* Description */}
        <div className="h-4 w-96 bg-gray-100 rounded-full" />

        {/* City switch */}
        <div className="flex items-center bg-gray-100 rounded-full p-1.5 gap-1.5 border border-gray-200/80 mt-2">
          <div className="w-44 h-9 bg-gray-200 rounded-full" />
          <div className="w-44 h-9 bg-gray-100 rounded-full" />
        </div>

        {/* Cards — 2-col mobile, 3-col tablet, 5-col flex desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row gap-3 w-full mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="lg:flex-1 rounded-tl-4xl rounded-br-4xl overflow-hidden border border-gray-100">
              {/* Image */}
              <div className="h-60 bg-gray-200 rounded-tl-4xl rounded-br-4xl" />
              {/* Content */}
              <div className="py-4 px-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
                  <div className="h-4 w-full bg-gray-200 rounded-full" />
                  <div className="h-3 w-full bg-gray-100 rounded-full" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded-full" />
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-12 bg-gray-100 rounded-full" />
                    <div className="h-3 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="h-3 w-14 bg-gray-100 rounded-full" />
                    <div className="h-5 w-10 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Explore button */}
        <div className="h-10 w-40 bg-gray-100 rounded-full mt-1" />
      </div>
    </section>
  );

  const visiblePackages = allPackages
    .filter((pkg) => pkg.city.includes(activeCity))
    .slice(0, 5);

  return (
    <section id="tours" className="bg-white text-gray-700">
      <div className="max-w-6xl mx-auto py-14 2xl:py-18 px-5 md:px-10 xl:px-0 flex flex-col items-center text-center justify-center gap-4">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#00B5A3]/20 bg-[#00B5A3]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#00B5A3]">
            Chase experiences beyond the ordinary
          </p>
          {/* Header */}
          <h2 className="cursive text-4xl 2xl:text-5xl font-bold text-center leading-tight">
            Unleash Your{" "}
            <i className="text-[#f2836f]">
              Adventurous Spirit
            </i>
          </h2>
          <p className="max-w-3xl leading-relaxed text-xs md:text-sm 2xl:text-base font-medium text-gray-500">
            Whether you&apos;re interested in history, culture, luxury experiences,
            or outdoor adventures, the UAE has something for everyone.
          </p>
        </motion.div>

        {/* City Switch */}
        <div className="flex justify-center items-center bg-gray-100 rounded-full p-1.5 my-4 gap-1.5 border border-gray-200/80">
          {(["Dubai", "Abu Dhabi"] as const).map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`w-32 md:w-44 lg:w-56 py-2.5 rounded-full uppercase text-[11px] 2xl:text-xs font-bold cursor-pointer transition-all duration-300 tracking-wider ${
                activeCity === city
                  ? city === "Dubai"
                    ? "bg-[#f2836f] text-white shadow-md shadow-[#f2836f]/30"
                    : "bg-[#00B5A3] text-white shadow-md shadow-[#00B5A3]/30"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/70"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Cards — grid on mobile/tablet, flex hover-expand on desktop */}
        {isDesktop ? (
          // ── Desktop: flex expand on hover ──
          <div
            className="flex gap-3 w-full"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {visiblePackages.map((pack, index) => {
              const isHovered = hoveredIndex === index;
              const isCompressed = hoveredIndex !== null && !isHovered;

              return (
                <motion.div
                  key={pack.id}
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
                  className="text-start rounded-tl-4xl rounded-br-4xl overflow-hidden group bg-white hover:shadow-xl border border-gray-100 hover:border-[#f2836f]/30 transition-all duration-500"
                >
                  <div
                    className="text-base group-hover:text-black duration-500 cursor-pointer"
                    onClick={() => navigateToTour(pack)}
                  >
                    <div className="relative h-64 rounded-tl-4xl rounded-br-4xl overflow-hidden bg-gray-100">
                      <Image
                        src={pack.image_urls?.[0] || "/assets/tour.webp"}
                        alt={pack.title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-[#f2836f]/10 shadow-md transition-all duration-700" />
                      {pack.is_recom && (
                        <span className="absolute top-3 right-3 bg-white/60 group-hover:bg-[#00B5A3] text-black group-hover:text-white backdrop-blur-md duration-500 text-xs font-bold px-3 py-1 rounded-tl-2xl rounded-br-2xl flex items-center gap-1">
                          <TbStar size={14} />
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="py-4 px-4 flex flex-col justify-between gap-3 h-50 select-none">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm 2xl:text-xs text-[#f2836f] font-bold truncate">
                          {pack.city} · {pack.country}
                        </p>
                        <h3 className="text-base font-bold truncate">
                          {pack.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {pack.description}
                        </p>
                      </div>

                      <div className="flex items-end justify-between mt-3">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-bold text-gray-600 whitespace-nowrap">
                            Reviews
                          </p>
                          <ul className="flex items-center gap-0.5 text-sm text-yellow-400">
                            <TbStarFilled />
                            <TbStarFilled />
                            <TbStarFilled />
                            <TbStarFilled />
                            <TbStar className="text-gray-300" />
                          </ul>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            From AED
                          </p>
                          <p className="font-extrabold text-lg">{pack.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // ── Mobile / Tablet: normal 2-col grid ──
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {visiblePackages.map((pack, index) => (
              <motion.div
                key={pack.id}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="text-start rounded-tl-4xl rounded-br-4xl overflow-hidden group bg-white shadow-sm border-r-2 border-b-2 border-[#f2836f]/10"
              >
                <div
                  className="text-base cursor-pointer"
                  onClick={() => navigateToTour(pack)}
                >
                  <div className="relative h-60 rounded-tl-4xl rounded-br-4xl overflow-hidden bg-gray-100">
                    <Image
                      src={pack.image_urls?.[0] || "/assets/tour.webp"}
                      alt={pack.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[#f2836f]/10" />
                    {pack.is_recom && (
                      <span className="absolute top-2 right-2 bg-[#00B5A3]/80 text-white text-[10px] font-bold px-2 py-1 rounded-tl-xl rounded-br-xl flex items-center gap-1">
                        <TbStar size={11} />
                        Recommended
                      </span>
                    )}

                    <p className="absolute bottom-3 left-3 text-xs text-white font-extrabold truncate">
                      {pack.city} · {pack.country}
                    </p>
                  </div>

                  <div className="p-4 flex flex-col gap-2 select-none">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-extrabold line-clamp-1">
                        {pack.title}
                      </h3>
                      <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {pack.description}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-1">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-gray-600">
                          Reviews
                        </p>
                        <ul className="flex items-center gap-0.5 text-xs text-yellow-400">
                          <TbStarFilled />
                          <TbStarFilled />
                          <TbStarFilled />
                          <TbStarFilled />
                          <TbStar className="text-gray-300" />
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">From AED</p>
                        <p className="font-extrabold text-sm">{pack.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Link
          href={`/destinations/${slugify(visiblePackages[0]?.country[0] ?? "uae")}/${slugify(activeCity)}/tours`}
          className="max-w-fit mx-auto mt-3 select-none btn-secondary-outline"
        >
          Explore All Tours
        </Link>
      </div>
    </section>
  );
}
