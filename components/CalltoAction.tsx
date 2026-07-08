"use client";

import { FaArrowRight } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { useCmsSection, splitTitle } from "@/lib/useCmsSection";

const FALLBACK = {
  eyebrow: "Your Journey Awaits",
  title: "Make Your Dreams a Reality.",
  body: "Start your next journey with confidence. From personalized itineraries to seamless bookings, we help you turn your travel goals into real experiences — effortlessly and beautifully.",
  image: "/hallstatt.jpeg",
};

const CallToAction = () => {
  const cms = useCmsSection("global", 1);

  const eyebrow = cms?.subtitle || FALLBACK.eyebrow;
  const title = cms?.title || FALLBACK.title;
  const body = cms?.description || FALLBACK.body;
  const image = cms?.images?.[0] || FALLBACK.image;
  const { main, accent } = splitTitle(title);

  return (
    <div className="bg-gradient-to-t from-[#f9f0ee] to-white text-gray-800">
      <div className="max-w-6xl mx-auto py-14 xl:py-20 px-8 md:px-14 xl:px-0">
        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_30px_80px_rgba(242,131,111,0.3)] transition-shadow duration-700 min-h-[420px] lg:min-h-[480px]">

          {/* Full Background Image */}
          <Image
            src={image}
            alt="Hallstatt village lake scenery"
            fill
            className="object-cover object-center"
          />

          {/* Mist overlay — fades from left (heavy) to right (clear) */}
          <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-transparent" />

          {/* Subtle warm tint on the left for brand color */}
          <div className="absolute inset-0 bg-linear-to-r from-[#f2836f]/20 via-[#f2836f]/25 to-black/80" />

          {/* Content — sits on the left over the mist */}
          <div className="relative z-10 flex flex-col justify-center h-full min-h-[420px] lg:min-h-[480px] px-8 md:px-14 lg:px-16 py-14 lg:w-[55%] xl:w-[48%]">
            {/* Eyebrow label */}
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#f2836f] mb-4">
              {eyebrow}
            </span>

            <h2 className="cursive text-4xl xl:text-5xl font-extrabold leading-tight text-black/70 mb-5">
              {main && `${main} `}
              <span className="text-[#f2836f]">{accent}</span>
            </h2>

            <p className="text-sm xl:text-base text-gray-500 font-medium leading-relaxed mb-8 max-w-md">
              {body}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 text-sm 2xl:text-base">
              <Link
                href="https://wa.me/971529991223"
                className="select-none btn-primary-base"
              >
                Book Now <FaArrowRight size={16} />
              </Link>
              <Link href="/contact" className="select-none btn-primary-outline">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
