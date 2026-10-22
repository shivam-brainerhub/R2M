import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Brochures, Tech Specs & User Manuals",
  description:
    "Download verified manufacturer brochures, technical specifications, clinical datasheets, compliance certificates, and user manuals for hospital medical equipment.",
  keywords: [
    "medical equipment brochures",
    "patient monitor user manual",
    "ventilator tech specs",
    "defibrillator compliance certificate",
    "hospital bed technical data sheet",
    "medical device documentation",
  ],
  alternates: {
    canonical: "/resources",
  },
  openGraph: {
    title:
      "Medical Brochures, Tech Specs & User Manuals | SA Healthcare Resource Centre",
    description:
      "Download official medical device brochures, technical specifications, and user manuals.",
    url: "/resources",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
