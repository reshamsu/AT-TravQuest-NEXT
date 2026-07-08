"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/destinations/Hero"), { ssr: false });
const Intro = dynamic(() => import("@/components/destinations/Intro"), { ssr: false });
const Cities = dynamic(() => import("@/components/destinations/Cities"), { ssr: false });
const Discoveries = dynamic(() => import("@/components/destinations/Discoveries"), { ssr: false });
const Destinations = dynamic(() => import("@/components/Destinations"), { ssr: false });
const CallToAction = dynamic(() => import("@/components/CalltoAction"), { ssr: false });

export default function CountryPageClient() {
  return (
    <div className="relative z-30">
      <Hero />
      <Intro />
      <Cities />
      <Discoveries />
      <Destinations />
      <CallToAction />
    </div>
  );
}
