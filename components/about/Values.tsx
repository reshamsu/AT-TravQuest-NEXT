"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FaHandshake,
  FaStar,
  FaFire,
  FaLightbulb,
  FaUserTie,
  FaLeaf,
  FaGlobeAsia,
  FaSuitcaseRolling,
  FaBuilding,
} from "react-icons/fa";
import { useCmsSection } from "@/lib/useCmsSection";

// Icons stay pinned to card position — the dashboard only edits each card's
// title/description text (titles[]/descriptions[] on ac_sections "about" #2).
const ICONS = [
  FaHandshake, FaStar, FaFire, FaLightbulb, FaUserTie,
  FaLeaf, FaGlobeAsia, FaSuitcaseRolling, FaBuilding,
];

const FALLBACK_ITEMS = [
  { title: "Integrity", description: "Authenticity and transparency in every journey." },
  { title: "Service Excellence", description: "Going beyond expectations with precision and care." },
  { title: "Passion", description: "Driven by a genuine love for travel and expertise." },
  { title: "Innovation", description: "Tech-driven solutions keeping you ahead." },
  { title: "Professionalism", description: "Guided by experts with 25+ years of industry experience." },
  { title: "Sustainability", description: "Committed to responsible travel and community impact." },
  { title: "Personalized Travel", description: "Handpicked destinations and tailored itineraries." },
  { title: "Seamless Services", description: "Meet & greet, transfers, hotels, tours, attractions, visas." },
  { title: "Corporate Events", description: "Professional handling of launches, events, and functions." },
];

const FALLBACK_HEADER = {
  eyebrow: "Curated Experiences",
  title: "What We Do",
  body: (
    <>
      At <strong>The TravQuest Travel & Tourism</strong>, we specialize in
      curating unforgettable journeys. Our mission is to turn your travel
      dreams into reality. Explore our handpicked destinations, expertly
      crafted itineraries, and personalized experiences. Whether you seek
      adventure, relaxation, or cultural immersion, we&apos;re here to create
      your perfect getaway.
    </>
  ),
};

const Values = () => {
  const cms = useCmsSection("about", 2);

  const eyebrow = cms?.subtitle || FALLBACK_HEADER.eyebrow;
  const heading = cms?.title || FALLBACK_HEADER.title;
  const body = cms?.description || FALLBACK_HEADER.body;

  const cmsItems =
    cms?.titles?.length && cms.titles.some(Boolean)
      ? cms.titles.map((t, i) => ({
          title: t || FALLBACK_ITEMS[i]?.title || "",
          description: cms.descriptions[i] || FALLBACK_ITEMS[i]?.description || "",
        }))
      : FALLBACK_ITEMS;

  const items = cmsItems.map((item, i) => {
    const Icon = ICONS[i % ICONS.length];
    return { ...item, icon: <Icon className="text-3xl text-[#f2836f]" /> };
  });

  return (
    <div className="bg-gradient-to-b from-gray-200/80 via-gray-100 to-white text-gray-700 rounded-tl-[50px] md:rounded-tl-[80px]">
      <div className="max-w-6xl mx-auto flex flex-col gap-10 py-14 2xl:py-18 px-8 md:px-10 xl:px-0">
        <motion.div
          className="flex flex-col items-center text-center gap-4 2xl:gap-6"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#f2836f]/20 bg-[#f2836f]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]">
            {eyebrow}
          </p>
          <h2 className="cursive text-4xl 2xl:text-5xl font-bold">
            {heading}
          </h2>
          <p className="max-w-4xl leading-relaxed text-xs md:text-sm font-medium text-gray-500">
            {body}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 duration-1000">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                delay: index * 0.06,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-white py-6 px-8 flex flex-col items-start justify-center gap-6 rounded-tr-4xl rounded-bl-4xl hover:scale-105 duration-1000 group shadow-lg"
            >
              <div className="p-3 bg-[#f2836f]/10 rounded-2xl shadow-sm w-fit">
                {item.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base 2xl:text-lg font-bold capitalize">
                  {item.title}
                </h3>
                <p className="text-xs 2xl:text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Values;
