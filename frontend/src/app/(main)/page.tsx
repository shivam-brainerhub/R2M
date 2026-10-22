import HomeContent from "@/components/HomeContent";
import { COMMON_SEO_KEYWORDS } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SA Healthcare | Medical Equipment, ICU Devices & Hospital Supplies",
  description:
    "Explore SA Healthcare's digital catalogue of medical equipment, ICU patient monitors, surgical instruments, autoclaves, hospital beds, and clinical healthcare systems from world-leading manufacturers.",
  keywords: [
    ...COMMON_SEO_KEYWORDS,
    "buy medical equipment South Africa",
    "hospital procurement",
    "theatre surgical supplies",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SA Healthcare | Medical Equipment & Hospital Supplies",
    description:
      "Explore our comprehensive digital catalogue of medical equipment, ICU systems, surgical devices, and hospital furniture.",
    url: "/",
    siteName: "SA Healthcare",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SA Healthcare | Medical Equipment & Hospital Supplies",
    description:
      "Explore our digital catalogue of medical equipment, ICU systems, surgical devices, and hospital furniture.",
  },
};

export default function RootHomePage() {
  return <HomeContent />;
}
