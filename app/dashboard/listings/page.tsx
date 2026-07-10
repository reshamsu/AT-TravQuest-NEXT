"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ComboInput from "@/components/ui/ComboInput";
import ImageSlider from "@/components/ui/ImageSlider";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Home, Plus, Eye, Pencil, Trash2,
  Upload, X, Loader2,
  LayoutGrid, List, Building2, Search,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { supabase } from "@/lib/supabase";
import { apiInsert, apiUpdate, apiDelete } from "@/lib/dashboard-api";
import { uploadImage as uploadToR2 } from "@/lib/upload";
import { useIndustry } from "@/app/dashboard/IndustryContext";

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT    = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT   = `${INPUT} cursor-pointer`;

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
  listing_type: string;
  category: string[];
  status: string;
  price: string;
  full_price: string;
  agent: string;
  tagline: string;
  description: string;
  features: string[];
  amenities: string[];
  image_urls: string[];
  image_gallery: string[];
}

type ListingForm = Omit<Listing, "id" | "created_at">;

const INDUSTRIES = [
  "Real Estate", "Hospitality", "Tourism & Travel", "Trade & Wholesale",
  "Retail", "Manufacturing", "Healthcare", "Technology", "Agriculture",
  "Construction", "Finance", "Education", "Transport & Logistics",
  "Food & Beverage", "Energy",
];

// This project is travel only — every listing lives in ac_listings_travel.
function tableFor(): string {
  return "ac_listings_travel";
}

const EMPTY_FORM: ListingForm = {
  client_name: "",
  industry: "",
  title: "",
  address: "",
  city: "",
  state: "",
  country: "",
  location: "",
  listing_type: "",
  category: [],
  status: "Active",
  price: "",
  full_price: "",
  agent: "",
  tagline: "",
  description: "",
  features: [],
  amenities: [],
  image_urls: [],
  image_gallery: [],
};

// Matches the Listings submenu categories in constants/SideLinks.ts.
const LISTING_TYPES = ["Hotels", "Tours", "Packages", "Visas", "Transfers", "Promotions", "Meetings", "Apartments", "Shop"];
const STATUSES      = ["Active", "Draft", "Sold Out", "Pending", "Closed", "Hidden"];

const STATUS_STYLES: Record<string, string> = {
  "Active":   "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  "Draft":    "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/30",
  "Sold Out": "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30",
  "Pending":  "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
  "Closed":   "bg-gray-50 dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke",
  "Hidden":   "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/30",
};

const FORM_TABS = ["basic", "details", "images"] as const;
type FormTab = typeof FORM_TABS[number];
const TAB_LABEL: Record<FormTab, string> = { basic: "Basic Info", details: "Details", images: "Images" };

// ac_listings_travel stores city/country as TEXT[] — normalize to string for this dashboard
function strOf(v: unknown): string {
  return Array.isArray(v) ? (v[0] ?? '') : ((v ?? '') as string);
}
function arrOf(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function normRow(r: Record<string, unknown>): Listing {
  return { ...r, city: strOf(r.city), country: strOf(r.country), category: arrOf(r.category) } as unknown as Listing;
}
function arrWrap(s: string): string[] { return s ? [s] : []; }

// ─── Image upload ─────────────────────────────────────────────────────────────

function uploadImage(file: File): Promise<string> {
  return uploadToR2(file, "listings");
}

function ImageUploadField({
  label, images, onChange,
}: { label: string; images: string[]; onChange: (imgs: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try { onChange([...images, ...(await Promise.all(files.map(uploadImage)))]); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed — check console"); }
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
        {uploading
          ? <Loader2 size={16} className="text-[#00B5A3] animate-spin mb-1" />
          : <Upload size={15} className={error ? "text-red-400 mb-1" : "text-gray-300 mb-1"} />
        }
        <span className={`text-[11px] ${error ? "text-red-500" : "text-gray-400"}`}>
          {uploading ? "Uploading & converting…" : error ?? "Click to upload"}
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

// ─── View sub-component ───────────────────────────────────────────────────────

function ViewListing({ listing }: { listing: Listing }) {
  return (
    <div className="space-y-5 overflow-y-auto max-h-[68vh] pr-1">

      {/* Image slider */}
      {[...(listing.image_urls ?? []), ...(listing.image_gallery ?? [])].length > 0 && (
        <ImageSlider images={[...(listing.image_urls ?? []), ...(listing.image_gallery ?? [])]} />
      )}

      {/* Basic */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Listing Info</p>
        {listing.tagline && (
          <p className="text-[12.5px] italic text-[#00B5A3] mb-3">{listing.tagline}</p>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className={FIELD}>Address</p><p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">{listing.address || "—"}</p></div>
          <div><p className={FIELD}>City</p><p className="text-[12.5px] text-gray-700 dark:text-gray-300">{[listing.city, listing.state].filter(Boolean).join(", ") || "—"}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className={FIELD}>Country</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{listing.country || "—"}</p></div>
          <div><p className={FIELD}>Location</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{listing.location || "—"}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className={FIELD}>Type</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{listing.listing_type || "—"}</p></div>
          <div>
            <p className={FIELD}>Status</p>
            <span className={`inline-block text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[listing.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {listing.status}
            </span>
          </div>
        </div>
        {listing.category?.length > 0 && (
          <div className="mb-3">
            <p className={FIELD}>Category tags</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.category.map(c => (
                <span key={c} className="px-2.5 py-1 bg-[#f2836f]/8 text-[#f2836f] rounded-lg text-[10.5px] font-semibold border border-[#f2836f]/15">{c}</span>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><p className={FIELD}>Price</p><p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{listing.price || "—"}</p></div>
          <div><p className={FIELD}>Full Price</p><p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{listing.full_price || "—"}</p></div>
        </div>
      </div>

      {/* Details */}
      {(listing.agent || listing.description) && (
        <>
          <hr className="border-gray-100" />
          <div>
            <p className="text-[10px] font-bold text-[#00B5A3] uppercase tracking-widest mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              {listing.agent       && <div><p className={FIELD}>Agent</p><p className="text-[12px] text-gray-600">{listing.agent}</p></div>}
            </div>
            {listing.description && (
              <div className="mt-3">
                <p className={FIELD}>Description</p>
                <div className="rich-content text-[12px] text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: listing.description }} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Features & amenities */}
      {((listing.features?.length ?? 0) > 0 || (listing.amenities?.length ?? 0) > 0) && (
        <>
          <hr className="border-gray-100" />
          <div className="grid grid-cols-2 gap-4">
            {listing.features?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.features.map(f => (
                    <span key={f} className="px-2.5 py-1 bg-[#00B5A3]/8 text-[#00B5A3] rounded-lg text-[10.5px] font-semibold border border-[#00B5A3]/15">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {listing.amenities?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.amenities.map(a => (
                    <span key={a} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10.5px] font-semibold">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}

// ─── List item — flat row, matches the Destinations list pattern exactly ─────

function ListingListItem({ item, onOpen, onEdit, onDelete }: {
  item: Listing;
  onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const img = item.image_urls?.[0];

  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 cursor-pointer"
    >
      <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-dk-raised shrink-0">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Building2 size={14} className="text-gray-300 dark:text-gray-600" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
            {item.title || item.location || "Untitled"}
          </p>
          {item.listing_type && (
            <span className="px-2 py-0.5 bg-[#00B5A3]/15 text-[#00B5A3] rounded-md text-[9.5px] font-bold uppercase tracking-wide shrink-0">
              {item.listing_type}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate">
          {[item.city, item.country].filter(Boolean).join(", ") || "—"}
        </p>
      </div>

      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[item.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
        {item.status}
      </span>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit}   className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#00B5A3] transition-all" title="Edit"><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ─── Grid card with hover image cycling ──────────────────────────────────────

function waShareUrl(item: Listing): string {
  const lines: string[] = [];
  if (item.client_name) lines.push(`🏢 *${item.client_name}*`);
  lines.push(`🧳 *${item.title || item.address || "Travel Listing"}*`);
  if (item.listing_type) lines.push(`Type: ${item.listing_type}`);
  if (item.category?.length) lines.push(`Tags: ${item.category.join(", ")}`);
  const loc = [item.city, item.state, item.country].filter(Boolean).join(", ");
  if (loc) lines.push(`📍 ${loc}`);
  if (item.price) lines.push(`💰 ${item.price}${item.full_price ? ` (${item.full_price})` : ""}`);
  if (item.status) lines.push(`Status: ${item.status}`);
  if (item.agent)  lines.push(`👤 Agent: ${item.agent}`);
  lines.push(`\n🌐 ${process.env.NEXT_PUBLIC_APP_NAME || "TravQuest"}\n${process.env.NEXT_PUBLIC_APP_URL || ""}`);
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}

function ListingsGridCard({ item, onView, onEdit, onDelete }: {
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
      <div className="absolute inset-0 bg-linear-to-b from-black/25 via-transparent to-transparent" />
      {item.listing_type && (
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-[#00B5A3]/90 backdrop-blur-sm text-white rounded-full text-[10px] font-bold tracking-wide shadow-sm">{item.listing_type}</span>
        </div>
      )}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onView} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }} title="View"><Eye size={14} /></button>
        <button onClick={onEdit} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }} title="Edit"><Pencil size={14} /></button>
        <button onClick={onDelete} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-red-500 transition-all" style={{ borderRadius: "10px" }} title="Delete"><Trash2 size={14} /></button>
        <a href={waShareUrl(item)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Share on WhatsApp" className="p-1.5 bg-white shadow-md text-green-600 hover:text-green-700 transition-all flex items-center" style={{ borderRadius: "10px" }}><FaWhatsapp size={14} /></a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[15px] font-bold text-white leading-tight tracking-tight truncate">{item.title || item.location || "Untitled"}</p>
        {item.price && <p className="text-[13px] font-bold text-[#f5c88a] mt-0.5">{item.price}{item.full_price && <span className="text-[10.5px] font-normal text-white/60 ml-1.5">{item.full_price}</span>}</p>}
        {(item.city || item.country) && <p className="text-[10px] text-white/60 mt-0.5">{[item.city, item.country].filter(Boolean).join(", ")}</p>}
        {item.status && <span className={`inline-block mt-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[item.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{item.status}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ListingsPageContent() {
  const { industryId } = useIndustry();
  const searchParams = useSearchParams();
  const [listings, setListings]     = useState<Listing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState<"list" | "grid">("list");
  const [selectedClient, setSelectedClient] = useState<string>("__all__");
  const [typeFilter,     setTypeFilter]     = useState<string>("All");
  const [search,         setSearch]         = useState("");

  // Deep-link from the sidebar's Listings submenu, e.g. /dashboard/listings?type=Hotels
  useEffect(() => {
    const t = searchParams.get("type");
    if (t && LISTING_TYPES.includes(t)) setTypeFilter(t);
  }, [searchParams]);

  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: Listing | null }>({
    open: false, mode: "add", data: null,
  });
  const [form, setForm]           = useState<ListingForm>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);

  const setF = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  // ── Fetch list ────────────────────────────────────────────────────────────

  const fetchListings = useCallback(async () => {
    const COLS = "id,created_at,client_name,industry,title,address,city,state,country,location,listing_type,category,status,price,full_price,agent,image_urls";
    const { data, error } = await supabase.from(tableFor()).select(COLS).eq("industry", industryId).order("created_at", { ascending: false });
    if (!error) setListings((data ?? []).map(r => normRow(r as Record<string, unknown>)));
  }, [industryId]);

  useEffect(() => {
    setLoading(true);
    fetchListings().finally(() => setLoading(false));
  }, [fetchListings]);

  // ── Open modal ────────────────────────────────────────────────────────────

  async function openModal(mode: "add" | "edit" | "view", item?: Listing) {
    setActiveTab("basic");

    if (mode === "add") {
      setForm(EMPTY_FORM);
      setModal({ open: true, mode, data: null });
      return;
    }

    if (!item) return;
    setModal({ open: true, mode, data: item });
    setFullLoading(true);

    const { data: full } = await supabase
      .from(tableFor())
      .select("*")
      .eq("id", item.id)
      .single();

    if (full) {
      setModal({ open: true, mode, data: normRow(full as Record<string, unknown>) });
      if (mode === "edit") {
        setForm({
          client_name:   full.client_name   ?? "",
          industry:      full.industry      ?? "",
          title:         full.title         ?? "",
          address:       full.address       ?? "",
          city:          strOf(full.city),
          state:         full.state         ?? "",
          country:       strOf(full.country),
          location:      full.location      ?? "",
          listing_type:  full.listing_type  ?? "",
          category:      arrOf(full.category),
          status:        full.status        ?? "Active",
          price:         full.price         ?? "",
          full_price:    full.full_price    ?? "",
          agent:         full.agent         ?? "",
          tagline:       full.tagline       ?? "",
          description:   full.description   ?? "",
          features:      full.features      ?? [],
          amenities:     full.amenities     ?? [],
          image_urls:    full.image_urls    ?? [],
          image_gallery: full.image_gallery ?? [],
        });
      }
    }
    setFullLoading(false);
  }

  function closeModal() {
    setModal({ open: false, mode: "add", data: null });
    setSaveError(null);
    setSaveSuccess(false);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const cityArr    = arrWrap(form.city);
      const countryArr = arrWrap(form.country);
      if (modal.mode === "edit" && modal.data) {
        const { data, error } = await apiUpdate<Record<string, unknown>>(
          tableFor(), modal.data.id, { ...form, city: cityArr, country: countryArr },
        );
        if (error) { setSaveError(error); return; }
        if (data) setListings(p => p.map(l => l.id === modal.data!.id ? normRow({ ...l as unknown as Record<string, unknown>, ...data }) : l));
      } else {
        const { data, error } = await apiInsert<Record<string, unknown>>(
          tableFor(), { ...form, industry: industryId, city: cityArr, country: countryArr },
        );
        if (error) { setSaveError(error); return; }
        if (data) setListings(p => [normRow(data), ...p]);
      }
      setSaveSuccess(true);
      setTimeout(closeModal, 800);
    } finally { setSaving(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    const { error } = await apiDelete(tableFor(), id);
    if (!error) setListings(p => p.filter(l => l.id !== id));
  }

  // ── Filters & stats ───────────────────────────────────────────────────────

  const clientNames = [...new Set(listings.map(l => l.client_name).filter(Boolean))].sort();

  // Unique values for datalist autofill in the add/edit form
  const uniq = (fn: (l: Listing) => string) =>
    [...new Set(listings.map(fn).filter(Boolean))].sort();
  const dl = {
    client_name:  uniq(l => l.client_name),
    industry:     uniq(l => l.industry),
    city:         uniq(l => l.city),
    state:        uniq(l => l.state),
    country:      uniq(l => l.country),
    location:     uniq(l => l.location),
    agent:        uniq(l => l.agent),
    category:     [...new Set(listings.flatMap(l => l.category ?? []))].sort(),
  };

  // Deduplicated geo combos for cross-field autofill
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

  // client_name → auto-fill agent (and location/city/state/country if blank)
  const clientMap = Object.fromEntries(
    listings
      .filter(l => l.client_name)
      .map(l => [l.client_name, { agent: l.agent, city: l.city, state: l.state, country: l.country, location: l.location, industry: l.industry }])
  ) as Record<string, { agent: string; city: string; state: string; country: string; location: string; industry: string }>;

  // clients filtered by whichever industry is selected in the form
  const clientOptionsForForm = form.industry
    ? [...new Set(listings.filter(l => l.industry === form.industry && l.client_name).map(l => l.client_name))].sort()
    : dl.client_name;

  function handleIndustryChange(val: string) {
    setForm(p => {
      const clientStillValid = !val || !p.client_name ||
        listings.some(l => l.industry === val && l.client_name === p.client_name);
      return { ...p, industry: val, client_name: clientStillValid ? p.client_name : "" };
    });
  }

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

  const byClient = selectedClient === "__all__"
    ? listings
    : listings.filter(l => l.client_name === selectedClient);

  const byType = typeFilter === "All"
    ? byClient
    : byClient.filter(l => l.listing_type === typeFilter);

  const visible = byType.filter(l => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.country?.toLowerCase().includes(q) ||
      l.category?.some(c => c.toLowerCase().includes(q))
    );
  });

  const STATS = [
    { label: "Total",       value: visible.length },
    { label: "Active",      value: visible.filter(l => l.status === "Active").length },
    { label: "Locations",   value: new Set(visible.filter(l => l.location).map(l => l.location)).size },
    { label: "With Images", value: visible.filter(l => (l.image_urls?.length ?? 0) > 0).length },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Listings</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Manage listings — details, descriptions, and photos.
          </p>
        </div>
        <button onClick={() => openModal("add")} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Add Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-4 sm:p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
            {loading
              ? <div className="h-8 w-12 bg-gray-100 rounded-lg animate-pulse mb-1.5" />
              : <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5">{value}</p>
            }
            <p className="text-[12px] text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Type filter — fixed set matching the sidebar's Listings submenu */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", ...LISTING_TYPES].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition-all duration-200 ${
              typeFilter === t
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {t === "All" ? "All types" : t}
          </button>
        ))}
      </div>

      {/* Client filter */}
      {clientNames.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">Client</label>
          <select className={`${SELECT} max-w-xs`} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
            <option value="__all__">All clients</option>
            {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Table / Grid card */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
              {typeFilter === "All" ? "All Listings" : typeFilter}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {visible.length} listing{visible.length !== 1 ? "s" : ""}
              {selectedClient !== "__all__" && <span className="ml-1 text-[#00B5A3]">· {selectedClient}</span>}
            </p>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view"><List size={13} /></button>
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view"><LayoutGrid size={13} /></button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, location, category…"
              className="w-full pl-8 pr-8 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {viewMode === "list" ? (
          /* ── List view — flat, matches the Destinations list pattern ── */
          <div>
            {loading ? (
              <div className="p-6 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-4">
                  <Home size={22} className="text-gray-200 dark:text-gray-600" />
                </div>
                <p className="text-[13px] font-semibold text-gray-400">
                  {search ? "No matches found" : selectedClient !== "__all__" ? `No listings for ${selectedClient}` : "No listings yet"}
                </p>
                <p className="text-[11.5px] text-gray-300 mt-1">{search ? "Try a different search term." : 'Click "Add Listing" to get started.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {visible.map(item => (
                  <ListingListItem
                    key={item.id}
                    item={item}
                    onOpen={() => openModal("view", item)}
                    onEdit={() => openModal("edit", item)}
                    onDelete={() => setConfirmDelete(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Grid view ── */
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 bg-gray-50 rounded-3xl animate-pulse" />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-4">
                  <Home size={22} className="text-gray-200 dark:text-gray-600" />
                </div>
                <p className="text-[13px] font-semibold text-gray-400">
                  {search ? "No matches found" : selectedClient !== "__all__" ? `No listings for ${selectedClient}` : "No listings yet"}
                </p>
                <p className="text-[11.5px] text-gray-300 mt-1">{search ? "Try a different search term." : 'Click "Add Listing" to get started.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visible.map(item => (
                  <ListingsGridCard
                    key={item.id}
                    item={item}
                    onView={() => openModal("view", item)}
                    onEdit={() => openModal("edit", item)}
                    onDelete={() => setConfirmDelete(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ╔═ MODAL ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        size={modal.mode === "view" ? "lg" : "xl"}
        title={
          modal.mode === "view"
            ? modal.data?.title || modal.data?.location || "Listing"
            : modal.mode === "edit" ? "Edit Listing" : "Add Listing"
        }
      >
        {fullLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="text-[#00B5A3] animate-spin" />
          </div>
        ) : modal.mode === "view" && modal.data ? (
          <ViewListing listing={modal.data} />
        ) : (
          <form onSubmit={handleSave} className="flex flex-col">

            {/* Tab bar */}
            <div className="flex gap-0 border-b border-gray-100 mb-5 -mx-1">
              {FORM_TABS.map(tab => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-semibold px-4 py-2.5 border-b-2 transition-all ${
                    activeTab === tab
                      ? "border-[#00B5A3] text-[#00B5A3]"
                      : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}>
                  {TAB_LABEL[tab]}
                </button>
              ))}
            </div>

            {/* ── Basic Info ── */}
            {activeTab === "basic" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Industry</label>
                    <ComboInput className={INPUT} placeholder="e.g. Real Estate"
                      value={form.industry}
                      options={[...new Set([...INDUSTRIES, ...dl.industry])]}
                      onChange={handleIndustryChange} />
                  </div>
                  <div>
                    <label className={FIELD}>Client <span className="text-gray-400 font-normal">(Company name)</span></label>
                    <ComboInput className={INPUT} placeholder="e.g. Emirates Holidays"
                      value={form.client_name} options={clientOptionsForForm} onChange={handleClientChange} />
                  </div>
                </div>
                <div>
                  <label className={FIELD}>Listing Title <span className="text-gray-400 font-normal">(optional display name)</span></label>
                  <input className={INPUT} placeholder="e.g. 5-Night Maldives Overwater Escape"
                    value={form.title} onChange={e => setF("title", e.target.value)} />
                </div>
                <div>
                  <label className={FIELD}>Address <span className="text-red-400">*</span></label>
                  <input required className={INPUT} placeholder="e.g. Palm Jumeirah, Dubai"
                    value={form.address} onChange={e => setF("address", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>City</label>
                    <ComboInput className={INPUT} placeholder="e.g. Dubai"
                      value={form.city} options={dl.city} onChange={v => autoFillGeo("city", v)} />
                  </div>
                  <div>
                    <label className={FIELD}>State / Region</label>
                    <ComboInput className={INPUT} placeholder="e.g. Dubai"
                      value={form.state} options={dl.state} onChange={v => autoFillGeo("state", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Country</label>
                    <ComboInput className={INPUT} placeholder="e.g. United Arab Emirates"
                      value={form.country} options={dl.country} onChange={v => autoFillGeo("country", v)} />
                  </div>
                  <div>
                    <label className={FIELD}>Location</label>
                    <ComboInput className={INPUT} placeholder="e.g. Downtown, Beachfront"
                      value={form.location} options={dl.location} onChange={v => autoFillGeo("location", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Type</label>
                    <select className={SELECT} value={form.listing_type} onChange={e => setF("listing_type", e.target.value)}>
                      <option value="">Select type</option>
                      {LISTING_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={FIELD}>Status</label>
                    <select className={SELECT} value={form.status} onChange={e => setF("status", e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={FIELD}>Category tags <span className="text-gray-400 font-normal">(comma-separated, e.g. Luxury, Beachfront)</span></label>
                  <input className={INPUT} placeholder="e.g. Luxury, Beachfront, Family Hotel"
                    value={form.category.join(", ")}
                    onChange={e => setF("category", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    list="category-suggestions" />
                  <datalist id="category-suggestions">
                    {dl.category.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Price</label>
                    <input className={INPUT} placeholder="e.g. AED 2,499"
                      value={form.price} onChange={e => setF("price", e.target.value)} />
                  </div>
                  <div>
                    <label className={FIELD}>Full Price</label>
                    <input className={INPUT} placeholder="e.g. From AED 2,499 per person"
                      value={form.full_price} onChange={e => setF("full_price", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={FIELD}>Agent</label>
                  <ComboInput className={INPUT} placeholder="e.g. Sarah Nguyen"
                    value={form.agent} options={dl.agent} onChange={v => setF("agent", v)} />
                </div>
                <div>
                  <label className={FIELD}>Tagline</label>
                  <input className={INPUT} placeholder="e.g. Stunning overwater villa with private beach access"
                    value={form.tagline} onChange={e => setF("tagline", e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Details ── */}
            {activeTab === "details" && (
              <div className="space-y-3">
                <div>
                  <label className={FIELD}>Description</label>
                  <RichTextEditor placeholder="Full listing description…" value={form.description} onChange={html => setF("description", html)} />
                </div>
                <div>
                  <label className={FIELD}>Features <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input className={INPUT} placeholder="e.g. Pool, Parking, Garden, Sea View"
                    value={form.features.join(", ")}
                    onChange={e => setF("features", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                </div>
                <div>
                  <label className={FIELD}>Amenities <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input className={INPUT} placeholder="e.g. Gym, Concierge, Rooftop"
                    value={form.amenities.join(", ")}
                    onChange={e => setF("amenities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                </div>
              </div>
            )}

            {/* ── Images ── */}
            {activeTab === "images" && (
              <div className="space-y-5">
                <ImageUploadField
                  label="Hero Images"
                  images={form.image_urls}
                  onChange={imgs => setF("image_urls", imgs)}
                />
                <p className="text-[11px] text-gray-400 -mt-3">
                  First image is used as the main listing photo.
                </p>
                <ImageUploadField
                  label="Gallery Images"
                  images={form.image_gallery}
                  onChange={imgs => setF("image_gallery", imgs)}
                />
                <p className="text-[11px] text-gray-400 -mt-3">
                  Additional interior and exterior photos shown in the listing gallery.
                </p>
              </div>
            )}

            {/* Save feedback */}
            {saveError && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600 font-medium flex items-start gap-2">
                <span className="mt-px shrink-0">✕</span>
                <span>{saveError}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="mt-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-700 font-medium">
                ✓ Listing saved successfully
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center gap-2 pt-5 border-t border-gray-100 mt-5">
              <div className="flex gap-1">
                {FORM_TABS.map(tab => (
                  <div key={tab} className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === tab ? "bg-[#00B5A3]" : "bg-gray-200"}`}
                    title={TAB_LABEL[tab]} />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                  Cancel
                </button>
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
                    ? (modal.mode === "edit" ? "Save Changes" : "Add Listing")
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

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsPageContent />
    </Suspense>
  );
}
