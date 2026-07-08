"use client";

import { useState } from "react";
import {
  CreditCard, TrendingUp, TrendingDown, ArrowUpRight,
  ChevronRight, Plus, MapPin, Table2, List, LayoutGrid,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD = "text-[12px] text-gray-700 dark:text-gray-300 font-medium mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT = `${INPUT} cursor-pointer`;

const EMPTY = { property: "", type: "", agent: "", buyer: "", amount: "" };

const STATS = [
  { label: "Confirmed This Month", value: "84",     change: "+18%", up: true,  icon: CreditCard, bg: "bg-blue-50 dark:bg-blue-900/20",    color: "text-[#00B5A3]" },
  { label: "Revenue MTD",          value: "AED 412K", change: "+21%", up: true,  icon: TrendingUp,  bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400" },
  { label: "Avg Booking Value",    value: "AED 4.9K", change: "+8%",  up: true,  icon: TrendingUp,  bg: "bg-violet-50 dark:bg-violet-900/20",  color: "text-violet-600 dark:text-violet-400" },
  { label: "Pending",              value: "47",     change: "+6",   up: true,  icon: CreditCard,  bg: "bg-amber-50 dark:bg-amber-900/20",   color: "text-amber-600 dark:text-amber-400" },
];

const TRANSACTIONS = [
  { id: "BKG-3921", property: "5-Night Maldives Overwater Escape",  type: "Honeymoon",   agent: "Sarah Nguyen", buyer: "R. Carter",    amount: "AED 8.2K", status: "Pending",   date: "Jun 01" },
  { id: "BKG-3920", property: "Dubai Corporate Retreat",            type: "Corporate",   agent: "James Park",   buyer: "Apex Group",   amount: "AED 32K",  status: "Confirmed", date: "May 31" },
  { id: "BKG-3919", property: "Istanbul Group Heritage Tour",       type: "Group Tours", agent: "Maria Garcia", buyer: "K. Williams",  amount: "AED 5.4K", status: "Confirmed", date: "May 29" },
  { id: "BKG-3918", property: "Bali Adventure Package",             type: "Adventure",   agent: "Chris Osei",   buyer: "Pacific Tours",amount: "AED 18K",  status: "Cancelled", date: "May 28" },
  { id: "BKG-3917", property: "Paris City Break",                   type: "Group Tours", agent: "James Park",   buyer: "TechSpace",    amount: "AED 41K",  status: "Confirmed", date: "May 27" },
  { id: "BKG-3916", property: "Dubai Luxury Weekend",                type: "Luxury",      agent: "Sarah Nguyen", buyer: "M. Johnson",   amount: "AED 11K",  status: "Pending",   date: "May 26" },
  { id: "BKG-3915", property: "Cairo Adventure Tour",                type: "Adventure",   agent: "Daniel Kim",   buyer: "NW Logistics", amount: "AED 68K",  status: "Completed", date: "May 25" },
];

const STATUS_STYLES: Record<string, string> = {
  "Pending":   "bg-amber-50 text-amber-700 border-amber-200",
  "Confirmed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Completed": "bg-blue-50 text-blue-700 border-blue-200",
  "Cancelled": "bg-gray-50 text-gray-600 border-gray-200",
};

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "table">("list");
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalOpen(false);
    setForm(EMPTY);
  }

  const filtered = activeFilter === "All"
    ? TRANSACTIONS
    : TRANSACTIONS.filter((t) => t.status === activeFilter);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Track bookings, confirmations, and payment status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all">
            Export
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> New Booking
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke gap-4 flex-wrap">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Booking History</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{filtered.length} bookings</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-all ${activeFilter === f ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dk-raised"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-dk-raised rounded-xl p-0.5">
              <button onClick={() => setViewMode("list")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "list"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="List view"><List size={13} /></button>
              <button onClick={() => setViewMode("grid")}  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid"  ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Grid view"><LayoutGrid size={13} /></button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-dk-surface shadow-sm text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`} title="Table view"><Table2 size={13} /></button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 border-b border-gray-50 last:border-0 cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                    <CreditCard size={14} className="text-[#00B5A3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{t.property}</p>
                    <p className="text-[11px] text-[#00B5A3] font-semibold">{t.id}</p>
                  </div>
                  <div className="hidden sm:block w-28 shrink-0 text-right">
                    <p className="text-[11px] text-gray-500 truncate">{t.buyer}</p>
                    <p className="text-[10px] text-gray-400">{t.date}</p>
                  </div>
                  <div className="hidden md:block w-16 shrink-0 text-right">
                    <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-200">{t.amount}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[t.status]}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Showing {filtered.length} of {TRANSACTIONS.length}</span>
              <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </button>
            </div>
          </>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filtered.map((t) => (
                <div key={t.id} className="bg-white dark:bg-dk-surface border border-gray-100 dark:border-dk-stroke rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                      <CreditCard size={13} className="text-[#00B5A3]" />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[10.5px] font-semibold text-[#00B5A3] mb-0.5">{t.id}</p>
                  <p className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100 mb-3 truncate">{t.property}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-gray-400">Traveler</span>
                      <span className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[80px]">{t.buyer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-gray-400">Amount</span>
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{t.amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-gray-400">Date</span>
                      <span className="text-[10.5px] font-semibold text-gray-500">{t.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Showing {filtered.length} of {TRANSACTIONS.length}</span>
              <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50/80 dark:bg-dk-raised/50 border-b border-gray-100 dark:border-dk-stroke">
              <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</span>
              <span className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Package</span>
              <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
              <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consultant</span>
              <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Traveler</span>
              <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Date</span>
              <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</span>
              <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((t) => (
                <div key={t.id} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors cursor-pointer group">
                  <span className="col-span-1 text-[11px] font-semibold text-[#00B5A3]">{t.id}</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <MapPin size={10} className="text-gray-300 shrink-0" />
                    <span className="text-[11.5px] font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-[#00B5A3] transition-colors">{t.property}</span>
                  </div>
                  <span className="col-span-1 text-[10.5px] text-gray-500">{t.type}</span>
                  <span className="col-span-2 text-[11px] text-gray-500 truncate">{t.agent}</span>
                  <span className="col-span-2 text-[11px] text-gray-500 truncate">{t.buyer}</span>
                  <span className="col-span-1 text-[11px] text-gray-400 text-right">{t.date}</span>
                  <span className="col-span-1 text-[12.5px] font-bold text-gray-800 dark:text-gray-200 text-right">{t.amount}</span>
                  <div className="col-span-1 flex justify-end">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            </div></div>
            <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Showing {filtered.length} of {TRANSACTIONS.length}</span>
              <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Booking">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={FIELD}>Package / Listing</label>
            <input required className={INPUT} placeholder="e.g. 5-Night Maldives Overwater Escape" value={form.property} onChange={(e) => set("property", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>Category</label>
              <select required className={SELECT} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">Select type</option>
                {["Luxury", "Honeymoon", "Group Tours", "Adventure", "Corporate"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={FIELD}>Consultant</label>
              <select required className={SELECT} value={form.agent} onChange={(e) => set("agent", e.target.value)}>
                <option value="">Select consultant</option>
                {["Sarah Nguyen", "James Park", "Maria Garcia", "Chris Osei", "Daniel Kim"].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>Traveler</label>
              <input required className={INPUT} placeholder="e.g. R. Carter" value={form.buyer} onChange={(e) => set("buyer", e.target.value)} />
            </div>
            <div>
              <label className={FIELD}>Booking Amount</label>
              <input required className={INPUT} placeholder="e.g. AED 8.2K" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" className="btn-primary-sm">Create Booking</button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Send Quote",        sub: "Draft and send a booking quote",      icon: CreditCard },
          { label: "Confirm Itinerary", sub: "Finalize a traveler's itinerary",      icon: MapPin },
          { label: "Export Report",     sub: "Download booking analytics",           icon: TrendingUp },
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
