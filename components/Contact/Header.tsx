"use client";

import Image from "next/image";
import { useCmsSection, splitTitle } from "@/lib/useCmsSection";

const ContactHeader = () => {
  const cms = useCmsSection("contact", 1);

  const { main, accent } = cms?.title
    ? splitTitle(cms.title)
    : { main: "We're Always", accent: "Here for You" };

  const bgImage = cms?.images?.[0] ?? null;

  return (
    <section className="relative bg-gray-950 overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {bgImage && (
        <Image src={bgImage} alt="" fill className="object-cover opacity-25" priority />
      )}

      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />
      {!bgImage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_12%_50%,rgba(242,131,111,0.10),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_88%_50%,rgba(0,181,163,0.07),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[72px_72px]" />
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-[#f2836f]/20 via-[#00B5A3]/15 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-8 md:px-16">
        <p className="text-[#f2836f] text-[12px] md:text-[13px] font-semibold uppercase tracking-[0.32em] mb-5 drop-shadow-[0_0_10px_rgba(242,131,111,0.4)]">
          {cms?.subtitle ?? "Get in Touch"}
        </p>
        <h1 className="cursive text-4xl md:text-6xl font-semibold text-white leading-[1.07] tracking-tight max-w-xl mb-5">
          {main}{main ? " " : ""}<span className="text-[#f2836f]">{accent}</span>
        </h1>
        <p className="text-white/60 text-[14px] font-light leading-relaxed max-w-md">
          {cms?.description ?? "Got a question about your trip, need a custom itinerary, or want to partner with us? Our Dubai-based team will get back to you within one business day."}
        </p>
      </div>
    </section>
  );
};

export default ContactHeader;
