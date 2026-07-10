"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface HeroSectionRow {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
  intro_title: string;
  intro_subtitle: string;
  intro_body: string;
  intro_quote: string;
  image_collages: string[];
}

export interface TourRow {
  id: string | number;
  title: string;
  subtitle: string;
  country: string[];
  city: string[];
  category: string[];
  is_recom: boolean;
  description: string;
  price: string;
  image_urls: string[];
}

export interface DestinationRow {
  id: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  continent: string[];
  image_urls: string[];
}

export interface ApartRow {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
}

export interface ServiceRow {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  page_type: string[];
  image_urls: string[];
}

export interface BackgroundRow {
  explore_title: string;
  explore_subtitle: string;
  explore_body: string;
  image_explores: string[] | null;
}

export interface PromoRow {
  id: string | number;
  title: string;
  subtitle: string;
  country: string[];
  city: string[];
  category: string[];
  is_recom: boolean;
  description: string;
  price: string;
  image_urls: string[];
}

export interface HomeData {
  heroSection: HeroSectionRow | null;
  tours: TourRow[];
  destinations: DestinationRow[];
  apart: ApartRow[];
  services: ServiceRow[];
  background: BackgroundRow | null;
  promos: PromoRow[];
}

// page_id <-> display page_type name, matching components/more/Hero.tsx's PAGE_TYPE map
const APART_PAGE = { id: "apartment-for-monthly-stays", label: "Apartment for Monthly Stays" };
const SERVICE_PAGES = [
  { id: "meeting-conferences", label: "Meeting Conferences" },
  { id: "visa-assistance",     label: "Visa Assistance" },
  { id: "airport-transfers",   label: "Airport Transfers" },
  { id: "corporate-travels",   label: "Corporate Travels" },
];

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
};

const COMPANY = process.env.NEXT_PUBLIC_COMPANY;

export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    heroSection: null,
    tours: [],
    destinations: [],
    apart: [],
    services: [],
    background: null,
    promos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSequentially() {
      // 1. Hero + Intro (ac_heroes + ac_sections section 1, page_id "home")
      const [{ data: heroRow }, { data: introRow }] = await Promise.all([
        supabase.from("ac_heroes").select("*").eq("page_id", "home").maybeSingle(),
        supabase.from("ac_sections").select("*").eq("page_id", "home").eq("section_number", 1).maybeSingle(),
      ]);

      if (cancelled) return;
      if (heroRow) {
        const introDescriptions = Array.isArray(introRow?.descriptions) ? introRow.descriptions : [];
        setData((prev) => ({
          ...prev,
          heroSection: {
            id: 0,
            hero_title: heroRow.title ?? "",
            hero_subtitle: heroRow.subtitle ?? "",
            page_type: ["Homepage"],
            image_urls: normalizeImages(heroRow.images),
            intro_title: introRow?.title ?? "",
            intro_subtitle: introRow?.subtitle ?? "",
            intro_body: introDescriptions[0] ?? introRow?.description ?? "",
            intro_quote: introDescriptions[1] ?? "",
            image_collages: normalizeImages(introRow?.images),
          },
        }));
      }

      // 2. Tours
      let toursQ = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", "Tours");
      if (COMPANY) toursQ = toursQ.eq("company", COMPANY);
      const { data: toursData } = await toursQ.order("created_at", { ascending: true });

      if (cancelled) return;
      setData((prev) => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tours: (toursData ?? []).map((row: any) => ({
          ...row,
          image_urls: normalizeImages(row.image_urls),
        })),
      }));

      // 3. Destinations
      const { data: destData } = await supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .order("created_at", { ascending: true });

      if (cancelled) return;
      setData((prev) => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        destinations: (destData ?? []).map((row: any) => ({
          ...row,
          image_urls: normalizeImages(row.image_urls),
          continent: Array.isArray(row.continent) ? row.continent : [],
        })),
      }));

      // 4. Apart (single ac_heroes row, page_id "apartment-for-monthly-stays")
      const { data: apartHero } = await supabase
        .from("ac_heroes").select("id, title, subtitle, images")
        .eq("page_id", APART_PAGE.id).maybeSingle();

      if (cancelled) return;
      setData((prev) => ({
        ...prev,
        apart: apartHero ? [{
          id: 0,
          hero_title: apartHero.title ?? "",
          hero_subtitle: apartHero.subtitle ?? "",
          page_type: [APART_PAGE.label],
          image_urls: normalizeImages(apartHero.images),
        }] : [],
      }));

      // 5. Services (one ac_heroes row per MICE page)
      const serviceRows = await Promise.all(
        SERVICE_PAGES.map(({ id, label }) =>
          supabase.from("ac_heroes").select("id, title, subtitle, images")
            .eq("page_id", id).maybeSingle()
            .then(({ data }) => data ? {
              id: 0,
              hero_title: data.title ?? "",
              hero_subtitle: data.subtitle ?? "",
              page_type: [label],
              image_urls: normalizeImages(data.images),
            } : null)
        ),
      );

      if (cancelled) return;
      setData((prev) => ({
        ...prev,
        services: serviceRows.filter((r): r is NonNullable<typeof r> => r !== null),
      }));

      // 6. Background (ac_sections section 2, page_id "home" — the Explore UAE banner)
      const { data: bgSection } = await supabase
        .from("ac_sections").select("title, subtitle, description, descriptions, images")
        .eq("page_id", "home").eq("section_number", 2).maybeSingle();

      if (cancelled) return;
      if (bgSection) {
        const bgDescriptions = Array.isArray(bgSection.descriptions) ? bgSection.descriptions : [];
        setData((prev) => ({
          ...prev,
          background: {
            explore_title: bgSection.title ?? "",
            explore_subtitle: bgSection.subtitle ?? "",
            explore_body: bgDescriptions[0] ?? bgSection.description ?? "",
            image_explores: normalizeImages(bgSection.images),
          },
        }));
      }

      // 7. Promos
      let promosQ = supabase
        .from("ac_listings_travel")
        .select("*")
        .eq("listing_type", "Promotions");
      if (COMPANY) promosQ = promosQ.eq("company", COMPANY);
      const { data: promosData } = await promosQ.order("created_at", { ascending: true });

      if (cancelled) return;
      setData((prev) => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promos: (promosData ?? []).map((row: any) => ({
          ...row,
          image_urls: normalizeImages(row.image_urls),
        })),
      }));

      setLoading(false);
    }

    fetchSequentially();
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
