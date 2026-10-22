import { COMMON_SEO_KEYWORDS } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Equipment Catalogue & Products",
  description:
    "Search and browse SA Healthcare's full medical equipment catalogue: ICU monitors, hospital beds, autoclaves, surgical instruments, diagnostic equipment, and medical disposables.",
  keywords: [
    ...COMMON_SEO_KEYWORDS,
    "medical product catalogue",
    "hospital equipment price quote",
    "buy hospital devices South Africa",
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Medical Equipment Catalogue & Products | SA Healthcare",
    description:
      "Search and browse our full medical equipment catalogue of ICU monitors, surgical tools, and hospital supplies.",
    url: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
