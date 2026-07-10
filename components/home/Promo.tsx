"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants, Transition } from "framer-motion";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TbStarFilled, TbStar, TbArrowRight, TbMapPin } from "react-icons/tb";
import type { PromoRow } from "@/lib/useHomeData";

interface Promo {
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

const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: easeOut },
  }),
};

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.length > 0);
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && v.length > 0) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizePromo = (row: any): Promo => ({
  id: row.id,
  title: row.title || "Special offer",
  subtitle: row.subtitle || "",
  country: normalizeStrings(row.country),
  city: normalizeStrings(row.city),
  category: normalizeStrings(row.category),
  is_recom: Boolean(row.is_recom),
  description: row.description || "",
  price: row.price || "0",
  image_urls: normalizeImages(row.image_urls),
});

const StarRating = ({ count = 4 }: { count?: number }) => (
  <ul className="flex items-center gap-0.5 text-yellow-400">
    {[1, 2, 3, 4, 5].map((n) =>
      n <= count ? (
        <li key={n}><TbStarFilled size={12} /></li>
      ) : (
        <li key={n}><TbStar size={12} /></li>
      ),
    )}
  </ul>
);

const saleLabels: [string, number, number][][] = [
  [["Weekend", 40, 6], ["Flash", 60, 16], ["Sale", 50, 14]],
  [["Early", 40, 6], ["Bird", 60, 16], ["Special", 50, 14]],
  [["Last", 40, 6], ["Minute", 60, 8], ["Deals", 50, 12]],
  [["Travel", 40, 6], ["Super", 60, 16], ["Promo", 50, 14]],
];

const beachPositions = ["0% 50%", "33% 50%", "66% 50%", "100% 50%"];

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

function PromoCard({
  promo,
  index,
  isHovered,
  isCompressed,
  onHover,
}: {
  promo: Promo;
  index: number;
  isHovered: boolean;
  isCompressed: boolean;
  onHover: () => void;
}) {
  const router = useRouter();
  const label = saleLabels[index] ?? [];
  const beachPos = beachPositions[index] ?? "50% 50%";

  const handleClick = () => {
    const country = slugify(promo.country.find((c) => c === "UAE") ?? promo.country[0] ?? "uae");
    const city = slugify(promo.city[0] ?? "dubai");
    router.push(`/destinations/${country}/${city}/promotions/${promo.id}`);
  };

  return (
    <motion.div
      custom={index}
      variants={rowVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      onMouseEnter={onHover}
      style={{
        flex: isHovered ? "1.3 0 0%" : isCompressed ? "0.85 0 0%" : "1 0 0%",
        transition: "flex 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
        minWidth: 0,
        border: isHovered ? "2.5px solid #00B5A3" : "2.5px solid #d1d5db",
        boxShadow: isHovered
          ? "0 8px 32px rgba(242,131,111,0.18), 0 2px 8px rgba(0,0,0,0.10)"
          : "0 2px 12px rgba(0,0,0,0.07)",
      }}
      className="rounded-tl-[3pc] rounded-br-[3pc] overflow-hidden"
    >
      <button
        className="block w-full text-left group cursor-pointer"
        onClick={handleClick}
        aria-label={`View offer: ${promo.title}`}
      >
        <div className="relative h-72 2xl:h-[50vh] overflow-hidden">
          {/* Beach layer — desktop default, fades out on hover */}
          <div className="hidden md:block absolute inset-0 transition-opacity duration-500 group-hover:opacity-0">
            <Image
              src="/airplane1.jpg"
              alt=""
              fill
              sizes="25vw"
              className="object-cover"
              style={{ objectPosition: beachPos }}
              aria-hidden="true"
            />
          </div>
          <div className="hidden md:block absolute inset-0 bg-linear-to-b from-black/80 to-black/40 transition-opacity duration-500 group-hover:opacity-0" />

          {/* Listing image — always visible on mobile, revealed on hover on desktop */}
          <Image
            src={promo.image_urls?.[0] || "/assets/tour.webp"}
            alt={promo.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-100 md:scale-105 md:group-hover:scale-100 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 md:from-black/90 md:via-black/40 md:to-black/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

          {/* Sale label — desktop only, hidden on hover */}
          <div
            className={`hidden md:flex absolute inset-0 flex-col items-center gap-3 px-5 py-15 select-none pointer-events-none group-hover:opacity-0 transition-opacity duration-500 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
            aria-hidden
          >
            <span className="playfair font-bold text-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] flex flex-col items-center gap-0.5">
              {label.map(([word, size, mobileSize]) => (
                <span
                  key={word}
                  className="text-white/60 leading-none"
                  style={{
                    fontSize: `clamp(${mobileSize}px, ${mobileSize + (size - mobileSize) * 0.5}px + 2vw, ${size}px)`,
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
          </div>

          {/* Featured badge */}
          {promo.is_recom && (
            <span className="absolute top-3 right-3 bg-[#f2836f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 leading-none z-10">
              <TbStarFilled size={9} /> Featured
            </span>
          )}

          {/* Content panel — always visible on mobile, slides up on desktop hover */}
          <div className="absolute inset-x-0 bottom-0 z-10 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 ease-out p-3 md:p-4 flex flex-col gap-1.5 md:gap-2">
            <div className="flex gap-1 text-white/80">
              <TbMapPin size={12} className="text-[#00B5A3] mt-0.5 shrink-0" />
              <span className="text-[11px] font-semibold">
                {promo.city[0] || "Dubai"}, {promo.country[0] || "UAE"}
              </span>
            </div>
            <h3 className="text-[13px] md:text-sm font-extrabold text-white leading-tight line-clamp-2 md:line-clamp-1">
              {promo.title}
            </h3>
            <p className="hidden md:block text-[11px] text-white/70 leading-relaxed line-clamp-3">
              {promo.description}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-white/20 mt-0.5 md:mt-1">
              <div className="flex flex-col gap-1">
                <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wide">Reviews</p>
                <StarRating count={4} />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/50">From AED</p>
                <p className="font-extrabold text-base text-white leading-none">{promo.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#00B5A3] text-[11px] font-bold mt-0.5 md:mt-1">
              <span>View Offer</span>
              <TbArrowRight size={13} />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export default function Promo({ initialData }: { initialData?: PromoRow[] }) {
  const [allPromos, setAllPromos] = useState<Promo[] | null>(
    initialData?.length ? initialData.map(normalizePromo) : null,
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (initialData?.length) return;
    const fetchPromos = async () => {
      let q = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", "Promotions");
      if (COMPANY) q = q.eq("company", COMPANY);
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching promotions:", error.message);
        setAllPromos([]);
        return;
      }
      setAllPromos((data ?? []).map(normalizePromo));
    };
    fetchPromos();
  }, [initialData]);

  if (allPromos !== null && allPromos.length === 0) return null;

  if (allPromos === null)
    return (
      <section className="bg-white">
        <div className="max-w-6xl mx-auto py-14 px-5 md:px-10 xl:px-0 flex flex-col gap-10 animate-pulse">
          <div className="flex flex-col items-center gap-4">
            <div className="h-5 w-1/3 bg-gray-200 rounded-full" />
            <div className="h-8 w-1/2 bg-gray-200 rounded-full" />
            <div className="h-4 w-2/3 bg-gray-100 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-100 rounded-tl-[3pc] rounded-br-[3pc]" />
            ))}
          </div>
        </div>
      </section>
    );

  const visiblePromos = allPromos.slice(0, 4);

  return (
    <section className="bg-white text-gray-700">
      <div className="max-w-6xl mx-auto py-14 2xl:py-18 px-5 md:px-10 xl:px-0 flex flex-col justify-center gap-10">
        <div className="flex flex-col items-center text-center gap-4">
          <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#00B5A3]/20 bg-[#00B5A3]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#00B5A3]">
            Exclusive Offers & Packages
          </p>
          <h2 className="cursive text-4xl 2xl:text-5xl font-bold text-center leading-tight">
            Improve Your{" "}
            <i className="text-4xl 2xl:text-5xl text-[#f2836f]">Stay with Offers</i>
          </h2>
          <p className="max-w-3xl leading-relaxed text-xs md:text-sm 2xl:text-base font-medium text-gray-500">
            Take a look at our enticing offers, which include room deals and more. From curated
            experiences to exclusive packages, find the perfect offer to elevate your stay in the UAE.
          </p>
        </div>

        {/* Desktop: flex expand on hover */}
        {isDesktop ? (
          <div className="flex gap-4" onMouseLeave={() => setHoveredIndex(null)}>
            {visiblePromos.map((promo, index) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                index={index}
                isHovered={hoveredIndex === index}
                isCompressed={hoveredIndex !== null && hoveredIndex !== index}
                onHover={() => setHoveredIndex(index)}
              />
            ))}
          </div>
        ) : (
          /* Mobile / Tablet: 2-col grid */
          <div className="grid grid-cols-2 gap-4">
            {visiblePromos.map((promo, index) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                index={index}
                isHovered={false}
                isCompressed={false}
                onHover={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
