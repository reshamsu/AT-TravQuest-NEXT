"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/destinations/Hero"), { ssr: false });
const Intro = dynamic(() => import("@/components/destinations/Intro"), { ssr: false });
const Discoveries = dynamic(() => import("@/components/destinations/Discoveries"), { ssr: false });
const Destinations = dynamic(() => import("@/components/Destinations"), { ssr: false });
const CallToAction = dynamic(() => import("@/components/CalltoAction"), { ssr: false });

export default function CityPageClient() {
  return (
    <div className="relative z-30">
      <Hero />
      <Intro />
      <Discoveries />
      <Destinations />
      <CallToAction />
    </div>
  );
}
