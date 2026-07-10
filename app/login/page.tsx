"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef, Suspense } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  MapPin,
  Compass,
  Star,
  Mail,
  Smartphone,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const FEATURES = [
  { icon: MapPin, label: "500+ curated destinations worldwide" },
  { icon: Compass, label: "Tailored tours & unique experiences" },
  { icon: Star, label: "Expert-guided travel, rated 5 stars" },
];

type Step = "credentials" | "otp";
type OtpMethod = "email" | "totp";

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<Step>("credentials");
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [emailHint, setEmailHint] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [resending, setResending] = useState(false);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const unauthorized = errorParam === "unauthorized";
  const oauthError =
    errorParam === "oauth_failed" ||
    errorParam === "token_exchange_failed" ||
    errorParam === "profile_failed";
  const notConfigured = errorParam === "not_configured";
  const sessionNotConfigured = errorParam === "session_not_configured";
  const from = searchParams.get("from") || "/dashboard";
  const router = useRouter();

  const otpValue = otpDigits.join("");

  function resetOtp() {
    setOtpDigits(["", "", "", "", "", ""]);
    setError("");
    setTimeout(() => digitRefs.current[0]?.focus(), 50);
  }

  function handleDigitChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) digitRefs.current[idx + 1]?.focus();
  }

  function handleDigitKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      digitRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured yet.");
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: from,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      setEmailHint(data.hint ?? "");
      setDevOtp(data.devOtp ?? null);
      setEmailSent(data.emailSent ?? true);
      setStep("otp");
      resetOtp();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 6) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpValue, method: otpMethod }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        resetOtp();
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDevOtp(data.devOtp ?? null);
        setEmailSent(data.emailSent ?? true);
        resetOtp();
      } else {
        setError(data.error ?? "Could not resend code.");
      }
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden">
        {/* Background image */}
        <Image
          src="/login.jpg"
          alt="BG"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,181,163,0.2)_0%,transparent_55%)]" />

        {/* Logo */}
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

        {/* Body — pinned to bottom */}
        <div className="relative z-10 flex-1 flex flex-col justify-end px-12 pb-10">
          <p className="text-[#00B5A3] text-[10px] font-bold tracking-widest uppercase mb-3">
            Your Journey Starts Here
          </p>
          <h2 className="text-[2.6rem] font-bold text-white leading-tight mb-3">
            Discover another
            <br />
            destination.
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm">
            Handpicked destinations, curated tours, and unforgettable
            experiences — crafted just for you.
          </p>

          {/* Feature pills */}
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

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-14 relative bg-white">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-4 flex items-center justify-center w-10 h-10 rounded-full hover:scale-125 duration-700 transition-all"
        >
          <ChevronLeft size={24} className="text-[#1a1a1a]/60" />
        </Link>

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden flex-col items-center gap-4 mb-10">
          <Image
            src="/favicon.ico"
            alt="TravQuest icon"
            width={60}
            height={40}
            className="object-contain"
          />
        </Link>

        <div className="w-full max-w-sm">
          {unauthorized && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-semibold text-red-600">
                Access denied
              </p>
              <p className="text-[11px] text-red-500/80 mt-0.5">
                This account is not authorised to access TravQuest.
              </p>
            </div>
          )}
          {oauthError && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
              <p className="text-xs font-semibold text-orange-600">
                Sign-in failed
              </p>
              <p className="text-[11px] text-orange-500/80 mt-0.5">
                Google sign-in could not be completed. Please try again.
              </p>
            </div>
          )}
          {notConfigured && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs font-semibold text-amber-600">
                Google sign-in not set up
              </p>
              <p className="text-[11px] text-amber-500/80 mt-0.5">
                Add your Google OAuth credentials to{" "}
                <code className="font-mono">.env.local</code> to enable this.
              </p>
            </div>
          )}
          {sessionNotConfigured && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-semibold text-red-600">
                Sign-in is temporarily unavailable
              </p>
              <p className="text-[11px] text-red-500/80 mt-0.5">
                The server is missing its session signing key. Set{" "}
                <code className="font-mono">SESSION_SECRET</code> in this
                environment and try again.
              </p>
            </div>
          )}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          {/* STEP 1 — CREDENTIALS */}
          {step === "credentials" && (
            <>
              <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">
                Welcome back
              </h1>
              <p className="text-xs text-[#9e8e7e] mb-8">
                Sign in to your travel account
              </p>

              {/* Social login */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-white border border-[#e8e2d9] hover:border-[#f2836f]/50 hover:shadow-sm text-sm font-semibold text-[#3d3128] transition-all duration-200"
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
                  className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-white border border-[#e8e2d9] text-sm font-semibold text-[#b0a89d] cursor-not-allowed opacity-50"
                >
                  <svg width="15" height="18" viewBox="0 0 814 1000" fill="currentColor">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-37.3-166.8-111.6C121.2 726.2 65 547.3 65 389.8 65 102.2 247.8 0 414.4 0c80.4 0 148 43.1 198.6 43.1 48.3 0 123.3-46.6 213.1-46.6 33.6 0 113 3.2 169.5 85.7zm-126.7-98.6c-25.4 29-67.6 52.7-113.2 52.7-5.5 0-11-.5-16.5-1.4 1.5-27.6 12.8-56.3 34.2-79.3 20.7-22 65.1-47.3 108.7-52.3 1 6 1.5 12 1.5 16.5 0 28.4-11.1 56.2-14.7 63.8z" />
                  </svg>
                  Continue with Apple
                  <span className="ml-auto text-[10px] font-medium text-[#b0a89d] tracking-wide">Soon</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#ede8e0]" />
                <span className="text-xs text-[#b0a89d] font-medium">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-[#ede8e0]" />
              </div>

              {/* Form */}
              <form className="flex flex-col gap-5" onSubmit={handleCredentialsSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9e8e7e] tracking-widest uppercase">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border-b border-[#e0d9cf] focus:border-[#f2836f] py-2 text-sm text-[#1a1a1a] placeholder:text-[#b0a89d] outline-none transition-colors duration-200"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#9e8e7e] tracking-widest uppercase">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#f2836f] hover:text-[#e06d59] transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-transparent border-b border-[#e0d9cf] focus:border-[#f2836f] py-2 pr-8 text-sm text-[#1a1a1a] placeholder:text-[#b0a89d] outline-none transition-colors duration-200"
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
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-base mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 — OTP */}
          {step === "otp" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setDevOtp(null);
                }}
                className="flex items-center gap-1.5 text-xs text-[#9e8e7e] hover:text-[#1a1a1a] mb-8 transition-colors"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </button>

              <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">
                Verify your identity
              </h1>
              <p className="text-xs text-[#9e8e7e] mb-6">
                Choose how you&apos;d like to receive your verification code
              </p>

              <div className="flex rounded-xl border border-[#e8e2d9] overflow-hidden mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setOtpMethod("email");
                    resetOtp();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                    otpMethod === "email"
                      ? "bg-[#f2836f] text-white"
                      : "bg-white text-[#9e8e7e] hover:text-[#1a1a1a]"
                  }`}
                >
                  <Mail size={13} />
                  Email Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpMethod("totp");
                    resetOtp();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                    otpMethod === "totp"
                      ? "bg-[#f2836f] text-white"
                      : "bg-white text-[#9e8e7e] hover:text-[#1a1a1a]"
                  }`}
                >
                  <Smartphone size={13} />
                  Authenticator
                </button>
              </div>

              <div className="mb-6 px-4 py-3 rounded-xl bg-[#f7f4f0] border border-[#ede8e0]">
                {otpMethod === "email" ? (
                  <p className="text-xs text-[#6b5e4e]">
                    A 6-digit code was sent to{" "}
                    <span className="font-semibold text-[#1a1a1a]">
                      {emailHint}
                    </span>
                    . Check your inbox and spam folder.
                  </p>
                ) : (
                  <p className="text-xs text-[#6b5e4e]">
                    Open your authenticator app (Google Authenticator, Authy,
                    etc.) and enter the current 6-digit code for TravQuest.
                  </p>
                )}
              </div>

              {otpMethod === "email" && devOtp && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">
                    {emailSent ? "Debug code" : "Email delivery failed — showing code"}
                  </p>
                  <p className="text-sm font-mono font-bold text-amber-800 tracking-widest">
                    {devOtp}
                  </p>
                  {!emailSent && (
                    <p className="text-[10px] text-amber-600/80 mt-0.5">
                      Check the Resend configuration in .env.local.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                <label className="text-[10px] font-bold text-[#9e8e7e] tracking-widest uppercase block mb-3">
                  Verification Code
                </label>
                <div className="flex gap-2 mb-6">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleDigitPaste : undefined}
                      className={`w-full aspect-square text-center text-lg font-bold rounded-xl border-2 outline-none transition-colors duration-150 ${
                        digit
                          ? "border-[#f2836f] bg-[#fff3f0] text-[#f2836f]"
                          : "border-[#e0d9cf] bg-white text-[#1a1a1a] focus:border-[#f2836f]"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpValue.length < 6}
                  className="btn-primary-base w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Verifying..." : "Verify & Sign In"}
                </button>
              </form>

              {otpMethod === "email" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs text-[#f2836f] hover:text-[#e06d59] disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw
                      size={11}
                      className={resending ? "animate-spin" : ""}
                    />
                    {resending ? "Resending..." : "Resend code"}
                  </button>
                </div>
              )}
            </>
          )}

          {step === "credentials" && (
            <p className="mt-6 text-center text-sm font-medium text-[#6b5e4e]">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-[#f2836f] font-semibold hover:text-[#e06d59] transition-colors"
              >
                Create an account
              </Link>
            </p>
          )}

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

export default function Login() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
