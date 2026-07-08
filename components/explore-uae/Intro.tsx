"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { TbChevronRight } from "react-icons/tb";

interface IntroData {
  intro_title: string;
  intro_subtitle: string;
  intro_body: string;
  image_collages: string[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const IntroSkeleton = () => (
  <div className="max-w-6xl mx-auto py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 px-8 md:px-10 xl:px-0 animate-pulse">
    <div className="flex flex-col justify-center gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-3/4 rounded-lg bg-gray-200" />
        <div className="h-5 w-1/2 rounded-lg bg-gray-200" />
      </div>
      <div className="flex flex-col gap-2">
        {[100, 100, 83, 100, 66].map((w, i) => (
          <div
            key={i}
            className="h-4 rounded bg-gray-200"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
    <div className="relative h-[480px]">
      <div className="absolute top-0 left-0 w-[55%] h-[52%] rounded-2xl bg-gray-200" />
      <div className="absolute top-0 right-0 w-[42%] h-[48%] rounded-2xl bg-gray-200" />
      <div className="absolute bottom-0 left-0 w-[42%] h-[46%] rounded-2xl bg-gray-200" />
      <div className="absolute bottom-0 right-0 w-[55%] h-[50%] rounded-2xl bg-gray-200" />
    </div>
  </div>
);

const CARD_STYLES = [
  "absolute top-0 left-0 w-[54%] h-[52%] rounded-2xl overflow-hidden shadow-xl",
  "absolute top-[6%] right-0 w-[43%] h-[40%] rounded-2xl overflow-hidden shadow-xl",
  "absolute bottom-[6%] left-0 w-[43%] h-[40%] rounded-2xl overflow-hidden shadow-xl",
  "absolute bottom-0 right-0 w-[54%] h-[52%] rounded-2xl overflow-hidden shadow-xl",
] as const;

// ── Main ──────────────────────────────────────────────────────────────────────
const Intro = () => {
  const [data, setData] = useState<IntroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntro = async () => {
      const { data: row } = await supabase
        .from("ac_sections")
        .select("title, subtitle, description, descriptions, images")
        .eq("page_id", "explore-uae")
        .eq("section_number", 1)
        .single();

      if (row) {
        const descriptions = Array.isArray(row.descriptions) ? row.descriptions : [];
        setData({
          intro_title: row.title ?? "",
          intro_subtitle: row.subtitle ?? "",
          intro_body: descriptions[0] ?? row.description ?? "",
          image_collages: Array.isArray(row.images) ? row.images : [],
        });
      } else {
        setData(null);
      }
      setLoading(false);
    };

    fetchIntro();
  }, []);

  if (loading) return <IntroSkeleton />;
  if (!data) return null;

  const images = (data.image_collages ?? []).slice(0, 4);

  return (
    <div className="bg-linear-to-b from-white via-white to-white text-gray-700">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 py-14 md:py-20 px-8 md:px-10 xl:px-0">
        <motion.div
          className="flex flex-col justify-center gap-6"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-3 2xl:gap-5">
            {data.intro_subtitle && (
              <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#00B5A3]/20 bg-[#00B5A3]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#00B5A3]">
                {data.intro_subtitle}
              </p>
            )}
            <h3 className="cursive text-3xl 2xl:text-4xl font-bold">
              {data.intro_title}
            </h3>
          </div>
          {data.intro_body && (
            <p className="whitespace-pre-line max-w-xl text-xs lg:text-sm text-justify leading-relaxed text-gray-500">
              {data.intro_body}
            </p>
          )}
          <Link
            href="#destinations"
            className="flex items-center gap-2 pb-1 text-sm font-bold tracking-wide text-[#f2836f] hover:gap-3 transition-all"
          >
            Explore Destinations
            <TbChevronRight size={14} />
          </Link>
        </motion.div>

        <motion.div
          className="relative h-[480px] lg:h-[540px]"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              className={`${CARD_STYLES[i]} group`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                delay: 0.1 + i * 0.08,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src={src}
                alt={`${data.intro_title} photo ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 30vw, 22vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={i === 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Intro;
