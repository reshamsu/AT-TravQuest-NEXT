"use client";

import { useEffect, useState } from "react";

// .env values — used as the day-one default and as a fallback for any field
// an admin hasn't overridden yet from /dashboard/settings.
export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "",
  company: process.env.NEXT_PUBLIC_COMPANY ?? "",

  contact: {
    email: process.env.NEXT_PUBLIC_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_PHONE ?? "",
    get phoneTel() {
      return this.phone.replace(/[^\d+]/g, "");
    },
  },

  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    defaultMessage: process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "",
  },

  social: {
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",
  },
} as const;

export interface SiteSettings {
  email: string;
  phone: string;
  phoneTel: string;
  whatsappNumber: string;
  whatsappMessage: string;
  instagramUrl: string;
  linkedinUrl: string;
  appName: string;
}

function toSiteSettings(overrides: Record<string, string>): SiteSettings {
  const phone = overrides.contact_phone || config.contact.phone;
  return {
    email: overrides.contact_email || config.contact.email,
    phone,
    phoneTel: phone.replace(/[^\d+]/g, ""),
    whatsappNumber: overrides.whatsapp_number || config.whatsapp.number,
    whatsappMessage: overrides.whatsapp_message || config.whatsapp.defaultMessage,
    instagramUrl: overrides.instagram_url || config.social.instagramUrl,
    linkedinUrl: overrides.linkedin_url || config.social.linkedinUrl,
    appName: overrides.app_name || config.appName,
  };
}

const ENV_DEFAULTS = toSiteSettings({});

// Public contact details (email/phone/whatsapp/socials), editable from
// /dashboard/settings and stored in the at_settings table. Starts from the
// .env defaults (no loading flash) then overlays whatever's saved in the DB.
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(ENV_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => {
        if (!cancelled) setSettings(toSiteSettings(data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
