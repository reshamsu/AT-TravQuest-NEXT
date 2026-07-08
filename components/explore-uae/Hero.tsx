"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const FALLBACK: HeroRow = {
  hero_title: "Where Luxury Meets Innovation",
  hero_subtitle:
    "Discover unforgettable experiences across the United Arab Emirates.",
  page_type: ["Explore UAE"],
  image_urls: ["/assets/hero/.jpg"],
};

interface HeroRow {
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
}

const HeroSkeleton = () => (
  <div className="relative h-[70vh] w-full animate-pulse bg-gray-900">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-400 to-gray-200" />
    <div className="absolute bottom-4 left-2 xl:left-1/16 2xl:left-2/12 max-w-6xl w-full space-y-3 p-10 px-8 md:px-10 xl:px-0">
      <div className="h-10 w-80 md:w-2xl rounded-lg bg-gray-400" />
      <div className="h-4 w-60 md:w-lg rounded bg-gray-400" />
    </div>
  </div>
);

const Hero = () => {
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      const { data, error } = await supabase
        .from("ac_heroes")
        .select("title, subtitle, images")
        .eq("page_id", "explore-uae")
        .single();

      setHero(error || !data ? FALLBACK : {
        hero_title: data.title ?? FALLBACK.hero_title,
        hero_subtitle: data.subtitle ?? FALLBACK.hero_subtitle,
        page_type: ["Explore UAE"],
        image_urls: Array.isArray(data.images) && data.images.length ? data.images : FALLBACK.image_urls,
      });
      setLoading(false);
    };

    fetchHero();
  }, []);

  const images = hero?.image_urls ?? [];

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!hero || images.length <= 1) return;
    const id = setInterval(next, 10000);
    return () => clearInterval(id);
  }, [hero, images.length, next]);

  if (loading) return <HeroSkeleton />;

  return (
    <div className="relative h-[74vh] w-full overflow-hidden">
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={img}
            alt={`${hero?.hero_title} photo ${i + 1}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-[#f2836f]/10 to-black/60 transition-all duration-1000" />
        </div>
      ))}

      <div className="max-w-6xl mx-auto absolute inset-0 z-20 flex flex-col justify-end p-10 px-8 md:px-10 xl:px-0">
        <motion.div
          className="flex flex-col items-start gap-3 max-w-4xl text-white/90"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="cursive text-4xl lg:text-5xl font-bold leading-tight">
            {hero?.hero_title}
          </h1>
          <p className="text-sm md:text-base text-white/70 line-clamp-2 leading-relaxed">
            {hero?.hero_subtitle}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
