"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TbArrowUpRight } from "react-icons/tb";
import type { BackgroundRow } from "@/lib/useHomeData";

interface BackgroundData {
  explore_title: string;
  explore_subtitle: string;
  explore_body: string;
  image_explores: string[] | null;
}

const ExploreSection = ({ initialData }: { initialData?: BackgroundRow | null }) => {
  const [data, setData] = useState<BackgroundData | null>(initialData ?? null);
  const [isLoaded, setIsLoaded] = useState(!!initialData);

  useEffect(() => {
    if (initialData) {
      Promise.resolve().then(() => { setData(initialData); setIsLoaded(true); });
      return;
    }

    const fetchData = async () => {
      const { data: row, error } = await supabase
        .from("ac_sections")
        .select("title, subtitle, description, descriptions, images")
        .eq("page_id", "home")
        .eq("section_number", 2)
        .single();

      if (error) {
        console.error("[Background] ac_sections fetch failed:", error.message);
        return;
      }
      if (!row) {
        console.warn('[Background] No ac_sections row for page_id="home", section_number=2 — the Explore UAE banner has no content saved yet.');
        return;
      }

      const descriptions = Array.isArray(row.descriptions) ? row.descriptions : [];
      const images = Array.isArray(row.images) ? row.images : [];
      if (images.length === 0) {
        console.warn('[Background] ac_sections row for "home" section 2 has no images uploaded.');
      }
      setData({
        explore_title: row.title ?? "",
        explore_subtitle: row.subtitle ?? "",
        explore_body: descriptions[0] ?? row.description ?? "",
        image_explores: images,
      });
      setIsLoaded(true);
    };

    fetchData();
  }, [initialData]);

  const image = data?.image_explores?.[0];

  return (
    <motion.div
      className={`group relative w-full overflow-hidden transition-opacity duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: isLoaded ? 1 : 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image layer */}
      <div className="relative w-full h-[640px] 2xl:h-[740px]">
        {image && (
          <Image
            src={image}
            alt={data?.explore_title ?? "Explore UAE"}
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/60" />
      </div>

      {/* Content layer */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center text-center gap-6 2xl:gap-10 px-5 md:px-10 2xl:px-0 md:pt-8 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {data?.explore_subtitle && (
          <p className="inline-flex items-center gap-2 text-[11px] 2xl:text-sm font-bold uppercase border border-[#f2836f]/20 bg-[#f2836f]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]">
            {data.explore_subtitle}
          </p>
        )}

        {data?.explore_title && (
          <h3 className="cursive text-4xl md:text-5xl 2xl:text-6xl font-semibold text-white">
            {data.explore_title}
          </h3>
        )}

        {data?.explore_body && (
          <p className="max-w-3xl whitespace-pre-line tracking-wide leading-relaxed text-sm md:text-base 2xl:text-lg font-normal text-gray-300">
            {data.explore_body}
          </p>
        )}

        <div className="flex flex-col items-center gap-6 mt-2">
          <span className="text-xs 2xl:text-sm text-gray-300">
            Dubai • Abu Dhabi • Fujairah • Ras Al Khaimah
          </span>
          <Link
            href="/explore-uae"
            aria-label="Explore UAE"
            className="select-none btn-light-base btn-dynamic"
          >
            Explore UAE <TbArrowUpRight size={22} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExploreSection;
