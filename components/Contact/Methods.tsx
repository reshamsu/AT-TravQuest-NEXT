"use client";

import { useRef, useState, useEffect } from "react";
import { Phone, MessageCircle, Mail, Clock, MapPin } from "lucide-react";
import { useCmsSection, splitTitle } from "@/lib/useCmsSection";

const contacts = [
  { icon: Phone,         label: "Call Us",  value: "+971 52 999 1223",         href: "tel:+971529991223",               color: "coral" as const },
  { icon: MessageCircle, label: "WhatsApp", value: "+971 52 999 1223",         href: "https://wa.me/971529991223",      color: "teal"  as const },
  { icon: Mail,          label: "Email",    value: "info@travquesttravel.com", href: "mailto:info@travquesttravel.com", color: "coral" as const },
];

const CORAL = { text: "text-[#f2836f]", bg: "bg-[#f2836f]/5", bgHover: "group-hover:bg-[#f2836f]/10", border: "border-[#f2836f]/15", borderHover: "group-hover:border-[#f2836f]/30", cardBorderHover: "hover:border-[#f2836f]/25", line: "via-[#f2836f]" };
const TEAL  = { text: "text-[#00B5A3]", bg: "bg-[#00B5A3]/5", bgHover: "group-hover:bg-[#00B5A3]/10", border: "border-[#00B5A3]/15", borderHover: "group-hover:border-[#00B5A3]/30", cardBorderHover: "hover:border-[#00B5A3]/25", line: "via-[#00B5A3]" };

const ContactMethods = () => {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const cms = useCmsSection("contact", 2);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const { main, accent } = cms?.title
    ? splitTitle(cms.title)
    : { main: "Multiple Ways to", accent: "Reach Us" };

  return (
    <section ref={ref} className="relative bg-white overflow-hidden">
      <style>{`
        @keyframes cmUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        .cm{opacity:0}
        .cm-in .cm-h{animation:cmUp 0.85s ease-out forwards}
        .cm-in .cm-1{animation:cmUp 0.7s 0.1s ease-out forwards}
        .cm-in .cm-2{animation:cmUp 0.7s 0.2s ease-out forwards}
        .cm-in .cm-3{animation:cmUp 0.7s 0.3s ease-out forwards}
        .cm-in .cm-4{animation:cmUp 0.7s 0.4s ease-out forwards}
        .cm-in .cm-5{animation:cmUp 0.7s 0.5s ease-out forwards}
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_20%_0%,rgba(242,131,111,0.05),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_80%_100%,rgba(0,181,163,0.05),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#f2836f]/20 via-gray-200 to-[#00B5A3]/20" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className={`relative max-w-7xl mx-auto px-8 md:px-16 py-20 md:py-24 ${inView ? "cm-in" : ""}`}>
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="cm cm-h text-[#f2836f] text-[12px] font-semibold uppercase tracking-[0.32em] mb-4 drop-shadow-[0_0_10px_rgba(242,131,111,0.4)]">
            {cms?.subtitle ?? "Contact Options"}
          </p>
          <h2 className="cm cm-h cursive text-3xl md:text-4xl font-semibold text-gray-900 leading-[1.07] tracking-tight mb-4">
            {main}{main ? " " : ""}<span className="text-[#f2836f]">{accent}</span>
          </h2>
          <p className="cm cm-h text-gray-400 text-[13.5px] font-light leading-relaxed">
            {cms?.description ?? "Choose the channel that suits you best — we're available across phone, WhatsApp, and email from our Dubai office."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contacts.map(({ icon: Icon, label, value, href, color }, i) => {
            const c = color === "teal" ? TEAL : CORAL;
            return (
              <a
                key={label}
                href={href}
                className={`cm cm-${i + 1} group flex flex-col items-center text-center gap-4 bg-gray-50 hover:bg-white border border-gray-100 ${c.cardBorderHover} rounded-2xl p-7 transition-all duration-400 shadow-sm hover:shadow-md relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${c.line} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} ${c.bgHover} ${c.borderHover} flex items-center justify-center transition-all duration-300`}>
                  <Icon size={18} className={c.text} strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-[0.22em] mb-1">{label}</p>
                  <p className="text-gray-800 text-[13px] font-medium">{value}</p>
                </div>
              </a>
            );
          })}

          {/* Hours card — teal */}
          <div className="cm cm-4 flex flex-col items-center text-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-2xl bg-[#00B5A3]/5 border border-[#00B5A3]/15 flex items-center justify-center">
              <Clock size={18} className="text-[#00B5A3]" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-[0.22em] mb-1">Office Hours</p>
              <p className="text-gray-800 text-[13px] font-medium leading-relaxed">
                Mon–Fri 9am–6pm GST<br />Sat 10am–3pm GST
              </p>
            </div>
          </div>
        </div>

        {/* Address bar — full width */}
        <a
          href="https://maps.app.goo.gl/f8BFgTL4j6HWvfk49"
          target="_blank"
          rel="noopener noreferrer"
          className="cm cm-5 group flex items-center gap-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-[#f2836f]/20 rounded-2xl px-7 py-5 mt-2 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-[#f2836f]/30 via-[#00B5A3]/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          <div className="w-10 h-10 rounded-2xl bg-[#f2836f]/5 border border-[#f2836f]/15 group-hover:bg-[#f2836f]/10 group-hover:border-[#f2836f]/30 flex items-center justify-center shrink-0 transition-all duration-300">
            <MapPin size={17} className="text-[#f2836f]" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-[0.22em] mb-0.5">Our Office</p>
            <p className="text-gray-800 text-[13px] font-medium group-hover:text-gray-900 transition-colors">
              PO Box 35195, Meydan Business Center, Meydan, Nad Al Sheba 1, Dubai, UAE, United Arab Emirates
            </p>
          </div>
        </a>
      </div>
    </section>
  );
};

export default ContactMethods;
