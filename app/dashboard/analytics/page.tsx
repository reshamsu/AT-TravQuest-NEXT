"use client";

import { useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight, Download,
  Globe, Package, Building2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD = "text-[12px] text-gray-700 dark:text-gray-300 font-medium mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";
const SELECT = `${INPUT} cursor-pointer`;

const EMPTY = { title: "", type: "", schedule: "Monthly", dateFrom: "", dateTo: "" };

const STATS = [
  { label: "Booking Volume YTD", value: "AED 1.84M", change: "+22%", up: true,  icon: TrendingUp,  bg: "bg-violet-50 dark:bg-violet-900/20",  color: "text-violet-600 dark:text-violet-400" },
  { label: "Bookings Closed",    value: "142",        change: "+14%", up: true,  icon: Package,     bg: "bg-blue-50 dark:bg-blue-900/20",    color: "text-[#00B5A3]" },
  { label: "Active Consultants", value: "24",         change: "+5%",  up: true,  icon: Building2,   bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400" },
  { label: "Avg Booking Value",  value: "AED 4.5K",   change: "+7%",  up: true,  icon: BarChart3,   bg: "bg-amber-50 dark:bg-amber-900/20",   color: "text-amber-600 dark:text-amber-400" },
];

const MONTHLY = [
  { month: "Jan", revenue: 140, orders: 98 },
  { month: "Feb", revenue: 162, orders: 114 },
  { month: "Mar", revenue: 188, orders: 132 },
  { month: "Apr", revenue: 175, orders: 128 },
  { month: "May", revenue: 210, orders: 156 },
  { month: "Jun", revenue: 248, orders: 184 },
];

const CATEGORIES = [
  { label: "Hotels",    pct: 85, revenue: "AED 684K", orders: 420 },
  { label: "Tours",     pct: 62, revenue: "AED 312K", orders: 284 },
  { label: "Packages",  pct: 46, revenue: "AED 218K", orders: 189 },
  { label: "Visas",     pct: 36, revenue: "AED 147K", orders: 147 },
  { label: "Transfers", pct: 28, revenue: "AED 98K",  orders: 92  },
];

const REPORTS = [
  { title: "Q2 Booking Analysis",         date: "Jun 01", type: "Financial",  size: "2.4 MB" },
  { title: "Consultant Performance Report", date: "May 28", type: "Operations", size: "1.8 MB" },
  { title: "Listings KPI Dashboard",      date: "May 15", type: "Operations", size: "3.1 MB" },
  { title: "Category Revenue Breakdown",  date: "May 01", type: "Financial",  size: "1.2 MB" },
  { title: "Time-to-Book Report",         date: "Apr 30", type: "Operations", size: "0.9 MB" },
];

const maxRevenue = Math.max(...MONTHLY.map((m) => m.revenue));

export default function AnalyticsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
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
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Monitor performance, track trends, and export reports.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary-sm flex items-center gap-1.5">
          <Download size={13} /> Export Report
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <div>
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Revenue & Orders</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Monthly overview · 2026</p>
            </div>
            <button className="text-[11px] font-semibold text-[#00B5A3] flex items-center gap-1">
              Full report <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="px-6 pb-6 pt-4">
            <div className="flex items-end gap-3 h-40">
              {MONTHLY.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg bg-linear-to-t from-[#00B5A3] to-[#f2836f] opacity-90 transition-all duration-500 hover:opacity-100"
                      style={{ height: `${(m.revenue / maxRevenue) * 128}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto mt-4 pt-4 border-t border-gray-50 dark:border-dk-stroke">
              <div className="flex items-center gap-4 min-w-[340px]">
                {MONTHLY.map((m) => (
                  <div key={m.month} className="flex-1 text-center">
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">${m.revenue}K</p>
                    <p className="text-[9.5px] text-gray-400">{m.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">By Category</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Revenue share YTD</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {CATEGORIES.map(({ label, pct, revenue, orders }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  <div className="text-right">
                    <p className="text-[11.5px] font-bold text-gray-800 dark:text-gray-200">{revenue}</p>
                    <p className="text-[10px] text-gray-400">{orders} orders</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-dk-raised rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#00B5A3] to-[#f2836f]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mx-5 mb-5 rounded-xl bg-linear-to-br from-[#00B5A3] to-[#f2836f] p-4 text-white">
            <Globe size={13} className="opacity-80 mb-1" />
            <p className="text-[20px] font-bold leading-none mb-0.5">6+</p>
            <p className="text-[11px] opacity-70">Regions · Travel &amp; Tourism</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div>
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Recent Reports</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Download or schedule exports</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary-sm flex items-center gap-1.5">
            <BarChart3 size={13} /> Generate Report
          </button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {REPORTS.map((r) => (
            <div key={r.title} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00B5A3]/8 flex items-center justify-center shrink-0">
                  <BarChart3 size={14} className="text-[#00B5A3]" />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#00B5A3] transition-colors">
                    {r.title}
                  </p>
                  <p className="text-[10.5px] text-gray-400">{r.type} · {r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] text-gray-400">{r.size}</span>
                <button className="flex items-center gap-1 text-[11px] font-semibold text-[#00B5A3] hover:text-[#009d8d] transition-colors">
                  <Download size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={FIELD}>Report Title</label>
            <input required className={INPUT} placeholder="e.g. Q3 Spend Analysis" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD}>Report Type</label>
              <select required className={SELECT} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">Select type</option>
                {["Financial", "Operations", "Consultant", "Category"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={FIELD}>Schedule</label>
              <select required className={SELECT} value={form.schedule} onChange={(e) => set("schedule", e.target.value)}>
                {["Monthly", "Quarterly", "Annually", "One-time"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
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
            <button type="submit" className="btn-primary-sm">Generate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
