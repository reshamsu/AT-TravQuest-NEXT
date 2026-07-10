"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";

interface Destination {
  country: string;
  city: string;
  tagline: string;
  description: string;
  image_urls: string[];
}

const unslugify = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const HeroSkeleton = () => (
  <div className="relative h-[74vh] w-full animate-pulse bg-gray-900">
    <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-gray-400 to-gray-200" />
    <div className="absolute bottom-4 left-2 lg:left-2/12 max-w-6xl w-full space-y-3 p-10 px-8 md:px-10 xl:px-0">
      <div className="h-10 w-80 md:w-2xl rounded-lg bg-gray-400" />
      <div className="h-4 w-60 md:w-lg rounded bg-gray-400" />
    </div>
  </div>
);

export default function Hero() {
  const params = useParams<{ country: string; city?: string }>();
  const country = params.country;
  const city = params.city;

  const [data, setData] = useState<Destination | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState<boolean[]>([]);

  useEffect(() => {
    if (!country) return;

    const fetchDestination = async () => {
      setLoading(true);
      setData(null);
      setCurrent(0);
      setImgLoaded([]);

      const formattedCountry = unslugify(country);
      let query = supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .ilike("country", formattedCountry);

      if (city) {
        const formattedCity = unslugify(city);
        query = query.ilike("city", formattedCity);
      } else {
        query = query.or("city.is.null,city.eq.,city.ilike.empty");
      }

      const { data: result, error } = await query.limit(1).maybeSingle();

      if (error || !result) {
        setLoading(false);
        return notFound();
      }

      setData(result);
      setLoading(false);
    };

    fetchDestination();
  }, [country, city]);

  const prev = useCallback(
    () =>
      setCurrent(
        (c) =>
          (c - 1 + (data?.image_urls.length ?? 1)) %
          (data?.image_urls.length ?? 1),
      ),
    [data],
  );

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % (data?.image_urls.length ?? 1)),
    [data],
  );

  useEffect(() => {
    if (!data) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [data, next]);

  if (loading || !data) return <HeroSkeleton />;

  const images = data.image_urls;

  const displayTitle = city ? data.city : data.country;

  return (
    <div className="relative h-[84vh] w-full overflow-hidden">
      {/* Slides */}
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000  ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Fallback background shown until image loads */}
          {!imgLoaded[i] && (
            <div className="absolute inset-0 bg-linear-to-br from-[#1a1a2e] via-[#2d1f3d] to-[#1a1a2e]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,#f2836f18,transparent_60%)]" />
            </div>
          )}
          <Image
            src={img}
            alt={`${displayTitle} photo ${i + 1}`}
            fill
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${imgLoaded[i] ? "opacity-100" : "opacity-0"}`}
            priority={i === 0}
            onLoad={() => setImgLoaded((prev) => { const next = [...prev]; next[i] = true; return next; })}
            onError={() => setImgLoaded((prev) => { const next = [...prev]; next[i] = true; return next; })}
          />
          {/* Layered gradient: dark bottom for text legibility + warm orange mid-tone */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-linear-to-tr from-[#f2836f]/15 via-transparent to-transparent" />
        </div>
      ))}

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-linear-to-b from-transparent via-[#f2836f]/60 to-transparent z-30" />

      {/* Bottom content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end">
        <motion.div
          className="max-w-6xl mx-auto w-full px-8 md:px-10 xl:px-0 pb-8 2xl:pb-12 flex flex-col items-start gap-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Title */}
          <h1 className="cursive text-5xl 2xl:text-6xl font-bold leading-tight line-clamp-2 text-white drop-shadow-md">
            {displayTitle}
          </h1>

          <div>
            {/* Tagline */}
            {data.tagline && (
              <p className="text-sm md:text-base text-white/65 leading-relaxed max-w-xl line-clamp-1 mb-1">
                {data.tagline}
              </p>
            )}

            {/* Description */}
            {data.description && (
              <p className="text-xs md:text-sm text-white/65 line-clamp-2 leading-relaxed max-w-xl">
                {data.description}
              </p>
            )}
          </div>

          {/* Dot indicators + nav arrows in one row */}
          {images.length > 1 && (
            <div className="flex items-center justify-between w-full">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`transition-all duration-500 rounded-full ${
                      i === current
                        ? "w-6 h-2 bg-[#f2836f] shadow-[0_0_6px_#f2836f88]"
                        : "w-2 h-2 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="p-2 rounded-xl text-white bg-white/10 border border-white/15 hover:bg-[#f2836f]/80 hover:border-[#f2836f]/40 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <TbChevronLeft size={20} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next image"
                  className="p-2 rounded-xl text-white bg-white/10 border border-white/15 hover:bg-[#f2836f]/80 hover:border-[#f2836f]/40 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <TbChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
