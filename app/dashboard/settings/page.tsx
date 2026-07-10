"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Settings, Bell, Shield, Zap, ChevronRight, Check, Upload, Loader2, AlertCircle,
} from "lucide-react";
import { useUser } from "@/app/dashboard/UserContext";
import { useCompany } from "@/app/dashboard/CompanyContext";
import { uploadImage as uploadToR2 } from "@/lib/upload";

const TABS = ["General", "Notifications", "Security", "Integrations"];

const inputCls =
  "w-full px-3.5 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";

const EMPLOYEE_RANGES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,001–5,000", "5,000+"];
const REVENUE_RANGES  = ["Under $100K", "$100K – $500K", "$500K – $1M", "$1M – $10M", "$10M – $50M", "$50M – $100M", "$100M+"];

interface CompanyDetails {
  registrationNo?: string;
  taxId?: string;
  employees?: string;
  website?: string;
  revenue?: string;
  state?: string;
  postalCode?: string;
  streetAddress?: string;
}

interface ContactSettings {
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  whatsapp_message: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
  notify_email: string;
  from_email: string;
  whatsapp_recipient: string;
  app_name: string;
}

const BLANK_CONTACT_SETTINGS: ContactSettings = {
  contact_email: "", contact_phone: "", whatsapp_number: "", whatsapp_message: "",
  instagram_url: "", facebook_url: "", linkedin_url: "", notify_email: "", from_email: "", whatsapp_recipient: "",
  app_name: "",
};

const CONTACT_SETTINGS_KEYS = Object.keys(BLANK_CONTACT_SETTINGS) as (keyof ContactSettings)[];

export default function SettingsPage() {
  const { userName, initials } = useUser();
  const { company } = useCompany();

  const [firstName, lastNameInitial] = (() => {
    const parts = userName.trim().split(/\s+/);
    return [parts[0] ?? "", parts.slice(1).join(" ")];
  })();

  const [activeTab, setActiveTab]         = useState("General");
  const [saved, setSaved]                 = useState(false);
  const [avatarUrl, setAvatarUrl]         = useState("");
  const [logoUrl, setLogoUrl]             = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [logoLoading, setLogoLoading]     = useState(false);
  const [firstNameField, setFirstNameField] = useState(firstName);
  const [lastNameField, setLastNameField]   = useState(lastNameInitial);
  const [email, setEmail]                 = useState("");
  const [jobTitle, setJobTitle]           = useState("");
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({});
  const [contactSettings, setContactSettings] = useState<ContactSettings>(BLANK_CONTACT_SETTINGS);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates:    true,
    supplierAlerts:  true,
    logistics:       true,
    weeklyReport:    false,
    marketingEmails: false,
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef   = useRef<HTMLInputElement>(null);

  const setCD = (k: keyof CompanyDetails, v: string) => setCompanyDetails((p) => ({ ...p, [k]: v }));
  const setCS = (k: keyof ContactSettings, v: string) => setContactSettings((p) => ({ ...p, [k]: v }));
  const profileIncomplete = Object.values(companyDetails).every((v) => !v?.trim());

  useEffect(() => {
    fetch(`/api/settings?keys=avatar_url,logo_url,${CONTACT_SETTINGS_KEYS.join(",")}`)
      .then((r) => r.json())
      .then((d: Record<string, string>) => {
        if (d.avatar_url) setAvatarUrl(d.avatar_url);
        if (d.logo_url)   setLogoUrl(d.logo_url);
        setContactSettings((p) => {
          const next = { ...p };
          for (const key of CONTACT_SETTINGS_KEYS) if (d[key]) next[key] = d[key];
          return next;
        });
      })
      .catch(() => {});

    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((d: { profile?: { name?: string; email?: string; job_title?: string; company_details?: CompanyDetails } }) => {
        if (d.profile?.name) {
          const parts = d.profile.name.trim().split(/\s+/);
          setFirstNameField(parts[0] ?? "");
          setLastNameField(parts.slice(1).join(" "));
        }
        if (d.profile?.email) setEmail(d.profile.email);
        if (d.profile?.job_title) setJobTitle(d.profile.job_title);
        if (d.profile?.company_details) setCompanyDetails(d.profile.company_details);
      })
      .catch(() => {});
  }, []);

  async function upload(file: File, key: "avatar_url" | "logo_url") {
    const setLoading = key === "avatar_url" ? setAvatarLoading : setLogoLoading;
    const setUrl     = key === "avatar_url" ? setAvatarUrl     : setLogoUrl;
    setLoading(true);
    try {
      const url = await uploadToR2(file, "settings");
      setUrl(url);
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: url }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeLogo() {
    setLogoLoading(true);
    try {
      setLogoUrl("");
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: "" }),
      });
    } finally {
      setLogoLoading(false);
    }
  }

  async function handleSave() {
    setSavingProfile(true);
    try {
      await Promise.all([
        fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: [firstNameField, lastNameField].filter(Boolean).join(" "),
            jobTitle,
            companyDetails,
          }),
        }),
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactSettings),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-7">

      {/* Hidden file inputs */}
      <input
        ref={avatarRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file, "avatar_url");
          e.target.value = "";
        }}
      />
      <input
        ref={logoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file, "logo_url");
          e.target.value = "";
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your account, preferences, and security settings.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={savingProfile}
          className={`btn-primary-sm flex items-center gap-1.5 transition-all disabled:opacity-60 ${saved ? "opacity-80" : ""}`}
        >
          {saved
            ? <><Check size={13} /> Saved</>
            : savingProfile
              ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
              : <><Settings size={13} /> Save Changes</>}
        </button>
      </div>

      {activeTab === "General" && profileIncomplete && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 max-w-2xl">
          <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11.5px] font-semibold text-amber-700 dark:text-amber-400">Complete your company profile</p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
              Add your registration number, tax ID, and other company details in the card below.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dk-raised p-1 rounded-xl overflow-x-auto w-full sm:w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-white dark:bg-dk-surface text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {activeTab === "General" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profile Information */}
            <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
                <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Profile Information</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Update your name, email, and company details</p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full shrink-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="rounded-full object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#f2836f] flex items-center justify-center">
                        <span className="text-white text-[18px] font-bold">{initials || "U"}</span>
                      </div>
                    )}
                    {avatarLoading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <Loader2 size={14} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => avatarRef.current?.click()}
                      disabled={avatarLoading}
                      className="text-[11.5px] font-semibold text-[#00B5A3] hover:text-[#00B5A3] transition-colors disabled:opacity-50"
                    >
                      {avatarLoading ? "Uploading…" : "Change photo"}
                    </button>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">JPG, PNG or WebP. Max 2MB</p>
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstNameField}
                    onChange={(e) => setFirstNameField(e.target.value)}
                    placeholder="First name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastNameField}
                    onChange={(e) => setLastNameField(e.target.value)}
                    placeholder="Last name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    placeholder="you@email.com"
                    className={`${inputCls} opacity-70 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Company</label>
                  <input
                    type="text"
                    value={company.label}
                    readOnly
                    disabled
                    placeholder="Company"
                    className={`${inputCls} opacity-70 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job title"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
                <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Preferences</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Customise your dashboard experience</p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                {[
                  { label: "Language",    value: "English (UK)" },
                  { label: "Timezone",    value: "UTC+0 · London" },
                  { label: "Currency",    value: "GBP (£)" },
                  { label: "Date Format", value: "DD/MM/YYYY" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                    <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl cursor-pointer hover:border-[#00B5A3]/30 transition-all">
                      <span className="text-[12.5px] text-gray-700 dark:text-gray-200">{value}</span>
                      <ChevronRight size={13} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Company Details</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Optional — add these once your account is approved
              </p>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Business Registration No.</label>
                <input className={inputCls} placeholder="e.g. 12345678"
                  value={companyDetails.registrationNo ?? ""} onChange={(e) => setCD("registrationNo", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tax ID / VAT / EIN</label>
                <input className={inputCls} placeholder="Tax or VAT number"
                  value={companyDetails.taxId ?? ""} onChange={(e) => setCD("taxId", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Number of Employees</label>
                <select className={inputCls} value={companyDetails.employees ?? ""} onChange={(e) => setCD("employees", e.target.value)}>
                  <option value="">Select range</option>
                  {EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Company Website</label>
                <input type="url" className={inputCls} placeholder="https://yourcompany.com"
                  value={companyDetails.website ?? ""} onChange={(e) => setCD("website", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Annual Revenue (USD)</label>
                <select className={inputCls} value={companyDetails.revenue ?? ""} onChange={(e) => setCD("revenue", e.target.value)}>
                  <option value="">Select range</option>
                  {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">State / Province / Region</label>
                <input className={inputCls} placeholder="e.g. California"
                  value={companyDetails.state ?? ""} onChange={(e) => setCD("state", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">ZIP / Postal Code</label>
                <input className={inputCls} placeholder="e.g. 94105"
                  value={companyDetails.postalCode ?? ""} onChange={(e) => setCD("postalCode", e.target.value)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Street Address</label>
                <input className={inputCls} placeholder="123 Commerce Street, Suite 400"
                  value={companyDetails.streetAddress ?? ""} onChange={(e) => setCD("streetAddress", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Branding + Contact Details */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            {/* Branding */}
            <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
                <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Branding</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Shown in the dashboard, lead notification emails, and WhatsApp alerts
                </p>
              </div>
              <div className="px-6 pt-5">
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">App Name</label>
                <input className={`${inputCls} max-w-xs`} placeholder="e.g. AtlasB2B"
                  value={contactSettings.app_name} onChange={(e) => setCS("app_name", e.target.value)} />
              </div>
              <div className="px-6 py-5">
                <div className="flex items-start gap-5">
                  {/* Preview box */}
                  <div className="w-28 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-dk-stroke flex items-center justify-center shrink-0 bg-gray-50 dark:bg-dk-raised relative overflow-hidden">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Company logo"
                        fill
                        className="object-contain p-2"
                        sizes="112px"
                      />
                    ) : (
                      <Upload size={18} className="text-gray-300" />
                    )}
                    {logoLoading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-dk-raised/80 flex items-center justify-center">
                        <Loader2 size={16} className="text-[#00B5A3] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">Company Logo</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Shown in every lead notification email.<br />
                      JPG, PNG or WebP · Max 2MB · Recommended 300 × 80px
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => logoRef.current?.click()}
                        disabled={logoLoading}
                        className="flex items-center gap-2 text-[11.5px] font-semibold px-4 py-2 rounded-xl border border-[#00B5A3]/30 text-[#00B5A3] hover:bg-[#00B5A3]/5 transition-all w-fit disabled:opacity-50"
                      >
                        <Upload size={12} />
                        {logoLoading ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
                      </button>
                      {logoUrl && (
                        <button
                          onClick={removeLogo}
                          disabled={logoLoading}
                          className="flex items-center gap-1.5 text-[11.5px] font-semibold px-4 py-2 rounded-xl border border-red-200 dark:border-red-800/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-fit disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {logoUrl && (
                      <p className="text-[10px] text-gray-300 font-mono truncate max-w-xs">{logoUrl}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
                <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Contact Details</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Synced from your .env defaults — shown on your public site and used for lead notifications. Edit and save to override.
                </p>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Public Email</label>
                  <input type="email" className={inputCls} placeholder="hello@yourcompany.com"
                    value={contactSettings.contact_email} onChange={(e) => setCS("contact_email", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Number</label>
                  <input className={inputCls} placeholder="e.g. 447700900000 (digits only)"
                    value={contactSettings.whatsapp_number} onChange={(e) => setCS("whatsapp_number", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Public Phone</label>
                  <input type="tel" className={inputCls} placeholder="+1 234 567 8900"
                    value={contactSettings.contact_phone} onChange={(e) => setCS("contact_phone", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Default Message</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Hi! I'd like to know more…"
                    value={contactSettings.whatsapp_message} onChange={(e) => setCS("whatsapp_message", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Instagram URL</label>
                  <input type="url" className={inputCls} placeholder="https://instagram.com/yourcompany"
                    value={contactSettings.instagram_url} onChange={(e) => setCS("instagram_url", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Facebook URL</label>
                  <input type="url" className={inputCls} placeholder="https://facebook.com/yourcompany"
                    value={contactSettings.facebook_url} onChange={(e) => setCS("facebook_url", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">LinkedIn URL</label>
                  <input type="url" className={inputCls} placeholder="https://linkedin.com/company/yourcompany"
                    value={contactSettings.linkedin_url} onChange={(e) => setCS("linkedin_url", e.target.value)} />
                </div>

                <div className="sm:col-span-2 pt-3 mt-1 border-t border-gray-50 dark:border-dk-stroke">
                  <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Lead Notification Routing</p>
                  <p className="text-[10.5px] text-gray-400 mt-0.5 mb-1">Where new leads and registration requests get sent</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Notify Email</label>
                  <input type="email" className={inputCls} placeholder="admin@yourcompany.com"
                    value={contactSettings.notify_email} onChange={(e) => setCS("notify_email", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">&quot;From&quot; Sender Name / Email</label>
                  <input className={inputCls} placeholder="Your Company <no-reply@yourcompany.com>"
                    value={contactSettings.from_email} onChange={(e) => setCS("from_email", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Notification Recipient</label>
                  <input className={inputCls} placeholder="e.g. 447700900000"
                    value={contactSettings.whatsapp_recipient} onChange={(e) => setCS("whatsapp_recipient", e.target.value)} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "Notifications" && (
        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Notification Preferences</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Choose what you want to be notified about</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { key: "orderUpdates",    icon: Settings, label: "Order Updates",    sub: "Get notified when order status changes"      },
              { key: "supplierAlerts",  icon: Bell,     label: "Supplier Alerts",  sub: "New supplier registrations and updates"      },
              { key: "logistics",       icon: Bell,     label: "Logistics",        sub: "Shipment tracking and delivery alerts"       },
              { key: "weeklyReport",    icon: Bell,     label: "Weekly Report",    sub: "Weekly performance summary email"            },
              { key: "marketingEmails", icon: Bell,     label: "Marketing Emails", sub: "Product updates and announcements"           },
            ].map(({ key, icon: Icon, label, sub }) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00B5A3]/8 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[#00B5A3]" />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-[10.5px] text-gray-400">{sub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                    notifications[key as keyof typeof notifications] ? "bg-[#00B5A3]" : "bg-gray-200 dark:bg-dk-stroke"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      notifications[key as keyof typeof notifications] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Security ── */}
      {activeTab === "Security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                <div key={label}>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
              ))}
              <button className="btn-primary-sm w-full justify-center mt-1">Update Password</button>
            </div>
          </div>

          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
              <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <Shield size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[12.5px] font-semibold text-emerald-800 dark:text-emerald-400">2FA is enabled</p>
                  <p className="text-[10.5px] text-emerald-600 dark:text-emerald-500">Authenticator app is active</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-2 rounded-xl border border-gray-200 dark:border-dk-stroke bg-white dark:bg-dk-raised text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-all w-fit">
                Manage 2FA
              </button>

              <div className="pt-2 border-t border-gray-50 dark:border-dk-stroke">
                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 mb-3">Active Sessions</p>
                {[
                  { device: "Chrome · macOS",   location: "London, UK", current: true  },
                  { device: "Safari · iPhone",   location: "London, UK", current: false },
                ].map(({ device, location, current }) => (
                  <div key={device} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-[12px] font-medium text-gray-800 dark:text-gray-200">
                        {device}{" "}
                        {current && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">current</span>}
                      </p>
                      <p className="text-[10.5px] text-gray-400">{location}</p>
                    </div>
                    {!current && (
                      <button className="text-[10.5px] font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Integrations ── */}
      {activeTab === "Integrations" && (
        <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
            <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">Connected Services</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Manage third-party service connections</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { name: "Google OAuth", desc: "Sign in with Google",   connected: true,  color: "bg-blue-100 dark:bg-blue-900/25 text-[#00B5A3]"     },
              { name: "Slack",        desc: "Notifications & alerts", connected: true,  color: "bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400" },
              { name: "Stripe",       desc: "Payment processing",    connected: false, color: "bg-violet-100 dark:bg-violet-900/25 text-violet-600 dark:text-violet-400"   },
              { name: "Zapier",       desc: "Workflow automation",   connected: false, color: "bg-rose-100 dark:bg-rose-900/25 text-rose-600 dark:text-rose-400"     },
            ].map(({ name, desc, connected, color }) => (
              <div key={name} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${color}`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">{name}</p>
                    <p className="text-[10.5px] text-gray-400">{desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connected && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>}
                  <button className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    connected
                      ? "border-red-200 dark:border-red-800/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "border-[#00B5A3]/30 text-[#00B5A3] hover:bg-[#00B5A3]/5"
                  }`}>
                    {connected ? "Disconnect" : <><Zap size={11} /> Connect</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
