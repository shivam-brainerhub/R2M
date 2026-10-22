import { COMMON_SEO_KEYWORDS, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Script from "next/script";
import ClientProviders from "../components/ClientProviders";
import "./globals.css";

const siteUrl = getSiteUrl();
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | SA Healthcare",
    default: "SA Healthcare | Medical Equipment & Healthcare Solutions",
  },
  description:
    "Explore SA Healthcare's digital product catalogue of medical devices, ICU patient monitors, surgical solutions, autoclaves, and hospital equipment from leading global manufacturers.",
  keywords: COMMON_SEO_KEYWORDS,
  authors: [{ name: "SA Healthcare" }],
  creator: "SA Healthcare",
  publisher: "SA Healthcare",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "SA Healthcare",
    title: "SA Healthcare | Medical Equipment & Healthcare Solutions",
    description:
      "Explore SA Healthcare's digital catalogue of medical devices, ICU systems, surgical equipment, and hospital furniture.",
    images: [
      {
        url: `${siteUrl}/hero.jpg`,
        width: 1200,
        height: 630,
        alt: "SA Healthcare Medical Equipment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "SA Healthcare | Medical Equipment COMMON_SEO_KEYWORDS& Healthcare Solutions",
    description:
      "Explore SA Healthcare's digital catalogue of medical devices, ICU systems, surgical equipment, and hospital furniture.",
    images: [`${siteUrl}/hero.jpg`],
  },
  verification: googleVerification
    ? {
        google: googleVerification,
      }
    : undefined,
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalBusiness",
      "@id": `${siteUrl}/#organization`,
      name: "SA Healthcare",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/hero.jpg`,
      description:
        "Leading distributor of medical equipment, ICU patient monitors, operating theatre systems, autoclaves, and hospital supplies across Southern Africa.",
      telephone: "+27 11 555 0100",
      email: "info@sahealthcare.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "15 Medical Boulevard, Sandton",
        addressLocality: "Johannesburg",
        addressRegion: "Gauteng",
        postalCode: "2196",
        addressCountry: "ZA",
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Southern Africa",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "SA Healthcare",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/products?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />

        {/* Global JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Google Analytics (gtag.js) */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager (GTM) */}
        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
