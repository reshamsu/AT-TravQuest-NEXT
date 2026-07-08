"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import type { HeroSectionRow } from "@/lib/useHomeData";

interface IntroData {
  intro_title: string;
  intro_subtitle: string;
  intro_body: string;
  intro_quote: string;
  image_collages: string[];
}

const Intro = ({ initialData }: { initialData?: HeroSectionRow | null }) => {
  const [data, setData] = useState<IntroData | null>(null);

  useEffect(() => {
    if (initialData) {
      Promise.resolve().then(() => setData(initialData));
      return;
    }
    const fetchData = async () => {
      const { data: row, error } = await supabase
        .from("ac_sections")
        .select("title, subtitle, description, descriptions, images")
        .eq("page_id", "home")
        .eq("section_number", 1)
        .single();
      if (error || !row) return;
      const descriptions = Array.isArray(row.descriptions) ? row.descriptions : [];
      setData({
        intro_title: row.title ?? "",
        intro_subtitle: row.subtitle ?? "",
        intro_body: descriptions[0] ?? row.description ?? "",
        intro_quote: descriptions[1] ?? "",
        image_collages: Array.isArray(row.images) ? row.images : [],
      });
    };
    fetchData();
  }, [initialData]);

  if (!data) return (
    <section className="bg-gradient-to-b from-[#F7F4F1] to-[#FFFFFF]">
      <div className="max-w-6xl mx-auto px-8 md:px-12 2xl:px-0 pt-14 pb-20 flex flex-col items-center gap-8 animate-pulse">
        <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
          <div className="h-10 w-2/3 bg-gray-200 rounded-full" />
          <div className="h-4 w-1/3 bg-gray-200 rounded-full" />
          <div className="h-4 w-full bg-gray-100 rounded-full" />
          <div className="h-4 w-5/6 bg-gray-100 rounded-full" />
        </div>
        <div className="flex gap-4 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-40 h-52 bg-gray-200 rounded-sm" />
          ))}
        </div>
      </div>
    </section>
  );

  const images = data.image_collages ?? [];

  return (
    <section className="bg-gradient-to-b from-[#F7F4F1] to-[#FFFFFF] overflow-hidden">
      <div className="max-w-6xl mx-auto px-8 md:px-12 2xl:px-0 pt-14 pb-20 2xl:pt-20 2xl:pb-30 flex flex-col items-center gap-8 2xl:gap-10">
        {/* ── Centered text block ── */}
        <div className="flex flex-col items-center text-center gap-6 2xl:gap-10 max-w-3xl 2xl:max-w-4xl">
          <div className="flex flex-col items-center gap-5">
            <motion.h2
              className="cursive text-5xl 2xl:text-6xl font-extrabold tracking-wide text-gray-800"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: 0.1,
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {data.intro_title}
            </motion.h2>

            {/* Eyebrow */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="inline-flex items-center gap-1 text-sm 2xl:text-base w-fit font-bold uppercase  text-[#00B5A3]">
                {data.intro_subtitle}
              </p>
            </motion.div>
          </div>

          {/* Body */}
          <motion.p
            className="text-gray-500 text-sm 2xl:text-lg leading-relaxed max-w-4xl whitespace-pre-line"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.intro_body}
          </motion.p>

          <motion.p
            className="text-gray-900 text-sm 2xl:text-lg font-bold uppercase leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.intro_quote}
          </motion.p>
        </div>

        {/* ── Polaroid Fan Row ── */}
        {images.length > 0 && (
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Polaroid fan — works on all screen sizes */}
            <div className="relative flex items-end justify-center">
              {/* Overlap container */}
              <div className="flex items-end justify-center">
                {images.slice(0, 5).map((src, i) => {
                  // Fan rotations: left tilts left, center straight, right tilts right
                  const rotations = [6, 6, -6, 6, 6];
                  // Arc: edges dip down, centre sits highest
                  const translateYs = [40, 16, 0, 16, 40];
                  const rot = rotations[i] ?? 0;
                  const ty = translateYs[i] ?? 0;

                  return (
                    <motion.div
                      key={i}
                      className="group cursor-pointer"
                      style={{
                        marginLeft: i === 0 ? "0" : "-24px",
                        transformOrigin: "bottom center",
                        zIndex: i === 2 ? 5 : i === 1 || i === 3 ? 4 : 3,
                      }}
                      initial={{ opacity: 0, rotate: rot, y: ty + 30 }}
                      whileInView={{ opacity: 1, rotate: rot, y: ty }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        delay: 0.1 + i * 0.08,
                        duration: 0.65,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{
                        rotate: 0,
                        y: ty - 16,
                        scale: 1.06,
                        zIndex: 10,
                        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                      }}
                    >
                      {/* Polaroid frame */}
                      <div
                        className="bg-white shadow-2xl"
                        style={{
                          padding: "12px 12px 44px 12px",
                          width: "clamp(160px, 22vw, 280px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                        }}
                      >
                        {/* Photo area */}
                        <div
                          className="relative overflow-hidden bg-gray-100"
                          style={{ aspectRatio: "4/3" }}
                        >
                          {src ? (
                            <Image
                              src={src}
                              alt={`Destination ${i + 1}`}
                              fill
                              sizes="(max-width: 640px) 28vw, (max-width: 1024px) 20vw, 16vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Intro;
