"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  MapPin,
  Compass,
  Star,
} from "lucide-react";

const FEATURES = [
  { icon: MapPin, label: "500+ curated destinations worldwide" },
  { icon: Compass, label: "Tailored tours & unique experiences" },
  { icon: Star, label: "Expert-guided travel, rated 5 stars" },
];

const inputCls =
  "w-full bg-transparent border-b border-[#e0d9cf] focus:border-[#f2836f] py-2 text-sm text-[#1a1a1a] placeholder:text-[#b0a89d] outline-none transition-colors duration-200";

const labelCls =
  "text-[10px] font-bold text-[#9e8e7e] tracking-widest uppercase";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="text-[10px] font-bold tracking-widest text-[#f2836f] uppercase whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-[#ede8e0]" />
    </div>
  );
}

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Unable to create your account.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-up is not configured yet.");
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: "/dashboard",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col w-[38%] relative overflow-hidden sticky top-0 h-screen">
        <Image
          src="/login.jpg"
          alt="BG"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,181,163,0.2)_0%,transparent_55%)]" />

        <Link href="/" className="relative z-10 flex items-center gap-2 p-10">
          <Image
            src="/favicon.ico"
            alt="TravQuest icon"
            width={52}
            height={36}
            className="object-contain"
          />
          <Image
            src="/tq-logo.png"
            alt="TravQuest"
            width={140}
            height={18}
            className="object-contain"
          />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-end px-12 pb-10">
          <p className="text-[#00B5A3] text-[10px] font-bold tracking-widest uppercase mb-3">
            Your Journey Starts Here
          </p>
          <h2 className="text-[2.2rem] font-bold text-white leading-tight mb-3">
            Your world of
            <br />
            travel awaits.
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm">
            Join travelers discovering destinations they love — curated
            tours, honest reviews, and rewards on every trip.
          </p>

          <div className="flex flex-wrap gap-2 mb-10">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
              >
                <Icon size={12} className="text-[#00B5A3] shrink-0" />
                <span className="text-white/75 text-xs">{label}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 mb-5" />
          <p className="text-white/30 text-xs tracking-wide">
            Explore · Discover · Adventure · Experience
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center bg-white px-8 sm:px-16 pt-20 pb-14 relative">
        <Link
          href="/"
          className="absolute top-6 left-4 flex items-center justify-center w-10 h-10 rounded-full hover:scale-125 duration-700 transition-all"
        >
          <ChevronLeft size={24} className="text-[#1a1a1a]/60" />
        </Link>

        <Link href="/" className="flex lg:hidden flex-col items-center gap-4 mb-10">
          <Image
            src="/favicon.ico"
            alt="TravQuest icon"
            width={60}
            height={40}
            className="object-contain"
          />
        </Link>

        <div className="w-full max-w-lg">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">
            Create your account
          </h1>
          <p className="text-xs text-[#9e8e7e] mb-8">
            Join TravQuest — your personal gateway to travel done right.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          {submitted ? (
            <div className="px-5 py-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                Account request submitted
              </p>
              <p className="text-xs text-emerald-700/70 mt-1.5 leading-relaxed">
                An admin needs to approve your access before you can sign in.
                You&apos;ll be able to log in with your email once that
                happens.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-xs font-semibold text-[#f2836f] hover:text-[#e06d59] transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Social signup */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex items-center justify-center gap-3 flex-1 py-2.5 px-4 rounded-xl bg-white border border-[#e8e2d9] hover:border-[#f2836f]/50 hover:shadow-sm text-sm font-semibold text-[#3d3128] transition-all duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M47.532 24.552c0-1.636-.132-3.228-.388-4.764H24.48v9.01h12.984c-.56 2.976-2.248 5.496-4.788 7.188v5.964h7.752c4.536-4.176 7.104-10.332 7.104-17.398z"
                      fill="#4285F4"
                    />
                    <path
                      d="M24.48 48c6.516 0 11.988-2.16 15.984-5.856l-7.752-5.964c-2.16 1.44-4.92 2.292-8.232 2.292-6.324 0-11.676-4.272-13.584-10.008H2.868v6.156C6.852 42.672 15.072 48 24.48 48z"
                      fill="#34A853"
                    />
                    <path
                      d="M10.896 28.464A14.388 14.388 0 0 1 10.08 24c0-1.548.264-3.048.816-4.464v-6.156H2.868A23.988 23.988 0 0 0 .48 24c0 3.876.924 7.548 2.388 10.62l8.028-6.156z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M24.48 9.528c3.564 0 6.756 1.224 9.276 3.624l6.948-6.948C36.468 2.376 30.996 0 24.48 0 15.072 0 6.852 5.328 2.868 13.38l8.028 6.156c1.908-5.736 7.26-10.008 13.584-10.008z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled
                  title="Apple sign-in coming soon"
                  className="flex items-center justify-center gap-3 flex-1 py-2.5 px-4 rounded-xl bg-white border border-[#e8e2d9] text-sm font-semibold text-[#b0a89d] cursor-not-allowed opacity-50"
                >
                  <svg width="15" height="18" viewBox="0 0 814 1000" fill="currentColor">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-37.3-166.8-111.6C121.2 726.2 65 547.3 65 389.8 65 102.2 247.8 0 414.4 0c80.4 0 148 43.1 198.6 43.1 48.3 0 123.3-46.6 213.1-46.6 33.6 0 113 3.2 169.5 85.7zm-126.7-98.6c-25.4 29-67.6 52.7-113.2 52.7-5.5 0-11-.5-16.5-1.4 1.5-27.6 12.8-56.3 34.2-79.3 20.7-22 65.1-47.3 108.7-52.3 1 6 1.5 12 1.5 16.5 0 28.4-11.1 56.2-14.7 63.8z" />
                  </svg>
                  Continue with Apple
                  <span className="ml-auto text-[10px] font-medium text-[#b0a89d] tracking-wide">Soon</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#ede8e0]" />
                <span className="text-xs text-[#b0a89d] font-medium">
                  or sign up with email
                </span>
                <div className="flex-1 h-px bg-[#ede8e0]" />
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleEmailSignup}>
                <SectionHeading title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="First Name">
                    <input
                      type="text"
                      placeholder="Jane"
                      className={inputCls}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      type="text"
                      placeholder="Smith"
                      className={inputCls}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" className={inputCls} />
                  </Field>
                  <Field label="Country">
                    <input
                      type="text"
                      placeholder="e.g. United Arab Emirates"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <SectionHeading title="Contact Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Email Address">
                    <input
                      type="email"
                      placeholder="jane@email.com"
                      className={inputCls}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      placeholder="+971 50 000 0000"
                      className={inputCls}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                </div>

                <SectionHeading title="Account Security" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Username">
                    <input
                      type="text"
                      placeholder="jane.smith"
                      className={inputCls}
                    />
                    <p className="text-[10px] text-[#b0a89d] mt-0.5">
                      Display only for now — sign in uses your email
                    </p>
                  </Field>
                  <Field label="Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={`${inputCls} pr-8`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-[#b0a89d] hover:text-[#f2836f] transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  <div className="sm:col-span-2 sm:max-w-[calc(50%-16px)]">
                    <Field label="Confirm Password">
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat your password"
                          className={`${inputCls} pr-8`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#b0a89d] hover:text-[#f2836f] transition-colors"
                        >
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm font-medium text-[#6b5e4e]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#f2836f] font-semibold hover:text-[#e06d59] transition-colors"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-8 text-center text-[11px] text-[#b0a89d] leading-relaxed">
            By continuing, you agree to TravQuest&apos;s{" "}
            <Link href="/terms" className="underline transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
