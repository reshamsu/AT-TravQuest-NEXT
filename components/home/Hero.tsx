"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  TbSearch,
  TbMapPin,
  TbBuilding,
  TbWorld,
  TbTrendingUp,
  TbX,
  TbCompass,
  TbBed,
  TbBriefcase,
  TbHome,
  TbFileText,
  TbArrowUpRight,
  TbArrowLeft,
  TbCar,
  TbShoppingBag,
} from "react-icons/tb";
import type { HeroSectionRow } from "@/lib/useHomeData";

const FALLBACK_IMAGES = ["/assets/hero/hero-default.jpg"];
const DEFAULT_TITLE = "Let Us Unfold Your Extraordinary Travel Story";
const DEFAULT_SUBTITLE =
  "Discover thousands of beautiful places around the world.";

const SEARCH_CATEGORIES = [
  {
    key: "hotels",
    label: "Stay",
    placeholder: "Search hotels, resorts, stays…",
  },
  {
    key: "tours",
    label: "Play",
    placeholder: "Search tours, safaris, experiences…",
  },
  {
    key: "packages",
    label: "Packages",
    placeholder: "Search travel packages…",
  },
  {
    key: "apartments",
    label: "Apartments",
    placeholder: "Search service apartments…",
  },
  { key: "visas", label: "Visa", placeholder: "Search visa types…" },
  {
    key: "shopping",
    label: "Shop",
    placeholder: "Search malls, markets, shops…",
  },
] as const;

const STEP2_CATEGORIES = [
  {
    key: "hotels",
    label: "Stay",
    Icon: TbBed,
    color: "#00B5A3",
    desc: "Hotels, Resorts & Apartments at Best Rates",
  },
  {
    key: "tours",
    label: "Play",
    Icon: TbCompass,
    color: "#f2836f",
    desc: "Theme Parks, Attractions & Unforgettable Activities",
  },
  {
    key: "packages",
    label: "Packages",
    Icon: TbBriefcase,
    color: "#6366f1",
    desc: "Curated Trips, Guided Tours & All-in-One Holidays",
  },
  {
    key: "meetings",
    label: "Meetings",
    Icon: TbHome,
    color: "#f59e0b",
    desc: "Premium Spaces for Meetings Conferences & Events",
  },
    {
    key: "apartments",
    label: "Apartments",
    Icon: TbHome,
    color: "#f59e0b",
    desc: "Spacious Stays for Comfort, Work & Extended Visits",
  },
  {
    key: "transfers",
    label: "Transfers",
    Icon: TbCar,
    color: "#0ea5e9",
    desc: "Private Rides, Pickups & Seamless Airport Travel",
  },
  {
    key: "visas",
    label: "Visa",
    Icon: TbFileText,
    color: "#e11d48",
    desc: "Fast, Reliable Processing with Expert Guidance",
  },
  {
    key: "shopping",
    label: "Shop",
    Icon: TbShoppingBag,
    color: "#8b5cf6",
    desc: "Top Malls, Luxury Brands & Local Markets",
  },
] as const;

const CATEGORY_TABLE: Record<string, string> = {
  tours: "tours",
  hotels: "hotels",
  packages: "packages",
  apartments: "apartments",
  visas: "visas",
  shopping: "shop",
};

type SupabaseRow = {
  id: number;
  title: string;
  city: string | string[];
  country: string | string[];
  status?: string;
};

const SLIDE_COPY: { eyebrow: string; title: string; subtitle: string }[] = [
  {
    eyebrow: "Discover the World",
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
  },
  {
    eyebrow: "Luxury Stays",
    title: "Sleep Where the World Feels Like a Dream",
    subtitle:
      "Hand-picked hotels, resorts and private villas for every kind of traveller.",
  },
  {
    eyebrow: "Curated Experiences",
    title: "Every Journey Deserves Its Perfect Story",
    subtitle:
      "From desert safaris to rooftop dinners — we craft moments you'll never forget.",
  },
  {
    eyebrow: "Explore Packages",
    title: "One Price. Infinite Possibilities.",
    subtitle:
      "All-inclusive packages designed so you can focus on the adventure, not the planning.",
  },
  {
    eyebrow: "Hidden Gems",
    title: "Beyond the Ordinary, Into the Extraordinary",
    subtitle:
      "Discover destinations that don't make the postcards — but absolutely should.",
  },
  {
    eyebrow: "Travel Smart",
    title: "Seamless Travel, Start to Finish",
    subtitle:
      "Visas, transfers, stays and tours — everything handled in one place.",
  },
];

const slugify = (text: string) =>
  text
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") ?? "";

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

interface Suggestion {
  type: "country" | "city" | "item";
  label: string;
  sublabel: string;
  href: string;
}

interface QuickSuggestion {
  label: string;
  href: string;
}

interface PopularDestination {
  id: string;
  slug: string;
  displayLabel: string;
  image: string;
  tagline: string;
  dbCountry: string;
}

interface SelectedLocation {
  label: string;
  countrySlug: string;
  citySlug: string;
  country: string;
  dbCountry: string;
  type: "country" | "city";
}

const Hero = ({ initialData }: { initialData?: HeroSectionRow | null }) => {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Autocomplete state
  const [allDestinations, setAllDestinations] = useState<
    { country: string; city: string }[]
  >([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [quickSuggestions, setQuickSuggestions] = useState<QuickSuggestion[]>(
    [],
  );
  const [popularDests, setPopularDests] = useState<PopularDestination[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [categoryAvailability, setCategoryAvailability] = useState<
    Record<string, boolean | undefined>
  >({});

  const modalInputRef = useRef<HTMLInputElement>(null);

  // Fetch hero images/copy from CMS
  useEffect(() => {
    if (initialData) {
      const heroImages = normalizeImages(initialData.image_urls);
      Promise.resolve().then(() => {
        if (heroImages.length) setImages(heroImages);
        if (initialData.hero_title)
          SLIDE_COPY[0].title = initialData.hero_title;
        if (initialData.hero_subtitle)
          SLIDE_COPY[0].subtitle = initialData.hero_subtitle;
      });
      return;
    }
    const fetchHero = async () => {
      const { data, error } = await supabase
        .from("ac_heroes")
        .select("title, subtitle, images")
        .eq("page_id", "home")
        .single();
      if (error || !data) return;
      const heroImages = normalizeImages(data.images);
      if (heroImages.length) setImages(heroImages);
      if (data.title) SLIDE_COPY[0].title = data.title;
      if (data.subtitle) SLIDE_COPY[0].subtitle = data.subtitle;
    };
    fetchHero();
  }, [initialData]);

  // Prefetch destinations for autocomplete
  useEffect(() => {
    supabase
      .from("ac_destinations")
      .select("country, city")
      .neq("status", "Hidden")
      .then(({ data }) => {
        if (data)
          setAllDestinations(data as { country: string; city: string }[]);
      });
  }, []);

  // Fetch popular destinations for modal discovery cards
  useEffect(() => {
    supabase
      .from("ac_destinations")
      .select("id, country, city, image_urls, tagline")
      .neq("status", "Hidden")
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data }) => {
        if (!data) return;
        const seenUae = new Set<string>();
        const seenCountry = new Set<string>();
        const result: PopularDestination[] = [];
        const UAE_CITIES = ["abu dhabi", "dubai", "fujairah", "ras al khaimah"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
          const countryNorm = (row.country ?? "").trim().toLowerCase();
          const cityNorm = (row.city ?? "").trim().toLowerCase();
          const imgs = normalizeImages(row.image_urls);
          if (countryNorm === "uae" || countryNorm === "united arab emirates") {
            if (
              cityNorm &&
              UAE_CITIES.includes(cityNorm) &&
              !seenUae.has(cityNorm)
            ) {
              seenUae.add(cityNorm);
              result.push({
                id: row.id,
                slug: `uae/${slugify(row.city)}`,
                displayLabel: row.city,
                image: imgs[0] ?? "/assets/banner/property1.webp",
                tagline: row.tagline ?? "",
                dbCountry: row.country,
              });
            }
          } else {
            // Only use root entries (no city) so a hidden country-level row removes the card
            if (!cityNorm && !seenCountry.has(countryNorm)) {
              seenCountry.add(countryNorm);
              result.push({
                id: row.id,
                slug: slugify(row.country),
                displayLabel: row.country,
                image: imgs[0] ?? "/assets/banner/property1.webp",
                tagline: row.tagline ?? "",
                dbCountry: row.country,
              });
            }
          }
        }
        setPopularDests(result);
      });
  }, []);

  // Fetch quick-access chips on mount
  useEffect(() => {
    const fetchQuick = async () => {
      const tableEntries = Object.entries(CATEGORY_TABLE);
      const perTable = await Promise.all(
        tableEntries.map(([catKey, table]) =>
          supabase
            .from(table)
            .select("id, title, city, country, status")
            .neq("status", "Hidden")
            .limit(2)
            .then(({ data }) =>
              (data ?? []).map((item: SupabaseRow) => {
                const itemCountry = Array.isArray(item.country)
                  ? item.country[0]
                  : (item.country ?? "");
                const itemCity = Array.isArray(item.city)
                  ? item.city[0]
                  : (item.city ?? "");
                return {
                  label: item.title as string,
                  href: `/destinations/${slugify(itemCountry)}/${slugify(itemCity)}/${catKey}/${item.id}`,
                };
              }),
            ),
        ),
      );
      setQuickSuggestions(perTable.flat().slice(0, 8));
    };
    fetchQuick();
  }, []);

  // Debounced autocomplete (runs when modal is open and query changes)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(
      async () => {
        if (!query.trim()) {
          setSuggestions([]);
          setHighlightedIndex(-1);
          return;
        }
        const q = query.toLowerCase().trim();

        const countrySet = new Set<string>();
        const cityMatches: { country: string; city: string }[] = [];
        for (const dest of allDestinations) {
          const lc = dest.country?.toLowerCase();
          const lci = dest.city?.toLowerCase();
          if (lc?.includes(q) && !countrySet.has(dest.country))
            countrySet.add(dest.country);
          if (lci?.includes(q)) cityMatches.push(dest);
        }

        const countrySugs: Suggestion[] = Array.from(countrySet)
          .map((country) => ({
            type: "country" as const,
            label: country,
            sublabel: "Country",
            href: `/destinations/${slugify(country)}`,
          }));

        const seenCities = new Set<string>();
        const citySugs: Suggestion[] = cityMatches
          .filter((d) => {
            const k = `${d.city}|${d.country}`;
            if (seenCities.has(k)) return false;
            seenCities.add(k);
            return true;
          })
          .map((d) => ({
            type: "city" as const,
            label: d.city,
            sublabel: d.country,
            href: `/destinations/${slugify(d.country)}/${slugify(d.city)}`,
          }));

        let itemSugs: Suggestion[] = [];
        if (q.length >= 2) {
          setDropdownLoading(true);
          const perTableResults = await Promise.all(
            Object.entries(CATEGORY_TABLE).map(([catKey, table]) =>
              supabase
                .from(table)
                .select("id, title, city, country, status")
                .ilike("title", `%${q}%`)
                .neq("status", "Hidden")
                .order("id", { ascending: false })
                .limit(20)
                .then(({ data }) =>
                  (data ?? [])
                    .map((item: SupabaseRow) => {
                      const itemCountry = Array.isArray(item.country)
                        ? item.country[0]
                        : (item.country ?? "");
                      const itemCity = Array.isArray(item.city)
                        ? item.city[0]
                        : (item.city ?? "");
                      const catLabel =
                        SEARCH_CATEGORIES.find((c) => c.key === catKey)
                          ?.label ?? catKey;
                      return {
                        type: "item" as const,
                        label: item.title,
                        sublabel: [catLabel, itemCity, itemCountry]
                          .filter(Boolean)
                          .join(" · "),
                        href: `/destinations/${slugify(itemCountry)}/${slugify(itemCity)}/${catKey}/${item.id}`,
                      };
                    }),
                ),
            ),
          );
          itemSugs = perTableResults.flat();
        }

        setSuggestions([...countrySugs, ...citySugs, ...itemSugs]);
        setDropdownLoading(false);
        setHighlightedIndex(-1);
      },
      query.trim() ? 250 : 0,
    );
    return () => clearTimeout(timer);
  }, [query, allDestinations, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Slide show
  const goTo = useCallback((next: number) => setCurrent(next), []);
  const nextSlide = useCallback(
    () => goTo((current + 1) % images.length),
    [current, images.length, goTo],
  );
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(nextSlide, 5500);
    return () => clearInterval(id);
  }, [images.length, nextSlide]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSuggestions([]);
    setHighlightedIndex(-1);
    setDropdownLoading(false);
    setSelectedLocation(null);
    setCategoryAvailability({});
  }, []);

  const chooseLocation = useCallback((location: SelectedLocation | null) => {
    setCategoryAvailability({});
    setSelectedLocation(location);
  }, []);

  // Check which categories have data for the selected location
  useEffect(() => {
    if (!selectedLocation) return;
    let cancelled = false;
    const dbCountry = selectedLocation.dbCountry;
    const tables = Object.keys(CATEGORY_TABLE); // tours, hotels, packages, apartments, visas

    Promise.all(
      tables.map(async (cat) => {
        try {
          // Try array-field match first (most tables store country as string[])
          const { count: arrCount, error: arrError } = await supabase
            .from(CATEGORY_TABLE[cat])
            .select("id", { count: "exact", head: true })
            .contains("country", [dbCountry]);
          if (!arrError && (arrCount ?? 0) > 0) return [cat, true] as const;

          // Fall back to text-field match
          const { count: strCount } = await supabase
            .from(CATEGORY_TABLE[cat])
            .select("id", { count: "exact", head: true })
            .ilike("country", dbCountry);
          return [cat, (strCount ?? 0) > 0] as const;
        } catch {
          return [cat, false] as const;
        }
      }),
    ).then((results) => {
      if (!cancelled) {
        setCategoryAvailability(Object.fromEntries(results));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedLocation]);

  const detectCategory = (q: string): string => {
    const s = q.toLowerCase();
    if (/hotel|resort|stay|villa|inn|lodge/.test(s)) return "hotels";
    if (/package|honeymoon|family trip|group tour|city break|weekend/.test(s))
      return "packages";
    if (/apartment|flat|studio|serviced/.test(s)) return "apartments";
    if (/visa/.test(s)) return "visas";
    if (/shop|mall|market|store|retail/.test(s)) return "shopping";
    return "tours";
  };

  const handleModalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      router.push(suggestions[highlightedIndex].href);
      closeModal();
      return;
    }
    const raw = query.trim();
    if (!raw) return;
    const cat = detectCategory(raw);
    router.push(`/destinations/uae/all/${cat}?q=${encodeURIComponent(raw)}`);
    closeModal();
  };

  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    }
  };

  // Group suggestions
  const countrySugs = suggestions.filter((s) => s.type === "country");
  const citySugs = suggestions.filter((s) => s.type === "city");
  const itemSugs = suggestions.filter((s) => s.type === "item");
  const countryOffset = 0;
  const cityOffset = countrySugs.length;
  const itemOffset = countrySugs.length + citySugs.length;

  return (
    <>
      {/* ─────────── Hero ─────────── */}
      <div className="relative h-screen bg-[#070f19]">
        {/* Slides */}
        <div className="absolute inset-0 overflow-hidden">
          {images.map((img, i) => (
            <div
              key={img + i}
              className={`absolute inset-0 transition-opacity duration-1200 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ scale: i === current ? 1.06 : 1 }}
                transition={{ duration: 6, ease: "linear" }}
              >
                <Image
                  src={img}
                  alt={SLIDE_COPY[i]?.title ?? `Slide ${i + 1}`}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-linear-to-t from-[#070f19] via-black/40 to-black/10" />
              <div className="absolute inset-0 bg-linear-to-r from-[#070f19]/70 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-linear-to-tr from-[#f2836f]/10 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Slide dots */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${i === current ? "w-6 h-[5px] bg-[#f2836f] shadow-[0_0_8px_rgba(242,131,111,0.7)]" : "w-[5px] h-[5px] bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-20 px-6 md:px-10 2xl:px-0">
          <div id="discover" />
          <div className="max-w-6xl 2xl:max-w-7xl md:mx-auto w-full flex flex-col items-start gap-5">
            {/* Animated copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className="flex flex-col items-start gap-4 max-w-md md:max-w-2xl lg:max-w-3xl"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] border border-[#f2836f]/30 bg-[#f2836f]/10 text-[#f2836f] px-4 py-1.5 rounded-full backdrop-blur-sm"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] animate-pulse" />
                  {SLIDE_COPY[current % SLIDE_COPY.length].eyebrow}
                </motion.span>
                <h1 className="cursive text-4xl 2xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                  {SLIDE_COPY[current % SLIDE_COPY.length].title}
                </h1>
                <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-lg">
                  {SLIDE_COPY[current % SLIDE_COPY.length].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Search widget */}
            <div className="flex flex-col gap-3 w-full max-w-sm md:max-w-lg">
              {/* Trigger button */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative w-full flex items-center pl-12 pr-14 py-3.5 rounded-full bg-white/10 backdrop-blur-lg border border-white/15 hover:border-[#f2836f]/50 hover:bg-white/14 transition-all duration-300 shadow-lg group text-left"
              >
                <TbSearch
                  size={17}
                  className="absolute left-5 text-white/50 group-hover:text-white/70 transition-colors pointer-events-none"
                />
                <span className="text-sm text-white/40 group-hover:text-white/55 transition-colors flex-1 truncate">
                  Search tours, hotels, destinations…
                </span>
                <span className="absolute right-1.5 bg-[#f2836f] text-white rounded-full p-2.5 shadow-md pointer-events-none">
                  <TbSearch size={16} />
                </span>
              </button>

              {/* Quick suggestion chips */}
              <AnimatePresence>
                {quickSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2.5"
                  >
                    <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/40">
                      <TbTrendingUp size={11} /> Popular
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {quickSuggestions.map((s, i) => (
                        <motion.button
                          key={s.href}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.22 }}
                          type="button"
                          onClick={() => router.push(s.href)}
                          className="shrink-0 whitespace-nowrap text-[10px] font-medium text-white/70 hover:text-white bg-white/8 hover:bg-white/14 border border-white/15 hover:border-[#f2836f]/50 px-3 py-1 rounded-full transition-all duration-200 backdrop-blur-sm"
                        >
                          {s.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── Search Modal ─────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeModal}
              className="fixed inset-0 bg-[#070f19]/40 backdrop-blur-sm z-[100]"
            />

            {/* Panel — bottom sheet on mobile, centered card on desktop */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-4xl sm:mx-0 w-full z-[101] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh]"
            >
              {/* ── Search input header ── */}
              <form
                onSubmit={handleModalSearch}
                className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0"
              >
                <TbSearch size={20} className="text-[#f2836f] shrink-0" />
                <input
                  ref={modalInputRef}
                  autoFocus
                  type="text"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleModalKeyDown}
                  placeholder="Search tours, hotels, destinations…"
                  className="flex-1 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <TbX size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors ml-1"
                >
                  <TbX size={20} />
                </button>
              </form>

              {/* ── Body ── */}
              <div className="overflow-y-auto flex-1">
                {/* ── SEARCH RESULTS (when typing) ── */}
                {query.trim() ? (
                  <div className="py-2">
                    {dropdownLoading && suggestions.length === 0 ? (
                      <div className="px-5 py-8 text-sm text-gray-400 text-center">
                        Searching…
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-5 py-10 flex flex-col items-center gap-2 text-center text-gray-400">
                        <TbSearch size={32} className="opacity-30" />
                        <p className="text-sm font-medium">
                          No results for &ldquo;{query}&rdquo;
                        </p>
                        <p className="text-xs">
                          Try a destination, city, or activity name.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Countries */}
                        {countrySugs.length > 0 && (
                          <div>
                            <p className="px-5 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                              <TbWorld size={10} /> Countries
                              <span className="font-bold text-gray-300">({countrySugs.length})</span>
                            </p>
                            {countrySugs.map((s, i) => {
                              const idx = countryOffset + i;
                              return (
                                <button
                                  key={s.href}
                                  onMouseDown={() => {
                                    chooseLocation({
                                      label: s.label,
                                      countrySlug: slugify(s.label),
                                      citySlug: "all",
                                      country: s.label,
                                      dbCountry: s.label,
                                      type: "country",
                                    });
                                    setQuery("");
                                  }}
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${highlightedIndex === idx ? "bg-orange-50" : "hover:bg-gray-50"}`}
                                >
                                  <span className="w-9 h-9 rounded-xl bg-[#f2836f]/10 flex items-center justify-center shrink-0">
                                    <TbWorld
                                      size={16}
                                      className="text-[#f2836f]"
                                    />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {s.label}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {s.sublabel}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Cities */}
                        {citySugs.length > 0 && (
                          <div>
                            <p className="px-5 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                              <TbBuilding size={10} /> Cities
                              <span className="font-bold text-gray-300">({citySugs.length})</span>
                            </p>
                            {citySugs.map((s, i) => {
                              const idx = cityOffset + i;
                              return (
                                <button
                                  key={s.href}
                                  onMouseDown={() => {
                                    chooseLocation({
                                      label: s.label,
                                      countrySlug: slugify(s.sublabel),
                                      citySlug: slugify(s.label),
                                      country: s.sublabel,
                                      dbCountry: s.sublabel,
                                      type: "city",
                                    });
                                    setQuery("");
                                  }}
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${highlightedIndex === idx ? "bg-teal-50" : "hover:bg-gray-50"}`}
                                >
                                  <span className="w-9 h-9 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                                    <TbBuilding
                                      size={16}
                                      className="text-[#00B5A3]"
                                    />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {s.label}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {s.sublabel}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Items */}
                        {itemSugs.length > 0 && (
                          <div>
                            <p className="px-5 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                              <TbMapPin size={10} /> Results
                              <span className="font-bold text-gray-300">({itemSugs.length})</span>
                            </p>
                            {itemSugs.map((s, i) => {
                              const idx = itemOffset + i;
                              return (
                                <button
                                  key={s.href}
                                  onMouseDown={() => {
                                    router.push(s.href);
                                    closeModal();
                                  }}
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${highlightedIndex === idx ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                >
                                  <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                    <TbSearch
                                      size={15}
                                      className="text-gray-400"
                                    />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      {s.label}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {s.sublabel}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {dropdownLoading && (
                          <p className="px-5 py-2 text-[11px] text-gray-400">
                            Searching more…
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : selectedLocation ? (
                  /* ── STEP 2: What would you like to do? ── */
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="px-5 py-5 flex flex-col gap-6"
                    >
                      {/* Back + selected location */}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => chooseLocation(null)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          <TbArrowLeft size={15} />
                          Back
                        </button>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[#f2836f]/10 flex items-center justify-center shrink-0">
                            <TbMapPin size={13} className="text-[#f2836f]" />
                          </span>
                          <span className="text-base font-semibold text-gray-800 truncate">
                            {selectedLocation.label}
                          </span>
                          {selectedLocation.type === "city" &&
                            selectedLocation.country !==
                              selectedLocation.label && (
                              <span className="text-xs text-gray-600 shrink-0">
                                {selectedLocation.country}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Category grid */}
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-wide text-gray-600 mb-3">
                          What would you love to explore?
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {STEP2_CATEGORIES.map(
                            ({ key, label, Icon, color, desc }) => {
                              const inTable = key in CATEGORY_TABLE;
                              const checked =
                                categoryAvailability[key] !== undefined;
                              const unavailable =
                                !inTable ||
                                (checked &&
                                  categoryAvailability[key] === false);
                              const loading = inTable && !checked;

                              return (
                                <motion.button
                                  key={key}
                                  whileHover={unavailable ? {} : { y: -1 }}
                                  whileTap={unavailable ? {} : { scale: 0.98 }}
                                  disabled={unavailable}
                                  onClick={() => {
                                    if (unavailable) return;
                                    router.push(
                                      `/destinations/${selectedLocation.countrySlug}/${selectedLocation.citySlug}/${key}`,
                                    );
                                    closeModal();
                                  }}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 shadow-sm text-left relative overflow-hidden ${
                                    unavailable
                                      ? "border-gray-200 bg-gray-50 cursor-default"
                                      : "hover:scale-[1.02] duration-200 group cursor-pointer"
                                  }`}
                                  style={
                                    unavailable
                                      ? {}
                                      : {
                                          background: `${color}12`,
                                          borderColor: `${color}35`,
                                        }
                                  }
                                >
                                  <span
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${unavailable ? "" : "group-hover:scale-110"}`}
                                    style={{
                                      background: unavailable
                                        ? "#f3f4f6"
                                        : `${color}2A`,
                                    }}
                                  >
                                    <Icon
                                      size={18}
                                      style={{
                                        color: unavailable ? "#d1d5db" : color,
                                      }}
                                    />
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p
                                        className={`text-sm font-bold ${unavailable ? "text-gray-400" : "text-gray-800"}`}
                                      >
                                        {label}
                                      </p>
                                      {unavailable && (
                                        <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full leading-none">
                                          Coming Soon
                                        </span>
                                      )}
                                      {loading && (
                                        <span className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                                      )}
                                    </div>
                                    <p
                                      className={`text-[11px] leading-snug truncate ${unavailable ? "text-gray-300" : "text-gray-500"}`}
                                    >
                                      {desc}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  /* ── STEP 1: Where would you like to go? ── */
                  <div className="px-5 py-5 flex flex-col gap-7">
                    {/* Popular destinations */}
                    {popularDests.length > 0 && (
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-wide text-gray-600 mb-3">
                          Your Next Adventure Starts HERE...
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {popularDests.map((dest, i) => (
                            <motion.button
                              key={dest.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.25 }}
                              onClick={() => {
                                const parts = dest.slug.split("/");
                                chooseLocation({
                                  label: dest.displayLabel,
                                  countrySlug: parts[0],
                                  citySlug: parts[1] || "all",
                                  country:
                                    parts[0] === "uae"
                                      ? "UAE"
                                      : dest.displayLabel,
                                  dbCountry: dest.dbCountry,
                                  type: parts[0] === "uae" ? "city" : "country",
                                });
                              }}
                              className="relative overflow-hidden rounded-2xl aspect-[7/4] group text-left"
                            >
                              <Image
                                src={dest.image}
                                alt={dest.displayLabel}
                                fill
                                sizes="(max-width: 640px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-base font-bold leading-tight truncate">
                                  {dest.displayLabel}
                                </p>
                                {dest.tagline && (
                                  <p className="text-white/70 text-[10px] leading-tight truncate mt-0.5">
                                    {dest.tagline}
                                  </p>
                                )}
                              </div>
                              <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <TbArrowUpRight
                                  size={13}
                                  className="text-white"
                                />
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular searches */}
                    {quickSuggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-3 flex items-center gap-1.5">
                          <TbTrendingUp size={16} /> Popular searches
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {quickSuggestions.map((s) => (
                            <button
                              key={s.href}
                              onClick={() => {
                                router.push(s.href);
                                closeModal();
                              }}
                              className="text-[11px] font-medium text-gray-600 hover:text-[#f2836f] bg-gray-100 hover:bg-[#f2836f]/8 border border-transparent hover:border-[#f2836f]/20 px-3.5 py-1.5 rounded-full transition-all duration-200"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Hero;
