"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import {
  TbWorld,
  TbUsers,
  TbCurrencyDollar,
  TbCloudRain,
  TbToolsKitchen2,
  TbMapPin,
  TbShirt,
  TbPlane,
  TbHeartbeat,
  TbChevronRight,
} from "react-icons/tb";
import Link from "next/link";

interface Destination {
  country: string;
  city: string;
  image_collages?: string[];
  overview_title?: string;
  overview_subtitle?: string;
  overview_body?: string;
  population_title?: string;
  population_subtitle?: string;
  population_body?: string;
  economy_title?: string;
  economy_subtitle?: string;
  economy_body?: string;
  currency_title?: string;
  currency_subtitle?: string;
  currency_body?: string;
  weather_title?: string;
  weather_subtitle?: string;
  weather_body?: string;
  food_title?: string;
  food_subtitle?: string;
  food_body?: string;
  place_title?: string;
  place_subtitle?: string;
  place_body?: string;
  whattowear_title?: string;
  whattowear_subtitle?: string;
  whattowear_body?: string;
  flights_title?: string;
  flights_subtitle?: string;
  flights_body?: string;
  health_title?: string;
  health_subtitle?: string;
  health_body?: string;
}

type TabKey =
  | "overview"
  | "places"
  | "visa"
  | "food"
  | "weather"
  | "what_to_wear"
  | "currency"
  | "health"
  | "flights"
  | "population";

const TAB_PREFIX: Record<Exclude<TabKey, "overview">, string> = {
  places: "place",
  visa: "visa",
  food: "food",
  weather: "weather",
  what_to_wear: "whattowear",
  currency: "currency",
  health: "health",
  flights: "flights",
  population: "population",
};

const TABS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: TbWorld },
  { key: "places", label: "Top Places", Icon: TbMapPin },
  { key: "visa", label: "Visa Info", Icon: TbMapPin },
  { key: "food", label: "Food & Cuisine", Icon: TbToolsKitchen2 },
  { key: "weather", label: "Weather", Icon: TbCloudRain },
  { key: "what_to_wear", label: "What to Wear", Icon: TbShirt },
  { key: "currency", label: "Currency", Icon: TbCurrencyDollar },
  { key: "health", label: "Health", Icon: TbHeartbeat },
  { key: "flights", label: "Flights", Icon: TbPlane },
  { key: "population", label: "Population", Icon: TbUsers },
];

const TAB_HEADING: Record<Exclude<TabKey, "overview">, string> = {
  places: "Top Places to Visit",
  visa: "Visa Information",
  food: "Food & Cuisine",
  weather: "Weather & Climate",
  what_to_wear: "What to Wear",
  currency: "Currency & Money",
  health: "Health & Vaccinations",
  flights: "Flight Connectivity",
  population: "Population & Demography",
};

const CARD_STYLES = [
  "absolute top-0 left-0 w-[54%] h-[52%] rounded-3xl overflow-hidden shadow-md",
  "absolute top-[6%] right-0 w-[43%] h-[40%] rounded-3xl overflow-hidden shadow-md",
  "absolute bottom-[6%] left-0 w-[43%] h-[40%] rounded-3xl overflow-hidden shadow-md",
  "absolute bottom-0 right-0 w-[54%] h-[52%] rounded-3xl overflow-hidden shadow-md",
] as const;

const ABBREVIATIONS = ["uae", "usa", "uk", "ksa", "gcc"];
const formatParam = (slug: string) =>
  slug
    ?.replace(/_/g, "-")
    .split("-")
    .map((w) =>
      ABBREVIATIONS.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ") ?? "";

// ── Rich body renderer ────────────────────────────────────────────────────────
// Post-processes Tiptap HTML to add spacing classes before rendering.
function processRichHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  const paragraphs = div.querySelectorAll("p");
  paragraphs.forEach((p, i) => {
    // Detect "sub-heading" paragraphs: ALL text content is wrapped in a
    // semantic mark (em, strong, u, s) with no bare text nodes alongside.
    // A paragraph with mixed bold + plain text is NOT a sub-heading.
    const childNodes = Array.from(p.childNodes).filter(
      (n) =>
        !(n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === "BR"),
    );

    // Count bare (non-whitespace) text nodes — if any exist, it's a normal paragraph
    const hasBareText = childNodes.some(
      (n) =>
        n.nodeType === Node.TEXT_NODE &&
        (n.textContent ?? "").trim() !== "",
    );

    // Must have at least one meaningful child, all must be inline marks, and no bare text
    const hasOnlyInlineMarks =
      !hasBareText &&
      childNodes.length > 0 &&
      childNodes.every((n) => {
        if (n.nodeType === Node.TEXT_NODE)
          return (n.textContent ?? "").trim() === "";
        const tag = (n as Element).tagName;
        return ["EM", "STRONG", "SPAN", "U", "S", "A"].includes(tag);
      });

    if (hasOnlyInlineMarks) {
      p.classList.add("rp-subhead");
      if (i === 0) p.classList.add("rp-subhead-first");
    }

    // Empty paragraph (only whitespace / <br>)
    const text = p.textContent?.trim() ?? "";
    const hasBr = p.querySelector("br");
    if (text === "" && !hasBr) p.classList.add("rp-spacer");
    if (text === "" && hasBr) p.classList.add("rp-br-spacer");
  });

  return div.innerHTML;
}

function RichBody({ html }: { html: string }) {
  const processed = processRichHtml(html);
  return (
    <>
      <style>{`
        /* Base */
        .rich-prose { font-size: 13.5px; line-height: 1.75; color: #374151; }

        /* Paragraphs — Word-like spacing: each paragraph has a comfortable gap below */
        .rich-prose p { margin: 0 0 0.4em 0; line-height: inherit; }

        /* Truly empty paragraphs → honour as a blank line (like pressing Enter in Word) */
        .rich-prose p.rp-spacer    { margin: 0; height: 0.65em; display: block; }
        /* <br>-only paragraphs → same as a blank line */
        .rich-prose p.rp-br-spacer { margin: 0; height: 0.65em; display: block; }

        /* Sub-heading paragraphs (em/strong-only lines like bold section titles) */
        .rich-prose p.rp-subhead       { margin-top: 0.5rem; margin-bottom: 0.1em; }
        .rich-prose p.rp-subhead-first { margin-top: 0; }

        /* Headings */
        .rich-prose h1 { font-size: 1.15rem; font-weight: 700; margin: 1.4rem 0 0.5rem; line-height: 1.35; }
        .rich-prose h2 { font-size: 0.975rem; font-weight: 700; margin: 1.2rem 0 0.45rem; line-height: 1.35; }
        .rich-prose h3 { font-size: 0.875rem; font-weight: 700; margin: 1rem 0 0.4rem; line-height: 1.35; }

        /* Inline */
        .rich-prose strong, .rich-prose b { font-weight: 700; }
        .rich-prose em, .rich-prose i { font-style: italic; }
        .rich-prose u { text-decoration: underline; text-underline-offset: 2px; }
        .rich-prose s { text-decoration: line-through; }

        /* Blockquote */
        .rich-prose blockquote { border-left: 4px solid #99f6e4; padding-left: 1rem; margin: 0.65rem 0; color: #6B7280; font-style: italic; }

        /* Links */
        .rich-prose a { color: #0d9488; text-decoration: underline; cursor: pointer; }

        /* Lists */
        .rich-prose ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0 0.65rem; }
        .rich-prose ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0 0.65rem; }
        .rich-prose li { line-height: 1.75; margin-bottom: 0.35rem; }
        .rich-prose li > p { margin: 0 0 0.35rem; }

        /* Text alignment */
        .rich-prose [style*="text-align: center"] { text-align: center; }
        .rich-prose [style*="text-align: right"]  { text-align: right;  }
        .rich-prose [style*="text-align: left"]   { text-align: left;   }
        .rich-prose [style*="text-align: justify"] { text-align: justify; }
      `}</style>
      <div
        className="rich-prose"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    </>
  );
}

// ── Scroll box shared wrapper ─────────────────────────────────────────────────
function BodyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-t border-b border-gray-50 py-2 rounded-2xl max-h-[480px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent]">
      {children}
    </div>
  );
} 

// ── Skeleton ──────────────────────────────────────────────────────────────────
const OverviewSkeleton = () => (
  <div className="bg-white animate-pulse">
    <div className="max-w-6xl mx-auto px-8 md:px-10 2xl:px-0 py-10 flex flex-col gap-6">
      <div className="h-8 w-48 rounded-lg bg-gray-100" />
      <div className="flex gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
        <div className="flex flex-col gap-3">
          {[80, 60, 100, 100, 75].map((w, i) => (
            <div
              key={i}
              className="h-4 rounded bg-gray-100"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const DestinationOverview = () => {
  const { country, city } = useParams<{ country: string; city?: string }>();
  const [data, setData] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const countryLabel = formatParam(country ?? "");
  const cityLabel = city ? formatParam(city) : "";

  useEffect(() => {
    if (!country) return;
    const fetchDestination = async () => {
      setLoading(true);
      let query = supabase
        .from("ac_destinations")
        .select("*")
        .neq("status", "Hidden")
        .ilike("country", `%${countryLabel}%`);
      if (cityLabel) {
        query = query.ilike("city", `%${cityLabel}%`);
      } else {
        query = query.or("city.is.null,city.eq.,city.ilike.empty");
      }
      const { data: result } = await query.limit(1).maybeSingle();
      setData(result);
      setLoading(false);
    };
    fetchDestination();
  }, [country, city, countryLabel, cityLabel]);

  if (loading) return <OverviewSkeleton />;
  if (!data) return null;

  const images = (data.image_collages ?? []).slice(0, 4);
  const displayName = cityLabel || countryLabel;

  return (
    <div className="bg-white text-gray-700">
      <div className="max-w-6xl mx-auto px-8 md:px-10 xl:px-0 py-8 2xl:py-10 flex flex-col gap-0">
        {/* ── Tabs ── */}
        <div
          className="flex items-end gap-1.5 overflow-x-auto border-b border-gray-50"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 mb-6 text-[12.5px] font-semibold whitespace-nowrap border rounded-full transition-all duration-200 ${
                activeTab === key
                  ? "text-white bg-[#00B5A3] border-[#00B5A3] shadow-md shadow-[#00B5A3]/30 scale-[1.04]"
                  : "text-gray-500 bg-white border-gray-200 hover:border-[#00B5A3]/40 hover:text-gray-700 hover:bg-[#00B5A3]/5"
              }`}
            >
              <Icon
                size={13}
                className={
                  activeTab === key
                    ? "text-white"
                    : "text-gray-400 group-hover:text-[#00B5A3] transition-colors duration-200"
                }
              />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="py-6 2xl:py-10">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-14 items-start">
            {/* Left — text */}
            <motion.div
              className="flex flex-col justify-center gap-6 h-full"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "overview" ? (
                <>
                  <div>
                    {data.overview_subtitle && (
                      <p className="text-xs 2xl:text-sm uppercase text-[#f2836f] font-bold tracking-wide mb-2">
                        {data.overview_subtitle}
                      </p>
                    )}
                    <h3 className="cursive text-3xl 2xl:text-4xl font-bold capitalize text-gray-900 leading-tight">
                      {data.overview_title || displayName}
                    </h3>
                  </div>

                  {data.overview_body && (
                    <BodyBox>
                      <RichBody html={data.overview_body} />
                    </BodyBox>
                  )}

                  <Link
                    href={city ? "#discoveries" : "#cities"}
                    className="flex items-center gap-2 pb-1 text-sm font-bold tracking-wide text-[#f2836f] hover:gap-3 transition-all"
                  >
                    {city
                      ? "Explore Packages · Plan Your Trip"
                      : "Explore Cities "}
                    <TbChevronRight size={13} />
                  </Link>
                </>
              ) : (
                (() => {
                  const prefix = TAB_PREFIX[activeTab];
                  const title = data[`${prefix}_title` as keyof Destination] as
                    | string
                    | undefined;
                  const subtitle = data[
                    `${prefix}_subtitle` as keyof Destination
                  ] as string | undefined;
                  const body = data[`${prefix}_body` as keyof Destination] as
                    | string
                    | undefined;
                  return (
                    <>
                      <div>
                        {subtitle && (
                          <p className="text-xs 2xl:text-sm uppercase text-[#f2836f] font-bold tracking-wide mb-2">
                            {subtitle}
                          </p>
                        )}
                        <h3 className="cursive text-3xl 2xl:text-4xl font-bold capitalize text-gray-800 leading-tight">
                          {title || TAB_HEADING[activeTab]}
                        </h3>
                      </div>

                      <BodyBox>
                        {body ? (
                          <RichBody html={body} />
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            Content coming soon.
                          </p>
                        )}
                      </BodyBox>
                    </>
                  );
                })()
              )}
            </motion.div>

            {/* Right — image collage */}
            {images.length > 0 ? (
              <motion.div
                className="relative h-[420px] md:h-[540px]"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                {images.map((src, i) => (
                  <motion.div
                    key={i}
                    className={`${CARD_STYLES[i]} group`}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{
                      delay: 0.08 + i * 0.07,
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Image
                      src={src}
                      alt={`${displayName} photo ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 30vw, 22vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="h-[380px] rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <p className="text-gray-300 text-sm">No images available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationOverview;
