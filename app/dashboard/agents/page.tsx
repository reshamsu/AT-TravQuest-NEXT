"use client";

import { useState } from "react";
import {
  Users, TrendingUp, TrendingDown, ArrowUpRight,
  Star, Globe, ChevronRight, Plus, Table2, List, LayoutGrid,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD = "text-[12px] text-gray-700 dark:text-gray-300 font-medium mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT = `${INPUT} cursor-pointer`;

const EMPTY = { name: "", market: "", specialty: "", email: "" };

const STATS = [
  { label: "Total Consultants", value: "18",   change: "+2",   up: true, icon: Users,     bg: "bg-blue-50 dark:bg-blue-900/20",    color: "text-[#00B5A3]" },
  { label: "Active",            value: "16",   change: "+1",   up: true, icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400" },
  { label: "Top Booker",        value: "AED 412K", change: "+18%", up: true, icon: TrendingUp, bg: "bg-violet-50 dark:bg-violet-900/20",  color: "text-violet-600 dark:text-violet-400" },
  { label: "Avg Rating",        value: "4.8",  change: "+0.1", up: true, icon: Star,       bg: "bg-amber-50 dark:bg-amber-900/20",   color: "text-amber-600 dark:text-amber-400" },
];

const AGENTS = [
  { name: "Sarah Nguyen", market: "Dubai & UAE",     specialty: "Luxury",         deals: 38, volume: "AED 412K", rating: 4.9, status: "Active" },
  { name: "James Park",   market: "Maldives",         specialty: "Honeymoon",      deals: 31, volume: "AED 356K", rating: 4.8, status: "Active" },
  { name: "Maria Garcia", market: "Europe",           specialty: "Group Tours",    deals: 27, volume: "AED 298K", rating: 4.8, status: "Active" },
  { name: "Chris Osei",   market: "Southeast Asia",   specialty: "Adventure",      deals: 24, volume: "AED 271K", rating: 4.7, status: "Active" },
  { name: "Emily Walsh",  market: "Saudi Arabia",     specialty: "Corporate",      deals: 22, volume: "AED 214K", rating: 4.6, status: "Active" },
  { name: "Daniel Kim",   market: "Turkey",           specialty: "Group Tours",    deals: 18, volume: "AED 189K", rating: 4.7, status: "Active" },
  { name: "Lisa Torres",  market: "Domestic (UAE)",   specialty: "Luxury",         deals: 16, volume: "AED 176K", rating: 4.8, status: "Active" },
  { name: "Tom Fletcher", market: "Egypt",            specialty: "Adventure",      deals: 14, volume: "AED 98K",  rating: 4.4, status: "On Leave" },
];

const STATUS_STYLES: Record<string, string> = {
  "Active":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
  "Inactive": "bg-gray-50 text-gray-500 border-gray-200",
};

export default function AgentsPage() {
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
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Partners</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your travel consultant team and track booking performance.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all">
            Leaderboard
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> Add Partner
          </button>
        </div>
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
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Partner Directory</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{AGENTS.length} partners · sorted by bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
              <button onClick={() => setViewMode("list")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "list"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view"><List size={13} /></button>
              <button onClick={() => setViewMode("grid")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view"><LayoutGrid size={13} /></button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Table view"><Table2 size={13} /></button>
            </div>
            <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
              Export <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {AGENTS.map((a, i) => (
              <div key={a.name} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 border-b border-gray-50 last:border-0 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#00B5A3] flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-white">
                    {a.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{a.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{a.market}</p>
                </div>
                <div className="hidden sm:block w-28 shrink-0">
                  <p className="text-[11px] text-gray-500">{a.specialty}</p>
                  <p className="text-[10px] text-gray-400">#{i + 1} booker</p>
                </div>
                <div className="hidden md:flex items-center gap-1 w-16 shrink-0">
                  <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{a.deals}</span>
                  <span className="text-[10px] text-gray-400">deals</span>
                </div>
                <div className="hidden lg:flex items-center gap-1 shrink-0">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{a.rating}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[a.status]}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="bg-white dark:bg-dk-surface border border-gray-100 dark:border-dk-stroke rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#00B5A3] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-white">
                      {a.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status]}`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">{a.name}</p>
                <p className="text-[10.5px] text-gray-400 mb-3 truncate">{a.market}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Specialty</span>
                    <span className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-400">{a.specialty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Deals</span>
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{a.deals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-gray-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star size={9} className="text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{a.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50/80 dark:bg-dk-raised/50 border-b border-gray-100 dark:border-dk-stroke">
            <span className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specialty</span>
            <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Deals</span>
            <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Volume</span>
            <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Rating</span>
            <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {AGENTS.map((a, i) => (
              <div key={a.name} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors cursor-pointer group">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B5A3]/20 to-[#f2836f]/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#00B5A3]">{a.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#00B5A3] transition-colors">{a.name}</p>
                    <p className="text-[10px] text-gray-400">#{i + 1} booker</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-[11px] text-gray-500">
                  <Globe size={9} className="text-gray-300 shrink-0" />
                  <span className="truncate">{a.market}</span>
                </div>
                <span className="col-span-2 text-[11px] text-gray-500">{a.specialty}</span>
                <span className="col-span-1 text-[12px] font-semibold text-gray-700 dark:text-gray-300 text-center">{a.deals}</span>
                <span className="col-span-2 text-[12.5px] font-bold text-gray-800 dark:text-gray-200 text-right">{a.volume}</span>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">{a.rating}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status]}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </div></div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Agent">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={FIELD}>Full Name</label>
            <input required className={INPUT} placeholder="e.g. Sarah Nguyen" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>Market</label>
              <input required className={INPUT} placeholder="e.g. Dubai & UAE" value={form.market} onChange={(e) => set("market", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Specialty</label>
              <select required className={SELECT} value={form.specialty} onChange={(e) => set("specialty", e.target.value)}>
                <option value="">Select specialty</option>
                {["Luxury", "Honeymoon", "Group Tours", "Adventure", "Corporate"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={FIELD}>Contact Email</label>
            <input required type="email" className={INPUT} placeholder="e.g. agent@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" className="btn-primary-sm">Add Agent</button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Find a Partner", sub: "Browse by region or specialty",   icon: Users },
          { label: "Assign Booking",   sub: "Pair a listing with a consultant", icon: ChevronRight },
          { label: "Performance",      sub: "View detailed consultant analytics", icon: TrendingUp },
        ].map(({ label, sub, icon: Icon }) => (
          <button key={label} className="group flex items-center gap-3.5 px-4 py-4 bg-white rounded-2xl border border-gray-100 hover:border-[#00B5A3]/20 hover:shadow-sm text-left transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-[#00B5A3]/[0.08] flex items-center justify-center shrink-0 group-hover:bg-[#00B5A3] transition-colors duration-300">
              <Icon size={15} className="text-[#00B5A3] group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">{label}</p>
              <p className="text-[10.5px] text-gray-400">{sub}</p>
            </div>
            <ChevronRight size={13} className="text-gray-300 group-hover:text-[#00B5A3] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
