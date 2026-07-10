"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Inbox } from "lucide-react";
import { useCompany } from "@/app/dashboard/CompanyContext";

interface Contact {
  id: string;
  name: string;
  business_name: string;
  intent: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { company } = useCompany();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [seenCount, setSeenCount] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`/api/admin/contacts?company=${encodeURIComponent(company.label)}`).catch(() => null);
    if (!res?.ok) return;
    const { contacts: data } = (await res.json()) as { contacts: Contact[] };
    if (Array.isArray(data)) {
      setContacts(data);
      setSeenCount((prev) => (prev === null ? data.length : prev));
    }
  }, [company.label]);

  useEffect(() => {
    Promise.resolve().then(fetchContacts);
    const id = setInterval(fetchContacts, 20_000);
    return () => clearInterval(id);
  }, [fetchContacts]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unread = seenCount === null ? 0 : Math.max(contacts.length - seenCount, 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); setSeenCount(contacts.length); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#00B5A3]/30 hover:text-[#00B5A3] hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00B5A3] border border-white dark:border-dk-stroke" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-72 bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-dk-stroke flex items-center justify-between">
            <p className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100">Notifications</p>
            <span className="text-[10.5px] text-gray-400">{contacts.length} inquiries</span>
          </div>
          {contacts.length === 0 ? (
            <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
              <Inbox size={20} className="text-gray-200 dark:text-gray-700" />
              <p className="text-[11.5px] text-gray-400">No inquiries yet.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-dk-stroke">
              {contacts.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setOpen(false); router.push("/dashboard"); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-dk-raised/50 transition-colors"
                >
                  <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name} — {c.intent}</p>
                  <p className="text-[10.5px] text-gray-400 mt-0.5">{c.business_name} · {timeAgo(c.created_at)}</p>
                </button>
              ))}
            </div>
          )}
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-[11.5px] font-semibold text-[#00B5A3] hover:bg-gray-50 dark:hover:bg-dk-raised border-t border-gray-50 dark:border-dk-stroke transition-colors"
          >
            View all on Overview
          </Link>
        </div>
      )}
    </div>
  );
}
