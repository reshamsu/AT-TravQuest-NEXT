"use client";

import { useState } from "react";
import {
  MapPin, TrendingUp, TrendingDown, ArrowUpRight,
  Globe, ChevronRight, BarChart3, Table2, List, LayoutGrid,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD = "text-[12px] text-gray-700 dark:text-gray-300 font-medium mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT = `${INPUT} cursor-pointer`;

const EMPTY = { city: "", region: "", type: "", dateFrom: "", dateTo: "" };

const STATS = [
  { label: "Regions Covered",  value: "8",     change: "+1",   up: true,  icon: MapPin,   bg: "bg-blue-50 dark:bg-blue-900/20",    color: "text-[#00B5A3]" },
  { label: "Avg Package Price", value: "AED 3.2K", change: "+7.4%",up: true,  icon: TrendingUp,bg:"bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400" },
  { label: "YoY Growth",       value: "7.4%",  change: "+1.2%",up: true,  icon: TrendingUp,bg:"bg-violet-50 dark:bg-violet-900/20",  color: "text-violet-600 dark:text-violet-400" },
  { label: "Trending Regions", value: "3",     change: "+1",   up: true,  icon: BarChart3, bg: "bg-amber-50 dark:bg-amber-900/20",   color: "text-amber-600 dark:text-amber-400" },
];

const MARKETS = [
  { city: "Dubai",         region: "UAE",              type: "Luxury",      avgPrice: "AED 8.5K", yoy: "+14.2%", listings: 28, trend: "up" },
  { city: "Abu Dhabi",     region: "UAE",              type: "Corporate",   avgPrice: "AED 6.2K", yoy: "+11.8%", listings: 21, trend: "up" },
  { city: "Maldives",      region: "Indian Ocean",     type: "Honeymoon",   avgPrice: "AED 11K",  yoy: "+9.4%",  listings: 17, trend: "up" },
  { city: "Istanbul",      region: "Europe & Turkey",  type: "Group Tours", avgPrice: "AED 4.2K", yoy: "+8.7%",  listings: 16, trend: "up" },
  { city: "Bali",          region: "Southeast Asia",   type: "Adventure",   avgPrice: "AED 4.8K", yoy: "+6.3%",  listings: 14, trend: "up" },
  { city: "Paris",         region: "Europe & Turkey",  type: "Group Tours", avgPrice: "AED 5.8K", yoy: "+4.1%",  listings: 13, trend: "up" },
  { city: "Cairo",         region: "Middle East",      type: "Adventure",   avgPrice: "AED 3.4K", yoy: "+2.8%",  listings: 11, trend: "up" },
  { city: "Riyadh",        region: "Middle East",      type: "Corporate",   avgPrice: "AED 2.8K", yoy: "−1.2%",  listings: 9,  trend: "down" },
];

export default function MarketsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "table">("list");
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalOpen(false);
    setForm(EMPTY);
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Market Insights</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Analyse destination demand trends and pricing by region.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary-sm flex items-center gap-1.5">
          <BarChart3 size={13} /> Region Report
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, up, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-4 sm:p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <span className={`flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-full ${up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {change}
              </span>
            </div>
            <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5">{value}</p>
            <p className="text-[12px] text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Market Overview</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Top markets by growth · YoY</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
              <button onClick={() => setViewMode("list")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "list"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view"><List size={13} /></button>
              <button onClick={() => setViewMode("grid")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view"><LayoutGrid size={13} /></button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Table view"><Table2 size={13} /></button>
            </div>
            <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
              View all markets <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {MARKETS.map((m) => (
              <div key={m.city} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 border-b border-gray-50 last:border-0 cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-[#00B5A3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{m.city}</p>
                  <p className="text-[11px] text-gray-400 truncate">{m.region}</p>
                </div>
                <div className="hidden sm:block w-28 shrink-0">
                  <p className="text-[11px] text-gray-500">{m.type}</p>
                  <p className="text-[10px] text-gray-400">{m.listings} listings</p>
                </div>
                <div className="hidden md:block w-20 shrink-0 text-right">
                  <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-200">{m.avgPrice}</p>
                  <p className="text-[10px] text-gray-400">avg price</p>
                </div>
                <span className={`text-[11.5px] font-bold shrink-0 ${m.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                  {m.yoy}
                </span>
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {MARKETS.map((m) => (
              <div key={m.city} className="bg-white dark:bg-dk-surface border border-gray-100 dark:border-dk-stroke rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-[#00B5A3]" />
                  </div>
                  <span className={`text-[10px] font-bold ${m.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                    {m.yoy}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">{m.city}</p>
                <p className="text-[10.5px] text-gray-400 mb-3">{m.region}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Type</span>
                    <span className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-400">{m.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Listings</span>
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{m.listings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Avg Price</span>
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{m.avgPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50/80 dark:bg-dk-raised/50 border-b border-gray-100 dark:border-dk-stroke">
            <span className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Region</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Avg Price</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">YoY Growth</span>
            <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Listings</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {MARKETS.map((m) => (
              <div key={m.city} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors cursor-pointer group">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#00B5A3]/8 flex items-center justify-center shrink-0">
                    <MapPin size={12} className="text-[#00B5A3]" />
                  </div>
                  <span className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#00B5A3] transition-colors">{m.city}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-[11px] text-gray-500">
                  <Globe size={9} className="text-gray-300 shrink-0" />
                  {m.region}
                </div>
                <span className="col-span-2 text-[11px] text-gray-500">{m.type}</span>
                <span className="col-span-2 text-[12.5px] font-bold text-gray-800 dark:text-gray-200 text-right">{m.avgPrice}</span>
                <div className="col-span-2 flex justify-end">
                  <span className={`text-[11.5px] font-bold ${m.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                    {m.yoy}
                  </span>
                </div>
                <span className="col-span-1 text-[12px] font-semibold text-gray-700 dark:text-gray-300 text-right">{m.listings}</span>
              </div>
            ))}
          </div>
          </div></div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">By Category</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Active listing share</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {[
              { label: "Hotels",     pct: 85, count: 1084 },
              { label: "Tours",      pct: 45, count: 574 },
              { label: "Packages",   pct: 27, count: 344 },
              { label: "Visas",      pct: 18, count: 229 },
              { label: "Luxury",     pct: 12, count: 153 },
            ].map(({ label, pct, count }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11.5px] font-semibold text-gray-500 dark:text-gray-400">{count.toLocaleString()}</span>
                    <ChevronRight size={13} className="text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-dk-raised rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00B5A3] to-[#f2836f]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">By Region</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Listings by geography</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {[
              { label: "UAE",             pct: 72, count: 66 },
              { label: "Europe & Turkey", pct: 65, count: 63 },
            ].map(({ label, pct, count }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="text-[11.5px] font-semibold text-gray-500 dark:text-gray-400">{count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-dk-raised rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00B5A3] to-[#00B5A3]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Region Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>City</label>
              <input required className={INPUT} placeholder="e.g. Dubai" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Region</label>
              <select required className={SELECT} value={form.region} onChange={(e) => set("region", e.target.value)}>
                <option value="">Select region</option>
                {["UAE", "Europe & Turkey", "Middle East", "Southeast Asia", "Indian Ocean"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={FIELD}>Category</label>
            <select required className={SELECT} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">Select type</option>
              {["Luxury", "Honeymoon", "Group Tours", "Adventure", "Corporate"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>Date From</label>
              <input type="date" required className={INPUT} value={form.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Date To</label>
              <input type="date" required className={INPUT} value={form.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" className="btn-primary-sm">Generate Report</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
