"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TbMail, TbMapPin, TbPhone, TbSend2 } from "react-icons/tb";
import Link from "next/link";

const FALLBACK_IMAGES = ["/assets/hero/.jpg"];

interface ContactForm {
  full_name: string;
  email: string;
  phone: string;
  best_reason: string;
  inquiry_subject: string;
  inquiry_message: string;
}

const Page = () => {
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);
  const [title, setTitle] = useState("Get in Touch");
  const [subtitle, setSubtitle] = useState(
    "We're here to assist you with any inquiries.",
  );
  const [introTitle, setIntroTitle] = useState(
    "We are here to support your journey...",
  );
  const [introSubtitle, setIntroSubtitle] = useState("CONNECT");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<ContactForm>({
    full_name: "",
    email: "",
    phone: "",
    best_reason: "",
    inquiry_subject: "",
    inquiry_message: "",
  });

  /* ── fetch hero + intro data ── */
  useEffect(() => {
    if (!supabase) return;

    const fetchHero = async () => {
      const [heroRes, sectionRes] = await Promise.all([
        supabase
          .from("ac_heroes")
          .select("title, subtitle, images")
          .eq("page_id", "contact")
          .single(),
        supabase
          .from("ac_sections")
          .select("title, subtitle")
          .eq("page_id", "contact")
          .eq("section_number", 1)
          .single(),
      ]);

      const hero = heroRes.data;
      const section = sectionRes.data;

      if (hero?.images?.length) setImages(hero.images);
      if (hero?.title) setTitle(hero.title);
      if (hero?.subtitle) setSubtitle(hero.subtitle);
      if (section?.title) setIntroTitle(section.title);
      if (section?.subtitle) setIntroSubtitle(section.subtitle);

      if (!hero && !section) {
        console.warn("Using fallback hero content");
      }
    };

    fetchHero();
  }, []);

  /* ── image carousel ── */
  useEffect(() => {
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % images.length),
      10000,
    );
    return () => clearInterval(interval);
  }, [images.length]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("contact")
      .insert([
        {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          best_reason: form.best_reason,
          inquiry_subject: form.inquiry_subject,
          inquiry_message: form.inquiry_message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error.message);
      setMessage("Failed to submit. Please try again.");
      setLoading(false);
      return;
    }

    setMessage("Message sent successfully!");
    setForm({
      full_name: "",
      email: "",
      phone: "",
      best_reason: "",
      inquiry_subject: "",
      inquiry_message: "",
    });

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-b from-[#f2836f]/40 via-[#f2836f]/30 to-white text-gray-700">
      {/* ── HERO ── */}
      <div className="relative h-[74vh] w-full overflow-hidden flex items-center justify-center text-center">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#f2836f]/25 via-[#f2836f]/10 to-black/50 transition-all duration-1000" />
          </div>
        ))}

        <motion.div
          className="max-w-6xl mx-auto absolute inset-0 flex flex-col justify-center items-center gap-3 2xl:gap-4 text-white/80 z-10 px-6 md:px-10 2xl:px-0"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="playfair text-5xl 2xl:text-6xl font-semibold leading-tight line-clamp-2">
            {title}
          </h1>
          <p className="text-xs 2xl:text-sm text-gray-200 max-w-3xl">
            {subtitle}
          </p>
        </motion.div>
      </div>

      {/* ── FORM CARD ── */}
      <motion.div
        className="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto mb-20 -mt-25 2xl:-mt-40 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-4 md:p-10 2xl:px-6 lg:shadow-xl border-2 border-gray-100 rounded-4xl relative z-30"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── LEFT — intro info ── */}
        <motion.div
          className="bg-gray-50 border-2 border-gray-100 shadow-md rounded-3xl p-6 md:p-8 flex flex-col gap-12"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-1 text-[11px] 2xl:text-sm w-fit font-bold uppercase border border-[#f2836f]/20 bg-[#f2836f]/5 px-4 py-1.5 rounded-full backdrop-blur-sm text-[#f2836f]">
              {introSubtitle}
            </p>
            <h1 className="cursive text-3xl 2xl:text-4xl font-extrabold leading-tight line-clamp-2">
              {introTitle}
            </h1>
            <p className="text-xs 2xl:text-sm whitespace-break-spaces leading-relaxed max-w-2xl text-gray-500">
              Every listing handpicked by The TravQuest Travel &amp; Tourism
              Team, so you can invest with confidence.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Phone */}
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-white p-3 duration-700 rounded-2xl shadow-sm w-fit">
                <TbPhone
                  size={30}
                  className="text-3xl text-[#00B5A3] transition-all"
                />
              </div>
              <label className="flex flex-col gap-0.5 text-base 2xl:text-lg font-bold">
                Call Us
                <Link
                  href="https://wa.me/971529991223"
                  className="text-sm 2xl:text-base font-medium hover:underline"
                >
                  +971 52 999 1223
                </Link>
              </label>
            </div>

            {/* Email */}
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-white p-3 duration-700 rounded-2xl shadow-sm w-fit">
                <TbMail
                  size={30}
                  className="text-3xl text-[#00B5A3] transition-all"
                />
              </div>
              <label className="flex flex-col gap-0.5 text-base 2xl:text-lg font-bold">
                Email Us
                <Link
                  href="mailto:shihan.suhood@thetravquest.com"
                  className="text-sm 2xl:text-base font-medium hover:underline break-all"
                >
                  info@travquesttravel.com
                </Link>
              </label>
            </div>

            {/* Address */}
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-white p-3 duration-700 rounded-2xl shadow-sm w-fit">
                <TbMapPin
                  size={30}
                  className="text-3xl text-[#00B5A3] transition-all"
                />
              </div>
              <label className="flex flex-col gap-1 text-base 2xl:text-lg font-bold">
                Address
                <h3 className="text-sm font-medium">
                  PO Box 35195, Meydan Business Center,
                  <br />
                  Meydan Hotel, Dubai, U.A.E
                </h3>
              </label>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT — contact form ── */}
        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 py-4 md:py-6 px-4 md:px-0 rounded-3xl"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Full Name */}
          <div className="flex flex-col gap-3 w-full">
            <label className="font-bold text-sm">
              Full name<span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              type="text"
              placeholder="Your Full name"
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-3 w-full">
            <label className="font-bold text-sm">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="Your Email Address"
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 text-gray-800 w-full">
            {/* Phone */}
            <div className="flex flex-col gap-3 w-full">
              <label className="font-bold text-sm">
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="Your Phone Number"
                className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
                required
              />
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-3 w-full">
              <label className="font-bold text-sm">
                How can we assist you?<span className="text-red-500">*</span>
              </label>
              <select
                name="best_reason"
                value={form.best_reason}
                onChange={handleChange}
                className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
                required
              >
                <option value="" disabled>
                  Select option
                </option>
                <option value="Hotel Bookings">Hotel Bookings</option>
                <option value="Sightseeing Tours">Sightseeing Tours</option>
                <option value="Round Tour Packages">Round Tour Packages</option>
                <option value="Airport Transfers">Airport Transfers</option>
                <option value="Monthly Stay Apartments">
                  Monthly Stay Apartments
                </option>
                <option value="Visa Support">Visa Assistance</option>
                <option value="Meeting Venues">Meeting Venues</option>
                <option value="Flight Tickets">Flight Tickets</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-3 w-full">
            <label className="font-bold text-sm">
              Inquiry Subject<span className="text-red-500">*</span>
            </label>
            <input
              name="inquiry_subject"
              value={form.inquiry_subject}
              onChange={handleChange}
              type="text"
              placeholder="Your Purpose"
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-3 w-full">
            <label className="font-bold text-sm">
              Inquiry Message<span className="text-red-500">*</span>
            </label>
            <textarea
              name="inquiry_message"
              value={form.inquiry_message}
              onChange={handleChange}
              placeholder="Enter your message here"
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Feedback */}
          {message && (
            <p className="text-center text-sm font-semibold text-[#0099AD] w-full">
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="max-w-fit select-none btn-primary-base"
          >
            {loading ? "Sending..." : "Submit Message"} <TbSend2 size={24} />
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Page;