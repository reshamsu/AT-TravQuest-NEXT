import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Suspense } from "react";
import HideNavbar from "@/components/HideNavbar";
import HideFooter from "@/components/HideFooter";
import GoogleProvider from "./GoogleProvider";
import ScrollToTop from "@/components/ScrollToTop";
import HideWhatsApp from "@/components/HideWhatsApp";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const SITE_URL = "https://www.travquesttravel.com"; // TODO: replace with your production domain

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TravQuest Travel & Tourism LLC — Dubai, UAE",
    template: "%s | TravQuest Travel & Tourism",
  },
  description:
    "TravQuest Travel & Tourism LLC is a licensed travel agency in Dubai offering luxury holiday packages, city tours, desert safaris, visa services, and serviced apartments across the UAE and worldwide.",
  keywords: [
    "travel agency Dubai",
    "tourism UAE",
    "Dubai holiday packages",
    "luxury tours Dubai",
    "desert safari Dubai",
    "visa services UAE",
    "serviced apartments Dubai",
    "Abu Dhabi tours",
    "UAE travel deals",
    "TravQuest",
    "travel and tourism LLC Dubai",
    "international holiday packages",
  ],
  authors: [{ name: "TravQuest Travel & Tourism LLC", url: SITE_URL }],
  creator: "TravQuest Travel & Tourism LLC",
  publisher: "TravQuest Travel & Tourism LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: SITE_URL,
    siteName: "TravQuest Travel & Tourism LLC",
    title: "TravQuest Travel & Tourism LLC — Dubai, UAE",
    description:
      "Licensed travel agency in Dubai offering luxury holiday packages, city tours, desert safaris, visa services, and serviced apartments across the UAE and worldwide.",
    images: [
      {
        url: "/tq-logo.png",
        width: 1200,
        height: 630,
        alt: "TravQuest Travel & Tourism LLC — Dubai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TravQuest Travel & Tourism LLC — Dubai, UAE",
    description:
      "Licensed travel agency in Dubai offering luxury holiday packages, city tours, desert safaris, visa services, and serviced apartments.",
    images: ["/tq-logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "TravQuest Travel & Tourism LLC",
  url: SITE_URL,
  logo: `${SITE_URL}/tq-logo.png`,
  image: `${SITE_URL}/tq-logo.png`,
  description:
    "Licensed travel agency in Dubai offering luxury holiday packages, city tours, desert safaris, visa services, and serviced apartments across the UAE and worldwide.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  areaServed: ["AE", "Worldwide"],
  priceRange: "$$",
  sameAs: [
    // TODO: add your social profile URLs here
    // "https://www.instagram.com/travquest",
    // "https://www.facebook.com/travquest",
    // "https://www.linkedin.com/company/travquest",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://pub-8a7f898b82314e1f905b0c3ffd16e076.r2.dev" />
        <link rel="preconnect" href="https://cetwdvlytnggcipugraq.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div className="print:hidden"><HideNavbar /></div>
        <GoogleProvider>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <main className="relative">{children}</main>
          <div className="print:hidden"><HideWhatsApp /></div>
        </GoogleProvider>
        <div className="print:hidden"><HideFooter /></div>
      </body>
    </html>
  );
}
