"use client";

export const runtime = "edge";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, Variants, Transition, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  TbSearch,
  TbStar,
  TbStarFilled,
  TbX,
  TbChevronDown,
  TbFilter,
  TbMapPin,
  TbBuilding,
  TbSparkles,
  TbChevronLeft,
  TbChevronRight,
  TbLayoutGrid,
  TbLayoutList,
} from "react-icons/tb";
import { useParams, useSearchParams } from "next/navigation";

interface Item {
  id: string | number;
  ref_id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  category: string[];
  description: string;
  country: string[];
  city: string[];
  image_urls: string[];
  price: string;
  original_price?: string;
  is_recom: boolean;
  status?: string;
  star_category?: string;
  apartment_type?: string;
  apartment_category?: string;
  location?: string;
}

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

type SortOption = "popular" | "price-asc" | "price-desc" | "recommended";

const SORT_LABELS: Record<SortOption, string> = {
  popular: "Most Popular",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  recommended: "Recommended First",
};

interface CategoryConfig {
  listingType: string;
  heading: string;
  description: string;
  placeholder: string;
  categoryFilter?: string;
  staticCategories: string[];
  dynamicCategoryLabel?: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  hotels: {
    listingType: "Hotels",
    heading: "Hotels & Stays",
    description: "Hotels, Resorts & Apartments at Best Rates",
    placeholder: "Search hotels…",
    staticCategories: [
      "Beachfront",
      "City Center",
      "Luxury",
      "Boutique",
      "Resort",
      "Business Hotel",
      "Family Hotel",
      "Honeymoon Hotel",
      "Corporate Stay",
      "Spa & Wellness",
      "Desert Resort",
      "Heritage Hotel",
      "Cultural Hotel",
      "All Inclusive",
      "Airport Hotel",
      "Adults Only",
      "Budget Stay",
    ],
  },
  tours: {
    listingType: "Tours",
    heading: "Tours & Sightseeing",
    description: "Theme Parks, Attractions & Unforgettable Activities",
    placeholder: "Search tours…",
    staticCategories: [
      "Culture & Attractions",
      "Adventure Tours",
      "Iconic Marvels",
      "Sightseeing Tours",
      "Food & Beverages",
      "Dhow Cruise",
      "Theme Parks",
      "City Tours",
      "Nature & Wildlife",
      "Water Activities",
      "Desert Safari",
      "Premium Tours",
      "Yacht Charter",
      "Hot Air Balloon",
      "Helicopter Tour",
    ],
  },
  // Shop is missing
  packages: {
    listingType: "Packages",
    heading: "Travel Packages",
    description: "Curated Trips, Guided Tours & All-in-One Holidays",
    placeholder: "Search packages…",
    staticCategories: [
      "Family Packages",
      "Honeymoon Packages",
      "Adventure Packages",
      "Luxury Packages",
      "Budget Packages",
      "Weekend Getaways",
      "City Breaks",
    ],
  },
  meetings: {
    listingType: "Meetings",
    heading: "Meetings & Events",
    description: "Premium Spaces for Meetings Conferences & Events",
    placeholder: "Search venues…",
    staticCategories: [
      "Conference Room",
      "Boardroom",
      "Event Hall",
      "Training Room",
      "Auditorium",
      "Outdoor Venue",
      "Rooftop Venue",
      "Hotel Meeting Room",
      "Co-working Space",
      "Private Dining Room",
      "Hybrid Meeting Space",
      "Workshop Space",
    ],
    dynamicCategoryLabel: "Venue Type",
  },
  apartments: {
    listingType: "Apartments",
    heading: "Service Apartments",
    description: "Spacious Stays for Comfort, Work & Extended Visits",
    placeholder: "Search apartments…",
    staticCategories: [
      "Service Apartment",
      "Monthly Stay",
      "Long Term",
      "Short Term",
    ],
    dynamicCategoryLabel: "Apartment Type",
  },
  airports: {
    listingType: "Transfers",
    heading: "Airport Transfers",
    description: "Private Rides, Pickups & Seamless Airport Travel",
    placeholder: "Search transfers…",
    staticCategories: [
      "Airport Transfers",
      "Meet & Greet",
      "VIP Airport Transfer",
      "Private Car Transfer",
      "Limousine Service",
      "Group Transfers",
      "Hotel Transfers",
      "Cruise Transfers",
      "Chauffeur Service",
      "Private Charter",
      "Fast Track",
      "Lounge Access",
    ],
    dynamicCategoryLabel: "Transfer Type",
  },
  visas: {
    listingType: "Visas",
    heading: "Visas",
    description: "Fast, Reliable Processing with Expert Guidance",
    placeholder: "Search visas…",
    staticCategories: [
      "Visa Assistance",
      "Tourist Visa",
      "Business Visa",
      "Transit Visa",
      "Residency",
      "30 days visa",
      "60 days visa",
      "90 days visa",
    ],
    dynamicCategoryLabel: "Visa Type",
  },
  promotions: {
    listingType: "Promotions",
    heading: "Promotions & Deals",
    description:
      "Exclusive Deals & Limited-Time Offers Handpicked For You. Don't Miss Out.",
    placeholder: "Search promotions…",
    staticCategories: [
      "Hotels",
      "Tours",
      "Packages",
      "Flights",
      "Experiences",
      "Last Minute",
      "Early Bird",
      "Weekend Deals",
      "Family Offers",
      "Service Apartments",
      "Honeymoon Packages",
      "Family Staycations",
      "Weekend Getaways",
      "Luxury Deals",
    ],
    dynamicCategoryLabel: "Promotion Type",
  },
  shopping: {
    listingType: "Shop",
    heading: "Shop",
    description: "Top Malls, Luxury Brands & Local Markets",
    placeholder: "Search shopping…",
    staticCategories: [
      "Mall",
      "Boutique",
      "Souq",
      "Duty Free",
      "Luxury Retail",
      "Electronics",
      "Fashion",
      "Jewellery",
      "Perfumes & Cosmetics",
      "Sportswear",
      "Gifts & Souvenirs",
      "Antiques & Art",
    ],
    dynamicCategoryLabel: "Shopping Type",
  },
};

const CATEGORY_NAV = [
  { slug: "hotels", label: "Stay" },
  { slug: "tours", label: "Play" },
  { slug: "packages", label: "Packages" },
  { slug: "meetings", label: "Meetings" },
  { slug: "apartments", label: "Apartments" },
  { slug: "airports", label: "Transfers" },
  { slug: "visas", label: "Visa" },
  { slug: "promotions", label: "Deals" },
  { slug: "shopping", label: "Shop" },
];

const ABBREVIATIONS = ["uae", "usa", "uk", "ksa", "gcc"];
const formatParam = (slug: string) =>
  slug
    ?.replace(/_/g, "-")
    .split("-")
    .map((w) =>
      ABBREVIATIONS.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ") ?? "";

const slugifyCity = (city: string) =>
  city
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const parsePrice = (price: string | number | null | undefined): number => {
  if (price == null) return 0;
  const n = parseFloat(String(price).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];
const cardV: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease },
  }),
};

// ── Filter Section ────────────────────────────────────────────────────────────

interface SidebarProps {
  availableCities: string[];
  currentCity: string;
  countrySlug: string;
  categorySlug: string;
  activeCategories: string[];
  selectedCategories: string[];
  toggleCategory: (cat: string) => void;
  setSelectedCategories: (v: string[]) => void;
  categoryLabel: string;
  starCategories?: string[];
  selectedStarCategories?: string[];
  toggleStarCategory?: (s: string) => void;
  setSelectedStarCategories?: (v: string[]) => void;
  apartmentTypes?: string[];
  selectedApartmentTypes?: string[];
  toggleApartmentType?: (t: string) => void;
  setSelectedApartmentTypes?: (v: string[]) => void;
  locations?: string[];
  selectedLocations?: string[];
  toggleLocation?: (l: string) => void;
  setSelectedLocations?: (v: string[]) => void;
}

const FilterGroup = ({
  label,
  icon,
  items,
  selected,
  toggle,
  clear,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  selected: string[];
  toggle: (v: string) => void;
  clear: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
        {icon}
        {label}
      </p>
      {selected.length > 0 && (
        <button
          onClick={clear}
          className="text-[10px] text-red-400 hover:text-red-500 font-bold"
        >
          Clear
        </button>
      )}
    </div>
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <label
            key={item}
            className="flex items-center gap-2.5 cursor-pointer group/cb py-0.5"
          >
            <span
              className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${active ? "bg-[#00B5A3] border-[#00B5A3]" : "border-gray-300 group-hover/cb:border-[#00B5A3]/60"}`}
            >
              {active && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(item)}
              className="sr-only"
            />
            <span
              className={`text-xs transition-colors ${active ? "text-[#00B5A3] font-semibold" : "text-gray-600 group-hover/cb:text-gray-900"}`}
            >
              {item}
            </span>
          </label>
        );
      })}
    </div>
  </div>
);

const SidebarContent = ({
  availableCities,
  currentCity,
  countrySlug,
  categorySlug,
  activeCategories,
  selectedCategories,
  toggleCategory,
  setSelectedCategories,
  categoryLabel,
  starCategories,
  selectedStarCategories,
  toggleStarCategory,
  setSelectedStarCategories,
  apartmentTypes,
  selectedApartmentTypes,
  toggleApartmentType,
  setSelectedApartmentTypes,
  locations,
  selectedLocations,
  toggleLocation,
  setSelectedLocations,
}: SidebarProps) => (
  <div className="flex flex-col gap-6">
    {availableCities.length > 0 && (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
          <TbBuilding size={11} />
          Browse Cities
        </p>
        <div className="flex flex-col gap-1">
          {(() => {
            const allActive = currentCity === "All";
            return (
              <Link
                href={`/destinations/${countrySlug}/all/${categorySlug}`}
                className={`flex items-center gap-2.5 py-0.5 text-xs transition-colors ${allActive ? "text-[#00B5A3] font-semibold" : "text-gray-600 hover:text-gray-900"}`}
              >
                <span
                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${allActive ? "bg-[#00B5A3] border-[#00B5A3]" : "border-gray-300"}`}
                >
                  {allActive && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                All
              </Link>
            );
          })()}
          {availableCities.map((city) => {
            const active = city === currentCity;
            return (
              <Link
                key={city}
                href={`/destinations/${countrySlug}/${slugifyCity(city)}/${categorySlug}`}
                className={`flex items-center gap-2.5 py-0.5 text-xs transition-colors ${active ? "text-[#00B5A3] font-semibold" : "text-gray-600 hover:text-gray-900"}`}
              >
                <span
                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${active ? "bg-[#00B5A3] border-[#00B5A3]" : "border-gray-300"}`}
                >
                  {active && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                {city}
              </Link>
            );
          })}
        </div>
      </div>
    )}
    {locations && locations.length > 0 && (
      <FilterGroup
        label="Location"
        icon={<TbMapPin size={11} />}
        items={locations}
        selected={selectedLocations ?? []}
        toggle={(l) => toggleLocation?.(l)}
        clear={() => setSelectedLocations?.([])}
      />
    )}
    {activeCategories.length > 0 && (
      <FilterGroup
        label={categoryLabel}
        icon={<TbMapPin size={11} />}
        items={activeCategories}
        selected={selectedCategories}
        toggle={toggleCategory}
        clear={() => setSelectedCategories([])}
      />
    )}
    {starCategories && starCategories.length > 0 && (
      <FilterGroup
        label="Star Rating"
        icon={<TbStarFilled size={11} />}
        items={starCategories}
        selected={selectedStarCategories ?? []}
        toggle={(s) => toggleStarCategory?.(s)}
        clear={() => setSelectedStarCategories?.([])}
      />
    )}
    {apartmentTypes && apartmentTypes.length > 0 && (
      <FilterGroup
        label="Apartment Type"
        icon={<TbBuilding size={11} />}
        items={apartmentTypes}
        selected={selectedApartmentTypes ?? []}
        toggle={(t) => toggleApartmentType?.(t)}
        clear={() => setSelectedApartmentTypes?.([])}
      />
    )}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const CategoryPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const countrySlug = params.country as string;
  const citySlug = params.city as string;
  const categorySlug = params.category as string;

  const countryLabel = formatParam(countrySlug);
  const cityLabel = formatParam(citySlug);
  const isAllCities = citySlug === "all";
  const displayCityLabel = isAllCities ? "All Cities" : cityLabel;
  const config = CATEGORY_CONFIG[categorySlug] ?? CATEGORY_CONFIG["tours"];

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      !CATEGORY_CONFIG[categorySlug]
    )
      console.warn(
        `[CategoryPage] No config for slug: "${categorySlug}". Falling back to "tours".`,
      );
  }, [categorySlug]);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [countryCities, setCountryCities] = useState<string[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [availableStarCategories, setAvailableStarCategories] = useState<
    string[]
  >([]);
  const [selectedStarCategories, setSelectedStarCategories] = useState<
    string[]
  >([]);
  const [availableApartmentTypes, setAvailableApartmentTypes] = useState<
    string[]
  >([]);
  const [selectedApartmentTypes, setSelectedApartmentTypes] = useState<
    string[]
  >([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const activeCategories =
    config.staticCategories.length > 0
      ? config.staticCategories
      : dynamicCategories;

  const toggleCategory = useCallback(
    (cat: string) =>
      setSelectedCategories((p) =>
        p.includes(cat) ? p.filter((c) => c !== cat) : [...p, cat],
      ),
    [],
  );
  const toggleCity = useCallback(
    (c: string) =>
      setSelectedCities((p) =>
        p.includes(c) ? p.filter((x) => x !== c) : [...p, c],
      ),
    [],
  );
  const toggleStarCategory = useCallback(
    (s: string) =>
      setSelectedStarCategories((p) =>
        p.includes(s) ? p.filter((x) => x !== s) : [...p, s],
      ),
    [],
  );
  const toggleApartmentType = useCallback(
    (t: string) =>
      setSelectedApartmentTypes((p) =>
        p.includes(t) ? p.filter((x) => x !== t) : [...p, t],
      ),
    [],
  );
  const toggleLocation = useCallback(
    (l: string) =>
      setSelectedLocations((p) =>
        p.includes(l) ? p.filter((x) => x !== l) : [...p, l],
      ),
    [],
  );
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedCities([]);
    setSelectedStarCategories([]);
    setSelectedApartmentTypes([]);
    setSelectedLocations([]);
    setSearchQuery("");
    setSortBy("popular");
  }, []);

  const activeFilterCount =
    selectedCategories.length +
    selectedCities.length +
    selectedStarCategories.length +
    selectedApartmentTypes.length +
    selectedLocations.length +
    (searchQuery.trim() ? 1 : 0);

  useEffect(() => {
    if (!countrySlug || !categorySlug) return;
    const fetchCountryCities = async () => {
      let q = supabase
        .from("ac_listings_travel")
        .select("city")
        .eq("listing_type", config.listingType)
        .limit(5000);
      if (COMPANY) q = q.eq("company", COMPANY);
      if (!isAllCities) q = q.contains("country", [countryLabel]);
      const { data } = await q;
      if (data) {
        const cities = Array.from(
          new Set(
            data
              .flatMap((r: { city: string | string[] }) =>
                Array.isArray(r.city)
                  ? r.city
                  : typeof r.city === "string"
                    ? [r.city]
                    : [],
              )
              .filter(Boolean),
          ),
        ).sort() as string[];
        setCountryCities(cities);
      }
    };
    fetchCountryCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySlug, citySlug, categorySlug]);

  useEffect(() => {
    if (!citySlug || !categorySlug) return;
    const fetchItems = async () => {
      setLoading(true);
      setItems([]);
      setDynamicCategories([]);
      setSelectedCategories([]);
      setSelectedCities([]);
      let q = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", config.listingType);
      if (COMPANY) q = q.eq("company", COMPANY);
      if (isAllCities) {
        if (countryLabel) q = q.contains("country", [countryLabel]);
      } else {
        q = q.contains("city", [cityLabel]);
      }
      q = q.order("created_at", { ascending: true }).limit(isAllCities ? 500 : 200);
      if (config.categoryFilter)
        q = q.contains("category", [config.categoryFilter]);
      const { data, error } = await q;
      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }
      const rows = data ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Item[] = rows.map((row: any) => {
        let images: string[] = [];
        if (Array.isArray(row.image_urls)) images = row.image_urls;
        else if (typeof row.image_urls === "string") {
          try {
            images = JSON.parse(row.image_urls);
          } catch {
            images = [];
          }
        }
        return {
          id: row.id,
          ref_id: row.ref_id ?? undefined,
          title: row.title,
          subtitle: row.subtitle,
          tagline: row.tagline,
          description: row.description,
          country: Array.isArray(row.country) ? row.country : [row.country],
          city: Array.isArray(row.city) ? row.city : [row.city],
          category: Array.isArray(row.category) ? row.category : [row.category],
          price: row.price ?? "0",
          original_price: row.original_price ?? undefined,
          is_recom: Boolean(row.is_recom),
          status: row.status ?? undefined,
          image_urls: images,
          star_category: row.star_category ?? undefined,
          apartment_type: row.apartment_type ?? undefined,
          apartment_category: row.apartment_category ?? undefined,
          location: row.location ?? undefined,
        };
      });
      const visible = formatted.filter((item) => item.status !== "Hidden");
      setItems(visible);
      setAvailableCities(
        Array.from(
          new Set(formatted.flatMap((t) => t.city).filter(Boolean)),
        ).sort(),
      );
      setAvailableStarCategories(
        Array.from(
          new Set(formatted.map((t) => t.star_category).filter(Boolean)),
        ).sort() as string[],
      );
      setAvailableApartmentTypes(
        Array.from(
          new Set(formatted.map((t) => t.apartment_type).filter(Boolean)),
        ).sort() as string[],
      );
      setAvailableLocations(
        Array.from(
          new Set(visible.map((t) => t.location).filter(Boolean)),
        ).sort() as string[],
      );
      setSelectedStarCategories([]);
      setSelectedApartmentTypes([]);
      setSelectedLocations([]);
      if (config.staticCategories.length === 0)
        setDynamicCategories(
          Array.from(
            new Set(
              formatted
                .flatMap((t) => t.category)
                .filter((c) => Boolean(c) && c !== config.categoryFilter),
            ),
          ).sort(),
        );
      setLoading(false);
    };
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySlug, citySlug, categorySlug]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q),
      );
    }
    if (selectedCities.length > 0)
      result = result.filter((p) =>
        p.city.some((c) => selectedCities.includes(c)),
      );
    if (selectedCategories.length > 0)
      result = result.filter((p) =>
        p.category.some((c) => selectedCategories.includes(c)),
      );
    if (selectedStarCategories.length > 0)
      result = result.filter(
        (p) =>
          p.star_category && selectedStarCategories.includes(p.star_category),
      );
    if (selectedApartmentTypes.length > 0)
      result = result.filter(
        (p) =>
          p.apartment_type && selectedApartmentTypes.includes(p.apartment_type),
      );
    if (selectedLocations.length > 0)
      result = result.filter((p) =>
        p.location ? selectedLocations.includes(p.location) : false,
      );
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => Number(b.is_recom) - Number(a.is_recom));
        break;
      case "price-asc":
        result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case "recommended":
        result.sort((a, b) => Number(b.is_recom) - Number(a.is_recom));
        break;
    }
    return result;
  }, [
    items,
    searchQuery,
    selectedCategories,
    selectedCities,
    selectedStarCategories,
    selectedApartmentTypes,
    selectedLocations,
    sortBy,
  ]);

  const categoryLabel = config.dynamicCategoryLabel ?? "Category";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-white z-50 p-7 shadow-2xl overflow-y-auto xl:hidden flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TbFilter size={16} className="text-[#f2836f]" />
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-[#f2836f] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition"
                >
                  <TbX size={18} />
                </button>
              </div>
              <SidebarContent
                availableCities={
                  countryCities.length > 0 ? countryCities : availableCities
                }
                currentCity={cityLabel}
                countrySlug={countrySlug}
                categorySlug={categorySlug}
                activeCategories={activeCategories}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                setSelectedCategories={setSelectedCategories}
                categoryLabel={categoryLabel}
                starCategories={availableStarCategories}
                selectedStarCategories={selectedStarCategories}
                toggleStarCategory={toggleStarCategory}
                setSelectedStarCategories={setSelectedStarCategories}
                apartmentTypes={availableApartmentTypes}
                selectedApartmentTypes={selectedApartmentTypes}
                toggleApartmentType={toggleApartmentType}
                setSelectedApartmentTypes={setSelectedApartmentTypes}
                locations={availableLocations}
                selectedLocations={selectedLocations}
                toggleLocation={toggleLocation}
                setSelectedLocations={setSelectedLocations}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-red-400 hover:text-red-500 font-bold underline"
                >
                  Clear all filters
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Page header band ── */}
      <div className="bg-linear-to-br from-[#070f19] via-[#0f1e31] to-[#122947] pt-28 pb-10 px-5 md:px-10 2xl:px-15">
        <div className="max-w-dvw mx-auto flex flex-col gap-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <TbChevronLeft size={11} className="rotate-180 shrink-0" />
            <Link
              href={`/destinations/${countrySlug}`}
              className="hover:text-white transition-colors"
            >
              {countryLabel}
            </Link>
            {!isAllCities && (
              <>
                <TbChevronLeft size={11} className="rotate-180 shrink-0" />
                <Link
                  href={`/destinations/${countrySlug}/${citySlug}`}
                  className="hover:text-white transition-colors"
                >
                  {cityLabel}
                </Link>
              </>
            )}
            <TbChevronLeft size={11} className="rotate-180 shrink-0" />
            <span className="text-white/80 font-bold">{config.heading}</span>
          </nav>

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] border border-[#f2836f]/30 bg-[#f2836f]/10 text-[#f2836f] px-3 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f2836f] animate-pulse" />
              {countryLabel}
              {` · ${displayCityLabel}`}
            </span>
            <h1 className="cursive text-4xl md:text-5xl font-bold text-white leading-tight">
              {config.heading}
            </h1>

            {/* Category switcher tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {CATEGORY_NAV.map(({ slug, label }) => (
                <Link
                  key={slug}
                  href={`/destinations/${countrySlug}/${citySlug}/${slug}`}
                  className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-wide px-4 py-1.5 rounded-full border transition-all duration-200 ${
                    categorySlug === slug
                      ? "bg-[#f2836f] text-white border-[#f2836f]"
                      : "bg-white/8 text-white/55 border-white/10 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <p className="text-sm uppercase font-bold tracking-wide text-white/80 leading-relaxed max-w-2xl">
              {config.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-dvw mx-auto px-5 md:px-10 2xl:px-15 py-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Desktop Sidebar ── */}
          <aside className="w-56 shrink-0 hidden xl:flex flex-col gap-4 sticky top-24 max-h-[calc(100vh-7rem)]">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TbFilter size={14} className="text-[#f2836f]" />
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">
                    Filters
                  </h3>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-red-400 hover:text-red-500 font-bold"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <SidebarContent
                availableCities={
                  countryCities.length > 0 ? countryCities : availableCities
                }
                currentCity={cityLabel}
                countrySlug={countrySlug}
                categorySlug={categorySlug}
                activeCategories={activeCategories}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                setSelectedCategories={setSelectedCategories}
                categoryLabel={categoryLabel}
                starCategories={availableStarCategories}
                selectedStarCategories={selectedStarCategories}
                toggleStarCategory={toggleStarCategory}
                setSelectedStarCategories={setSelectedStarCategories}
                apartmentTypes={availableApartmentTypes}
                selectedApartmentTypes={selectedApartmentTypes}
                toggleApartmentType={toggleApartmentType}
                setSelectedApartmentTypes={setSelectedApartmentTypes}
                locations={availableLocations}
                selectedLocations={selectedLocations}
                toggleLocation={toggleLocation}
                setSelectedLocations={setSelectedLocations}
              />
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Topbar */}
            <div className="bg-white rounded-2xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-800 shrink-0">
                <span className="text-[#00B5A3]">{filteredItems.length}</span>
                {filteredItems.length !== items.length && (
                  <span className="text-gray-400 font-normal text-xs">
                    {" "}
                    of {items.length}
                  </span>
                )}
                <span className="text-gray-400 font-normal">
                  {" "}
                  {config.heading.toLowerCase()} in{" "}
                </span>
                {displayCityLabel}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-white shadow-sm text-[#00B5A3]" : "text-gray-400 hover:text-gray-600"}`}
                    aria-label="Grid view"
                  >
                    <TbLayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-white shadow-sm text-[#00B5A3]" : "text-gray-400 hover:text-gray-600"}`}
                    aria-label="List view"
                  >
                    <TbLayoutList size={15} />
                  </button>
                </div>
                {/* Sort */}
                <div className="relative shrink-0" ref={sortRef}>
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center justify-between gap-2 bg-gray-100 hover:bg-gray-200/80 border border-transparent hover:border-gray-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 w-full sm:w-52 transition-all duration-200"
                  >
                    <span className="truncate">{SORT_LABELS[sortBy]}</span>
                    <TbChevronDown
                      size={14}
                      className={`transition-transform shrink-0 ${sortOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1"
                      >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map(
                          (opt) => (
                            <li key={opt}>
                              <button
                                onClick={() => {
                                  setSortBy(opt);
                                  setSortOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 ${sortBy === opt ? "bg-[#00B5A3]/8 text-[#00B5A3] font-bold" : "hover:bg-gray-50 text-gray-700"}`}
                              >
                                {SORT_LABELS[opt]}
                                {sortBy === opt && (
                                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </li>
                          ),
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search */}
                <div className="relative flex items-center flex-1 sm:flex-none">
                  <TbSearch
                    size={14}
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={config.placeholder}
                    className="bg-gray-100 pl-9 pr-8 py-2.5 rounded-xl text-xs w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:bg-white transition border border-transparent focus:border-[#00B5A3]/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <TbX size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Mobile: category pills + filter trigger ── */}
            <div className="xl:hidden flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-gray-700 tracking-wide uppercase">
                  {categoryLabel}
                </p>
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="relative flex items-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm hover:border-[#f2836f]/40 hover:text-[#f2836f] transition-all duration-200"
                >
                  <TbFilter size={13} /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#f2836f] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
              {activeCategories.length > 0 && (
                <div
                  className="overflow-x-auto -mx-5 px-5"
                  style={{ scrollbarWidth: "none" }}
                >
                  <div className="flex gap-2 w-max pb-1">
                    {activeCategories.map((cat) => {
                      const active = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full border transition-all duration-200 ${active ? "bg-[#00B5A3] text-white border-[#00B5A3] shadow-sm shadow-[#00B5A3]/20" : "bg-white text-gray-600 border-gray-200 hover:border-[#00B5A3]/40 hover:text-[#00B5A3] shadow-sm"}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeFilterCount > 0 && (
                <p className="text-xs text-[#00B5A3]">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                  active{" "}
                  <button
                    onClick={clearFilters}
                    className="ml-1 underline text-gray-500"
                  >
                    Clear all
                  </button>
                </p>
              )}
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <span className="flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                    &quot;{searchQuery}&quot;{" "}
                    <button onClick={() => setSearchQuery("")}>
                      <TbX size={11} />
                    </button>
                  </span>
                )}
                {selectedCities.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 bg-[#00B5A3] text-white text-[10px] font-semibold px-3 py-1.5 rounded-full"
                  >
                    <TbBuilding size={10} />
                    {c}
                    <button onClick={() => toggleCity(c)}>
                      <TbX size={11} />
                    </button>
                  </span>
                ))}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 bg-[#00B5A3]/80 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full"
                  >
                    {cat}
                    <button onClick={() => toggleCategory(cat)}>
                      <TbX size={11} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-gray-400 hover:text-gray-600 underline font-semibold"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid / List */}
            {loading ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden bg-white animate-pulse"
                    >
                      <div className="h-48 bg-gray-200" />
                      <div className="p-4 flex flex-col gap-2">
                        <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden bg-white animate-pulse flex h-32"
                    >
                      <div className="w-40 shrink-0 bg-gray-200" />
                      <div className="flex-1 p-4 flex flex-col gap-2 justify-center">
                        <div className="h-2.5 bg-gray-200 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <TbSearch size={24} className="text-gray-400" />
                </div>
                <p className="text-base font-bold text-gray-700">
                  No {config.heading} in {displayCityLabel}
                </p>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  We don&apos;t have any {config.heading.toLowerCase()} listed
                  for {displayCityLabel} yet.
                </p>
                <Link
                  href={`/destinations/${countrySlug}`}
                  className="max-w-fit mt-1 btn-secondary-base"
                >
                  Explore other cities in {countryLabel}
                </Link>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={index}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Link
                      href={`/destinations/${countrySlug}/${isAllCities ? slugifyCity(item.city?.[0] ?? citySlug) : citySlug}/${categorySlug}/${item.ref_id ?? item.id}`}
                    >
                      <div className="relative h-44 md:h-48 overflow-hidden bg-gray-100">
                        <Image
                          src={
                            item.image_urls?.[0] ||
                            "/assets/banner/property1.webp"
                          }
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-linear-to-tr from-[#f2836f]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {item.is_recom && (
                          <span className="absolute top-3 left-3 flex items-center gap-1 bg-[#00B5A3]/90 backdrop-blur-sm text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full">
                            <TbSparkles size={9} /> Recommended
                          </span>
                        )}
                        <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          {item.star_category ? (
                            <>
                              <TbStarFilled
                                size={9}
                                className="text-yellow-400"
                              />
                              {item.star_category}
                            </>
                          ) : item.apartment_type ? (
                            item.apartment_type
                          ) : (
                            (item.category?.[0] ?? null)
                          )}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#f2836f]">
                            {isAllCities
                              ? (item.city?.[0] ?? countryLabel)
                              : cityLabel}{" "}
                            · {countryLabel}
                          </p>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-black transition-colors duration-200">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                            {item.subtitle || item.tagline || item.description}
                          </p>
                        </div>
                        <div className="flex items-end justify-between gap-1 pt-1 border-t border-gray-100">
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                              {item.apartment_category || "Reviews"}
                            </p>
                            <div className="flex items-center gap-0.5 text-[11px] text-yellow-400">
                              {item.star_category ? (
                                <>
                                  {Array.from({
                                    length: parseInt(item.star_category) || 0,
                                  }).map((_, i) => (
                                    <TbStarFilled key={i} />
                                  ))}
                                  {Array.from({
                                    length: Math.max(
                                      0,
                                      5 - (parseInt(item.star_category) || 0),
                                    ),
                                  }).map((_, i) => (
                                    <TbStar key={i} className="text-gray-300" />
                                  ))}
                                </>
                              ) : (
                                <>
                                  <TbStarFilled />
                                  <TbStarFilled />
                                  <TbStarFilled />
                                  <TbStarFilled />
                                  <TbStar className="text-gray-300" />
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {item.original_price && (
                              <p className="text-[9px] text-gray-400 line-through">
                                AED {item.original_price}
                              </p>
                            )}
                            <p className="text-[9px] text-gray-400">From AED</p>
                            <div className="flex items-center justify-end gap-1.5">
                              <p className="font-extrabold text-sm text-gray-900">
                                {item.price || "—"}
                              </p>
                              {item.original_price && item.price && (
                                <span className="text-[9px] font-extrabold bg-[#f2836f] text-white px-1.5 py-0.5 rounded-full">
                                  {Math.round((1 - parsePrice(item.price) / parsePrice(item.original_price)) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* ── List view ── */
              <div className="flex flex-col gap-3">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={index}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <Link
                      href={`/destinations/${countrySlug}/${citySlug}/${categorySlug}/${item.ref_id ?? item.id}`}
                      className="flex"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-36 sm:w-48 shrink-0 overflow-hidden bg-gray-100">
                        <Image
                          src={
                            item.image_urls?.[0] ||
                            "/assets/banner/property1.webp"
                          }
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/20" />
                        {item.is_recom && (
                          <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#00B5A3]/90 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            <TbSparkles size={9} /> Recommended
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-4 flex flex-col justify-between gap-2 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#f2836f]">
                              {isAllCities
                                ? (item.city?.[0] ?? countryLabel)
                                : cityLabel}{" "}
                              · {countryLabel}
                            </p>
                            {(item.star_category ||
                              item.apartment_type ||
                              item.category?.[0]) && (
                              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                {item.star_category ? (
                                  <>
                                    <TbStarFilled
                                      size={9}
                                      className="text-yellow-400"
                                    />
                                    {item.star_category}
                                  </>
                                ) : item.apartment_type ? (
                                  item.apartment_type
                                ) : (
                                  item.category?.[0]
                                )}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-black transition-colors duration-200">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 hidden sm:block">
                            {item.subtitle || item.tagline || item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-0.5 text-[11px] text-yellow-400">
                            {item.star_category ? (
                              <>
                                {Array.from({
                                  length: parseInt(item.star_category) || 0,
                                }).map((_, i) => (
                                  <TbStarFilled key={i} />
                                ))}
                                {Array.from({
                                  length: Math.max(
                                    0,
                                    5 - (parseInt(item.star_category) || 0),
                                  ),
                                }).map((_, i) => (
                                  <TbStar key={i} className="text-gray-300" />
                                ))}
                              </>
                            ) : (
                              <>
                                <TbStarFilled />
                                <TbStarFilled />
                                <TbStarFilled />
                                <TbStarFilled />
                                <TbStar className="text-gray-300" />
                              </>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {item.original_price && (
                              <span className="text-[9px] text-gray-400 line-through">
                                AED {item.original_price}
                              </span>
                            )}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[9px] text-gray-400">
                                From AED
                              </span>
                              <span className="font-extrabold text-sm text-gray-900">
                                {item.price || "—"}
                              </span>
                              {item.original_price && item.price && (
                                <span className="text-[9px] font-extrabold bg-[#f2836f] text-white px-1.5 py-0.5 rounded-full">
                                  {Math.round((1 - parsePrice(item.price) / parsePrice(item.original_price)) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to top */}
        <div className="flex justify-center pb-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#00B5A3] bg-white border border-gray-200 hover:border-[#00B5A3]/40 px-5 py-2.5 rounded-full shadow-sm transition-all duration-200"
          >
            <TbChevronRight size={13} className="-rotate-90" /> Back to top
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
