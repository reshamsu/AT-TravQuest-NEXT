"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MessageCircle, ArrowUpRight, Check, MapPin } from "lucide-react";
import { useCmsSection, splitTitle } from "@/lib/useCmsSection";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  destination: string;
  service: string;
  message: string;
  subscribe: boolean;
}

const INITIAL: ContactForm = {
  name: "",
  email: "",
  phone: "",
  destination: "",
  service: "",
  message: "",
  subscribe: false,
};

const SERVICES = [
  { key: "Tour Package",       label: "Tour Package" },
  { key: "Visa Assistance",    label: "Visa Assistance" },
  { key: "Hotel Booking",      label: "Hotel Booking" },
  { key: "Flight Booking",     label: "Flight Booking" },
  { key: "Travel Insurance",   label: "Travel Insurance" },
  { key: "Other",              label: "Other / Not Sure" },
];

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#f2836f]/60 focus:ring-2 focus:ring-[#f2836f]/10 transition-colors duration-200";

const FALLBACK = {
  eyebrow: "Dubai's Travel Experts",
  title: "Plan Your Dream Trip.",
  body: "From custom tour packages to visa assistance — tell us about your travel plans and we'll get back to you within a few hours.",
  formTitle: "Request a Quote",
  formSubtitle: "Tell us about your travel plans — we'll respond within a few hours.",
};

export default function ContactForm() {
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm]           = useState<ContactForm>(INITIAL);

  const cms = useCmsSection("contact", 3);
  const eyebrow = cms?.subtitle || FALLBACK.eyebrow;
  const leftTitle = cms?.title || FALLBACK.title;
  const leftBody = cms?.description || FALLBACK.body;
  const formTitle = cms?.titles?.[1] || FALLBACK.formTitle;
  const formSubtitle = cms?.descriptions?.[1] || FALLBACK.formSubtitle;
  const { main, accent } = splitTitle(leftTitle);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service) {
      setMessage("Please select a service you're interested in.");
      return;
    }
    setLoading(true);
    setMessage("");

    // There's no dedicated subscribers table (and no DDL access to add one),
    // so the newsletter opt-in is folded into the inquiry message rather than
    // silently failing against a table that doesn't exist.
    const { subscribe, message, ...leadData } = form;
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadData,
        message: subscribe
          ? `${message}${message ? "\n\n" : ""}(Also opted in to the newsletter.)`
          : message,
      }),
    }).catch(() => null);

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setMessage(data?.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section
      id="contact"
      className="relative bg-[#111111] py-24 2xl:py-30 overflow-hidden"
    >
      <div className="absolute top-0 left-1/4 w-150 h-60 rounded-full bg-[#f2836f]/6 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-120 h-60 rounded-full bg-[#00B5A3]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 2xl:px-0">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px w-10 bg-[#f2836f]/50" />
          <span className="text-[#f2836f] text-[10px] font-bold tracking-[0.35em] uppercase">
            Contact Us
          </span>
        </div>

        {/* Card */}
        <div className="grid lg:grid-cols-[380px_1fr] rounded-3xl overflow-hidden border border-white/8">

          {/* ── LEFT: image + info overlay ── */}
          <div className="relative flex flex-col justify-between overflow-hidden min-h-105">
            <Image
              src="/contact.webp"
              alt="TravQuest Travel — Dubai"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 380px, 100vw"
            />
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-black/80" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#f2836f]/80 via-[#f2836f]/30 to-[#00B5A3]/40" />

            <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full gap-10">
              <div>
                <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-[#f2836f] bg-[#f2836f]/10 border border-[#f2836f]/25 px-4 py-1.5 rounded-full mb-5">
                  {eyebrow}
                </span>
                <h2 className="text-3xl font-bold uppercase text-white leading-tight tracking-wider mb-3">
                  {main && (
                    <>
                      {main}
                      <br />
                    </>
                  )}
                  <span className="text-[#f2836f]">{accent}</span>
                </h2>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                  {leftBody}
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: Phone,
                    href: "tel:+971529991223",
                    label: "+971 52 999 1223",
                    external: false,
                    teal: false,
                  },
                  {
                    icon: MessageCircle,
                    href: `https://wa.me/971529991223?text=${encodeURIComponent("Hi TravQuest! 👋\n\nI'd like to enquire about a travel package.\n\nCould we connect at your earliest convenience?")}`,
                    label: "WhatsApp Us",
                    external: true,
                    teal: true,
                  },
                  {
                    icon: Mail,
                    href: "mailto:info@travquesttravel.com",
                    label: "info@travquesttravel.com",
                    external: false,
                    teal: false,
                  },
                ].map(({ icon: Icon, href, label, external, teal }) => (
                  <Link
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-4 group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${teal ? "bg-[#00B5A3]/10 border border-[#00B5A3]/20 group-hover:bg-[#00B5A3]/20" : "bg-[#f2836f]/10 border border-[#f2836f]/20 group-hover:bg-[#f2836f]/20"}`}>
                      <Icon size={15} className={teal ? "text-[#00B5A3]" : "text-[#f2836f]"} />
                    </div>
                    <span className={`text-sm text-white/60 transition-colors duration-200 flex items-center gap-1.5 ${teal ? "group-hover:text-[#00B5A3]" : "group-hover:text-[#f2836f]"}`}>
                      {label}
                      {external && (
                        <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </Link>
                ))}

                {/* Address — separate so multi-line renders correctly */}
                <Link
                  href="https://maps.app.goo.gl/f8BFgTL4j6HWvfk49"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00B5A3]/10 border border-[#00B5A3]/20 flex items-center justify-center shrink-0 group-hover:bg-[#00B5A3]/20 transition-colors mt-0.5">
                    <MapPin size={15} className="text-[#00B5A3]" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-[#00B5A3] transition-colors duration-200 leading-relaxed">
                    PO Box 35195, Meydan Business Center,<br />
                    Meydan, Nad Al Sheba 1, Dubai,<br />
                    UAE, United Arab Emirates
                    <ArrowUpRight size={11} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>

                <div className="flex items-center gap-2.5 border border-white/10 rounded-xl px-4 py-2.5 bg-white/5 mt-2 w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <p className="text-[11px] text-white/40 font-semibold tracking-wide">
                    Open Mon – Sat · 9 AM – 6 PM GST
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: form or success ── */}
          {submitted ? (
            <div className="relative bg-[#0f0f0f] flex flex-col items-center justify-center text-center py-20 px-8 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_10%,rgba(242,131,111,0.07),transparent)] pointer-events-none" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-[#f2836f]/10 border border-[#f2836f]/30 flex items-center justify-center mb-5">
                <Check size={24} className="text-[#f2836f]" />
              </div>
              <h3 className="relative z-10 text-xl font-bold text-white uppercase tracking-wider mb-2">
                Enquiry Received.
              </h3>
              <p className="relative z-10 text-white/40 text-sm max-w-xs leading-relaxed">
                Our team will review your travel request and reach out shortly to
                help plan your perfect trip.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm(INITIAL); }}
                className="relative z-10 mt-6 text-[#f2836f] text-xs font-semibold tracking-widest uppercase hover:text-[#e06a55] transition-colors"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative bg-[#0f0f0f] p-8 md:p-10 flex flex-col gap-5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_10%,rgba(242,131,111,0.07),transparent)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_90%,rgba(0,181,163,0.05),transparent)] pointer-events-none" />
              <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-[#f2836f]/20 via-transparent to-[#00B5A3]/20" />
              <div className="relative z-10 mb-1">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wider mb-1">
                  {formTitle}
                </h3>
                <p className="text-white/40 text-sm">
                  {formSubtitle}
                </p>
              </div>

              {/* Service selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Service Interested In <span className="text-[#f2836f]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICES.map((svc) => (
                    <button
                      key={svc.key}
                      type="button"
                      onClick={() => setForm({ ...form, service: svc.key })}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer text-center leading-tight ${
                        form.service === svc.key
                          ? "border-[#f2836f]/50 bg-[#f2836f]/8 text-[#f2836f]"
                          : "border-white/10 bg-white/5 text-white/40 hover:border-[#f2836f]/30 hover:text-[#f2836f]"
                      }`}
                    >
                      {form.service === svc.key && (
                        <Check size={10} className="shrink-0" />
                      )}
                      {svc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    Your Name <span className="text-[#f2836f]">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Full name"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    Phone <span className="text-[#f2836f]">*</span>
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="+971 50 000 0000"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Email <span className="text-[#f2836f]">*</span>
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Destination / Country
                </label>
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  type="text"
                  placeholder="e.g. Maldives, Europe, Japan"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Additional Notes
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Travel dates, number of travellers, budget range, or any special requirements…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {message && (
                <p className={`text-xs font-semibold text-center px-4 py-3 rounded-xl border ${
                  message.startsWith("Something") || message.startsWith("Please")
                    ? "bg-[#f2836f]/10 text-[#f2836f] border-[#f2836f]/20"
                    : "bg-[#f2836f]/8 text-[#f2836f] border-[#f2836f]/20"
                }`}>
                  {message}
                </p>
              )}

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="subscribe"
                  checked={form.subscribe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border border-white/20 accent-[#f2836f] cursor-pointer"
                />
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                  Keep me updated with exclusive travel deals &amp; offers
                </span>
              </label>

              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send Request"}
                  {!loading && <ArrowUpRight size={15} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
