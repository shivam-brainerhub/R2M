import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Medical Equipment Manufacturers & Brand Partners",
  description:
    "Explore our world-leading medical manufacturing partners: Mindray, Contec, Philips, Dräger, CA-MI, 3M, BD, Aeonmed, Sturdy, Progetti Medical, and more.",
  keywords: [
    "medical equipment brands South Africa",
    "Mindray distributor",
    "Contec patient monitors",
    "Draeger acute point of care",
    "Philips medical systems",
    "CA-MI surgical suction",
    "Sturdy autoclaves",
    "Aeonmed ICU ventilators",
    "Progetti Medical defibrillators",
  ],
  alternates: {
    canonical: "/partners",
  },
  openGraph: {
    title:
      "Global Medical Equipment Manufacturers & Brand Partners | SA Healthcare",
    description:
      "Partnering with the world's leading healthcare technology brands to supply Southern Africa.",
    url: "/partners",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
