"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Home, Plus, Eye, Pencil, Trash2, Check,
  Upload, X, Loader2, MapPin,
  LayoutGrid, List, Building2, ChevronDown, ChevronRight, Search,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Modal from "@/components/ui/Modal";
import ComboInput from "@/components/ui/ComboInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageSlider from "@/components/ui/ImageSlider";
import RichTextEditor from "@/components/RichTextEditor";
import { supabase } from "@/lib/supabase";
import { uploadImage as uploadToR2 } from "@/lib/upload";
import { useIndustry } from "@/app/dashboard/IndustryContext";

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT    = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT   = `${INPUT} cursor-pointer`;

// ─── Type config ──────────────────────────────────────────────────────────────

interface TypeConfig {
  label: string;
  singular: string;
  description: string;
  filterKey: "property_type" | "status";
  filterValue: string;
  presetType?: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  houses:     { label: "Houses",             singular: "House",              description: "Manage residential house listings.", filterKey: "property_type", filterValue: "House",       presetType: "House" },
  apartments: { label: "Apartments",         singular: "Apartment",          description: "Manage apartment and flat listings.",  filterKey: "property_type", filterValue: "Apartment",   presetType: "Apartment" },
  commercial: { label: "Commercial",         singular: "Commercial Property",description: "Manage commercial property listings.", filterKey: "property_type", filterValue: "Commercial",  presetType: "Commercial" },
  land:       { label: "Land & Plots",       singular: "Land Listing",       description: "Manage land and plot listings.",       filterKey: "property_type", filterValue: "Land",        presetType: "Land" },
  rentals:    { label: "Rentals",            singular: "Rental",             description: "Manage rental property listings.",     filterKey: "status",        filterValue: "Rent" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: number;
  created_at: string;
  client_name: string;
  industry: string;
  title: string;
  address: string;
  city: string;
  state: string;
  country: string;
  location: string;
  property_type: string;
  status: string;
  price: string;
  full_price: string;
  sqft: number;
  beds: number;
  baths: number;
  lot_size: string;
  year_built: number;
  floors: string;
  actual_floor: string;
  agent: string;
  tagline: string;
  description: string;
  features: string[];
  amenities: string[];
  image_urls: string[];
  image_gallery: string[];
}

type ListingForm = Omit<Listing, "id" | "created_at">;

const PROPERTY_TYPES = ["House", "Apartment", "Commercial", "Villa", "Land", "Industrial", "Mixed-Use", "Luxury"];
const STATUSES       = ["Available", "Rent", "Sold", "Pending", "Closed", "Hidden"];

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  Rent:      "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/30",
  Sold:      "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30",
  Pending:   "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
  Closed:    "bg-gray-50 dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke",
  Hidden:    "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/30",
};

const FORM_TABS = ["basic", "details", "images"] as const;
type FormTab = typeof FORM_TABS[number];
const TAB_LABEL: Record<FormTab, string> = { basic: "Basic Info", details: "Details", images: "Images" };

// This project is travel only — every listing lives in ac_listings_travel.
function tableFor(): string {
  return "ac_listings_travel";
}

function strOf(v: unknown): string {
  return Array.isArray(v) ? (v[0] ?? '') : ((v ?? '') as string);
}
function normRow(r: Record<string, unknown>): Listing {
  return { ...r, city: strOf(r.city), country: strOf(r.country) } as unknown as Listing;
}
function arrWrap(s: string): string[] { return s ? [s] : []; }

// ─── Image upload ─────────────────────────────────────────────────────────────

function uploadImage(file: File): Promise<string> {
  return uploadToR2(file, "listings");
}

function ImageUploadField({ label, images, onChange }: { label: string; images: string[]; onChange: (v: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setError(null);
    try { onChange([...images, ...(await Promise.all(files.map(f => uploadImage(f))))]); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <label className={FIELD}>{label}</label>
      <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all ${
        error ? "border-red-300 bg-red-50/30 cursor-pointer" :
        uploading ? "border-[#00B5A3]/40 bg-[#00B5A3]/5 cursor-wait" :
        "border-gray-200 cursor-pointer hover:border-[#00B5A3]/50 hover:bg-[#00B5A3]/5"
      }`}>
        {uploading ? <Loader2 size={16} className="text-[#00B5A3] animate-spin mb-1" /> : <Upload size={15} className={error ? "text-red-400 mb-1" : "text-gray-300 mb-1"} />}
        <span className={`text-[11px] ${error ? "text-red-500" : "text-gray-400"}`}>
          {uploading ? "Uploading & converting to WebP…" : error ?? "Click to upload images"}
        </span>
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

// ─── Hover-cycling image thumbnail for list view ─────────────────────────────

function HoverCycleImage({ imgs, className, fallback }: {
  imgs: string[];
  className: string;
  fallback: React.ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (imgs.length <= 1 || timer.current) return;
    timer.current = setInterval(() => setIdx(p => (p + 1) % imgs.length), 900);
  }
  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setIdx(0);
  }

  return (
    <div className={`${className} relative`} onMouseEnter={start} onMouseLeave={stop}>
      {imgs.length > 0 ? imgs.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src + i} src={src} alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? "opacity-100" : "opacity-0"}`} />
      )) : (
        <div className="absolute inset-0 flex items-center justify-center">{fallback}</div>
      )}
    </div>
  );
}

// ─── Grid card with hover image cycling ──────────────────────────────────────

function waShareUrl(item: Listing): string {
  const lines: string[] = [];
  if (item.client_name) lines.push(`🏢 *${item.client_name}*`);
  if (item.industry)    lines.push(`🏭 ${item.industry}`);
  lines.push(`🏠 *${item.title || item.address || "Property Listing"}*`);
  if (item.property_type) lines.push(`Type: ${item.property_type}`);
  const loc = [item.city, item.state, item.country].filter(Boolean).join(", ");
  if (loc) lines.push(`📍 ${loc}`);
  if (item.price) lines.push(`💰 ${item.price}${item.full_price ? ` (${item.full_price})` : ""}`);
  const specs: string[] = [];
  if (item.beds)  specs.push(`${item.beds} bed${item.beds > 1 ? "s" : ""}`);
  if (item.baths) specs.push(`${item.baths} bath${item.baths > 1 ? "s" : ""}`);
  if (item.sqft)  specs.push(`${item.sqft} sqft`);
  if (specs.length) lines.push(`🔑 ${specs.join(" · ")}`);
  if (item.status) lines.push(`Status: ${item.status}`);
  if (item.agent)  lines.push(`👤 Agent: ${item.agent}`);
  lines.push(`\n🌐 Atlas'SampleB2B\nhttps://atlascreate.io`);
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}

function ListingTypeGridCard({ item, onView, onEdit, onDelete }: {
  item: Listing;
  onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const imgs = item.image_urls ?? [];

  function start() {
    if (imgs.length <= 1 || timer.current) return;
    timer.current = setInterval(() => setIdx(p => (p + 1) % imgs.length), 900);
  }
  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setIdx(0);
  }

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300"
      style={{ aspectRatio: "4/3" }} onMouseEnter={start} onMouseLeave={stop}>
      {imgs.length > 0 ? imgs.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src + i} src={src} alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? "opacity-100" : "opacity-0"}`} />
      )) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center"><Building2 size={32} className="text-gray-300" /></div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
      {item.property_type && (
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-[#00B5A3]/90 backdrop-blur-sm text-white rounded-full text-[10px] font-bold tracking-wide shadow-sm">{item.property_type}</span>
        </div>
      )}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onView} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }}><Eye size={14} /></button>
        <button onClick={onEdit} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }}><Pencil size={14} /></button>
        <button onClick={onDelete} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-red-500 transition-all" style={{ borderRadius: "10px" }}><Trash2 size={14} /></button>
        <a href={waShareUrl(item)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Share on WhatsApp" className="p-1.5 bg-white shadow-md text-green-600 hover:text-green-700 transition-all flex items-center" style={{ borderRadius: "10px" }}><FaWhatsapp size={14} /></a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[15px] font-bold text-white leading-tight truncate">{item.title || item.address || "Untitled"}</p>
        {item.price && <p className="text-[13px] font-bold text-[#f5c88a] mt-0.5">{item.price}{item.full_price && <span className="text-[10.5px] font-normal text-white/60 ml-1.5">{item.full_price}</span>}</p>}
        {item.status && <span className={`inline-block mt-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[item.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{item.status}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATIC_LISTING_TABS = Object.entries(TYPE_CONFIG).map(([slug, c]) => ({ slug, label: c.label, custom: false }));

type CustomListingType = { slug: string; label: string; filterValue: string };

function dispatchTabsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("type-tabs-changed"));
}
function mergeOrder(saved: string[], current: string[]): string[] {
  const cur = new Set(current);
  return [...saved.filter(s => cur.has(s)), ...current.filter(s => !saved.includes(s))];
}
function loadCustomListingTypes(): CustomListingType[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("custom_listing_types") ?? "[]"); } catch { return []; }
}
function saveCustomListingTypes(types: CustomListingType[]) {
  localStorage.setItem("custom_listing_types", JSON.stringify(types));
  dispatchTabsChanged();
}
function loadListingLabelOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("listing_type_label_overrides") ?? "{}"); } catch { return {}; }
}
function saveListingLabelOverrides(overrides: Record<string, string>) {
  localStorage.setItem("listing_type_label_overrides", JSON.stringify(overrides));
  dispatchTabsChanged();
}
function loadListingOrder(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("listing_type_order") ?? "[]"); } catch { return []; }
}
function saveListingOrder(order: string[]) {
  localStorage.setItem("listing_type_order", JSON.stringify(order));
  dispatchTabsChanged();
}
function toSlug(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function toTitle(s: string) {
  return s.trim().replace(/\b\w/g, c => c.toUpperCase());
}

export default function ListingTypePage() {
  const params      = useParams<{ type: string }>();
  const router      = useRouter();
  const { industryId } = useIndustry();

  const [customTypes,    setCustomTypes]    = useState<CustomListingType[]>(loadCustomListingTypes);
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>(loadListingLabelOverrides);
  const [tabOrder,       setTabOrder]       = useState<string[]>(() =>
    mergeOrder(loadListingOrder(), [...STATIC_LISTING_TABS.map(t => t.slug), ...loadCustomListingTypes().map(t => t.slug)])
  );
  const [addingType,     setAddingType]     = useState(false);
  const [newTypeLabel,   setNewTypeLabel]   = useState("");
  const [renamingSlug,   setRenamingSlug]   = useState<string | null>(null);
  const [renameVal,      setRenameVal]      = useState("");
  const [draggedSlug,    setDraggedSlug]    = useState<string | null>(null);
  const [dragOverSlug,   setDragOverSlug]   = useState<string | null>(null);

  useEffect(() => {
    const current = [...STATIC_LISTING_TABS.map(t => t.slug), ...customTypes.map(t => t.slug)];
    setTabOrder(prev => mergeOrder(prev, current));
  }, [customTypes]);

  const slugToTab: Record<string, { slug: string; label: string; custom: boolean }> = {};
  for (const t of STATIC_LISTING_TABS) slugToTab[t.slug] = { slug: t.slug, label: labelOverrides[t.slug] ?? t.label, custom: false };
  for (const t of customTypes) slugToTab[t.slug] = { slug: t.slug, label: t.label, custom: true };
  const allTypeTabs = tabOrder.map(s => slugToTab[s]).filter(Boolean) as Array<{ slug: string; label: string; custom: boolean }>;

  function commitRename(slug: string, newLabel: string, isCustom: boolean) {
    const val = toTitle(newLabel);
    setRenamingSlug(null);
    if (!val) return;
    if (isCustom) {
      const updated = customTypes.map(t => t.slug === slug ? { ...t, label: val } : t);
      setCustomTypes(updated); saveCustomListingTypes(updated);
    } else {
      const updated = { ...labelOverrides, [slug]: val };
      setLabelOverrides(updated); saveListingLabelOverrides(updated);
    }
  }

  function dropTab(from: string, to: string) {
    const order = allTypeTabs.map(t => t.slug);
    const fi = order.indexOf(from), ti = order.indexOf(to);
    if (fi === -1 || ti === -1 || fi === ti) return;
    const next = [...order];
    next.splice(fi, 1);
    next.splice(ti, 0, from);
    setTabOrder(next);
    saveListingOrder(next);
  }

  const customEntry = customTypes.find(t => t.slug === params.type);
  const config = TYPE_CONFIG[params.type] ?? (customEntry ? {
    label:       customEntry.label,
    singular:    customEntry.label.replace(/s$/i, ""),
    description: `Manage ${customEntry.label.toLowerCase()} listings.`,
    filterKey:   "property_type" as const,
    filterValue: customEntry.filterValue,
    presetType:  customEntry.filterValue,
  } : TYPE_CONFIG.houses);

  const emptyForm = (): ListingForm => ({
    client_name: "", industry: industryId, title: "", address: "", city: "", state: "", country: "", location: "",
    property_type: config.presetType ?? "", status: config.filterKey === "status" ? config.filterValue : "Available",
    price: "", full_price: "", sqft: 0, beds: 0, baths: 0, lot_size: "", year_built: 0,
    floors: "", actual_floor: "", agent: "", tagline: "", description: "",
    features: [], amenities: [], image_urls: [], image_gallery: [],
  });

  const [listings,     setListings]     = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [viewMode,       setViewMode]       = useState<"list" | "grid">("list");
  const [selectedClient] = useState<string>("__all__");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [modal,     setModal]     = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: Listing | null }>({ open: false, mode: "add", data: null });
  const [form,      setForm]      = useState<ListingForm>(emptyForm());
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fullLoad,    setFullLoad]    = useState(false);
  const [openLocations, setOpenLocations] = useState<Set<string>>(new Set());

  function toggleLocation(loc: string) {
    setOpenLocations(prev => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc); else next.add(loc);
      return next;
    });
  }

  const setF = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const fetchListings = useCallback(async () => {
    const COLS_WITH    = "id,created_at,client_name,industry,title,address,city,state,country,location,floors,actual_floor,property_type,status,price,full_price,sqft,beds,baths,lot_size,year_built,agent,image_urls";
    const COLS_WITHOUT = "id,created_at,client_name,title,address,city,state,country,location,floors,actual_floor,property_type,status,price,full_price,sqft,beds,baths,lot_size,year_built,agent,image_urls";

    const run = (cols: string) => {
      const q = supabase.from(tableFor()).select(cols).eq("industry", industryId).order("created_at", { ascending: false });
      return config.filterKey === "property_type"
        ? q.eq("property_type", config.filterValue)
        : q.eq("status", config.filterValue);
    };

    const { data, error } = await run(COLS_WITH);
    if (error) {
      const { data: fallback } = await run(COLS_WITHOUT);
      setListings(((fallback ?? []) as unknown[]).map(r => normRow({ ...(r as Record<string, unknown>), industry: (r as Record<string, unknown>).industry ?? "" })));
    } else {
      setListings((data ?? []).map(r => normRow(r as unknown as Record<string, unknown>)));
    }
  }, [config.filterKey, config.filterValue, industryId]);

  useEffect(() => {
    setLoading(true);
    fetchListings().finally(() => setLoading(false));
  }, [fetchListings]);

  // ── Autofill helpers ──────────────────────────────────────────────────────

  const uniq = (fn: (l: Listing) => string) =>
    [...new Set(listings.map(fn).filter(Boolean))].sort();
  const dl = {
    client_name:   uniq(l => l.client_name),
    industry:      uniq(l => l.industry),
    city:          uniq(l => l.city),
    state:         uniq(l => l.state),
    country:       uniq(l => l.country),
    location:      uniq(l => l.location),
    agent:         uniq(l => l.agent),
    property_type: uniq(l => l.property_type),
  };

  const geoIndex = [...new Map(
    listings
      .filter(l => l.city || l.state || l.country || l.location)
      .map(l => [`${l.city}|${l.state}|${l.country}|${l.location}`, { city: l.city, state: l.state, country: l.country, location: l.location }])
  ).values()];

  function autoFillGeo(field: "city" | "state" | "country" | "location", val: string) {
    setForm(p => {
      const match = val ? geoIndex.find(e => e[field] === val) : undefined;
      if (!match) return { ...p, [field]: val };
      return {
        ...p,
        [field]: val,
        city:     field === "city"     ? val : (p.city     || match.city     || ""),
        state:    field === "state"    ? val : (p.state    || match.state    || ""),
        country:  field === "country"  ? val : (p.country  || match.country  || ""),
        location: field === "location" ? val : (p.location || match.location || ""),
      };
    });
  }

  const clientMap = Object.fromEntries(
    listings
      .filter(l => l.client_name)
      .map(l => [l.client_name, { agent: l.agent, city: l.city, state: l.state, country: l.country, location: l.location, industry: l.industry }])
  ) as Record<string, { agent: string; city: string; state: string; country: string; location: string; industry: string }>;

  const clientNames = [...new Set(listings.map(l => l.client_name).filter(Boolean))].sort();

  function handleClientChange(val: string) {
    setForm(p => {
      const match = val ? clientMap[val] : undefined;
      if (!match) return { ...p, client_name: val };
      return {
        ...p,
        client_name: val,
        industry: p.industry || match.industry || "",
        agent:    p.agent    || match.agent    || "",
        city:     p.city     || match.city     || "",
        state:    p.state    || match.state    || "",
        country:  p.country  || match.country  || "",
        location: p.location || match.location || "",
      };
    });
  }

  async function openModal(mode: "add" | "edit" | "view", item?: Listing) {
    setActiveTab("basic");
    if (mode === "add") { setForm(emptyForm()); setModal({ open: true, mode, data: null }); return; }
    if (!item) return;
    setModal({ open: true, mode, data: item });
    setFullLoad(true);
    const { data: full } = await supabase.from(tableFor()).select("*").eq("id", item.id).single();
    if (full) {
      setModal({ open: true, mode, data: full as Listing });
      if (mode === "edit") setForm({
        client_name: full.client_name ?? "", industry: full.industry ?? "", title: full.title ?? "", address: full.address ?? "",
        city: strOf(full.city), state: full.state ?? "", country: strOf(full.country),
        location: full.location ?? "", floors: full.floors ?? "", actual_floor: full.actual_floor ?? "",
        property_type: full.property_type ?? "", status: full.status ?? "Available",
        price: full.price ?? "", full_price: full.full_price ?? "",
        sqft: full.sqft ?? 0, beds: full.beds ?? 0, baths: full.baths ?? 0,
        lot_size: full.lot_size ?? "", year_built: full.year_built ?? 0,
        agent: full.agent ?? "", tagline: full.tagline ?? "", description: full.description ?? "",
        features: full.features ?? [], amenities: full.amenities ?? [],
        image_urls: full.image_urls ?? [], image_gallery: full.image_gallery ?? [],
      });
    }
    setFullLoad(false);
  }

  function closeModal() {
    setModal({ open: false, mode: "add", data: null });
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const cityArr    = arrWrap(form.city);
      const countryArr = arrWrap(form.country);
      if (modal.mode === "edit" && modal.data) {
        const { data, error } = await supabase.from(tableFor()).update({ ...form, city: cityArr, country: countryArr }).eq("id", modal.data.id).select().single();
        if (error) { setSaveError(error.message); return; }
        if (data) setListings(p => p.map(l => l.id === modal.data!.id ? normRow({ ...l as unknown as Record<string, unknown>, ...data as Record<string, unknown> }) : l));
      } else {
        const { data, error } = await supabase.from(tableFor()).insert({ ...form, industry: industryId, listing_type: config.label, city: cityArr, country: countryArr })
          .select("id,created_at,client_name,industry,title,address,city,state,country,location,floors,actual_floor,property_type,status,price,full_price,sqft,beds,baths,lot_size,year_built,agent,image_urls")
          .single();
        if (error) { setSaveError(error.message); return; }
        if (data) setListings(p => [normRow(data as Record<string, unknown>), ...p]);
      }
      setSaveSuccess(true);
      setTimeout(closeModal, 800);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from(tableFor()).delete().eq("id", id);
    if (!error) setListings(p => p.filter(l => l.id !== id));
  }

  const _q = searchQuery.trim().toLowerCase();
  const baseListings = listings
    .filter(l => selectedClient === "__all__" || l.client_name === selectedClient);
  const filteredListings = !_q ? baseListings : baseListings.filter(l =>
    [l.title, l.address, l.city, l.state, l.country, l.location, l.property_type, l.client_name, l.agent, l.industry].some(
      v => v?.toLowerCase().includes(_q)
    )
  );

  const STATS = [
    { label: "Total",       value: listings.length },
    { label: "Available",   value: listings.filter(l => l.status === "Available").length },
    { label: "Locations",   value: new Set(listings.filter(l => l.location).map(l => l.location)).size },
    { label: "With Images", value: listings.filter(l => (l.image_urls?.length ?? 0) > 0).length },
  ];

  return (
    <div className="px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">{config.label}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{config.description}</p>
        </div>
        <button onClick={() => openModal("add")} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Add {config.singular}
        </button>
      </div>

      {/* Type nav */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {allTypeTabs.map(({ slug, label, custom }) => (
          <div
            key={slug}
            draggable={renamingSlug !== slug}
            onDragStart={() => setDraggedSlug(slug)}
            onDragEnd={() => { setDraggedSlug(null); setDragOverSlug(null); }}
            onDragOver={e => { e.preventDefault(); if (draggedSlug && draggedSlug !== slug) setDragOverSlug(slug); }}
            onDrop={e => { e.preventDefault(); if (draggedSlug && draggedSlug !== slug) dropTab(draggedSlug, slug); setDraggedSlug(null); setDragOverSlug(null); }}
            className={`relative flex items-center transition-all ${renamingSlug !== slug ? "cursor-grab active:cursor-grabbing" : ""} ${draggedSlug === slug ? "opacity-40 scale-95" : ""} ${dragOverSlug === slug && draggedSlug !== slug ? "ring-2 ring-[#00B5A3] ring-offset-1 rounded-full" : ""}`}
          >
            {renamingSlug === slug ? (
              <div className="flex items-center gap-1 border border-[#00B5A3] rounded-full px-2 py-0.5 bg-white dark:bg-dk-raised">
                <input
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={() => commitRename(slug, renameVal, custom ?? false)}
                  onKeyDown={e => {
                    if (e.key === "Enter") commitRename(slug, renameVal, custom ?? false);
                    if (e.key === "Escape") setRenamingSlug(null);
                  }}
                  className="text-[11px] font-semibold outline-none w-20 bg-transparent text-gray-700 dark:text-gray-200"
                />
                <button type="button" onMouseDown={() => commitRename(slug, renameVal, custom ?? false)} className="text-[#00B5A3]"><Check size={11}/></button>
              </div>
            ) : (
              <button
                onClick={() => router.push(`/dashboard/listings/${slug}`)}
                className={`px-3 py-1 pr-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200 flex items-center gap-1 ${
                  params.type === slug
                    ? "bg-[#00B5A3] text-white border-[#00B5A3]"
                    : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-[#00B5A3]/50 hover:text-[#00B5A3]"
                }`}
              >
                {label}
                <span className={`flex items-center gap-0.5 ml-0.5 ${params.type === slug ? "text-white/70" : "text-gray-300 dark:text-gray-600"}`}>
                  <button type="button" onClick={e => { e.stopPropagation(); setRenamingSlug(slug); setRenameVal(label); }} className="p-0.5 rounded hover:bg-white/20" title="Rename"><Pencil size={9}/></button>
                  {custom && <button type="button" onClick={e => { e.stopPropagation(); const updated = customTypes.filter(t => t.slug !== slug); setCustomTypes(updated); saveCustomListingTypes(updated); if (params.type === slug) router.push("/dashboard/listings/houses"); }} className="p-0.5 rounded hover:bg-white/20" title="Delete"><X size={9}/></button>}
                </span>
              </button>
            )}
          </div>
        ))}

        {addingType ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newTypeLabel}
              onChange={e => setNewTypeLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const label = toTitle(newTypeLabel);
                  if (!label) return;
                  const slug = toSlug(label);
                  if (allTypeTabs.some(t => t.slug === slug)) { setAddingType(false); setNewTypeLabel(""); return; }
                  const newType: CustomListingType = { slug, label, filterValue: label };
                  const updated = [...customTypes, newType];
                  setCustomTypes(updated);
                  saveCustomListingTypes(updated);
                  setAddingType(false); setNewTypeLabel("");
                  router.push(`/dashboard/listings/${slug}`);
                }
                if (e.key === "Escape") { setAddingType(false); setNewTypeLabel(""); }
              }}
              placeholder="Type name…"
              className="px-2.5 py-0.5 rounded-full text-[11px] border border-[#00B5A3] outline-none w-28 bg-white dark:bg-dk-raised text-gray-700 dark:text-gray-200"
            />
            <button onClick={() => { setAddingType(false); setNewTypeLabel(""); }} className="text-gray-400 hover:text-red-500"><X size={13}/></button>
          </div>
        ) : (
          <button
            onClick={() => setAddingType(true)}
            className="text-[11px] font-semibold px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-dk-stroke text-gray-400 dark:text-gray-500 hover:border-[#00B5A3]/50 hover:text-[#00B5A3] transition-all flex items-center gap-1"
          >
            <Plus size={11}/> Add type
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-4 sm:p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
            {loading ? <div className="h-8 w-12 bg-gray-100 rounded-lg animate-pulse mb-1.5" /> : <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5">{value}</p>}
            <p className="text-[12px] text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table / Grid */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">All {config.label}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
                {_q && <span className="ml-1 text-gray-400">· &ldquo;{searchQuery}&rdquo;</span>}
              </p>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view"><List size={13} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view"><LayoutGrid size={13} /></button>
            </div>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${config.label.toLowerCase()} by title, location, agent…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {viewMode === "list" ? (
          <div>
            {loading ? (
              <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
            ) : filteredListings.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4"><Home size={22} className="text-gray-200" /></div>
                <p className="text-[13px] font-semibold text-gray-400">{_q ? `No results for "${searchQuery}"` : `No ${config.label.toLowerCase()} yet`}</p>
                {!_q && <p className="text-[11.5px] text-gray-300 mt-1">Click &ldquo;Add {config.singular}&rdquo; to get started.</p>}
              </div>
            ) : Object.entries(
              filteredListings.reduce<Record<string, Listing[]>>((acc, l) => {
                const key = l.location || "Unknown";
                acc[key] = [...(acc[key] ?? []), l];
                return acc;
              }, {})
            ).map(([locationKey, locItems]) => {
              const locOpen = openLocations.has(locationKey);
              return (
              <div key={locationKey}>
                <button
                  onClick={() => toggleLocation(locationKey)}
                  className="w-full flex items-center gap-3 px-6 py-3 bg-gray-50/70 dark:bg-dk-raised/70 hover:bg-gray-100/70 dark:hover:bg-dk-raised transition-colors text-left"
                >
                  {locOpen
                    ? <ChevronDown size={13} className="text-gray-400 shrink-0" />
                    : <ChevronRight size={13} className="text-gray-400 shrink-0" />
                  }
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke flex items-center justify-center shadow-sm shrink-0"><MapPin size={12} className="text-[#00B5A3]" /></div>
                  <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 flex-1">{locationKey}</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400">{locItems.length} {locItems.length === 1 ? "listing" : "listings"}</span>
                </button>
                {locOpen && <div>
                  {locItems.map((item, i, arr) => (
                    <div key={item.id} onClick={() => openModal("view", item)} className={`group relative flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors duration-150 cursor-pointer ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-dk-stroke" : ""}`}>
                      <HoverCycleImage
                        imgs={item.image_urls ?? []}
                        className="w-28 h-20 sm:w-44 sm:h-28 lg:w-52 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 shrink-0"
                        fallback={<Building2 size={16} className="text-gray-300" />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">{item.title || item.address || "Untitled"}</p>
                          {item.property_type && (
                            <span className="px-2 py-0.5 bg-[#00B5A3]/15 text-[#00B5A3] rounded-md text-[9.5px] font-bold uppercase tracking-wide shrink-0">{item.property_type}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{[item.city, item.state, item.country].filter(Boolean).join(", ") || "—"}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 shrink-0">
                        {item.price && <div className="text-right"><p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{item.price}</p>{item.full_price && <p className="text-[10.5px] text-gray-400">{item.full_price}</p>}</div>}
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[item.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-52 bg-gray-50 rounded-3xl animate-pulse" />)}</div>
            ) : filteredListings.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4"><Home size={22} className="text-gray-200" /></div>
                <p className="text-[13px] font-semibold text-gray-400">{_q ? `No results for "${searchQuery}"` : `No ${config.label.toLowerCase()} yet`}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  filteredListings.reduce<Record<string, Listing[]>>((acc, l) => {
                    const key = l.location || "Unknown";
                    acc[key] = [...(acc[key] ?? []), l];
                    return acc;
                  }, {})
                ).map(([locationKey, locItems]) => {
                  return (
                    <div key={locationKey}>
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin size={13} className="text-[#00B5A3] shrink-0" />
                        <span className="text-[13.5px] font-bold text-gray-800 dark:text-gray-200">{locationKey}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-semibold">
                          {locItems.length} {locItems.length === 1 ? "listing" : "listings"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-2">
                        {locItems.map(item => (
                          <ListingTypeGridCard
                            key={item.id}
                            item={item}
                            onView={() => openModal("view", item)}
                            onEdit={() => openModal("edit", item)}
                            onDelete={() => setConfirmDelete(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
      <Modal isOpen={modal.open} onClose={closeModal} size={modal.mode === "view" ? "lg" : "xl"}
        title={modal.mode === "view" ? (modal.data?.title || modal.data?.address || config.singular) : modal.mode === "edit" ? `Edit ${config.singular}` : `Add ${config.singular}`}>
        {fullLoad ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-[#00B5A3] animate-spin" /></div>
        ) : modal.mode === "view" && modal.data ? (
          <div className="space-y-4 overflow-y-auto max-h-[68vh]">
            {[...(modal.data.image_urls ?? []), ...(modal.data.image_gallery ?? [])].length > 0 && (
              <ImageSlider images={[...(modal.data.image_urls ?? []), ...(modal.data.image_gallery ?? [])]} />
            )}
            {modal.data.tagline && <p className="text-[12.5px] italic text-[#00B5A3]">{modal.data.tagline}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><p className={FIELD}>Address</p><p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">{modal.data.address || "—"}</p></div>
              <div><p className={FIELD}>City / State</p><p className="text-[12.5px] text-gray-700 dark:text-gray-300">{[modal.data.city, modal.data.state].filter(Boolean).join(", ") || "—"}</p></div>
              <div><p className={FIELD}>Country</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{modal.data.country || "—"}</p></div>
              <div><p className={FIELD}>Location</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{modal.data.location || "—"}</p></div>
              <div><p className={FIELD}>Type</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{modal.data.property_type || "—"}</p></div>
              <div><p className={FIELD}>Status</p><span className={`inline-block text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[modal.data.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{modal.data.status}</span></div>
              <div><p className={FIELD}>Price</p><p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{modal.data.price || "—"}</p></div>
              <div><p className={FIELD}>Agent</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{modal.data.agent || "—"}</p></div>
            </div>
            {modal.data.description && <div><p className={FIELD}>Description</p><div className="rich-content text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: modal.data.description }} /></div>}
            {modal.data.features?.length > 0 && <div><p className={FIELD}>Features</p><div className="flex flex-wrap gap-1.5">{modal.data.features.map(f => <span key={f} className="px-2.5 py-1 bg-[#00B5A3]/8 text-[#00B5A3] rounded-lg text-[10.5px] font-semibold border border-[#00B5A3]/15">{f}</span>)}</div></div>}
            {modal.data.amenities?.length > 0 && <div><p className={FIELD}>Amenities</p><div className="flex flex-wrap gap-1.5">{modal.data.amenities.map(a => <span key={a} className="px-2.5 py-1 bg-gray-100 dark:bg-dk-raised text-gray-600 dark:text-gray-400 rounded-lg text-[10.5px] font-semibold">{a}</span>)}</div></div>}
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col">
            <div className="flex gap-0 border-b border-gray-100 mb-5 -mx-1">
              {FORM_TABS.map(tab => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-semibold px-4 py-2.5 border-b-2 transition-all ${activeTab === tab ? "border-[#00B5A3] text-[#00B5A3]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                  {TAB_LABEL[tab]}
                </button>
              ))}
            </div>

            {activeTab === "basic" && (
              <div className="space-y-3">
                <div>
                  <label className={FIELD}>Client <span className="text-gray-400 font-normal">(Company name)</span></label>
                  <ComboInput className={INPUT} placeholder="e.g. Prestige Realty" value={form.client_name} options={clientNames} onChange={handleClientChange} />
                </div>
                <div><label className={FIELD}>Listing Title</label><input className={INPUT} placeholder="e.g. Modern 3-Bed with Garden" value={form.title} onChange={e => setF("title", e.target.value)} /></div>
                <div><label className={FIELD}>Street Address <span className="text-red-400">*</span></label><input required className={INPUT} placeholder="e.g. 14 Oak Lane" value={form.address} onChange={e => setF("address", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={FIELD}>City</label><ComboInput className={INPUT} placeholder="e.g. Colombo" value={form.city} options={dl.city} onChange={v => autoFillGeo("city", v)} /></div>
                  <div><label className={FIELD}>State / Region</label><ComboInput className={INPUT} placeholder="e.g. Western" value={form.state} options={dl.state} onChange={v => autoFillGeo("state", v)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={FIELD}>Country</label><ComboInput className={INPUT} placeholder="e.g. Sri Lanka" value={form.country} options={dl.country} onChange={v => autoFillGeo("country", v)} /></div>
                  <div><label className={FIELD}>Location</label><ComboInput className={INPUT} placeholder="e.g. Sea Side, City Centre" value={form.location} options={dl.location} onChange={v => autoFillGeo("location", v)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Property Type</label>
                    <ComboInput className={INPUT} placeholder="e.g. House" value={form.property_type} options={[...new Set([...PROPERTY_TYPES, ...dl.property_type])]} onChange={v => setF("property_type", v)} />
                  </div>
                  <div><label className={FIELD}>Status</label>
                    <select className={SELECT} value={form.status} onChange={e => setF("status", e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={FIELD}>Price</label><input className={INPUT} placeholder="e.g. 48 Million" value={form.price} onChange={e => setF("price", e.target.value)} /></div>
                  <div><label className={FIELD}>Full Price</label><input className={INPUT} placeholder="e.g. 500 Lakhs" value={form.full_price} onChange={e => setF("full_price", e.target.value)} /></div>
                </div>
                <div><label className={FIELD}>Agent</label><ComboInput className={INPUT} placeholder="e.g. Sarah Nguyen" value={form.agent} options={dl.agent} onChange={v => setF("agent", v)} /></div>
                <div><label className={FIELD}>Tagline</label><input className={INPUT} placeholder="e.g. Stunning views with private pool" value={form.tagline} onChange={e => setF("tagline", e.target.value)} /></div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={FIELD}>Floors</label><input className={INPUT} placeholder="e.g. Ground floor, Upper floor" value={form.floors} onChange={e => setF("floors", e.target.value)} /></div>
                  <div><label className={FIELD}>Actual Floor</label><input className={INPUT} placeholder="e.g. 6th floor, Span Tower" value={form.actual_floor} onChange={e => setF("actual_floor", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={FIELD}>Square Footage</label><input type="number" min="0" className={INPUT} placeholder="e.g. 2400" value={form.sqft || ""} onChange={e => setF("sqft", Number(e.target.value))} /></div>
                  <div><label className={FIELD}>Year Built</label><input type="number" min="1800" max="2030" className={INPUT} placeholder="e.g. 2018" value={form.year_built || ""} onChange={e => setF("year_built", Number(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={FIELD}>Bedrooms</label><input type="number" min="0" className={INPUT} value={form.beds || ""} onChange={e => setF("beds", Number(e.target.value))} /></div>
                  <div><label className={FIELD}>Bathrooms</label><input type="number" min="0" className={INPUT} value={form.baths || ""} onChange={e => setF("baths", Number(e.target.value))} /></div>
                  <div><label className={FIELD}>Lot Size</label><input className={INPUT} placeholder="e.g. 0.25 acres" value={form.lot_size} onChange={e => setF("lot_size", e.target.value)} /></div>
                </div>
                <div><label className={FIELD}>Description</label><RichTextEditor placeholder="Full listing description…" value={form.description} onChange={html => setF("description", html)} /></div>
                <div><label className={FIELD}>Features <span className="text-gray-400 font-normal">(comma-separated)</span></label><input className={INPUT} placeholder="e.g. Pool, Parking, Garden, Sea View" value={form.features.join(", ")} onChange={e => setF("features", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></div>
                <div><label className={FIELD}>Amenities <span className="text-gray-400 font-normal">(comma-separated)</span></label><input className={INPUT} placeholder="e.g. Gym, Concierge, Rooftop" value={form.amenities.join(", ")} onChange={e => setF("amenities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></div>
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-5">
                <ImageUploadField label="Hero Images" images={form.image_urls} onChange={imgs => setF("image_urls", imgs)} />
                <p className="text-[11px] text-gray-400 -mt-3">First image is used as the main listing photo.</p>
                <ImageUploadField label="Gallery Images" images={form.image_gallery} onChange={imgs => setF("image_gallery", imgs)} />
                <p className="text-[11px] text-gray-400 -mt-3">Additional interior and exterior photos shown in the gallery.</p>
              </div>
            )}

            {saveError && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600 font-medium flex items-start gap-2">
                <span className="mt-px shrink-0">✕</span><span>{saveError}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="mt-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-700 font-medium">
                ✓ Listing saved successfully
              </div>
            )}

            <div className="flex justify-between items-center gap-2 pt-5 border-t border-gray-100 mt-5">
              <div className="flex gap-1">{FORM_TABS.map(tab => <div key={tab} className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === tab ? "bg-[#00B5A3]" : "bg-gray-200"}`} />)}</div>
              <div className="flex gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                <button
                  type={activeTab === "images" ? "submit" : "button"}
                  disabled={saving}
                  onClick={activeTab !== "images" ? () => {
                    const idx = FORM_TABS.indexOf(activeTab);
                    setActiveTab(FORM_TABS[idx + 1]);
                  } : undefined}
                  className="btn-primary-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {activeTab === "images"
                    ? (modal.mode === "edit" ? "Save Changes" : `Add ${config.singular}`)
                    : "Next →"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete listing?"
        message="This will permanently remove the listing and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelete !== null) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
