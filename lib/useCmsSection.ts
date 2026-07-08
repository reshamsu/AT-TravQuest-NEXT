"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export interface CmsSection {
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  /** Multi-value fields — e.g. FAQ questions/answers, or hero-style multi-slide
   *  copy. Falls back to [title]/[description] when a section has no array data. */
  titles: string[];
  subtitles: string[];
  descriptions: string[];
}

/** Same parser used by Hero.tsx and Intro.tsx for ac_heroes/ac_sections image columns. */
export function parseImages(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .flatMap((item) => {
      if (typeof item === "string") {
        try {
          return [(JSON.parse(item) as { url: string }).url];
        } catch {
          return [item];
        }
      }
      if (item && typeof item === "object" && "url" in item)
        return [(item as { url: string }).url];
      return [];
    })
    .filter(Boolean);
}

export function useCmsSection(pageId: string, sectionNumber: number): CmsSection | null {
  const [data, setData] = useState<CmsSection | null>(null);

  useEffect(() => {
    const company = process.env.NEXT_PUBLIC_COMPANY;
    let q = supabase
      .from("ac_sections")
      .select("title,subtitle,description,images,titles,subtitles,descriptions")
      .eq("page_id", pageId)
      .eq("section_number", sectionNumber);
    if (company) q = q.eq("company", company);
    q.single().then(({ data: d }) => {
      if (!d) return;
      const titles       = Array.isArray(d.titles) && d.titles.length ? d.titles : [d.title ?? ""];
      const subtitles    = Array.isArray(d.subtitles) && d.subtitles.length ? d.subtitles : [d.subtitle ?? ""];
      const descriptions = Array.isArray(d.descriptions) && d.descriptions.length ? d.descriptions : [d.description ?? ""];
      setData({
        title:       d.title       ?? "",
        subtitle:    d.subtitle    ?? "",
        description: d.description ?? "",
        images:      parseImages(d.images),
        titles, subtitles, descriptions,
      });
    });
  }, [pageId, sectionNumber]);

  return data;
}

/** Same shape as a section, but reads a page's single ac_heroes row instead. */
export function useCmsHero(pageId: string): CmsSection | null {
  const [data, setData] = useState<CmsSection | null>(null);

  useEffect(() => {
    const company = process.env.NEXT_PUBLIC_COMPANY;
    let q = supabase
      .from("ac_heroes")
      .select("title,subtitle,description,images,titles,subtitles,descriptions")
      .eq("page_id", pageId);
    if (company) q = q.eq("company", company);
    q.single().then(({ data: d }) => {
      if (!d) return;
      const titles       = Array.isArray(d.titles) && d.titles.length ? d.titles : [d.title ?? ""];
      const subtitles    = Array.isArray(d.subtitles) && d.subtitles.length ? d.subtitles : [d.subtitle ?? ""];
      const descriptions = Array.isArray(d.descriptions) && d.descriptions.length ? d.descriptions : [d.description ?? ""];
      setData({
        title:       d.title       ?? "",
        subtitle:    d.subtitle    ?? "",
        description: d.description ?? "",
        images:      parseImages(d.images),
        titles, subtitles, descriptions,
      });
    });
  }, [pageId]);

  return data;
}

/** Splits a title so the last 2 words are highlighted in gold. */
export function splitTitle(title: string): { main: string; accent: string } {
  const words = title.trim().split(" ");
  if (words.length <= 2) return { main: "", accent: title };
  return { main: words.slice(0, -2).join(" "), accent: words.slice(-2).join(" ") };
}
