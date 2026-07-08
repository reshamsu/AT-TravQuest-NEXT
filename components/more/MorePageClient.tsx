"use client";

import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/components/more/Hero"), { ssr: false });
const Intro = dynamic(() => import("@/components/more/Intro"), { ssr: false });
const Discoveries = dynamic(() => import("@/components/more/Discoveries"), { ssr: false });
const Destinations = dynamic(() => import("@/components/Destinations"), { ssr: false });
const CallToAction = dynamic(() => import("@/components/CalltoAction"), { ssr: false });

export default function MorePageClient() {
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
