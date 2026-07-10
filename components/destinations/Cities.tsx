"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { TbArrowUpRight } from "react-icons/tb";

interface Destination {
  id: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  continent: string[];
  image_urls: string[];
}

const easeOut: Transition["ease"] = [0.25, 0.1, 0.25, 1];

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: easeOut },
  }),
};

const INITIAL_VISIBLE = 6;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (str: string) => str?.trim().toLowerCase();
const slugToCountry = (slug: string) => slug.replace(/-/g, " ").toLowerCase();

const allowedUAECities = [
  "abu dhabi",
  "dubai",
  "fujairah",
  "ras al khaimah",
  "rak",
];

const Destination: React.FC = () => {
  const params = useParams();
  const countrySlug = params?.country as string;

  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    if (!countrySlug) return;

    const fetchDestinations = async () => {
      const { data, error } = await supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching destinations:", error.message);
        setDestinations([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Destination[] = (data ?? []).map((row: any) => {
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
          country: row.country,
          city: row.city,
          tagline: row.tagline,
          description: row.description,
          continent: Array.isArray(row.continent) ? row.continent : [],
          image_urls: images,
        };
      });

      const selectedCountry = slugToCountry(countrySlug);

      const filtered = formatted.filter((dest) => {
        const country = normalize(dest.country);
        const city = normalize(dest.city);

        // ❌ skip destinations with no city
        if (!city) return false;

        // ❌ skip other countries
        if (country !== selectedCountry) return false;

        // 🇦🇪 UAE special city filter
        if (country === "uae" || country === "united arab emirates") {
          return allowedUAECities.includes(city);
        }

        // 🌍 other countries → allow all cities
        return true;
      });

      setDestinations(filtered);
    };

    fetchDestinations();
  }, [countrySlug]);

  // ❌ hide section if no valid cities
  if (!destinations || destinations.length === 0) return null;

  const visibleDestinations = destinations.slice(0, visibleCount);
  const hasMore = destinations.length > visibleCount;

  return (
    <div
      className="bg-gradient-to-b from-gray-200/80 via-gray-100 to-white text-gray-700 rounded-tl-[50px] md:rounded-tl-[80px]"
      id="cities"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8 py-14 2xl:py-18 px-10 md:px-14 lg:px-10 xl:px-0">
        <motion.div
          className="flex flex-col items-center text-center gap-4 2xl:gap-5"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="cursive text-3xl 2xl:text-4xl font-bold">
            Explore <span className="text-[#f2836f]">Other Cities</span>
          </h3>
          <p className="leading-relaxed text-sm 2xl:text-base font-medium text-gray-500 max-w-3xl">
            From bustling metropolises to serene landscapes, our global
            adventure awaits. Explore diverse cultures, savor exotic flavors,
            and create memories that span continents.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDestinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              custom={index}
              variants={rowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="relative rounded-tr-4xl rounded-bl-4xl p-7 overflow-hidden h-[40vh] md:h-[24vh] lg:h-[30vh] group shadow-lg"
            >
              <Image
                src={dest.image_urls?.[0] || "/assets/banner/property1.webp"}
                alt={dest.city}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-[#f2836f]/20 group-hover:bg-black/64 transition-all duration-1000" />

              <div className="relative flex flex-col h-full text-white">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase text-[#f2836f] 2xl:text-gray-400 2xl:group-hover:text-[#f2836f] duration-500">
                    {dest.continent.join(" · ")} • {dest.country}
                  </p>
                  <h3 className="cursive font-bold text-white text-3xl group-hover:text-3xl duration-600">
                    {dest.city}
                  </h3>
                  <p className="text-xs font-semibold whitespace-pre-line leading-relaxed text-gray-300">
                    {dest.tagline}
                  </p>
                </div>

                <Link
                  href={`/destinations/${slugify(dest.country)}/${slugify(dest.city)}`}
                  className="absolute right-0 bottom-0 w-10 h-10 bg-white/15 group-hover:bg-[#f2836f]/80 border border-white/20 group-hover:border-[#f2836f]/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <TbArrowUpRight size={20} className="text-white" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show more */}
        {hasMore && (
          <button
            onClick={() => setVisibleCount(destinations.length)}
            className="max-w-fit mx-auto select-none btn-primary-outline"
          >
            Show more Destinations
          </button>
        )}
      </div>
    </div>
  );
};

export default Destination;
