"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon, Plus, Eye, Pencil, Trash2, Edit3,
  FileText, Upload, X, Check, Loader2, BookOpen, Compass,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useIndustry } from "../IndustryContext";
import { useCompany } from "../CompanyContext";
import { supabase } from "@/lib/supabase";
import { apiInsert, apiUpdate, apiDelete } from "@/lib/dashboard-api";
import { uploadImage as uploadToR2 } from "@/lib/upload";
import DiscoveriesSection from "../DiscoveriesSection";

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD    = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT    = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:text-gray-200";
const PA       = "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white";
// Inactive-pill hover previews the color the pill turns into once active —
// teal for MA-styled groups (page tabs), black/white for PA-styled groups
// (mode switcher, Discoveries category tabs).
const PI       = "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-[#00B5A3]/50 hover:text-[#00B5A3]";
const PI_MONO  = "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100";
const PB       = "text-[11px] font-semibold px-3 py-1 rounded-full border transition-all duration-200";
// Page tabs (Home/About/etc.) keep the teal accent — the mode switcher
// (Pages & Sections / Discoveries) and Discoveries category tabs use PA
// (black/white theme-inverted) instead.
const MA        = "bg-[#00B5A3] text-white border-[#00B5A3]";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Page        { id: string; label: string; sort_order: number }
interface HeroSection {
  id: string; page_id: string; company: string;
  // legacy single fields (kept for backward compat)
  title: string; subtitle: string; description: string;
  // array fields
  titles: string[]; subtitles: string[]; descriptions: string[];
  images: string[];
}
interface PageSection {
  id: string; page_id: string; company: string; section_number: number;
  title: string; subtitle: string; description: string;
  titles: string[]; subtitles: string[]; descriptions: string[];
  images: string[];
}

type HeroForm = {
  page_id: string; company: string;
  titles: string[]; subtitles: string[]; descriptions: string[];
  images: string[];
};
type SecForm = {
  page_id: string; company: string; section_number: number;
  titles: string[]; subtitles: string[]; descriptions: string[];
  images: string[];
};

// page_id values here must match the string ids each public component
// actually queries via useCmsSection(pageId, N) — e.g. components/Contact/FAQ.tsx
// calls useCmsSection("contact", 4). These are NOT arbitrary — renaming one
// here without updating its component would silently disconnect that page's
// CMS editor from what's rendered on the live site.
// These ids must exactly match the live URL slugs used by /more/[page_type]
// (see components/more/Hero.tsx's PAGE_TYPE map) — the homepage's Apart/Service
// cards also synthesize these same slugs via slugify(pageType) to link out.
const INITIAL_PAGES: { id: string; label: string }[] = [
  { id: "home",                          label: "Home" },
  { id: "about",                         label: "About" },
  { id: "explore-uae",                   label: "Explore UAE" },
  { id: "apartment-for-monthly-stays",   label: "Apartments" },
  { id: "meeting-conferences",           label: "Meetings & Conferences" },
  { id: "visa-assistance",               label: "Visa Assistance" },
  { id: "airport-transfers",             label: "Airport Transfers" },
  { id: "corporate-travels",             label: "Corporate Travels" },
  { id: "contact",                       label: "Contact" },
  // Not a real route — holds shared blocks reused across many pages:
  // section 1 = the CallToAction banner, section 2 = Footer tagline/newsletter copy.
  { id: "global",                        label: "Shared Blocks" },
];
function toTitle(s: string) { return s.trim().replace(/\b\w/g, c => c.toUpperCase()); }

// Every page's hero/sections are keyed by its own real slug — no legacy
// remapping needed (Home used to be pinned to "local-0"; migrated to "home").
function heroPageIdFor(pageId: string): string {
  return pageId;
}

function blankHeroForm(pageId: string, co: string): HeroForm {
  return { page_id: pageId, company: co, titles: [""], subtitles: [""], descriptions: [""], images: [] };
}
function blankSecForm(pageId: string, co: string, n: number): SecForm {
  return { page_id: pageId, company: co, section_number: n, titles: [""], subtitles: [""], descriptions: [""], images: [] };
}
function heroToForm(h: HeroSection, co: string): HeroForm {
  return {
    page_id:      h.page_id,
    company:      h.company || co,
    titles:       h.titles?.length       ? h.titles       : (h.title       ? [h.title]       : [""]),
    subtitles:    h.subtitles?.length    ? h.subtitles    : (h.subtitle    ? [h.subtitle]    : [""]),
    descriptions: h.descriptions?.length ? h.descriptions : (h.description ? [h.description] : [""]),
    images:       h.images ?? [],
  };
}
function secToForm(s: PageSection, co: string): SecForm {
  return {
    page_id:       s.page_id,
    company:       s.company || co,
    section_number: s.section_number,
    titles:         s.titles?.length       ? s.titles       : (s.title       ? [s.title]       : [""]),
    subtitles:      s.subtitles?.length    ? s.subtitles    : (s.subtitle    ? [s.subtitle]    : [""]),
    descriptions:   s.descriptions?.length ? s.descriptions : (s.description ? [s.description] : [""]),
    images:         s.images ?? [],
  };
}

// ─── Image upload helper ──────────────────────────────────────────────────────

function uploadImage(file: File): Promise<string> {
  return uploadToR2(file, "cms");
}

// ─── Image upload field ───────────────────────────────────────────────────────

function ImageUploadField({ label, images, onChange }: {
  label: string; images: string[]; onChange: (imgs: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)));
      onChange([...images, ...urls]);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }
  return (
    <div>
      <label className={FIELD}>{label}</label>
      <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all ${uploading ? "border-[#00B5A3]/40 bg-[#00B5A3]/5 cursor-wait" : "border-gray-200 dark:border-dk-stroke cursor-pointer hover:border-[#00B5A3]/50 hover:bg-[#00B5A3]/5"}`}>
        {uploading ? <Loader2 size={16} className="text-[#00B5A3] animate-spin mb-1" /> : <Upload size={15} className="text-gray-300 mb-1" />}
        <span className="text-[11px] text-gray-400">{uploading ? "Uploading & converting to WebP…" : "Click to upload images"}</span>
        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading} />
      </label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((src, i) => (
            <div key={i} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Array field ─────────────────────────────────────────────────────────────
// Renders a labelled list of text inputs with add / remove controls.

function ArrayInputField({ label, values, onChange, placeholder, multiline = false }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const add    = () => onChange([...values, ""]);
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i));
  const update = (i: number, val: string) => onChange(values.map((v, j) => j === i ? val : v));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={FIELD + " mb-0"}>{label}</span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#00B5A3] hover:text-[#f2836f] transition-colors"
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {values.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-dk-stroke rounded-xl text-[11.5px] text-gray-400 hover:border-[#00B5A3]/40 hover:text-[#00B5A3] transition-all"
        >
          + Add {label}
        </button>
      ) : (
        <div className="space-y-2">
          {values.map((val, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 text-[10px] font-bold text-gray-300 dark:text-gray-600 w-4 shrink-0 text-right select-none">
                {i + 1}
              </span>
              {multiline ? (
                <textarea
                  rows={2}
                  className={INPUT + " resize-none flex-1"}
                  placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
                  value={val}
                  onChange={(e) => update(i, e.target.value)}
                />
              ) : (
                <input
                  className={INPUT + " flex-1"}
                  placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
                  value={val}
                  onChange={(e) => update(i, e.target.value)}
                />
              )}
              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-2 p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Array display helper (view mode) ────────────────────────────────────────

function ArrayDisplay({ label, values }: { label: string; values: string[] }) {
  const items = values.filter(Boolean);
  return (
    <div>
      <p className={FIELD}>{label}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-gray-300 dark:text-gray-600 italic">None</p>
      ) : items.length === 1 ? (
        <p className="text-[12.5px] text-gray-700 dark:text-gray-300">{items[0]}</p>
      ) : (
        <ul className="space-y-1 mt-1">
          {items.map((v, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[9.5px] font-bold text-[#00B5A3] mt-0.5 shrink-0">{i + 1}</span>
              <span className="text-[12.5px] text-gray-700 dark:text-gray-300">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PagesManagerPage() {
  const { industryId } = useIndustry();
  const { company } = useCompany();
  const activeCompany = company.label;

  const [contentMode, setContentMode] = useState<"pages" | "discoveries">("pages");
  const [loading, setLoading]       = useState(true);
  const [pages, setPages]           = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<string>("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal]   = useState("");
  const [heroes, setHeroes]         = useState<HeroSection[]>([]);
  const [sections, setSections]     = useState<PageSection[]>([]);

  // Hero modal
  const [heroModal, setHeroModal]   = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: HeroSection | null }>({ open: false, mode: "add", data: null });
  const [heroForm, setHeroForm]     = useState<HeroForm>(blankHeroForm("", ""));
  const [heroSaving, setHeroSaving] = useState(false);

  // Section modal
  const [sectionModal, setSectionModal] = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: PageSection | null }>({ open: false, mode: "add", data: null });
  const [secForm, setSecForm]           = useState<SecForm>(blankSecForm("", "", 1));
  const [secSaving, setSecSaving]       = useState(false);

  // Add-page modal
  const [addPageModal, setAddPageModal]   = useState(false);
  const [addPageInput, setAddPageInput]   = useState("");
  const [addPageSaving, setAddPageSaving] = useState(false);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; fn: (() => void) | null }>({ open: false, title: "", message: "", fn: null });
  function askConfirm(title: string, message: string, fn: () => void) { setConfirm({ open: true, title, message, fn }); }
  function closeConfirm() { setConfirm({ open: false, title: "", message: "", fn: null }); }

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase
      .from("ac_pages").select("id,label,sort_order")
      .eq("industry", industryId).order("sort_order");

    if (error || !data || data.length === 0) {
      const local = INITIAL_PAGES.map(({ id, label }, i) => ({ id, label, sort_order: i }));
      setPages(local); setActivePage(local[0].id); return;
    }
    setPages(data);
    setActivePage((p) => p || data[0].id);
  }, [industryId]);

  const fetchHeroes = useCallback(async () => {
    const { data } = await supabase.from("ac_heroes").select("*")
      .eq("industry", industryId).eq("company", activeCompany);
    setHeroes(data ?? []);
  }, [industryId, activeCompany]);

  const fetchSections = useCallback(async () => {
    const { data } = await supabase.from("ac_sections").select("*")
      .eq("industry", industryId).eq("company", activeCompany).order("section_number");
    setSections(data ?? []);
  }, [industryId, activeCompany]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchPages(), fetchHeroes(), fetchSections()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchPages, fetchHeroes, fetchSections]);

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const currentPageObj  = pages.find((p) => p.id === activePage);
  const currentHero     = heroes.find((h) => h.page_id === heroPageIdFor(activePage)) ?? null;
  const currentSections = sections.filter((s) => s.page_id === activePage);

  // ─── Page management ─────────────────────────────────────────────────────────

  async function saveNewPage(e: React.FormEvent) {
    e.preventDefault();
    const label = toTitle(addPageInput);
    if (!label) return;
    setAddPageSaving(true);
    const { data } = await apiInsert<{ id: string; label: string; sort_order: number }>(
      "ac_pages", { industry: industryId, label, sort_order: pages.length },
    );
    if (data) { setPages((p) => [...p, data]); setActivePage(data.id); setAddPageModal(false); }
    setAddPageSaving(false);
  }

  async function commitRename() {
    const val = toTitle(renameVal);
    if (!val || !renamingId) { setRenamingId(null); return; }
    const { error } = await apiUpdate("ac_pages", renamingId, { label: val, updated_at: new Date().toISOString() });
    if (!error) setPages((p) => p.map((pg) => pg.id === renamingId ? { ...pg, label: val } : pg));
    setRenamingId(null);
  }

  async function deletePage(id: string) {
    await apiDelete("ac_heroes", id, "page_id");
    await apiDelete("ac_sections", id, "page_id");
    await apiDelete("ac_pages", id);
    setPages((p) => { const rest = p.filter((pg) => pg.id !== id); if (activePage === id) setActivePage(rest[0]?.id ?? ""); return rest; });
    setHeroes((h) => h.filter((h) => h.page_id !== id));
    setSections((s) => s.filter((s) => s.page_id !== id));
  }

  // ─── Hero actions ─────────────────────────────────────────────────────────────

  function openHeroModal(mode: "add" | "edit" | "view", data?: HeroSection) {
    setHeroForm(data ? heroToForm(data, activeCompany) : blankHeroForm(heroPageIdFor(activePage), activeCompany));
    setHeroModal({ open: true, mode, data: data ?? null });
  }

  async function saveHero(e: React.FormEvent) {
    e.preventDefault();
    setHeroSaving(true);
    const payload = {
      ...heroForm,
      // keep legacy single fields in sync with first array item
      title:       heroForm.titles.find((t) => t.trim())       ?? "",
      subtitle:    heroForm.subtitles.find((s) => s.trim())    ?? "",
      description: heroForm.descriptions.find((d) => d.trim()) ?? "",
      industry:    industryId,
      updated_at:  new Date().toISOString(),
    };
    if (heroModal.mode === "edit" && heroModal.data) {
      const { data } = await apiUpdate<HeroSection>("ac_heroes", heroModal.data.id, payload);
      if (data) { setHeroes((p) => p.map((h) => h.id === heroModal.data!.id ? data : h)); setHeroModal({ open: false, mode: "add", data: null }); }
    } else {
      const { data } = await apiInsert<HeroSection>("ac_heroes", payload);
      if (data) { setHeroes((p) => [...p, data]); setHeroModal({ open: false, mode: "add", data: null }); }
    }
    setHeroSaving(false);
  }

  async function deleteHero(id: string) {
    const { error } = await apiDelete("ac_heroes", id);
    if (!error) setHeroes((p) => p.filter((h) => h.id !== id));
  }

  // ─── Section actions ──────────────────────────────────────────────────────────

  function openSectionModal(mode: "add" | "edit" | "view", data?: PageSection) {
    setSecForm(data ? secToForm(data, activeCompany) : blankSecForm(activePage, activeCompany, currentSections.length + 1));
    setSectionModal({ open: true, mode, data: data ?? null });
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    setSecSaving(true);
    const payload = {
      ...secForm,
      title:       secForm.titles.find((t) => t.trim())       ?? "",
      subtitle:    secForm.subtitles.find((s) => s.trim())    ?? "",
      description: secForm.descriptions.find((d) => d.trim()) ?? "",
      industry:    industryId,
      updated_at:  new Date().toISOString(),
    };
    if (sectionModal.mode === "edit" && sectionModal.data) {
      const { data } = await apiUpdate<PageSection>("ac_sections", sectionModal.data.id, payload);
      if (data) { setSections((p) => p.map((s) => s.id === sectionModal.data!.id ? data : s)); setSectionModal({ open: false, mode: "add", data: null }); }
    } else {
      const { data } = await apiInsert<PageSection>("ac_sections", payload);
      if (data) { setSections((p) => [...p, data]); setSectionModal({ open: false, mode: "add", data: null }); }
    }
    setSecSaving(false);
  }

  async function deleteSection(id: string) {
    const { error } = await apiDelete("ac_sections", id);
    if (!error) setSections((p) => p.filter((s) => s.id !== id));
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Pages</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            {contentMode === "pages"
              ? "Manage pages, hero sections, and content blocks. Each field supports multiple entries."
              : "Experiences and things-to-do, grouped by category and shown across destinations."}
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setContentMode("pages")}
          className={`flex items-center gap-1.5 ${PB} ${contentMode === "pages" ? PA : PI_MONO}`}>
          <FileText size={12} /> Pages &amp; Sections
        </button>
        <button type="button" onClick={() => setContentMode("discoveries")}
          className={`flex items-center gap-1.5 ${PB} ${contentMode === "discoveries" ? PA : PI_MONO}`}>
          <Compass size={12} /> Discoveries
        </button>
      </div>

      {contentMode === "discoveries" ? (
        <DiscoveriesSection company={activeCompany} />
      ) : (
      <>
      {/* Page tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {loading
          ? [1, 2, 3].map((i) => <div key={i} className="h-7 w-16 bg-gray-100 dark:bg-dk-raised rounded-full animate-pulse" />)
          : pages.map((page) => {
            const isRenaming = renamingId === page.id;
            const isActive   = activePage === page.id;
            return (
              <div key={page.id}
                className={`${PB} pr-1.5 flex items-center gap-1 ${isRenaming ? PI : isActive ? MA : PI}`}>
                {isRenaming ? (
                  <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                    className="text-[11px] font-semibold outline-none w-20 bg-transparent text-gray-700 dark:text-gray-300" />
                ) : (
                  <>
                    <button type="button" onClick={() => setActivePage(page.id)} className="text-[11px] font-semibold">
                      {page.label}
                    </button>
                    <span className={`flex items-center gap-0.5 ml-0.5 ${isActive ? "text-white/70" : "text-gray-300 dark:text-gray-600"}`}>
                      <button type="button" onClick={() => { setRenamingId(page.id); setRenameVal(page.label); }}
                        className="p-0.5 rounded hover:bg-white/20" title="Edit"><Edit3 size={9} /></button>
                      {page.sort_order > 0 && (
                        <button type="button" onClick={() => askConfirm("Delete page?", `"${page.label}" and all its content will be permanently removed.`, () => { closeConfirm(); deletePage(page.id); })}
                          className="p-0.5 rounded hover:bg-white/20" title="Delete"><X size={9} /></button>
                      )}
                    </span>
                  </>
                )}
              </div>
            );
          })
        }
        <button onClick={() => { setAddPageInput(`Page ${pages.length + 1}`); setAddPageModal(true); }}
          className="text-[11px] font-semibold px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-dk-stroke text-gray-400 hover:border-[#00B5A3]/50 hover:text-[#00B5A3] transition-all flex items-center gap-1">
          <Plus size={11} /> Add Page
        </button>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
            {currentPageObj?.label} — Hero Section
          </h2>
          <div className="flex items-center gap-2">
            {currentHero ? (
              <>
                <button onClick={() => openHeroModal("view", currentHero)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dk-stroke bg-white dark:bg-dk-raised text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-all">
                  <Eye size={12} /> View
                </button>
                <button onClick={() => openHeroModal("edit", currentHero)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dk-stroke bg-white dark:bg-dk-raised text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-all">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => askConfirm("Delete hero?", "The hero section will be permanently removed.", () => { closeConfirm(); deleteHero(currentHero.id); })}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                  <Trash2 size={12} /> Delete
                </button>
              </>
            ) : (
              <button onClick={() => openHeroModal("add")} className="btn-primary-sm flex items-center gap-1.5">
                <Plus size={13} /> Add Hero
              </button>
            )}
          </div>
        </div>

        {currentHero ? (
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Titles */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Titles ({(currentHero.titles?.filter(Boolean) ?? [currentHero.title].filter(Boolean)).length})
                </p>
                <ul className="space-y-1">
                  {(currentHero.titles?.filter(Boolean) ?? [currentHero.title].filter(Boolean)).map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[9.5px] font-bold text-[#00B5A3] mt-0.5">{i + 1}</span>
                      <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Subtitles */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Subtitles ({(currentHero.subtitles?.filter(Boolean) ?? [currentHero.subtitle].filter(Boolean)).length})
                </p>
                <ul className="space-y-1">
                  {(currentHero.subtitles?.filter(Boolean) ?? [currentHero.subtitle].filter(Boolean)).map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[9.5px] font-bold text-[#00B5A3] mt-0.5">{i + 1}</span>
                      <span className="text-[12px] text-gray-600 dark:text-gray-300">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Descriptions */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Descriptions ({(currentHero.descriptions?.filter(Boolean) ?? [currentHero.description].filter(Boolean)).length})
                </p>
                <ul className="space-y-2">
                  {(currentHero.descriptions?.filter(Boolean) ?? [currentHero.description].filter(Boolean)).map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[9.5px] font-bold text-[#00B5A3] mt-0.5 shrink-0">{i + 1}</span>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">{d}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Images</p>
              {currentHero.images?.length > 0
                ? <div className="flex flex-wrap gap-2">{currentHero.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="w-20 h-16 object-cover rounded-xl border border-gray-100" />
                  ))}</div>
                : <div className="w-full h-20 rounded-xl border-2 border-dashed border-gray-100 dark:border-dk-stroke flex items-center justify-center">
                    <span className="text-[11px] text-gray-300">No images uploaded</span>
                  </div>
              }
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-3">
              <ImageIcon size={20} className="text-gray-200" />
            </div>
            <p className="text-[13px] font-semibold text-gray-400">No hero section for {currentPageObj?.label}</p>
            <p className="text-[11.5px] text-gray-300 mt-1">Add a hero to get started.</p>
          </div>
        )}
      </div>

      {/* ── Content sections ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
              {currentPageObj?.label} — Content Sections
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{currentSections.length} section{currentSections.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => openSectionModal("add")} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> Add Section
          </button>
        </div>

        {/* Section pills */}
        {currentSections.length > 0 && (
          <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 flex-wrap border-b border-gray-50 dark:border-dk-stroke">
            {currentSections.map((sec) => (
              <div key={sec.id} className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dk-raised border border-gray-100 dark:border-dk-stroke rounded-full px-2.5 py-1">
                Section {sec.section_number}
                <span className="flex items-center gap-0.5 ml-1 text-gray-300 dark:text-gray-600">
                  <button onClick={() => openSectionModal("view", sec)} className="p-0.5 rounded hover:text-gray-500 dark:hover:text-gray-300"><Eye size={10} /></button>
                  <button onClick={() => openSectionModal("edit", sec)} className="p-0.5 rounded hover:text-gray-500 dark:hover:text-gray-300"><Pencil size={10} /></button>
                  <button onClick={() => askConfirm("Delete section?", `Section ${sec.section_number} will be permanently removed.`, () => { closeConfirm(); deleteSection(sec.id); })} className="p-0.5 rounded hover:text-red-400"><Trash2 size={10} /></button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="divide-y divide-gray-50 dark:divide-dk-stroke">
          {loading ? (
            <div className="px-6 py-8 space-y-3">{[1, 2].map((i) => <div key={i} className="h-10 bg-gray-50 dark:bg-dk-raised rounded-xl animate-pulse" />)}</div>
          ) : currentSections.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-3">
                <FileText size={16} className="text-gray-200" />
              </div>
              <p className="text-[13px] font-semibold text-gray-400">No sections yet</p>
              <p className="text-[11.5px] text-gray-300 mt-1">Click &ldquo;Add Section&rdquo; to create your first content section.</p>
            </div>
          ) : currentSections.map((sec) => {
            const titles       = sec.titles?.filter(Boolean)       ?? [sec.title].filter(Boolean);
            const subtitles    = sec.subtitles?.filter(Boolean)    ?? [sec.subtitle].filter(Boolean);
            const descriptions = sec.descriptions?.filter(Boolean) ?? [sec.description].filter(Boolean);
            return (
              <div key={sec.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-dk-raised/30 transition-colors">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-[10px] font-bold text-[#00B5A3] uppercase tracking-widest">Section {sec.section_number}</p>
                  {/* Titles */}
                  {titles.length > 0 && (
                    <div>
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide">Titles</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {titles.map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[9px] font-bold text-[#00B5A3] mt-0.5 shrink-0">{i + 1}</span>
                            <span className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-100">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Subtitles */}
                  {subtitles.length > 0 && (
                    <div>
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide">Subtitles</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {subtitles.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[9px] font-bold text-[#00B5A3] mt-0.5 shrink-0">{i + 1}</span>
                            <span className="text-[11.5px] text-gray-500 dark:text-gray-400">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Descriptions preview */}
                  {descriptions.length > 0 && (
                    <p className="text-[11px] text-gray-400 line-clamp-2">{descriptions[0]}</p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openSectionModal("view", sec)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-gray-300 transition-all"><Eye size={11} /> View</button>
                    <button onClick={() => openSectionModal("edit", sec)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-gray-300 transition-all"><Pencil size={11} /> Edit</button>
                    <button onClick={() => askConfirm("Delete section?", `Section ${sec.section_number} will be permanently removed.`, () => { closeConfirm(); deleteSection(sec.id); })} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"><Trash2 size={11} /> Del</button>
                  </div>
                  {sec.images?.length > 0
                    ? <div className="flex flex-wrap gap-1 justify-end">{sec.images.slice(0, 3).map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt="" className="w-14 h-11 object-cover rounded-lg border border-gray-100" />
                      ))}</div>
                    : <span className="text-[10px] text-gray-300">No images</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── All pages summary ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-5">
        <h3 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100 mb-4">All Pages</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 dark:bg-dk-raised rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-0">
            {pages.map((page) => {
              const hero = heroes.find((h) => h.page_id === page.id);
              const secs = sections.filter((s) => s.page_id === page.id);
              return (
                <div key={page.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-dk-stroke last:border-0 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-dk-raised/30 rounded-xl px-2 -mx-2 transition-colors"
                  onClick={() => setActivePage(page.id)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#00B5A3]/8 flex items-center justify-center">
                      <BookOpen size={12} className="text-[#00B5A3]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">{page.label}</p>
                      <p className="text-[10.5px] text-gray-400">{secs.length} section{secs.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {hero
                    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><Check size={9} /> Hero set</span>
                    : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 dark:bg-dk-raised text-gray-400 border border-gray-200 dark:border-dk-stroke">No hero</span>
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────────── */}

      {/* Hero modal */}
      <Modal
        isOpen={heroModal.open}
        onClose={() => setHeroModal({ open: false, mode: "add", data: null })}
        title={heroModal.mode === "view" ? `${currentPageObj?.label} — Hero` : heroModal.mode === "edit" ? "Edit Hero Section" : "Add Hero Section"}
      >
        {heroModal.mode === "view" && heroModal.data ? (
          <div className="space-y-5">
            <div>
              <p className={FIELD}>Page</p>
              <p className="text-[12.5px] text-gray-700 dark:text-gray-300">{pages.find((p) => p.id === heroModal.data!.page_id)?.label}</p>
            </div>
            <ArrayDisplay label="Titles" values={heroModal.data.titles?.length ? heroModal.data.titles : [heroModal.data.title].filter(Boolean)} />
            <ArrayDisplay label="Subtitles" values={heroModal.data.subtitles?.length ? heroModal.data.subtitles : [heroModal.data.subtitle].filter(Boolean)} />
            <ArrayDisplay label="Descriptions" values={heroModal.data.descriptions?.length ? heroModal.data.descriptions : [heroModal.data.description].filter(Boolean)} />
            <div>
              <p className={FIELD}>Images ({heroModal.data.images?.length ?? 0})</p>
              {heroModal.data.images?.length > 0
                ? <div className="flex flex-wrap gap-2">{heroModal.data.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="w-20 h-16 object-cover rounded-xl border border-gray-100" />
                  ))}</div>
                : <p className="text-[12px] text-gray-300">No images uploaded</p>
              }
            </div>
          </div>
        ) : (
          <form onSubmit={saveHero} className="space-y-5">
            <div>
              <label className={FIELD}>Page</label>
              <select className={INPUT} value={heroForm.page_id} onChange={(e) => setHeroForm((p) => ({ ...p, page_id: e.target.value }))}>
                {pages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <ArrayInputField
              label="Titles"
              values={heroForm.titles}
              onChange={(v) => setHeroForm((p) => ({ ...p, titles: v }))}
              placeholder="Enter a hero title…"
            />
            <ArrayInputField
              label="Subtitles"
              values={heroForm.subtitles}
              onChange={(v) => setHeroForm((p) => ({ ...p, subtitles: v }))}
              placeholder="Enter a hero subtitle…"
            />
            <ArrayInputField
              label="Descriptions"
              values={heroForm.descriptions}
              onChange={(v) => setHeroForm((p) => ({ ...p, descriptions: v }))}
              placeholder="Enter a description paragraph…"
              multiline
            />
            <ImageUploadField label="Hero Images" images={heroForm.images} onChange={(imgs) => setHeroForm((p) => ({ ...p, images: imgs }))} />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setHeroModal({ open: false, mode: "add", data: null })} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 dark:bg-dk-raised dark:text-gray-400 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              <button type="submit" disabled={heroSaving} className="btn-primary-sm flex items-center gap-1.5">
                {heroSaving && <Loader2 size={12} className="animate-spin" />}
                {heroModal.mode === "edit" ? "Save Changes" : "Add Hero"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Section modal */}
      <Modal
        isOpen={sectionModal.open}
        onClose={() => setSectionModal({ open: false, mode: "add", data: null })}
        title={sectionModal.mode === "view" ? `Section ${sectionModal.data?.section_number}` : sectionModal.mode === "edit" ? "Edit Section" : "Add Content Section"}
      >
        {sectionModal.mode === "view" && sectionModal.data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={FIELD}>Page</p>
                <p className="text-[12.5px] text-gray-700 dark:text-gray-300">{pages.find((p) => p.id === sectionModal.data!.page_id)?.label}</p>
              </div>
              <div>
                <p className={FIELD}>Section #</p>
                <p className="text-[12.5px] text-gray-700 dark:text-gray-300">{sectionModal.data.section_number}</p>
              </div>
            </div>
            <ArrayDisplay label="Titles" values={sectionModal.data.titles?.length ? sectionModal.data.titles : [sectionModal.data.title].filter(Boolean)} />
            <ArrayDisplay label="Subtitles" values={sectionModal.data.subtitles?.length ? sectionModal.data.subtitles : [sectionModal.data.subtitle].filter(Boolean)} />
            <ArrayDisplay label="Descriptions" values={sectionModal.data.descriptions?.length ? sectionModal.data.descriptions : [sectionModal.data.description].filter(Boolean)} />
            <div>
              <p className={FIELD}>Images ({sectionModal.data.images?.length ?? 0})</p>
              {sectionModal.data.images?.length > 0
                ? <div className="flex flex-wrap gap-2">{sectionModal.data.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="w-20 h-16 object-cover rounded-xl border border-gray-100" />
                  ))}</div>
                : <p className="text-[12px] text-gray-300">No images</p>
              }
            </div>
          </div>
        ) : (
          <form onSubmit={saveSection} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FIELD}>Page</label>
                <select className={INPUT} value={secForm.page_id} onChange={(e) => setSecForm((p) => ({ ...p, page_id: e.target.value }))}>
                  {pages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={FIELD}>Section #</label>
                <input type="number" min="1" required className={INPUT} value={secForm.section_number}
                  onChange={(e) => setSecForm((p) => ({ ...p, section_number: Number(e.target.value) }))} />
              </div>
            </div>
            {secForm.page_id === "contact" && secForm.section_number === 4 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2">
                This is the public FAQ section. The first Title/Description pair below is the heading shown above the list —
                add a <b>second pair or more</b> to replace the default questions with your own (Titles = questions, Descriptions = answers).
              </p>
            )}
            <ArrayInputField
              label={secForm.page_id === "contact" && secForm.section_number === 4 ? "Heading / Questions" : "Titles"}
              values={secForm.titles}
              onChange={(v) => setSecForm((p) => ({ ...p, titles: v }))}
              placeholder="Enter a section title…"
            />
            <ArrayInputField
              label="Subtitles"
              values={secForm.subtitles}
              onChange={(v) => setSecForm((p) => ({ ...p, subtitles: v }))}
              placeholder="Enter a section subtitle…"
            />
            <ArrayInputField
              label={secForm.page_id === "contact" && secForm.section_number === 4 ? "Sub-heading / Answers" : "Descriptions"}
              values={secForm.descriptions}
              onChange={(v) => setSecForm((p) => ({ ...p, descriptions: v }))}
              placeholder="Enter a description paragraph…"
              multiline
            />
            <ImageUploadField label="Section Images" images={secForm.images} onChange={(imgs) => setSecForm((p) => ({ ...p, images: imgs }))} />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setSectionModal({ open: false, mode: "add", data: null })} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 dark:bg-dk-raised dark:text-gray-400 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              <button type="submit" disabled={secSaving} className="btn-primary-sm flex items-center gap-1.5">
                {secSaving && <Loader2 size={12} className="animate-spin" />}
                {sectionModal.mode === "edit" ? "Save Changes" : "Add Section"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add page modal */}
      <Modal isOpen={addPageModal} onClose={() => setAddPageModal(false)} title="Add New Page">
        <form onSubmit={saveNewPage} className="space-y-4">
          <div>
            <label className={FIELD}>Page Name</label>
            <input autoFocus required className={INPUT} placeholder="e.g. Services" value={addPageInput} onChange={(e) => setAddPageInput(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAddPageModal(false)} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 dark:bg-dk-raised dark:text-gray-400 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" disabled={addPageSaving} className="btn-primary-sm flex items-center gap-1.5">
              {addPageSaving && <Loader2 size={12} className="animate-spin" />} Add Page
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => confirm.fn?.()}
        onCancel={closeConfirm}
      />
    </div>
  );
}
