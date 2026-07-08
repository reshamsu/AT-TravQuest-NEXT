import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import ClientSections from "@/components/home/ClientSections";
import { supabase } from "@/lib/supabase";
import type { HeroSectionRow } from "@/lib/useHomeData";

const CalltoAction = dynamic(() => import("@/components/CalltoAction"));

export const metadata: Metadata = {
  title: "TravQuest Travel & Tourism LLC — Dubai, UAE",
  description:
    "Book unforgettable holidays with TravQuest Travel & Tourism LLC — a licensed Dubai travel agency offering luxury packages, desert safaris, city tours, visa services, and serviced apartments across the UAE and beyond.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "TravQuest Travel & Tourism LLC — Dubai, UAE",
    description:
      "Licensed Dubai travel agency offering luxury holiday packages, desert safaris, city tours, visa services, and serviced apartments across the UAE and worldwide.",
  },
  twitter: {
    title: "TravQuest Travel & Tourism LLC — Dubai, UAE",
    description:
      "Licensed Dubai travel agency offering luxury holiday packages, desert safaris, city tours, visa services, and serviced apartments.",
  },
};

async function getHeroData(): Promise<HeroSectionRow | null> {
  const company = process.env.NEXT_PUBLIC_COMPANY;
  let heroQ = supabase.from("ac_heroes").select("*").eq("page_id", "home");
  let introQ = supabase.from("ac_sections").select("*").eq("page_id", "home").eq("section_number", 1);
  if (company) { heroQ = heroQ.eq("company", company); introQ = introQ.eq("company", company); }

  const [{ data: hero }, { data: intro }] = await Promise.all([
    heroQ.maybeSingle(),
    introQ.maybeSingle(),
  ]);
  if (!hero) return null;

  const descriptions = Array.isArray(intro?.descriptions) ? intro.descriptions : [];
  return {
    id: 0,
    hero_title: hero.title ?? "",
    hero_subtitle: hero.subtitle ?? "",
    page_type: ["Homepage"],
    image_urls: hero.images ?? [],
    intro_title: intro?.title ?? "",
    intro_subtitle: intro?.subtitle ?? "",
    intro_body: descriptions[0] ?? intro?.description ?? "",
    intro_quote: descriptions[1] ?? "",
    image_collages: intro?.images ?? [],
  };
}

export default async function Home() {
  const heroSection = await getHeroData();

  return (
    <>
      <Hero initialData={heroSection} />
      <Intro initialData={heroSection} />
      <ClientSections />
      <CalltoAction />
    </>
  );
}
