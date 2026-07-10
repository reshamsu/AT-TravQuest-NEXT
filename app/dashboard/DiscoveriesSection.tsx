"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Compass, Plus, Eye, Pencil, Trash2, Upload, X, Loader2, MapPin,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { supabase } from "@/lib/supabase";
import { apiInsert, apiUpdate, apiDelete } from "@/lib/dashboard-api";
import { uploadImage as uploadToR2 } from "@/lib/upload";

// ─── Styles — matches app/dashboard/pages/page.tsx exactly ───────────────────

const FIELD = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const TEXTAREA = `${INPUT} resize-none`;
// Category tabs use the same teal colorway as the Pages & Sections page tabs
// (app/dashboard/pages/page.tsx's MA/PI) — the mode switcher above them stays
// black/white theme-inverted.
const PA = "bg-[#00B5A3] text-white border-[#00B5A3]";
const PI = "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-[#00B5A3]/50 hover:text-[#00B5A3]";
const PB = "text-[11px] font-semibold px-3 py-1 rounded-full border transition-all duration-200";

// ─── Fixed category tabs — matches the categories already in use ─────────────

const CATEGORIES = [
  "Iconic Marvels", "Shop", "Visa", "Package", "Meet",
  "Apartments", "Stay", "Play", "Transfers", "Special Offers",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Discovery {
  id: string;
  created_at: string;
  category: string[];
  country: string[];
  city: string[];
  tagline: string;
  description: string;
  intro_title: string;
  intro_subtitle: string;
  intro_body: string;
  image_urls: string[];
}

type DiscoveryForm = Omit<Discovery, "id" | "created_at">;

function blankForm(category: string): DiscoveryForm {
  return {
    category: [category], country: [], city: [], tagline: "", description: "",
    intro_title: "", intro_subtitle: "", intro_body: "", image_urls: [],
  };
}

function arrOf(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map(s => s.trim()).filter(Boolean) : [];
}
function normRow(r: Record<string, unknown>): Discovery {
  return { ...r, category: arrOf(r.category), country: arrOf(r.country), city: arrOf(r.city), image_urls: arrOf(r.image_urls) } as unknown as Discovery;
}

// ─── Tag input — comma-separated array field ─────────────────────────────────

function TagInput({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className={FIELD}>{label} <span className="text-gray-400 font-normal">(comma-separated)</span></label>
      <input className={INPUT} placeholder={placeholder}
        value={values.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
    </div>
  );
}

// ─── Image upload ─────────────────────────────────────────────────────────────

function uploadImage(file: File): Promise<string> {
  return uploadToR2(file, "discoveries");
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

// ─── Section (embedded in the Site Content / Pages screen) ───────────────────

export default function DiscoveriesSection({ company }: { company: string }) {
  const [loading, setLoading] = useState(true);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);

  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: Discovery | null }>({ open: false, mode: "add", data: null });
  const [form, setForm] = useState<DiscoveryForm>(blankForm(CATEGORIES[0]));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const setF = <K extends keyof DiscoveryForm>(k: K, v: DiscoveryForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const fetchDiscoveries = useCallback(async () => {
    const { data, error } = await supabase.from("ac_discoveries").select("*").order("created_at", { ascending: false });
    if (!error) setDiscoveries((data ?? []).map(r => normRow(r as Record<string, unknown>)));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDiscoveries().finally(() => setLoading(false));
  }, [fetchDiscoveries]);

  const currentItems = discoveries.filter(d => d.category.includes(activeCategory));

  function openModal(mode: "add" | "edit" | "view", data?: Discovery) {
    setForm(data ? { category: data.category, country: data.country, city: data.city, tagline: data.tagline, description: data.description, intro_title: data.intro_title, intro_subtitle: data.intro_subtitle, intro_body: data.intro_body, image_urls: data.image_urls } : blankForm(activeCategory));
    setModal({ open: true, mode, data: data ?? null });
  }
  function closeModal() { setModal({ open: false, mode: "add", data: null }); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === "edit" && modal.data) {
        const { data, error } = await apiUpdate<Record<string, unknown>>("ac_discoveries", modal.data.id, form);
        if (!error && data) setDiscoveries(p => p.map(d => d.id === modal.data!.id ? normRow(data) : d));
      } else {
        const { data, error } = await apiInsert<Record<string, unknown>>("ac_discoveries", { ...form, company });
        if (!error && data) setDiscoveries(p => [normRow(data), ...p]);
      }
      closeModal();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    const { error } = await apiDelete("ac_discoveries", id);
    if (!error) setDiscoveries(p => p.filter(d => d.id !== id));
  }

  return (
    <div className="space-y-5">

      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className={`${PB} ${activeCategory === cat ? PA : PI}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Category content */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">{activeCategory}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{currentItems.length} entr{currentItems.length !== 1 ? "ies" : "y"}</p>
          </div>
          <button onClick={() => openModal("add")} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> Add {activeCategory}
          </button>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-dk-stroke">
          {loading ? (
            <div className="px-6 py-8 space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-dk-raised rounded-xl animate-pulse" />)}</div>
          ) : currentItems.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-3">
                <Compass size={20} className="text-gray-200" />
              </div>
              <p className="text-[13px] font-semibold text-gray-400">No {activeCategory} entries yet</p>
              <p className="text-[11.5px] text-gray-300 mt-1">Click &quot;Add {activeCategory}&quot; to create the first one.</p>
            </div>
          ) : currentItems.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-dk-raised/30 transition-colors">
              <div className="md:col-span-2 space-y-1.5">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{item.tagline || "Untitled"}</p>
                {item.description && <p className="text-[11.5px] text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>}
                {(item.country.length > 0 || item.city.length > 0) && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <MapPin size={11} className="text-[#00B5A3] shrink-0" />
                    {[...item.country.slice(0, 3), ...item.city.slice(0, 2)].map((loc) => (
                      <span key={loc} className="px-2 py-0.5 bg-[#00B5A3]/10 text-[#00B5A3] rounded-full text-[9.5px] font-semibold">{loc}</span>
                    ))}
                    {(item.country.length + item.city.length) > 5 && (
                      <span className="text-[9.5px] text-gray-400">+{item.country.length + item.city.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal("view", item)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-gray-300 transition-all"><Eye size={11} /> View</button>
                  <button onClick={() => openModal("edit", item)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-gray-300 transition-all"><Pencil size={11} /> Edit</button>
                  <button onClick={() => setConfirmDelete(item.id)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"><Trash2 size={11} /> Del</button>
                </div>
                {item.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {item.image_urls.slice(0, 3).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" className="w-14 h-11 object-cover rounded-lg border border-gray-100" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.mode === "view" ? (modal.data?.tagline || activeCategory) : modal.mode === "edit" ? "Edit Discovery" : `Add ${activeCategory}`}
      >
        {modal.mode === "view" && modal.data ? (
          <div className="space-y-5">
            <div>
              <p className={FIELD}>Category</p>
              <div className="flex flex-wrap gap-1.5">{modal.data.category.map(c => <span key={c} className="px-2.5 py-1 bg-[#00B5A3]/10 text-[#00B5A3] rounded-lg text-[10.5px] font-semibold">{c}</span>)}</div>
            </div>
            <div>
              <p className={FIELD}>Tagline</p>
              <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{modal.data.tagline || "—"}</p>
            </div>
            <div>
              <p className={FIELD}>Description</p>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-300 leading-relaxed">{modal.data.description || "—"}</p>
            </div>
            {(modal.data.country.length > 0 || modal.data.city.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={FIELD}>Countries</p>
                  <div className="flex flex-wrap gap-1">{modal.data.country.map(c => <span key={c} className="px-2 py-0.5 bg-gray-100 dark:bg-dk-raised text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-medium">{c}</span>)}</div>
                </div>
                <div>
                  <p className={FIELD}>Cities</p>
                  <div className="flex flex-wrap gap-1">{modal.data.city.map(c => <span key={c} className="px-2 py-0.5 bg-gray-100 dark:bg-dk-raised text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-medium">{c}</span>)}</div>
                </div>
              </div>
            )}
            {(modal.data.intro_title || modal.data.intro_subtitle || modal.data.intro_body) && (
              <div>
                <p className={FIELD}>Intro</p>
                {modal.data.intro_title && <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{modal.data.intro_title}</p>}
                {modal.data.intro_subtitle && <p className="text-[12px] text-[#00B5A3] font-semibold">{modal.data.intro_subtitle}</p>}
                {modal.data.intro_body && <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{modal.data.intro_body}</p>}
              </div>
            )}
            <div>
              <p className={FIELD}>Images ({modal.data.image_urls.length})</p>
              {modal.data.image_urls.length > 0
                ? <div className="flex flex-wrap gap-2">{modal.data.image_urls.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="w-20 h-16 object-cover rounded-xl border border-gray-100" />
                  ))}</div>
                : <p className="text-[12px] text-gray-300">No images uploaded</p>
              }
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <TagInput label="Category" values={form.category} onChange={(v) => setF("category", v)} placeholder="e.g. Iconic Marvels" />
            <div>
              <label className={FIELD}>Tagline</label>
              <input className={INPUT} placeholder="e.g. TIMELESS LANDMARKS" value={form.tagline} onChange={e => setF("tagline", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Description</label>
              <textarea rows={2} className={TEXTAREA} placeholder="Short description shown on the public site…" value={form.description} onChange={e => setF("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TagInput label="Countries" values={form.country} onChange={(v) => setF("country", v)} placeholder="e.g. UAE, Sri Lanka" />
              <TagInput label="Cities" values={form.city} onChange={(v) => setF("city", v)} placeholder="e.g. Dubai, Colombo" />
            </div>
            <div>
              <label className={FIELD}>Intro Title</label>
              <input className={INPUT} value={form.intro_title} onChange={e => setF("intro_title", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Intro Subtitle</label>
              <input className={INPUT} value={form.intro_subtitle} onChange={e => setF("intro_subtitle", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Intro Body</label>
              <textarea rows={3} className={TEXTAREA} value={form.intro_body} onChange={e => setF("intro_body", e.target.value)} />
            </div>
            <ImageUploadField label="Images" images={form.image_urls} onChange={(imgs) => setF("image_urls", imgs)} />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 dark:bg-dk-raised dark:text-gray-400 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary-sm flex items-center gap-1.5">
                {saving && <Loader2 size={12} className="animate-spin" />}
                {modal.mode === "edit" ? "Save Changes" : "Add"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete discovery?"
        message="This will permanently remove this entry and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelete !== null) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
