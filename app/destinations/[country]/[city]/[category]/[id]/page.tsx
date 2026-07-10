"use client";

export const runtime = "edge";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  TbChevronLeft,
  TbChevronRight,
  TbMapPin,
  TbCheckbox,
  TbCompass,
  TbChecks,
  TbPhone,
  TbBrandWhatsapp,
  TbPhoto,
  TbCategoryPlus,
  TbTag,
  TbCalendarMonth,
  TbSparkles,
  TbInfoCircle,
  TbLicense,
  TbGlassCocktail,
  TbFileTypePdf,
  TbStarFilled,
  TbBed,
  TbShare,
  TbHome,
  TbArrowUpRight,
  TbX,
  TbChevronRight as TbCrumb,
} from "react-icons/tb";
import { RiGalleryView2 } from "react-icons/ri";
import { supabase } from "@/lib/supabase";

interface Item {
  id: string | number;
  ref_id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  category: string[];
  country: string[];
  city: string[];
  is_recom: boolean;
  highlights?: string;
  description?: string;
  itinerary?: string;
  restaurants?: string;
  location?: string;
  other_info?: string;
  price: number;
  additional_info?: string;
  cost_inclusions?: string;
  cost_exclusions?: string;
  terms_conditions?: string;
  image_urls?: string[];
  status?: string;
  discount_label?: string;
  valid_until?: string;
  original_price?: string;
  star_rating?: number;
  check_in?: string;
  check_out?: string;
  amenities?: string[];
  star_category?: string;
  apartment_type?: string;
  apartment_category?: string;
}

const ABBR = ["uae", "usa", "uk", "ksa", "gcc"];
const formatParam = (slug: string) =>
  slug
    ?.replace(/_/g, "-")
    .split("-")
    .map((w) =>
      ABBR.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ") ?? "";

const LISTING_TYPE_MAP: Record<string, string> = {
  hotels: "Hotels",
  hotel: "Hotels",
  stay: "Hotels",
  tours: "Tours",
  tour: "Tours",
  play: "Tours",
  packages: "Packages",
  package: "Packages",
  meetings: "Meetings",
  meeting: "Meetings",
  apartments: "Apartments",
  apartment: "Apartments",
  promotions: "Promotions",
  promotion: "Promotions",
  deals: "Promotions",
  visas: "Visas",
  visa: "Visas",
  shopping: "Shop",
  shop: "Shop",
  airports: "Transfers",
  airport: "Transfers",
};

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

const CATEGORY_NAV = [
  { slug: "hotels", label: "Stay" },
  { slug: "tours", label: "Play" },
  { slug: "packages", label: "Packages" },
  { slug: "apartments", label: "Apartments" },
  { slug: "visas", label: "Visa" },
  { slug: "promotions", label: "Deals" },
  { slug: "airports", label: "Transfers" },
  { slug: "meetings", label: "Meetings" },
  { slug: "shopping", label: "Shop" },
  { slug: "corporate", label: "Corporate" },
];

const ALL_NAV = [
  { href: "#highlights", label: "Highlights", Icon: TbCheckbox },
  { href: "#description", label: "Description", Icon: TbCompass },
  { href: "#amenities", label: "Amenities", Icon: TbGlassCocktail },
  { href: "#itinerary", label: "Itinerary", Icon: TbChecks },
  { href: "#location", label: "Location", Icon: TbMapPin },
  { href: "#gallery", label: "Gallery", Icon: RiGalleryView2 },
];

const RICH_TEXT_CLASS =
  "rich-body text-sm text-gray-600 leading-relaxed " +
  "[&_p]:mb-2.5 [&_p]:leading-relaxed [&_p]:text-sm [&_p]:text-gray-600 " +
  "[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-5 [&_h2]:mb-2 " +
  "[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-700 [&_h3]:mt-4 [&_h3]:mb-1.5 " +
  "[&_strong]:text-gray-800 [&_strong]:font-semibold " +
  "[&_em]:text-gray-500 [&_a]:text-[#00B5A3] [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul]:my-3 [&_ul]:space-y-1.5 " +
  "[&_ul_li]:flex [&_ul_li]:items-start [&_ul_li]:gap-2 [&_ul_li]:text-sm [&_ul_li]:text-gray-600 [&_ul_li]:leading-relaxed " +
  "[&_ul_li]:before:content-['✦'] [&_ul_li]:before:text-[#f2836f] [&_ul_li]:before:text-[9px] [&_ul_li]:before:mt-0.5 [&_ul_li]:before:shrink-0 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1 " +
  "[&_ol_li]:text-sm [&_ol_li]:text-gray-600 [&_ol_li]:leading-relaxed " +
  "[&_p:empty]:mb-1";

interface RelatedItem {
  id: string | number;
  ref_id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  price: number;
  status?: string;
  image_urls?: string[];
}

/* ─── Related Listings ─── */
const RelatedListings = ({
  listingType,
  categorySlug,
  countrySlug,
  citySlug,
  currentId,
}: {
  listingType: string;
  categorySlug: string;
  countrySlug: string;
  citySlug: string;
  currentId: string;
}) => {
  const [related, setRelated] = useState<RelatedItem[]>([]);

  useEffect(() => {
    const load = async () => {
      let q = supabase
        .from("ac_listings_travel")
        .select("id,ref_id,title,subtitle,tagline,price,status,image_urls")
        .eq("listing_type", listingType);
      if (COMPANY) q = q.eq("company", COMPANY);
      q = /^\d+$/.test(currentId)
        ? q.neq("ref_id", currentId)
        : q.neq("id", currentId);
      const { data } = await q.limit(4);
      if (!data) return;
      setRelated(
        data.map((d) => ({
          ...d,
          price: Number(d.price) || 0,
          image_urls: (() => {
            if (Array.isArray(d.image_urls)) return d.image_urls;
            try {
              return JSON.parse(d.image_urls);
            } catch {
              return [];
            }
          })(),
        })),
      );
    };
    load();
  }, [listingType, currentId]);

  if (!related.length) return null;

  return (
    <section className="pt-8 pb-12 border-t border-gray-100">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#00B5A3] mb-1">
            You may also like
          </p>
          <h2 className="playfair italic text-2xl font-bold text-gray-800">
            More from{" "}
            <span className="text-[#f2836f] capitalize">
              {categorySlug.replace(/-/g, " ")}
            </span>
          </h2>
        </div>
        <Link
          href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}`}
          className="flex items-center gap-1.5 text-xs font-bold text-[#00B5A3] border border-[#00B5A3]/30 bg-[#00B5A3]/5 px-4 py-2 rounded-full hover:bg-[#00B5A3] hover:text-white transition-all duration-300 shrink-0"
        >
          View all <TbArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {related.map((r) => {
          const thumb = r.image_urls?.[0] ?? null;
          return (
            <Link
              key={r.id}
              href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}/${r.ref_id ?? r.id}`}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-[#f2836f]/25 transition-all duration-500"
            >
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={r.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TbPhoto size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {r.status && (
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      r.status === "Available"
                        ? "bg-[#00B5A3]/90 text-white"
                        : r.status === "OnRequest"
                          ? "bg-amber-400/90 text-gray-800"
                          : "bg-gray-500/80 text-white"
                    }`}
                  >
                    {r.status}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <p className="text-sm font-extrabold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#00B5A3] transition-colors">
                  {r.title}
                </p>
                {(r.subtitle || r.tagline) && (
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {r.subtitle || r.tagline}
                  </p>
                )}
                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                    {r.price > 0 ? "From" : ""}
                  </span>
                  <p className={`text-sm font-extrabold ${r.price > 0 ? "text-[#f2836f]" : "text-[#00B5A3]"}`}>
                    {r.price > 0 ? `AED ${r.price.toLocaleString()}` : "Request a Quote"}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

/* ─── Section Card ─── */
const SectionCard = ({
  id,
  icon: Icon,
  iconBg = "bg-[#f2836f]/10",
  iconColor = "text-[#f2836f]",
  label,
  children,
}: {
  id?: string;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  label: string;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    className="tq-section bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden scroll-mt-28"
  >
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/70">
      <span className={`p-2 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon size={16} />
      </span>
      <h3 className="font-bold text-sm text-gray-800">{label}</h3>
    </div>
    <div className="px-6 py-6">{children}</div>
  </section>
);

/* ─── Main Page ─── */
const ItemDetailPage = () => {
  const params = useParams();
  const countrySlug = params.country as string;
  const citySlug = params.city as string;
  const categorySlug = params.category as string;
  const id = params.id as string;

  const listingType = LISTING_TYPE_MAP[categorySlug] ?? "Tours";
  const isPromotion = listingType === "Promotions";
  const isHotel = listingType === "Hotels";
  const isApartment = listingType === "Apartments";
  const isHotelOrApartment = isHotel || isApartment;


  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /* ── Fetch item ── */
  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      setLoading(true);
      let q = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", listingType);
      if (COMPANY) q = q.eq("company", COMPANY);
      q = /^\d+$/.test(id) ? q.eq("ref_id", id) : q.eq("id", id);
      const { data, error } = await q.single();

      if (error || !data) {
        console.error("Fetch error:", error?.message);
        setItem(null);
        setLoading(false);
        return;
      }

      const parseArr = (val: unknown): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val ? [val] : [];
          }
        }
        return [];
      };

      let imgs: string[] = [];
      if (Array.isArray(data.image_urls)) imgs = data.image_urls;
      else if (typeof data.image_urls === "string") {
        try {
          imgs = JSON.parse(data.image_urls);
        } catch {
          imgs = [];
        }
      }

      setItem({
        ...data,
        category: parseArr(data.category),
        country: parseArr(data.country),
        city: parseArr(data.city),
        amenities: parseArr(data.amenities),
        image_urls: imgs,
        price: Number(data.price) || 0,
        is_recom: Boolean(data.is_recom),
      });
      setLoading(false);
    };
    fetchItem();
  }, [id, listingType]);


  const images = useMemo<string[]>(() => item?.image_urls ?? [], [item]);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [images.length, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) next();
    if (touchEndX.current - touchStartX.current > 75) prev();
  };

  const lightboxPrev = () =>
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + images.length) % images.length : null,
    );
  const lightboxNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));

  const countryStr = useMemo(
    () =>
      Array.isArray(item?.country)
        ? item.country.join(", ")
        : (item?.country ?? ""),
    [item],
  );
  const cityStr = useMemo(
    () =>
      Array.isArray(item?.city) ? item.city.join(", ") : (item?.city ?? ""),
    [item],
  );
  const categoryStr = useMemo(
    () =>
      Array.isArray(item?.category)
        ? item.category.join(", ")
        : (item?.category ?? ""),
    [item],
  );

  const navLinks = ALL_NAV.filter(({ href }) => {
    if (href === "#highlights") return !!item?.highlights;
    if (href === "#description") return !!item?.description;
    if (href === "#amenities")
      return isHotelOrApartment && (item?.amenities?.length ?? 0) > 0;
    if (href === "#itinerary") return !!item?.itinerary;
    if (href === "#location") return listingType !== "Visas";
    if (href === "#gallery") return images.length > 0;
    return true;
  });

  const handleExportPDF = async () => {
    if (!item) return;
    const { exportListingPDF } = await import("@/lib/exportPromotionPDF");
    await exportListingPDF({
      title: item.title,
      subtitle: item.subtitle,
      tagline: item.tagline,
      highlights: item.highlights,
      description: item.description,
      itinerary: item.itinerary,
      category: item.category,
      country: item.country,
      city: item.city,
      location: item.location,
      price: String(item.price),
      original_price: item.original_price,
      discount_label: item.discount_label,
      valid_until: item.valid_until,
      cost_inclusions: item.cost_inclusions,
      cost_exclusions: item.cost_exclusions,
      other_info: item.other_info,
      additional_info: item.additional_info,
      terms_conditions: item.terms_conditions,
      status: item.status,
      star_category: item.star_category,
      apartment_type: item.apartment_type,
      check_in: item.check_in,
      check_out: item.check_out,
      amenities: item.amenities,
      image_urls: item.image_urls,
      listing_type: listingType,
    });
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="bg-gray-50 animate-pulse">
        {/* Skeleton hero */}
        <div className="relative h-[82vh] bg-[#0c1a2e] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/70" />
          {/* Top bar */}
          <div className="absolute top-24 left-6 md:left-14 right-6 md:right-14 flex items-center justify-between">
            <div className="h-8 w-36 rounded-full bg-white/10" />
            <div className="h-8 w-24 rounded-full bg-white/10" />
          </div>
          {/* Bottom content */}
          <div className="absolute bottom-10 left-6 md:left-14 right-6 md:right-14 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="h-6 w-28 rounded-full bg-white/10" />
              <div className="h-6 w-20 rounded-full bg-white/10" />
            </div>
            <div className="h-10 w-3/4 max-w-xl rounded-xl bg-white/12" />
            <div className="h-10 w-1/2 max-w-sm rounded-xl bg-white/10" />
            <div className="h-4 w-80 rounded-lg bg-white/8" />
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`rounded-full bg-white/20 ${i === 1 ? "w-7 h-2" : "w-2 h-2"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="max-w-7xl mx-auto py-8 px-5 md:px-10 2xl:px-0 flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            {[48, 16, 64, 16, 56, 16, 80].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-gray-200" style={{ width: w }} />
            ))}
          </div>

          {/* Section nav pills */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl py-3 px-5 flex gap-2 flex-wrap">
            {[88, 104, 96, 80, 88, 80].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-gray-100" style={{ width: w }} />
            ))}
          </div>

          {/* Category capsules */}
          <div className="flex items-center gap-2">
            {[52, 48, 88, 100, 52, 60, 96, 88, 52, 96].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-gray-200" style={{ width: w }} />
            ))}
          </div>

          {/* Two-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_440px] gap-7 items-start">
            {/* Left: content cards */}
            <div className="flex flex-col gap-5">
              {[5, 4, 3].map((lines, ci) => (
                <div key={ci} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-200" />
                    <div className="h-4 w-32 rounded-lg bg-gray-200" />
                  </div>
                  <div className="px-6 py-6 flex flex-col gap-2.5">
                    {Array.from({ length: lines }).map((_, li) => (
                      <div
                        key={li}
                        className="h-3 rounded-full bg-gray-100"
                        style={{ width: li % 3 === 2 ? "70%" : li % 3 === 1 ? "90%" : "100%" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: booking card */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                {/* Price band */}
                <div className="px-7 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-10 rounded-full bg-gray-100" />
                    <div className="h-10 w-44 rounded-xl bg-gray-200" />
                  </div>
                  <div className="h-7 w-24 rounded-full bg-gray-100 mt-1" />
                </div>
                {/* Details rows */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-3">
                  <div className="h-2.5 w-14 rounded-full bg-gray-100" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="h-2 w-14 rounded-full bg-gray-100" />
                        <div className="h-3 w-32 rounded-full bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* CTA buttons */}
                <div className="px-7 py-6 flex flex-col gap-2.5">
                  <div className="h-12 w-full rounded-2xl bg-[#f2836f]/20" />
                  <div className="h-12 w-full rounded-2xl bg-gray-100" />
                  <div className="h-12 w-full rounded-2xl bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <TbInfoCircle size={32} className="text-gray-300" />
        </div>
        <p className="text-xl font-extrabold text-gray-700">Item not found</p>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          This listing may have been removed or is no longer available.
        </p>
        <Link
          href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}`}
          className="btn-secondary-outline mt-2"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  const listingUrl = typeof window !== "undefined" ? window.location.href : "";

  const agentWhatsAppUrl = `https://wa.me/971529991223?text=${encodeURIComponent(
    [
      `*The TravQuest Travel & Tourism LLC Dubai*`,
      ``,
      `Hi, I found this listing on TravQuest and I'm interested:`,
      ``,
      `*${item.title}*`,
      `_${item.subtitle || item.tagline || ""}_`,
      ``,
      `📍 ${cityStr} — ${countryStr}`,
      `🏷️ ${categoryStr}`,
      `💰 ${item.price > 0 ? `AED ${item.price.toLocaleString()}` : "Request a Quote"}`,
      `✅ ${item.status || "Available"}`,
      ``,
      `Could you please share more details or assist with a booking?`,
      ``,
      `${listingUrl}`,
    ].join("\n"),
  )}`;

  const shareWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
    [
      `*The TravQuest Travel & Tourism LLC Dubai*`,
      ``,
      `✈️ *${item.title}*`,
      `_${item.subtitle || item.tagline || ""}_`,
      ``,
      `📍 ${cityStr} — ${countryStr}`,
      `🏷️ ${categoryStr}`,
      `💰 ${item.price > 0 ? `AED ${item.price.toLocaleString()} _(Per Person)_` : "Request a Quote"}`,
      `✅ ${item.status || "Available"}`,
      ``,
      `👉 View full listing:`,
      `${listingUrl}`,
      ``,
      `📞 +971 52 999 1223`,
      `TheTravQuest Team`,
    ].join("\n"),
  )}`;

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="bg-gray-50 text-gray-700">

      {/* ══ PRINT-ONLY MASTHEAD ══ */}
      <div className="hidden print:block">
        {/* Teal top stripe */}
        <div style={{ height: 5, background: "#00B5A3" }} />
        {/* Deep navy header band */}
        <div style={{
          background: "#0d1b2a",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 23, fontWeight: 900, color: "#f2836f", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              TravQuest
            </div>
            <div style={{ fontSize: 9, color: "rgba(0,181,163,0.75)", letterSpacing: "2.5px", textTransform: "uppercase", marginTop: 3 }}>
              Travel &amp; Tourism LLC · Dubai, UAE
            </div>
          </div>
          <div style={{ textAlign: "right", lineHeight: 1.9 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>+971 52 999 1223</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>hello@travquest.com</div>
            <div style={{ fontSize: 10, color: "#00B5A3", fontWeight: 600 }}>www.travquest.com</div>
          </div>
        </div>
        {/* Teal double rule */}
        <div style={{ height: 2, background: "#00B5A3" }} />
        <div style={{ height: 1, background: "rgba(0,181,163,0.30)", marginTop: 4 }} />
      </div>

      {/* ══ PRINT-ONLY INFO STRIP (title + price + key details) ══ */}
      {item && (
        <div className="hidden print:block">
          <div style={{
            background: "linear-gradient(135deg, #0d1b2a 0%, #1a2f4a 100%)",
            padding: "18px 32px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
          }}>
            {/* Left: title, subtitle, meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", lineHeight: 1.2, marginBottom: 5 }}>
                {item.title}
              </div>
              {(item.subtitle || item.tagline) && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontStyle: "italic", marginBottom: 9 }}>
                  {item.subtitle || item.tagline}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 10 }}>
                {(cityStr || countryStr) && (
                  <span style={{ color: "#00B5A3", fontWeight: 700 }}>
                    📍 {cityStr}{countryStr ? `, ${countryStr}` : ""}
                  </span>
                )}
                {categoryStr && (
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>{categoryStr}</span>
                )}
                {item.status && (
                  <span style={{ color: "#00B5A3", fontWeight: 700 }}>● {item.status}</span>
                )}
                {isHotel && item.star_category && (
                  <span style={{ color: "#f2836f", fontWeight: 700 }}>★ {item.star_category}</span>
                )}
              </div>
            </div>
            {/* Right: price */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {item.original_price && Number(item.original_price) > 0 && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", textDecoration: "line-through", marginBottom: 2 }}>
                  AED {Number(item.original_price).toLocaleString()}
                </div>
              )}
              <div style={{ fontSize: 9, color: "rgba(0,181,163,0.75)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 3 }}>
                Starting from
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#f2836f", lineHeight: 1 }}>
                {item.price > 0 ? `AED ${item.price.toLocaleString()}` : "Request a Quote"}
              </div>
              {item.original_price && item.price > 0 && Number(item.original_price) > 0 && (
                <div style={{
                  marginTop: 5,
                  display: "inline-block",
                  background: "#f2836f",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "2px 8px",
                  borderRadius: 999,
                  letterSpacing: "0.5px",
                }}>
                  {Math.round((1 - item.price / Number(item.original_price)) * 100)}% OFF
                </div>
              )}
            </div>
          </div>
          {/* Teal + coral brand stripe */}
          <div style={{ display: "flex", height: 4 }}>
            <div style={{ flex: "0 0 62%", background: "#00B5A3" }} />
            <div style={{ flex: "0 0 38%", background: "#f2836f" }} />
          </div>
        </div>
      )}

      {/* ──────────── Lightbox ──────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-white z-[60] flex flex-col"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-extrabold text-gray-800 text-sm leading-tight truncate">
                {item.title}
              </p>
              {isHotel && item.star_rating != null && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: item.star_rating }).map((_, i) => (
                    <TbStarFilled
                      key={i}
                      size={12}
                      className="text-[#f2836f]"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-sm font-bold text-gray-400 tabular-nums">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto bg-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-5">
              {/* Main image */}
              <div className="relative flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxPrev();
                  }}
                  className="absolute left-0 z-10 w-10 h-14 flex items-center justify-center rounded-2xl bg-white shadow border border-gray-100 hover:bg-gray-50 text-gray-600 transition hover:scale-105"
                >
                  <TbChevronLeft size={22} />
                </button>
                <div className="relative w-full h-[40vh] md:h-[58vh] mx-12 rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src={images[lightboxIndex]}
                    alt={`Gallery ${lightboxIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxNext();
                  }}
                  className="absolute right-0 z-10 w-10 h-14 flex items-center justify-center rounded-2xl bg-white shadow border border-gray-100 hover:bg-gray-50 text-gray-600 transition hover:scale-105"
                >
                  <TbChevronRight size={22} />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                      i === lightboxIndex
                        ? "border-[#00B5A3] scale-105 shadow-md"
                        : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`Thumb ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── Hero Slider ──────────── */}
      <div
        id="tq-hero"
        className="relative h-[82vh] w-full select-none overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        {images.length > 0 ? (
          images.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === current ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                src={img}
                alt={`${item.title} ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover scale-[1.02]"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/80" />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
        )}

        {/* Hero top bar — back + photo count */}
        <div className="print:hidden absolute top-0 left-0 right-0 z-20 px-6 md:px-14 2xl:px-0 pt-20 lg:pt-24">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}`}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-full transition-all duration-200"
            >
              <TbChevronLeft size={14} /> Back to {formatParam(categorySlug)}
            </Link>
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-full transition-all duration-200"
              >
                <TbPhoto size={14} /> {images.length} Photos
              </button>
            )}
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-10 px-6 md:px-14 2xl:px-0">
          <div className="max-w-6xl mx-auto w-full">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {item.is_recom && (
                <span className="inline-flex items-center gap-1.5 bg-[#00B5A3]/90 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full">
                  <TbSparkles size={11} /> Recommended
                </span>
              )}
              {isHotel && item.star_category && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full">
                  {item.star_category} Hotel
                </span>
              )}
              {isApartment && item.apartment_type && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full">
                  <TbBed size={11} /> {item.apartment_type}
                </span>
              )}
              {isPromotion && item.discount_label && (
                <span className="inline-flex items-center gap-1.5 bg-[#f2836f]/90 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full">
                  <TbTag size={11} /> {item.discount_label}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="cursive italic text-3xl md:text-4xl 2xl:text-5xl font-bold text-white leading-tight drop-shadow-md max-w-4xl mb-1.5">
              {item.title}
            </h1>
            {(item.subtitle || item.tagline) && (
              <p className="text-sm text-white/70 max-w-2xl font-medium leading-relaxed line-clamp-2 mb-3">
                {item.subtitle || item.tagline}
              </p>
            )}

            {/* Slide controls */}
            {images.length > 1 && (
              <div className="print:hidden flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      aria-label={`Slide ${i + 1}`}
                      className={`transition-all duration-500 rounded-full ${
                        i === current
                          ? "w-7 h-2 bg-[#f2836f] shadow-[0_0_8px_#f2836f88]"
                          : "w-2 h-2 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    aria-label="Previous"
                    className="p-2 rounded-xl text-white bg-white/10 border border-white/15 hover:bg-[#f2836f] hover:border-[#f2836f] backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <TbChevronLeft size={20} />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next"
                    className="p-2 rounded-xl text-white bg-white/10 border border-white/15 hover:bg-[#f2836f] hover:border-[#f2836f] backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <TbChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Body ──────────── */}
      <div id="tq-body" className="max-w-6xl mx-auto py-8 px-5 md:px-10 2xl:px-0 flex flex-col gap-6">
        {/* Breadcrumb */}
        <nav className="print:hidden flex items-center flex-wrap gap-1 text-xs text-gray-400 font-semibold">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#00B5A3] transition-colors"
          >
            <TbHome size={13} /> Home
          </Link>
          {[
            {
              label: formatParam(countrySlug),
              href: `/destinations/${countrySlug}`,
            },
            {
              label: formatParam(citySlug),
              href: `/destinations/${countrySlug}/${citySlug}`,
            },
            {
              label: formatParam(categorySlug),
              href: `/destinations/${countrySlug}/${citySlug}/${categorySlug}`,
            },
          ].map(({ label, href }) => (
            <span key={href} className="flex items-center gap-1">
              <TbCrumb size={11} className="text-gray-300" />
              <Link
                href={href}
                className="hover:text-[#00B5A3] transition-colors"
              >
                {label}
              </Link>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <TbCrumb size={11} className="text-gray-300" />
            <span className="text-gray-600 font-extrabold truncate max-w-[200px]">
              {item.title}
            </span>
          </span>
        </nav>

        {/* Section nav pill bar */}
        {navLinks.length > 0 && (
          <div className="print:hidden sticky top-18 z-30 bg-white/95 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl py-3 px-5 md:px-7 flex flex-wrap gap-1">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#00B5A3] px-3.5 py-1.5 rounded-full hover:bg-[#00B5A3]/8 transition-all duration-200"
              >
                <Icon
                  size={14}
                  className="text-[#f2836f] group-hover:text-[#00B5A3] group-hover:scale-110 transition-all duration-200 shrink-0"
                />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Category switcher capsules */}
        <div className="print:hidden flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORY_NAV.map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/destinations/${countrySlug}/${citySlug}/${slug}`}
              className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-wide px-4 py-1.5 rounded-full border transition-all duration-200 ${
                categorySlug === slug
                  ? "bg-[#00B5A3] text-white border-[#00B5A3]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#00B5A3]/40 hover:text-[#00B5A3]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div id="tq-detail-grid" className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_440px] gap-7 items-start">
          {/* ── LEFT: Content ── */}
          <div className="flex flex-col gap-5">
            {item.highlights && (
              <SectionCard id="highlights" icon={TbCheckbox} label="Highlights">
                <div
                  className={RICH_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: item.highlights }}
                />
              </SectionCard>
            )}

            {item.description && (
              <SectionCard
                id="description"
                icon={TbCompass}
                label="Description"
              >
                <div
                  className={RICH_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </SectionCard>
            )}

            {isHotelOrApartment && (item.amenities?.length ?? 0) > 0 && (
              <SectionCard
                id="amenities"
                icon={TbGlassCocktail}
                iconBg="bg-[#00B5A3]/10"
                iconColor="text-[#00B5A3]"
                label="Amenities"
              >
                <div className="flex flex-wrap gap-2">
                  {item.amenities!.map((amenity) => (
                    <span
                      key={amenity}
                      className="text-sm font-semibold text-[#00B5A3] bg-[#00B5A3]/8 border border-[#00B5A3]/20 px-3.5 py-1.5 rounded-full hover:bg-[#00B5A3]/15 transition-colors"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {item.itinerary && (
              <SectionCard id="itinerary" icon={TbLicense} label="Itinerary">
                <div
                  className={RICH_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: item.itinerary }}
                />
              </SectionCard>
            )}

            {isHotelOrApartment && item.restaurants && (
              <SectionCard
                id="restaurants"
                icon={RiGalleryView2}
                iconBg="bg-[#00B5A3]/10"
                iconColor="text-[#00B5A3]"
                label="Restaurants"
              >
                <div
                  className={RICH_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: item.restaurants }}
                />
              </SectionCard>
            )}

            {isPromotion && item.valid_until && (
              <div className="flex items-center gap-3 bg-[#f2836f]/6 border border-[#f2836f]/20 text-[#f2836f] text-sm font-semibold px-6 py-4 rounded-2xl">
                <TbCalendarMonth size={20} className="shrink-0" />
                This offer is valid until <strong>{item.valid_until}</strong>
              </div>
            )}

            {listingType !== "Visas" && (
              <div className="print:hidden">
                <SectionCard
                  id="location"
                  icon={TbMapPin}
                  iconBg="bg-[#00B5A3]/10"
                  iconColor="text-[#00B5A3]"
                  label="Location / Map"
                >
                  <div className="w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border border-gray-100">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <TbMapPin size={28} />
                      <p className="text-xs font-bold">Map coming soon</p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {item.other_info && (
              <SectionCard
                icon={TbInfoCircle}
                iconBg="bg-[#00B5A3]/10"
                iconColor="text-[#00B5A3]"
                label="Other Information"
              >
                <div
                  className={RICH_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: item.other_info }}
                />
              </SectionCard>
            )}

            {item.terms_conditions && (
              <div className="hidden lg:block">
                <SectionCard
                  icon={TbLicense}
                  iconBg="bg-gray-100"
                  iconColor="text-gray-500"
                  label="Terms & Conditions"
                >
                  <div
                    className={RICH_TEXT_CLASS}
                    dangerouslySetInnerHTML={{ __html: item.terms_conditions }}
                  />
                </SectionCard>
              </div>
            )}

            {images.length > 0 && (
              <SectionCard id="gallery" icon={RiGalleryView2} label="Gallery">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="relative aspect-video rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/50"
                    >
                      <Image
                        src={src}
                        alt={`${item.title} ${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <TbPhoto size={18} className="text-white" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── MIDDLE: Booking card ── */}
          <div id="tq-booking-wrapper" className="lg:sticky lg:top-24 flex flex-col gap-4">
            <div id="tq-booking-card" className="bg-white border border-gray-100 shadow-lg rounded-3xl overflow-hidden">
              {/* Price band */}
              <div className="px-7 pt-7 pb-5 border-b border-gray-50">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    {item.original_price && Number(item.original_price) > 0 && (
                      <p className="text-sm text-gray-400 line-through mb-0.5">
                        AED {Number(item.original_price).toLocaleString()}
                      </p>
                    )}
                    {item.price > 0 ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400">
                          from
                        </span>
                        <span className="text-[2.25rem] font-extrabold text-[#f2836f] leading-none">
                          AED {item.price.toLocaleString()}
                        </span>
                        {item.original_price && Number(item.original_price) > 0 && (
                          <span className="text-[11px] font-extrabold bg-[#f2836f] text-white px-2 py-1 rounded-full self-center">
                            {Math.round((1 - item.price / Number(item.original_price)) * 100)}% OFF
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xl font-extrabold text-[#00B5A3] leading-none">
                        Request a Quote
                      </p>
                    )}
                  </div>
                  {item.status && (
                    <span
                      className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border mt-1 ${
                        item.status === "Available"
                          ? "border-[#00B5A3]/25 bg-[#00B5A3]/8 text-[#00B5A3]"
                          : item.status === "OnRequest"
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : "border-red-200 bg-red-50 text-red-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
                {isPromotion && item.discount_label && (
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-[#f2836f]/8 text-[#f2836f] text-[11px] font-medium px-3 py-1 rounded-full border border-[#f2836f]/20">
                    <TbTag size={11} /> {item.discount_label}
                  </span>
                )}
                {isPromotion && item.valid_until && (
                  <p className="flex items-center gap-1.5 mt-2.5 text-[#f2836f] text-sm font-bold">
                    <TbCalendarMonth size={14} /> Valid until {item.valid_until}
                  </p>
                )}
              </div>

              {/* Quick-info details */}
              <div className="px-6 py-6 border-b border-gray-100">
                <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4">
                  Details
                </p>
                <div className="flex flex-col gap-4">
                  {(cityStr || countryStr) && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#f2836f]/10 flex items-center justify-center shrink-0">
                        <TbMapPin size={15} className="text-[#f2836f]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">
                          Location
                        </p>
                        <p className="text-sm font-semibold text-gray-700 truncate">
                          {cityStr}
                          {countryStr ? `, ${countryStr}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {categoryStr && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                        <TbCategoryPlus size={15} className="text-[#00B5A3]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">
                          Category
                        </p>
                        <p className="text-sm font-semibold text-gray-700 truncate">
                          {categoryStr}
                        </p>
                      </div>
                    </div>
                  )}
                  {isHotel && item.star_category && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <TbStarFilled size={15} className="text-amber-400" />
                      </span>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">
                          Star Rating
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({
                            length: parseInt(item.star_category) || 0,
                          }).map((_, i) => (
                            <TbStarFilled
                              key={i}
                              size={13}
                              className="text-amber-400"
                            />
                          ))}
                          <span className="text-sm font-semibold text-gray-700 ml-1">
                            {item.star_category}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {isHotel && (item.check_in || item.check_out) && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                        <TbCalendarMonth size={15} className="text-[#00B5A3]" />
                      </span>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">
                          Check-in / Check-out
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {item.check_in ?? "—"} → {item.check_out ?? "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {isApartment && item.apartment_type && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                        <TbBed size={15} className="text-[#00B5A3]" />
                      </span>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">
                          Apartment Type
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {item.apartment_type}
                          {item.apartment_category
                            ? ` · ${item.apartment_category}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inclusions / Exclusions / Additional / Terms */}
              {item.additional_info && (
                <div className="px-6 py-5 border-b border-gray-100">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500 mb-3">
                    Additional Info
                  </p>
                  <div
                    className="text-sm text-gray-500 leading-relaxed [&_p]:text-sm [&_li]:text-sm [&_p]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:text-gray-500"
                    dangerouslySetInnerHTML={{ __html: item.additional_info }}
                  />
                </div>
              )}
              {item.cost_inclusions && (
                <div className="mx-6 my-4 rounded-2xl border border-[#00B5A3]/20 bg-[#00B5A3]/4 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#00B5A3]/15">
                    <TbChecks size={15} className="text-[#00B5A3] shrink-0" />
                    <p className="text-sm font-bold text-[#00B5A3]">
                      Price Inclusions
                    </p>
                  </div>
                  <div
                    className="px-4 py-3 text-sm text-gray-600 leading-relaxed [&_p]:text-sm [&_p]:mb-2 [&_li]:text-sm [&_ul]:pl-4 [&_ul]:list-disc [&_li]:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: item.cost_inclusions }}
                  />
                </div>
              )}
              {item.cost_exclusions && (
                <div className="mx-6 my-4 rounded-2xl border border-[#f2836f]/20 bg-[#f2836f]/4 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f2836f]/15">
                    <TbX size={15} className="text-[#f2836f] shrink-0" />
                    <p className="text-sm font-bold text-[#f2836f]">
                      Price Exclusions
                    </p>
                  </div>
                  <div
                    className="px-4 py-3 text-sm text-gray-600 leading-relaxed [&_p]:text-sm [&_p]:mb-2 [&_li]:text-sm [&_ul]:pl-4 [&_ul]:list-disc [&_li]:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: item.cost_exclusions }}
                  />
                </div>
              )}

              {item.terms_conditions && (
                <div className="lg:hidden mx-6 my-4 rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <TbLicense size={15} className="text-gray-500 shrink-0" />
                    <p className="text-sm font-bold text-gray-600">
                      Terms & Conditions
                    </p>
                  </div>
                  <div
                    className="px-4 py-3 text-sm text-gray-600 leading-relaxed [&_p]:text-sm [&_p]:mb-2 [&_li]:text-sm [&_ul]:pl-4 [&_ul]:list-disc [&_li]:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: item.terms_conditions }}
                  />
                </div>
              )}

              <div className="print:hidden px-7 py-5 border-b border-gray-50">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-[#f2836f]/30 bg-[#f2836f]/6 text-[#f2836f] text-xs font-extrabold uppercase tracking-wider hover:bg-[#f2836f] hover:text-white hover:border-[#f2836f] hover:shadow-[0_4px_14px_#f2836f33] active:scale-[0.98] transition-all duration-200"
                >
                  <TbFileTypePdf size={17} />
                  {isPromotion
                    ? "Download Promotion PDF"
                    : isHotel
                    ? "Download Hotel Brochure"
                    : isApartment
                    ? "Download Apartment Brochure"
                    : "Download Listing PDF"}
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Exports a branded TravQuest PDF with full listing details
                </p>
              </div>

              {/* CTAs */}
              <div className="print:hidden px-7 py-7 flex flex-col gap-3">
                <Link
                  href={agentWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-base select-none w-full justify-center"
                >
                  <TbBrandWhatsapp size={17} /> Message Agent
                </Link>
                <Link
                  href="tel:+971529991223"
                  className="btn-secondary-base select-none w-full justify-center"
                >
                  <TbPhone size={17} /> Call Agent
                </Link>
                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <Link
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary-outline select-none w-full justify-center"
                >
                  <TbShare size={17} /> Share Listing
                </Link>
                <Link
                  href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}`}
                  className="btn-dark-base select-none justify-center w-full"
                >
                  ← Back to Listings
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ── Related Listings ── */}
        <div className="print:hidden">
          <RelatedListings
            listingType={listingType}
            categorySlug={categorySlug}
            countrySlug={countrySlug}
            citySlug={citySlug}
            currentId={id}
          />
        </div>

        {/* Back to top */}
        <div className="print:hidden flex justify-center pb-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#00B5A3] bg-white border border-gray-200 hover:border-[#00B5A3]/40 px-5 py-2.5 rounded-full shadow-sm transition-all duration-200"
          >
            <TbChevronRight size={13} className="-rotate-90" /> Back to top
          </button>
        </div>
      </div>

      {/* ══ PRINT-ONLY FOOTER ══ */}
      <div className="hidden print:block" style={{ marginTop: 32 }}>
        {/* Teal rule */}
        <div style={{ height: 2, background: "#00B5A3" }} />
        {/* Deep navy footer band */}
        <div style={{
          background: "#0d1b2a",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 9, color: "rgba(0,181,163,0.70)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            TravQuest Travel &amp; Tourism LLC · Dubai, UAE
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>
            +971 52 999 1223 &nbsp;·&nbsp; hello@travquest.com &nbsp;·&nbsp; www.travquest.com
          </div>
        </div>
        {/* Teal + coral brand stripe */}
        <div style={{ display: "flex", height: 5 }}>
          <div style={{ flex: "0 0 62%", background: "#00B5A3" }} />
          <div style={{ flex: "0 0 38%", background: "#f2836f" }} />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
