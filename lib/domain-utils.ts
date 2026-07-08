import { supabase } from "@/lib/supabase";
import { LISTING_SOURCE_TABLE } from "@/lib/cms-tables";

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function fromSlug(s: string): string {
  return s.replace(/-/g, " ");
}

/** Find the canonical DB value that matches a URL slug (case-insensitive). */
export function matchSlug(slug: string, values: string[]): string | undefined {
  const normalized = slug.replace(/-/g, " ").toLowerCase();
  return values.find((v) => v.toLowerCase() === normalized);
}

// ─── Industry config ──────────────────────────────────────────────────────────

export const INDUSTRY_LABELS: Record<string, string> = {
  b2b:        "B2B Procurement",
  healthcare: "Healthcare",
  saas:       "SaaS / Tech",
  realestate: "Real Estate",
  retail:     "Retail",
  finance:    "Finance",
  travel:     "Travel",
  automotive: "Automotive",
};

export const INDUSTRY_TYPES: Record<string, string[]> = {
  b2b:        ["Products", "Suppliers", "Services", "Packages", "Promotions"],
  healthcare: ["Doctors", "Services", "Treatments", "Packages", "Clinics"],
  saas:       ["Plans", "Features", "Integrations", "Case Studies", "Resources"],
  realestate: ["Houses", "Apartments", "Villas", "Commercial", "Lands"],
  retail:     ["Products", "Promotions", "Bundles", "Deals", "Collections"],
  finance:    ["Investment Products", "Loan Types", "Insurance Plans", "Funds", "Reports"],
  travel:     ["Hotels", "Tours", "Packages", "Visas", "Transfers", "Apartments", "Promotions"],
  automotive: ["Vehicles", "Services", "Parts", "Fleet", "Wraps"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true for tables that use listing_type scoping (all at_listings_* tables). */
function isAtTable(table: string): boolean {
  return table.startsWith("at_listings") || table === "ac_destinations";
}

/**
 * Build a de-duplicated map of { tableKey → { table, industryFilter } } so
 * callers that iterate over all types for an industry don't fire redundant
 * queries when multiple types share the same source table.
 *
 * For at_listings / at_destinations, add an industry filter so rows from
 * other industries are not mixed in.
 */
function uniqueTableQueries(
  industry: string,
  types: string[]
): Map<string, { table: string; industryFilter?: string }> {
  const map = new Map<string, { table: string; industryFilter?: string }>();
  for (const type of types) {
    const tbl = LISTING_SOURCE_TABLE[type];
    if (!tbl) continue;
    const key = isAtTable(tbl) ? `${tbl}::${industry}` : tbl;
    if (!map.has(key)) {
      map.set(key, {
        table: tbl,
        industryFilter: isAtTable(tbl) ? industry : undefined,
      });
    }
  }
  return map;
}

// ─── Country / city discovery ─────────────────────────────────────────────────

/**
 * Fetch all unique countries available for a given industry by querying every
 * distinct source table that industry uses.  Returns [{ country, count }] sorted by count.
 */
export async function fetchCountriesForIndustry(
  industry: string
): Promise<{ country: string; count: number }[]> {
  const types   = INDUSTRY_TYPES[industry] ?? [];
  const queries = uniqueTableQueries(industry, types);
  const countMap: Record<string, number> = {};

  await Promise.all(
    [...queries.values()].map(async ({ table, industryFilter }) => {
      let q = supabase.from(table).select("country").eq("status", "Active");
      if (industryFilter) q = q.eq("industry", industryFilter);
      const { data } = await q;
      if (!data) return;
      for (const row of data) {
        const countries: string[] = Array.isArray(row.country)
          ? row.country
          : row.country ? [row.country] : [];
        for (const c of countries) {
          if (c) countMap[c] = (countMap[c] ?? 0) + 1;
        }
      }
    })
  );

  return Object.entries(countMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Fetch all unique cities for a given country within an industry.
 * Returns [{ city, count }] sorted by count.
 */
export async function fetchCitiesForCountry(
  industry: string,
  countryName: string
): Promise<{ city: string; count: number }[]> {
  const types   = INDUSTRY_TYPES[industry] ?? [];
  const queries = uniqueTableQueries(industry, types);
  const countMap: Record<string, number> = {};

  await Promise.all(
    [...queries.values()].map(async ({ table, industryFilter }) => {
      let q = supabase.from(table).select("city, country").eq("status", "Active");
      if (industryFilter) q = q.eq("industry", industryFilter);
      const { data } = await q;
      if (!data) return;
      for (const row of data) {
        const countries: string[] = Array.isArray(row.country) ? row.country : row.country ? [row.country] : [];
        const inCountry = countries.some((c) => c.toLowerCase() === countryName.toLowerCase());
        if (!inCountry) continue;
        const cities: string[] = Array.isArray(row.city) ? row.city : row.city ? [row.city] : [];
        for (const city of cities) {
          if (city) countMap[city] = (countMap[city] ?? 0) + 1;
        }
      }
    })
  );

  return Object.entries(countMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Listing type counts per city ─────────────────────────────────────────────

export interface TypeCount { type: string; count: number; sourceTable: string | null }

export async function fetchTypeCountsForCity(
  industry: string,
  countryName: string,
  cityName: string
): Promise<TypeCount[]> {
  const types = INDUSTRY_TYPES[industry] ?? [];
  return Promise.all(
    types.map(async (type) => {
      const sourceTable = LISTING_SOURCE_TABLE[type] ?? null;
      if (!sourceTable) return { type, count: 0, sourceTable: null };

      let q = supabase
        .from(sourceTable)
        .select("city, country")
        .eq("status", "Active");

      if (sourceTable.startsWith("at_listings_")) {
        q = q.eq("listing_type", type);
      } else if (sourceTable === "ac_destinations") {
        q = q.eq("industry", industry);
      }

      const { data } = await q;
      const count = (data ?? []).filter((row) => {
        const countries: string[] = Array.isArray(row.country) ? row.country : row.country ? [row.country] : [];
        const cities: string[]    = Array.isArray(row.city)    ? row.city    : row.city    ? [row.city]    : [];
        return (
          countries.some((c) => c.toLowerCase() === countryName.toLowerCase()) &&
          cities.some((c) => c.toLowerCase() === cityName.toLowerCase())
        );
      }).length;
      return { type, count, sourceTable };
    })
  );
}

// ─── Listing cards for a type in a city ──────────────────────────────────────

export interface ListingCard {
  id: string | number;
  title: string;
  subtitle: string;
  price: string;
  category: string | string[];
  location: string;
  image_url: string;
  image_urls: string[];
  country: string[];
  city: string[];
  listing_type?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  floors?: string | number;
  area?: string | number;
}

export interface ListingFilters {
  listing_type?: string;
  city?: string;
  country?: string;
  priceRange?: string; // "min-max" or "min-" or "-max"
  bedrooms?: string;
  search?: string;
}

/** Real-estate-only listing search used by the public /listings page — richer
 *  filtering (full-text search, price range, bedrooms) than the generic
 *  multi-industry fetchListingCards below, scoped to ac_listings_realestate. */
export async function fetchListings(
  filters: ListingFilters = {},
  limit = 48
): Promise<ListingCard[]> {
  const company = process.env.NEXT_PUBLIC_COMPANY;
  let q = supabase
    .from("ac_listings_realestate")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .limit(limit * 3);
  if (company) q = q.eq("company", company);
  if (filters.listing_type) q = q.eq("listing_type", filters.listing_type);

  const { data, error } = await q;
  if (error) console.error("[fetchListings]", error.message);
  if (!data) return [];

  let results = data;

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    results = results.filter((row) =>
      (Array.isArray(row.city) ? row.city : row.city ? [row.city] : []).some((c: string) => c.toLowerCase().includes(cityLower))
    );
  }
  if (filters.country) {
    const countryLower = filters.country.toLowerCase();
    results = results.filter((row) =>
      (Array.isArray(row.country) ? row.country : row.country ? [row.country] : []).some((c: string) => c.toLowerCase().includes(countryLower))
    );
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(
      (row) =>
        (row.title ?? "").toLowerCase().includes(s) ||
        (row.tagline ?? row.description ?? "").toLowerCase().includes(s) ||
        (row.location ?? "").toLowerCase().includes(s)
    );
  }
  if (filters.priceRange) {
    const [minStr, maxStr] = filters.priceRange.split("-");
    const min = minStr ? Number(minStr) : null;
    const max = maxStr ? Number(maxStr) : null;
    results = results.filter((row) => {
      const numeric = parseFloat(String(row.price ?? "").replace(/[^0-9.]/g, ""));
      if (isNaN(numeric)) return true;
      if (min !== null && numeric < min) return false;
      if (max !== null && numeric > max) return false;
      return true;
    });
  }
  if (filters.bedrooms && filters.bedrooms !== "Any") {
    const target = parseInt(filters.bedrooms, 10);
    results = results.filter((row) => {
      const beds = parseInt(String(row.beds ?? row.bedrooms ?? ""), 10);
      if (isNaN(beds)) return false;
      if (filters.bedrooms!.endsWith("+")) return beds >= target;
      return beds === target;
    });
  }

  return results.slice(0, limit).map((row) => ({
    id: String(row.id ?? ""),
    title: row.title || "",
    subtitle: row.tagline || row.description || "",
    price: row.price || "",
    category: row.category ?? [],
    location: row.location || "",
    listing_type: row.listing_type || row.property_type || "",
    bedrooms: row.beds ?? row.bedrooms,
    bathrooms: row.baths ?? row.bathrooms,
    floors: row.floors,
    area: row.sqft ?? row.lot_size,
    image_url: row.image_url || (Array.isArray(row.image_urls) ? row.image_urls[0] ?? "" : ""),
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
    country: Array.isArray(row.country) ? row.country : row.country ? [row.country] : [],
    city: Array.isArray(row.city) ? row.city : row.city ? [row.city] : [],
  }));
}

/**
 * Fetch listing cards for a specific type in a city.
 * When sourceTable is an at_listings_* table, filters by listing_type to scope results.
 */
export async function fetchListingCards(
  sourceTable: string,
  countryName: string,
  cityName: string,
  listingType?: string,
  limit = 24
): Promise<ListingCard[]> {
  const company = process.env.NEXT_PUBLIC_COMPANY;
  let q = supabase
    .from(sourceTable)
    .select("id, title, subtitle, price, category, location, image_urls, country, city");
  if (company) q = q.eq("company", company);

  if (sourceTable.startsWith("ac_listings_") && listingType) {
    q = q.eq("listing_type", listingType);
  }

  const { data } = await q.limit(limit * 3); // over-fetch to filter client-side

  if (!data) return [];

  return data
    .filter((row) => {
      const countries: string[] = Array.isArray(row.country) ? row.country : row.country ? [row.country] : [];
      const cities: string[]    = Array.isArray(row.city)    ? row.city    : row.city    ? [row.city]    : [];
      const countryMatch = !countryName || countries.some((c) => c.toLowerCase() === countryName.toLowerCase());
      const cityMatch    = !cityName    || cities.some((c) => c.toLowerCase() === cityName.toLowerCase());
      return countryMatch && cityMatch;
    })
    .slice(0, limit)
    .map((row) => {
      const allUrls: string[] = Array.isArray(row.image_urls)
        ? row.image_urls
        : typeof row.image_urls === "string"
        ? row.image_urls.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      return {
        id:         row.id,
        title:      row.title     ?? "",
        subtitle:   row.subtitle  ?? "",
        price:      row.price     ?? "",
        category:   row.category  ?? [],
        location:   row.location  ?? "",
        image_url:  allUrls[0] ?? "",
        image_urls: allUrls,
        country:    Array.isArray(row.country) ? row.country : row.country ? [row.country] : [],
        city:       Array.isArray(row.city)    ? row.city    : row.city    ? [row.city]    : [],
      };
    });
}

// ─── Full item detail ─────────────────────────────────────────────────────────

export async function fetchItemDetail(
  sourceTable: string,
  id: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from(sourceTable)
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

// ─── Destination content ──────────────────────────────────────────────────────

export interface DestContent {
  id: number;
  country: string;
  city: string;
  tagline: string;
  description: string;
  overview_title: string;
  overview_subtitle: string;
  overview_body: string;
  image_urls: string[];
  image_collages: string[];
  category: string[];
  continent: string[];
}

export async function fetchDestinationByCountry(country: string): Promise<DestContent | null> {
  const { data } = await supabase
    .from("ac_destinations")
    .select("id,country,city,tagline,description,overview_title,overview_subtitle,overview_body,image_urls,image_collages,category,continent")
    .ilike("country", country)
    .is("city", null)
    .limit(1)
    .maybeSingle();
  return (data as DestContent | null) ?? null;
}

export async function fetchDestinationByCity(country: string, city: string): Promise<DestContent | null> {
  const { data } = await supabase
    .from("ac_destinations")
    .select("id,country,city,tagline,description,overview_title,overview_subtitle,overview_body,image_urls,image_collages,category,continent")
    .ilike("country", country)
    .ilike("city", city)
    .limit(1)
    .maybeSingle();
  return (data as DestContent | null) ?? null;
}
