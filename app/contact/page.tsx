import type { Metadata } from "next";
import { ContactHeader, ContactMethods, ContactForm, ContactFAQ } from "@/components/Contact/index";

export const metadata: Metadata = {
  title: "Contact | We're Always Here for You",
  description: "Get in touch via phone, WhatsApp, or email. We respond within one business day.",
};

export default function ContactPage() {
  return (
    <main>
      <ContactHeader />
      <ContactMethods />
      <ContactForm />
      <ContactFAQ />
    </main>
  );
}
