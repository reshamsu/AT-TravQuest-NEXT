"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function GoogleProvider({ children }: { children: ReactNode }) {
  if (!clientId) {
    console.error(
      "[GoogleProvider] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. " +
        "Make sure it is defined in .env.local and you have restarted the dev server."
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
