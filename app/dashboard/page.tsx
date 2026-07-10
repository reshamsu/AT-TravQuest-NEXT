"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, MapPin, Home, ArrowRight, Building2, TrendingUp, TrendingDown,
  Inbox, Mail, MessageSquare, ChevronRight, X, Globe, ExternalLink, Search,
  UserPlus, UserCheck, UserX, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCompany } from "./CompanyContext";
import { useUser } from "./UserContext";
import { canViewUsers, canManageUsers } from "@/lib/permissions";

interface Listing {
  id: number | string;
  title: string;
  listing_type: string;
  city: string;
  price: string;
  status: string;
  image_urls: string[];
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  industry: string;
  website: string | null;
  challenge: string;
  intent: string;
  created_at: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

function parsePrice(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

const statusColor: Record<string, string> = {
  Active: "text-emerald-600 dark:text-emerald-400",
  "Sold Out": "text-red-500 dark:text-red-400",
  Draft: "text-amber-500 dark:text-amber-400",
};

const INTENT_COLORS: Record<string, string> = {
  "Tour Package": "bg-blue-50 text-blue-700 border-blue-200",
  "Visa Assistance": "bg-violet-50 text-violet-700 border-violet-200",
  "Hotel Booking": "bg-sky-50 text-sky-700 border-sky-200",
  "Flight Booking": "bg-amber-50 text-amber-700 border-amber-200",
  "Travel Insurance": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Other": "bg-gray-100 text-gray-600 border-gray-200",
};

function ContactModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white dark:bg-dk-surface rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-linear-to-r from-[#00B5A3] via-[#00B5A3] to-[#f2836f]" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dk-stroke">
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Inquiry Details</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(contact.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-400 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#00B5A3] via-[#00B5A3] to-[#f2836f] flex items-center justify-center shrink-0">
              <span className="text-white text-[13px] font-bold">{initials(contact.name)}</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{contact.name}</p>
              <p className="text-[12px] text-[#00B5A3] font-semibold">{contact.business_name}</p>
            </div>
          </div>
          <span className={`text-[10.5px] font-semibold px-3 py-1 rounded-full border w-fit ${INTENT_COLORS[contact.intent] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {contact.intent}
          </span>
          <div className="h-px bg-gray-100 dark:bg-dk-stroke" />
          <div className="flex flex-col gap-3">
            {[
              { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
              { icon: MessageSquare, label: "Phone", value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined },
              { icon: Globe, label: "Destination", value: contact.business_name, href: undefined },
            ].map(({ icon: Icon, label, value, href }) => value ? (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-dk-raised border border-gray-100 dark:border-dk-stroke flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-[12px] text-[#00B5A3] font-medium truncate hover:underline flex items-center gap-1">
                      {value}{href.startsWith("http") && <ExternalLink size={9} />}
                    </a>
                  ) : (
                    <p className="text-[12px] text-gray-700 dark:text-gray-300 font-medium truncate">{value}</p>
                  )}
                </div>
              </div>
            ) : null)}
          </div>
          <div className="h-px bg-gray-100 dark:bg-dk-stroke" />
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">Details</p>
            <div className="bg-blue-50/40 dark:bg-dk-raised border-l-2 border-[#00B5A3] rounded-r-xl p-4">
              <p className="text-[12.5px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{contact.challenge}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00B5A3] text-white text-[12.5px] font-semibold hover:bg-[#009d8d] transition-colors">
              <Mail size={13} /> Reply via Email
            </a>
            {contact.phone && (
              <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-[12.5px] font-semibold hover:bg-emerald-50 transition-colors">
                <MessageSquare size={13} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const { userName, role } = useUser();
  const { company } = useCompany();
  const canReviewSignups = canViewUsers(role);
  const [greeting, setGreeting] = useState("");
  const [props, setProps] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.resolve().then(() => setGreeting(getGreeting())); }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      supabase
        .from("ac_listings_travel")
        .select("id, title, listing_type, city, price, status, image_urls, created_at")
        .eq("company", company.label)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setProps(data.map((r) => ({
              ...r,
              city: Array.isArray(r.city) ? (r.city[0] ?? "") : (r.city ?? ""),
              image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
            })));
          }
          setLoading(false);
        });
    });
  }, [company.label]);

  // ── Contact inquiries (live, from the public /contact form) ──────────────
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const prevContactIds = useRef<Set<string>>(new Set());

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`/api/admin/contacts?company=${encodeURIComponent(company.label)}`).catch(() => null);
    if (!res?.ok) { setContactsLoading(false); return; }
    const { contacts: data } = (await res.json()) as { contacts: Contact[] };
    if (!Array.isArray(data)) { setContactsLoading(false); return; }
    setContacts(data);
    prevContactIds.current = new Set(data.map((c) => c.id));
    setContactsLoading(false);
  }, [company.label]);

  useEffect(() => {
    Promise.resolve().then(fetchContacts);
    const id = setInterval(fetchContacts, 15_000);
    return () => clearInterval(id);
  }, [fetchContacts]);

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.intent.toLowerCase().includes(q);
  });
  const [now] = useState(() => Date.now());
  const newContactsThisWeek = useMemo(() => {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return contacts.filter((c) => new Date(c.created_at).getTime() >= weekAgo).length;
  }, [contacts, now]);

  // ── Registration requests (pending ac_users, from /signup) ───────────────
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingActingId, setPendingActingId] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    if (!canReviewSignups) { setPendingLoading(false); return; }
    const res = await fetch(`/api/admin/users?company=${encodeURIComponent(company.label)}`).catch(() => null);
    if (!res?.ok) { setPendingLoading(false); return; }
    const { users } = (await res.json()) as { users: (PendingUser & { status: string })[] };
    setPendingUsers((users ?? []).filter((u) => u.status === "Pending"));
    setPendingLoading(false);
  }, [company.label, canReviewSignups]);

  useEffect(() => {
    Promise.resolve().then(fetchPendingUsers);
    if (!canReviewSignups) return;
    const id = setInterval(fetchPendingUsers, 15_000);
    return () => clearInterval(id);
  }, [fetchPendingUsers, canReviewSignups]);

  async function handleApprovePending(id: string) {
    setPendingActingId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Active" }),
    }).catch(() => null);
    setPendingUsers((p) => p.filter((u) => u.id !== id));
    setPendingActingId(null);
  }

  async function handleRejectPending(id: string) {
    setPendingActingId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" }).catch(() => null);
    setPendingUsers((p) => p.filter((u) => u.id !== id));
    setPendingActingId(null);
  }

  const stats = useMemo(() => {
    const total = props.length;
    const available = props.filter((p) => p.status === "Active").length;
    const sold = props.filter((p) => p.status === "Sold Out").length;
    const locations = new Set(props.filter((p) => p.city).map((p) => p.city)).size;

    const typeCount: Record<string, number> = {};
    props.forEach((p) => { if (p.listing_type) typeCount[p.listing_type] = (typeCount[p.listing_type] || 0) + 1; });

    const cityCount: Record<string, number> = {};
    props.forEach((p) => { if (p.city) cityCount[p.city] = (cityCount[p.city] || 0) + 1; });

    const prices = props.map((p) => parsePrice(p.price)).filter((n) => n > 0);
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    return { total, available, sold, locations, typeCount, cityCount, avgPrice, maxPrice };
  }, [props]);

  const recent = props.slice(0, 5);
  const topTypes = Object.entries(stats.typeCount).sort((a, b) => b[1] - a[1]);
  const topCities = Object.entries(stats.cityCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxType = Math.max(...Object.values(stats.typeCount), 1);
  const maxCity = Math.max(...topCities.map(([, n]) => n), 1);

  const KPIS = [
    {
      label: "Total Inquiries", value: contactsLoading ? "—" : String(contacts.length),
      change: `${newContactsThisWeek} this week`, up: newContactsThisWeek > 0,
      icon: Inbox, bg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-[#00B5A3]",
    },
    {
      label: "Total Listings", value: loading ? "—" : String(stats.total),
      change: `${stats.available} available`, up: stats.available > 0,
      icon: Building2, bg: "bg-violet-50 dark:bg-violet-900/20", iconColor: "text-violet-500",
    },
    {
      label: "Sold Out", value: loading ? "—" : String(stats.sold),
      change: stats.total ? `${Math.round((stats.sold / stats.total) * 100)}% of catalog` : "—",
      up: stats.sold > 0, icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-500",
    },
    {
      label: "Locations", value: loading ? "—" : String(stats.locations),
      change: "cities covered", up: stats.locations > 0,
      icon: Globe, bg: "bg-sky-50 dark:bg-sky-900/20", iconColor: "text-sky-500",
    },
  ];

  const QUICK_ACTIONS = [
    { icon: Plus, label: "Add Listing", sub: "List a new hotel, tour, or package", href: "/dashboard/listings" },
    { icon: Building2, label: "View All Listings", sub: "Manage your catalog", href: "/dashboard/listings" },
    { icon: Globe, label: "Edit Pages", sub: "Update pages, hero & sections", href: "/dashboard/pages" },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">

      {selectedContact && <ContactModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">
            {greeting ? `${greeting}, ${userName ? userName.split(" ")[0] : "there"}` : " "}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Here&apos;s the state of your travel listings.
          </p>
        </div>
        <Link href="/dashboard/listings" className="inline-flex items-center gap-1.5 btn-primary-sm shrink-0">
          <Plus size={13} /> Add Listing
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ label, value, change, up, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <span className={`flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-full ${
                up ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-gray-50 dark:bg-dk-raised text-gray-400 dark:text-gray-500"
              }`}>
                {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {change}
              </span>
            </div>
            <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5">{value}</p>
            <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Contact Inquiries + Registration Requests */}
      <div className={`grid grid-cols-1 gap-4 ${canReviewSignups ? "xl:grid-cols-3" : ""}`}>
        <div className={`bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden flex flex-col ${canReviewSignups ? "xl:col-span-2" : ""}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-dk-stroke gap-3 flex-wrap">
            <div>
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Contact Inquiries</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {contactsLoading ? "Loading…" : `${contacts.length} total · live`}
              </p>
            </div>
            <div className="relative flex items-center">
              <Search size={11} className="absolute left-3 text-gray-400" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Filter by name or intent…"
                className="pl-8 pr-3 py-1.5 text-[11.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 w-40 sm:w-48 placeholder:text-gray-400 transition-all"
              />
            </div>
          </div>

          {contactsLoading ? (
            <div className="px-6 py-10 text-center"><p className="text-[12px] text-gray-400">Loading inquiries…</p></div>
          ) : filteredContacts.length === 0 ? (
            <div className="px-6 py-10 text-center flex flex-col items-center gap-3">
              <Inbox size={24} className="text-gray-200 dark:text-gray-700" />
              <p className="text-[12px] text-gray-400">
                {contacts.length === 0 ? "No inquiries yet — form submissions appear here." : "No inquiries match your filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50/80 dark:divide-gray-800">
              {filteredContacts.slice(0, 6).map((c) => (
                <div key={c.id} onClick={() => setSelectedContact(c)} className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#00B5A3] via-[#00B5A3] to-[#f2836f] flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-bold">{initials(c.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{c.business_name}</p>
                  </div>
                  <span className={`hidden xl:inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${INTENT_COLORS[c.intent] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {c.intent}
                  </span>
                  <div className="hidden xl:flex items-center gap-2 shrink-0">
                    <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-dk-raised flex items-center justify-center hover:bg-blue-50 hover:text-[#00B5A3] text-gray-400 transition-colors">
                      <Mail size={11} />
                    </a>
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-dk-raised flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 text-gray-400 transition-colors">
                        <MessageSquare size={11} />
                      </a>
                    )}
                  </div>
                  <ChevronRight size={13} className="text-gray-200 dark:text-gray-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
          {filteredContacts.length > 6 && (
            <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke mt-auto">
              <p className="text-[11px] text-gray-400">Showing 6 of {filteredContacts.length} inquiries</p>
            </div>
          )}
        </div>

        {canReviewSignups && (
          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Registration Requests</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {pendingLoading ? "Loading…" : `${pendingUsers.length} awaiting approval`}
              </p>
            </div>

            {pendingLoading ? (
              <div className="px-6 py-10 text-center"><p className="text-[12px] text-gray-400">Loading requests…</p></div>
            ) : pendingUsers.length === 0 ? (
              <div className="px-6 py-10 text-center flex flex-col items-center gap-3">
                <UserPlus size={24} className="text-gray-200 dark:text-gray-700" />
                <p className="text-[12px] text-gray-400">No pending sign-ups right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50/80 dark:divide-gray-800">
                {pendingUsers.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <span className="text-amber-700 dark:text-amber-400 text-[11px] font-bold">{initials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pendingActingId === u.id ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprovePending(u.id)}
                            title="Approve"
                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dk-raised flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <UserCheck size={13} />
                          </button>
                          {canManageUsers(role) && (
                            <button
                              onClick={() => handleRejectPending(u.id)}
                              title="Reject"
                              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dk-raised flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <UserX size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingUsers.length > 6 && (
              <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke mt-auto">
                <p className="text-[11px] text-gray-400">Showing 6 of {pendingUsers.length} requests</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions + Type breakdown + Top cities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Jump straight to a task</p>
          </div>
          <div className="p-3 flex flex-col gap-1">
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, href }) => (
              <Link key={label} href={href} className="group flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dk-raised text-left transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-[#00B5A3] transition-colors duration-300">
                  <Icon size={14} className="text-[#00B5A3] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 truncate">{label}</p>
                  <p className="text-[10.5px] text-gray-400 dark:text-gray-500">{sub}</p>
                </div>
                <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-[#00B5A3] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-5">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-[#00B5A3]" />
            <h2 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Category Breakdown</h2>
            <span className="ml-auto text-[10px] text-gray-400 font-medium">{stats.total} total</span>
          </div>
          <div className="flex flex-col gap-4">
            {topTypes.length > 0 ? topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 w-28 shrink-0 truncate">{type}</span>
                <div className="flex-1 bg-gray-100 dark:bg-dk-stroke rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#00B5A3] via-[#00B5A3] to-[#f2836f] rounded-full transition-all duration-700" style={{ width: `${(count / maxType) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-5 text-right shrink-0">{count}</span>
              </div>
            )) : <p className="text-[12px] text-gray-400">No listings yet.</p>}
          </div>
        </div>
      </div>

      {/* Top cities + Recent listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dk-raised rounded-2xl border border-gray-100 dark:border-dk-stroke p-5">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={15} className="text-[#00B5A3]" />
            <h2 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Top Cities</h2>
          </div>
          <div className="flex flex-col gap-3.5">
            {topCities.length > 0 ? topCities.map(([city, count], i) => (
              <div key={city} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 w-4 shrink-0 text-right">{i + 1}</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 flex-1 truncate">{city}</span>
                <div className="w-14 bg-gray-100 dark:bg-dk-stroke rounded-full h-1.5 overflow-hidden shrink-0">
                  <div className="h-full bg-[#00B5A3] rounded-full" style={{ width: `${(count / maxCity) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-4 text-right shrink-0">{count}</span>
              </div>
            )) : <p className="text-[12px] text-gray-400">No data yet.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-dk-raised rounded-2xl border border-gray-100 dark:border-dk-stroke p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Recent Listings</h2>
            <Link href="/dashboard/listings" className="text-[11px] text-[#00B5A3] font-bold hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-dk-stroke">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-dk-stroke animate-pulse shrink-0" />
                  <div className="flex-1 h-8 bg-gray-50 dark:bg-dk-stroke/60 rounded-lg animate-pulse" />
                </div>
              ))
            ) : recent.length > 0 ? recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-dk-stroke">
                  {p.image_urls[0] ? (
                    <Image src={p.image_urls[0]} alt={p.title} fill sizes="44px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home size={16} className="text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{p.title}</p>
                  <p className="text-[10.5px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-[#00B5A3] shrink-0" />
                    {p.city} · {p.listing_type}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-extrabold text-[#00B5A3]">{p.price}</p>
                  <span className={`text-[10px] font-bold ${statusColor[p.status] ?? "text-gray-400"}`}>{p.status}</span>
                </div>
              </div>
            )) : (
              <p className="text-[12px] text-gray-400 py-6 text-center">No listings yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
