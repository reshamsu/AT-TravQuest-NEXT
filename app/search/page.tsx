"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TbSearch, TbMapPin, TbArrowLeft } from "react-icons/tb";

interface Destination {
  id: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  continent: string[];
  image_urls: string[];
  displayLabel: string;
  slug: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (str: string) => str?.trim().toLowerCase();

const allowedUAECities = ["abu dhabi", "dubai", "fujairah", "ras al khaimah"];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      Promise.resolve().then(() => setResults([]));
      return;
    }

    const fetchResults = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .or(
          `country.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error.message);
        setResults([]);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (data || []).map((row: any) => {
        let images: string[] = [];
        if (Array.isArray(row.image_urls)) images = row.image_urls;
        else if (typeof row.image_urls === "string") {
          try {
            images = JSON.parse(row.image_urls);
          } catch {
            images = [];
          }
        }

        const country = normalize(row.country);
        const city = normalize(row.city);
        let displayLabel = row.country;
        let slug = slugify(row.country);

        if (country === "uae" || country === "united arab emirates") {
          if (allowedUAECities.includes(city)) {
            displayLabel = row.city;
            slug = `uae/${slugify(row.city)}`;
          } else {
            return null;
          }
        }

        return {
          id: row.id,
          country: row.country,
          city: row.city,
          tagline: row.tagline,
          description: row.description,
          continent: Array.isArray(row.continent) ? row.continent : [],
          image_urls: images,
          displayLabel,
          slug,
        } as Destination;
      }).filter(Boolean) as Destination[];

      setResults(formatted);
      setLoading(false);
    };

    fetchResults();
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setQuery(inputValue.trim());
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4f0]">
      {/* Header */}
      <div className="bg-[#0e1e32] pt-24 pb-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors w-fit"
          >
            <TbArrowLeft size={16} />
            Back
          </button>

          <h1 className="playfair text-3xl font-semibold text-white">
            {query ? (
              <>
                Results for{" "}
                <span className="text-[#f2836f]">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Search Destinations"
            )}
          </h1>

          <form onSubmit={handleSubmit} className="relative flex items-center max-w-lg">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              className="py-3 pl-6 pr-14 rounded-full bg-white/10 backdrop-blur-lg border-2 border-white/15 focus:border-white/40 w-full outline-none placeholder:text-white/50 text-sm text-white transition-colors duration-300"
              placeholder="Search destinations, cities, countries..."
            />
            <button
              type="submit"
              className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-full bg-[#f2836f] hover:bg-[#e06b58] text-white transition-colors"
              aria-label="Search"
            >
              <TbSearch size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#f2836f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-gray-500">
            <TbMapPin size={40} className="opacity-30" />
            <p className="text-base font-medium">No destinations found for &ldquo;{query}&rdquo;</p>
            <p className="text-sm">Try searching for a country, city, or region.</p>
          </div>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-gray-400">
            <TbSearch size={40} className="opacity-30" />
            <p className="text-sm">Type something above to find destinations.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 mb-3">
              {results.length} destination{results.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/destinations/${dest.slug}`}
                  className="group flex gap-4 bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#f2836f]/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative w-28 h-28 shrink-0">
                    <Image
                      src={dest.image_urls?.[0] || "/assets/banner/property1.webp"}
                      alt={dest.displayLabel}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-1 py-3 pr-4">
                    {dest.continent.length > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#f2836f]">
                        {dest.continent.join(" · ")}
                      </p>
                    )}
                    <h3 className="playfair font-semibold text-[#0e1e32] text-base group-hover:text-[#f2836f] transition-colors">
                      {dest.displayLabel}
                    </h3>
                    {dest.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {dest.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}