"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCmsSection, splitTitle } from "@/lib/useCmsSection";

const FAQS = [
  { q: "How do I book a tour or travel package?",             a: "The easiest way is via WhatsApp — tap 'Book Now' on any page and it opens a pre-filled chat. Alternatively, fill out the contact form above and our team will reach out to build a custom itinerary for you." },
  { q: "Do you offer visa assistance for UAE residents?",     a: "Yes. We assist UAE residents with tourist visas, visit visas, and entry permits for destinations worldwide. Processing times vary by country — contact us for specific requirements." },
  { q: "Can you arrange flights along with hotel bookings?",  a: "Absolutely. We offer complete travel packages including flights, hotels, transfers, and activities. We can also arrange standalone hotel or flight bookings if preferred." },
  { q: "How far in advance should I book my trip?",          a: "We recommend booking at least 2–4 weeks in advance for most destinations. Peak seasons (school holidays, Eid, summer) can book up quickly, so earlier is always better for the best availability and pricing." },
  { q: "Do you offer travel insurance?",                     a: "Yes, we can arrange comprehensive travel insurance covering medical emergencies, trip cancellations, and lost luggage. We strongly recommend it for international travel." },
  { q: "What destinations do you specialise in?",            a: "We cover destinations worldwide, with particular expertise in Southeast Asia, Europe, the Maldives, and African safaris. We also specialise in UAE staycations and GCC travel for UAE-based travellers." },
];

const ContactFAQ = () => {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const cms = useCmsSection("contact", 4);

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
    : { main: "Frequently Asked", accent: "Questions" };

  // Editable via the dashboard's Contact page section 4 (Titles = questions,
  // Descriptions = answers). Needs 2+ complete pairs before it overrides the
  // built-in defaults, since a single title/description pair there is more
  // often just the section heading above.
  const customFaqs = (cms?.titles ?? [])
    .map((q, i) => ({ q, a: cms?.descriptions?.[i] ?? "" }))
    .filter((f) => f.q.trim() && f.a.trim());
  const faqs = customFaqs.length > 1 ? customFaqs : FAQS;

  return (
    <section ref={ref} className="relative bg-white overflow-hidden">
      <style>{`
        @keyframes cfUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        .cf{opacity:0}
        .cf-in .cf-h{animation:cfUp 0.85s ease-out forwards}
        .cf-in .cf-1{animation:cfUp 0.7s 0.05s ease-out forwards}
        .cf-in .cf-2{animation:cfUp 0.7s 0.10s ease-out forwards}
        .cf-in .cf-3{animation:cfUp 0.7s 0.15s ease-out forwards}
        .cf-in .cf-4{animation:cfUp 0.7s 0.20s ease-out forwards}
        .cf-in .cf-5{animation:cfUp 0.7s 0.25s ease-out forwards}
        .cf-in .cf-6{animation:cfUp 0.7s 0.30s ease-out forwards}
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_0%,rgba(242,131,111,0.05),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_80%_100%,rgba(0,181,163,0.05),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-[#f2836f]/20 via-gray-200 to-[#00B5A3]/20" />

      <div className={`relative max-w-7xl mx-auto px-8 md:px-16 py-20 md:py-28 ${inView ? "cf-in" : ""}`}>
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="cf cf-h text-[#f2836f] text-[12px] font-semibold uppercase tracking-[0.32em] mb-4 drop-shadow-[0_0_10px_rgba(242,131,111,0.4)]">
            {cms?.subtitle ?? "FAQ"}
          </p>
          <h2 className="cf cf-h cursive text-3xl md:text-4xl font-semibold text-gray-900 leading-[1.07] tracking-tight mb-4">
            {main}{main ? " " : ""}<span className="text-[#f2836f]">{accent}</span>
          </h2>
          <p className="cf cf-h text-gray-400 text-[13.5px] font-light leading-relaxed">
            {cms?.description ?? "Can't find what you're looking for? Use the form above to get in touch with our Dubai team directly."}
          </p>
        </div>

        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {faqs.map(({ q, a }, i) => {
            const isTeal = i % 2 === 1;
            const chevronColor = isTeal ? "text-[#00B5A3]" : "text-[#f2836f]";
            const openBorder   = isTeal ? "border-l-4 border-l-[#00B5A3]/40" : "border-l-4 border-l-[#f2836f]/40";
            return (
              <div key={i} className={`cf cf-${i + 1} border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 ${openIdx === i ? `bg-white shadow-sm ${openBorder}` : "bg-gray-50"}`}>
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                >
                  <span className="text-gray-800 text-[14px] font-semibold leading-snug">{q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 ${chevronColor} transition-transform duration-300 ${openIdx === i ? "rotate-180" : ""}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-48" : "max-h-0"}`}>
                  <p className="px-6 pb-5 text-gray-500 text-[13px] leading-relaxed font-light">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactFAQ;
