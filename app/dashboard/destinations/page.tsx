"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Map, Plus, Eye, Pencil, Trash2, Upload, X, Loader2, LayoutGrid, List, Search,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ComboInput from "@/components/ui/ComboInput";
import { useCompany } from "../CompanyContext";
import { supabase } from "@/lib/supabase";
import { apiInsert, apiUpdate, apiDelete } from "@/lib/dashboard-api";
import { uploadImage as uploadToR2 } from "@/lib/upload";

// ─── Styles — matches app/dashboard/pages/page.tsx exactly ───────────────────

const FIELD = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT = `${INPUT} cursor-pointer`;
const TEXTAREA = `${INPUT} resize-none`;

const CONTINENTS = ["Africa", "Asia", "Europe", "Middle East", "North America", "Oceania", "South America"];
const STATUSES = ["Available", "Hidden"];
const STATUS_STYLES: Record<string, string> = {
  Available: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  Hidden: "bg-gray-50 dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke",
};

// Each of these gets a Title / Subtitle / Body group in the "Content Sections" tab.
const SECTION_FIELDS = [
  { key: "overview",   label: "Overview" },
  { key: "population",  label: "Population" },
  { key: "economy",     label: "Economy" },
  { key: "currency",    label: "Currency" },
  { key: "weather",     label: "Weather" },
  { key: "food",        label: "Food" },
  { key: "place",       label: "Places to Visit" },
  { key: "whattowear",  label: "What to Wear" },
  { key: "flights",     label: "Flights" },
  { key: "health",      label: "Health" },
  { key: "visa",        label: "Visa" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Destination {
  id: string;
  created_at: string;
  country: string;
  city: string;
  continent: string[];
  category: string[];
  tagline: string;
  description: string;
  client_name: string;
  status: string;
  image_urls: string[];
  image_collages: string[];
  [key: `${string}_title`]: unknown;
  [key: `${string}_subtitle`]: unknown;
  [key: `${string}_body`]: unknown;
}

type DestinationForm = Omit<Destination, "id" | "created_at">;

function blankForm(): DestinationForm {
  const sections: Record<string, string> = {};
  for (const s of SECTION_FIELDS) {
    sections[`${s.key}_title`] = "";
    sections[`${s.key}_subtitle`] = "";
    sections[`${s.key}_body`] = "";
  }
  return {
    country: "", city: "", continent: [], category: [], tagline: "", description: "",
    client_name: "", status: "Available", image_urls: [], image_collages: [],
    ...sections,
  } as unknown as DestinationForm;
}

function arrOf(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function strOf(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function normRow(r: Record<string, unknown>): Destination {
  return { ...r, continent: arrOf(r.continent), category: arrOf(r.category), image_urls: arrOf(r.image_urls), image_collages: arrOf(r.image_collages) } as unknown as Destination;
}

// ─── Image upload ─────────────────────────────────────────────────────────────

function uploadImage(file: File): Promise<string> {
  return uploadToR2(file, "destinations");
}

function ImageUploadField({ label, images, onChange }: {
  label: string; images: string[]; onChange: (imgs: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try { onChange([...images, ...(await Promise.all(files.map(f => uploadImage(f))))]); }
    catch { /* ignore */ }
    finally { setUploading(false); }
  }
  return (
    <div>
      <label className={FIELD}>{label}</label>
      <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all ${uploading ? "border-[#00B5A3]/40 bg-[#00B5A3]/5 cursor-wait" : "border-gray-200 dark:border-dk-stroke cursor-pointer hover:border-[#00B5A3]/50 hover:bg-[#00B5A3]/5"}`}>
        {uploading ? <Loader2 size={16} className="text-[#00B5A3] animate-spin mb-1" /> : <Upload size={15} className="text-gray-300 mb-1" />}
        <span className="text-[11px] text-gray-400">{uploading ? "Uploading & converting…" : "Click to upload images"}</span>
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

// ─── Grid card ────────────────────────────────────────────────────────────────

function DestinationCard({ item, onView, onEdit, onDelete }: {
  item: Destination; onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const img = item.image_urls?.[0];
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300" style={{ aspectRatio: "4/3" }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center"><Map size={32} className="text-gray-300" /></div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className={`px-2.5 py-1 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-wide shadow-sm border ${STATUS_STYLES[item.status] ?? "bg-white/90"}`}>{item.status}</span>
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onView} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }} title="View"><Eye size={14} /></button>
        <button onClick={onEdit} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-[#00B5A3] transition-all" style={{ borderRadius: "10px" }} title="Edit"><Pencil size={14} /></button>
        <button onClick={onDelete} className="p-1.5 bg-white shadow-md text-gray-900 hover:text-red-500 transition-all" style={{ borderRadius: "10px" }} title="Delete"><Trash2 size={14} /></button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[15px] font-bold text-white leading-tight tracking-tight truncate">{item.city ? `${item.city}, ${item.country}` : item.country}</p>
        {item.tagline && <p className="text-[11px] text-white/70 mt-0.5 truncate">{item.tagline}</p>}
        {item.continent?.length > 0 && <p className="text-[10px] text-white/50 mt-1">{item.continent.join(", ")}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FORM_TABS = ["basic", "content", "images"] as const;
type FormTab = typeof FORM_TABS[number];
const TAB_LABEL: Record<FormTab, string> = { basic: "Basic Info", content: "Content Sections", images: "Images" };

export default function DestinationsPage() {
  const { company } = useCompany();
  const activeCompany = company.label;

  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: Destination | null }>({ open: false, mode: "add", data: null });
  const [form, setForm] = useState<DestinationForm>(blankForm());
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [activeSection, setActiveSection] = useState<string>(SECTION_FIELDS[0].key);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const setF = <K extends keyof DestinationForm>(k: K, v: DestinationForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const fetchDestinations = useCallback(async () => {
    const { data, error } = await supabase.from("ac_destinations").select("*").order("created_at", { ascending: false });
    if (!error) setDestinations((data ?? []).map(r => normRow(r as Record<string, unknown>)));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDestinations().finally(() => setLoading(false));
  }, [fetchDestinations]);

  const visible = destinations
    .filter(d => statusFilter === "All" || d.status === statusFilter)
    .filter(d => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        d.country?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q) ||
        d.category?.some(c => c.toLowerCase().includes(q)) ||
        d.continent?.some(c => c.toLowerCase().includes(q))
      );
    });
  const allCountries = [...new Set(destinations.map(d => d.country).filter(Boolean))].sort();

  const STATS = [
    { label: "Total", value: destinations.length },
    { label: "Available", value: destinations.filter(d => d.status === "Available").length },
    { label: "Countries", value: allCountries.length },
    { label: "With Images", value: destinations.filter(d => (d.image_urls?.length ?? 0) > 0).length },
  ];

  function openModal(mode: "add" | "edit" | "view", item?: Destination) {
    setActiveTab("basic");
    setActiveSection(SECTION_FIELDS[0].key);
    if (mode === "add") {
      setForm(blankForm());
      setModal({ open: true, mode, data: null });
      return;
    }
    if (!item) return;
    const f: Record<string, unknown> = {
      country: item.country, city: item.city, continent: item.continent, category: item.category,
      tagline: item.tagline, description: item.description, client_name: item.client_name,
      status: item.status, image_urls: item.image_urls, image_collages: item.image_collages,
    };
    for (const s of SECTION_FIELDS) {
      f[`${s.key}_title`] = strOf(item[`${s.key}_title`]);
      f[`${s.key}_subtitle`] = strOf(item[`${s.key}_subtitle`]);
      f[`${s.key}_body`] = strOf(item[`${s.key}_body`]);
    }
    setForm(f as unknown as DestinationForm);
    setModal({ open: true, mode, data: item });
  }
  function closeModal() { setModal({ open: false, mode: "add", data: null }); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, title: form.city ? `${form.city}, ${form.country}` : form.country, company: activeCompany };
      if (modal.mode === "edit" && modal.data) {
        const { data, error } = await apiUpdate<Record<string, unknown>>("ac_destinations", modal.data.id, payload);
        if (!error && data) setDestinations(p => p.map(d => d.id === modal.data!.id ? normRow(data) : d));
      } else {
        const { data, error } = await apiInsert<Record<string, unknown>>("ac_destinations", payload);
        if (!error && data) setDestinations(p => [normRow(data), ...p]);
      }
      closeModal();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    const { error } = await apiDelete("ac_destinations", id);
    if (!error) setDestinations(p => p.filter(d => d.id !== id));
  }

  const activeSectionLabel = SECTION_FIELDS.find(s => s.key === activeSection)?.label ?? "";

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Destinations</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Countries and cities featured across the site — overview, travel info, and visa content.
          </p>
        </div>
        <button onClick={() => openModal("add")} className="btn-primary-sm flex items-center gap-1.5">
          <Plus size={13} /> Add Destination
        </button>
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

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition-all duration-200 ${
              statusFilter === s ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* List / Grid */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">All Destinations</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{visible.length} destination{visible.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`} title="Grid view"><LayoutGrid size={13} /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`} title="List view"><List size={13} /></button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by country, city, category…"
              className="w-full pl-8 pr-8 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-52 bg-gray-50 rounded-3xl animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-4"><Map size={22} className="text-gray-200 dark:text-gray-600" /></div>
            <p className="text-[13px] font-semibold text-gray-400">{search ? "No matches found" : "No destinations yet"}</p>
            <p className="text-[11.5px] text-gray-300 mt-1">{search ? "Try a different search term." : 'Click "Add Destination" to get started.'}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(item => (
              <DestinationCard key={item.id} item={item} onView={() => openModal("view", item)} onEdit={() => openModal("edit", item)} onDelete={() => setConfirmDelete(item.id)} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {visible.map(item => (
              <div key={item.id} onClick={() => openModal("view", item)} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 cursor-pointer">
                <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-dk-raised shrink-0">
                  {item.image_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center"><Map size={14} className="text-gray-300 dark:text-gray-600" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">{item.city ? `${item.city}, ${item.country}` : item.country}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.tagline || "—"}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[item.status] ?? ""}`}>{item.status}</span>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openModal("edit", item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#00B5A3] transition-all" title="Edit"><Pencil size={13} /></button>
                  <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        size={modal.mode === "view" ? "lg" : "xl"}
        title={modal.mode === "view" ? (modal.data?.city ? `${modal.data.city}, ${modal.data.country}` : modal.data?.country ?? "Destination") : modal.mode === "edit" ? "Edit Destination" : "Add Destination"}
      >
        {modal.mode === "view" && modal.data ? (
          <div className="space-y-5 overflow-y-auto max-h-[68vh] pr-1">
            {modal.data.image_urls?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {modal.data.image_urls.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="w-24 h-18 object-cover rounded-xl border border-gray-100" />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><p className={FIELD}>Country</p><p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{modal.data.country || "—"}</p></div>
              <div><p className={FIELD}>City</p><p className="text-[13px] text-gray-700 dark:text-gray-300">{modal.data.city || "—"}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className={FIELD}>Continent</p><p className="text-[12px] text-gray-600 dark:text-gray-400">{modal.data.continent?.join(", ") || "—"}</p></div>
              <div>
                <p className={FIELD}>Status</p>
                <span className={`inline-block text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[modal.data.status] ?? ""}`}>{modal.data.status}</span>
              </div>
            </div>
            {modal.data.tagline && <div><p className={FIELD}>Tagline</p><p className="text-[13px] italic text-[#00B5A3]">{modal.data.tagline}</p></div>}
            {modal.data.description && <div><p className={FIELD}>Description</p><p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{modal.data.description}</p></div>}
            <hr className="border-gray-100 dark:border-dk-stroke" />
            <p className="text-[10px] font-bold text-[#00B5A3] uppercase tracking-widest">Content Sections</p>
            {SECTION_FIELDS.map(s => {
              const title = strOf(modal.data![`${s.key}_title`]);
              const subtitle = strOf(modal.data![`${s.key}_subtitle`]);
              const body = strOf(modal.data![`${s.key}_body`]);
              if (!title && !subtitle && !body) return null;
              return (
                <div key={s.key} className="border-l-2 border-[#00B5A3]/20 pl-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
                  {title && <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{title}</p>}
                  {subtitle && <p className="text-[11.5px] text-[#00B5A3] font-medium">{subtitle}</p>}
                  {body && <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{body}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col">
            {/* Tab bar */}
            <div className="flex gap-0 border-b border-gray-100 mb-5 -mx-1">
              {FORM_TABS.map(tab => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-semibold px-4 py-2.5 border-b-2 transition-all ${activeTab === tab ? "border-[#00B5A3] text-[#00B5A3]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                  {TAB_LABEL[tab]}
                </button>
              ))}
            </div>

            {/* ── Basic Info ── */}
            {activeTab === "basic" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Country <span className="text-red-400">*</span></label>
                    <ComboInput className={INPUT} placeholder="e.g. United Arab Emirates" value={form.country} options={allCountries} onChange={v => setF("country", v)} />
                  </div>
                  <div>
                    <label className={FIELD}>City</label>
                    <input className={INPUT} placeholder="e.g. Dubai" value={form.city} onChange={e => setF("city", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD}>Continent</label>
                    <select className={SELECT} value={form.continent[0] ?? ""} onChange={e => setF("continent", e.target.value ? [e.target.value] : [])}>
                      <option value="">Select continent</option>
                      {CONTINENTS.map(c => <option key={c}>{c}</option>)}
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
                  <label className={FIELD}>Tagline</label>
                  <input className={INPUT} placeholder="e.g. City of Gold" value={form.tagline} onChange={e => setF("tagline", e.target.value)} />
                </div>
                <div>
                  <label className={FIELD}>Description</label>
                  <textarea rows={3} className={TEXTAREA} value={form.description} onChange={e => setF("description", e.target.value)} />
                </div>
                <div>
                  <label className={FIELD}>Client / Partner Name</label>
                  <input className={INPUT} value={form.client_name} onChange={e => setF("client_name", e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Content Sections ── */}
            {activeTab === "content" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 pb-3 border-b border-gray-100">
                  {SECTION_FIELDS.map(s => (
                    <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                      className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border transition-all ${activeSection === s.key ? "bg-[#00B5A3] text-white border-[#00B5A3]" : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">Editing: <span className="font-semibold text-gray-600 dark:text-gray-300">{activeSectionLabel}</span></p>
                <div>
                  <label className={FIELD}>Title</label>
                  <input className={INPUT} value={strOf((form as Record<string, unknown>)[`${activeSection}_title`])}
                    onChange={e => setF(`${activeSection}_title` as keyof DestinationForm, e.target.value as never)} />
                </div>
                <div>
                  <label className={FIELD}>Subtitle</label>
                  <input className={INPUT} value={strOf((form as Record<string, unknown>)[`${activeSection}_subtitle`])}
                    onChange={e => setF(`${activeSection}_subtitle` as keyof DestinationForm, e.target.value as never)} />
                </div>
                <div>
                  <label className={FIELD}>Body</label>
                  <textarea rows={4} className={TEXTAREA} value={strOf((form as Record<string, unknown>)[`${activeSection}_body`])}
                    onChange={e => setF(`${activeSection}_body` as keyof DestinationForm, e.target.value as never)} />
                </div>
              </div>
            )}

            {/* ── Images ── */}
            {activeTab === "images" && (
              <div className="space-y-5">
                <ImageUploadField label="Hero Images" images={form.image_urls} onChange={imgs => setF("image_urls", imgs)} />
                <ImageUploadField label="Collage Images" images={form.image_collages} onChange={imgs => setF("image_collages", imgs)} />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center gap-2 pt-5 border-t border-gray-100 mt-5">
              <div className="flex gap-1">
                {FORM_TABS.map(tab => (
                  <div key={tab} className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === tab ? "bg-[#00B5A3]" : "bg-gray-200"}`} title={TAB_LABEL[tab]} />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary-sm flex items-center gap-1.5">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {modal.mode === "edit" ? "Save Changes" : "Add Destination"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete destination?"
        message="This will permanently remove the destination and all its content."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelete !== null) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
