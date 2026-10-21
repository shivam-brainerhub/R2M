import TermsContent from "@/components/TermsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use and Catalogue Conditions for SA Healthcare.",
};

export default function TermsOfUsePage() {
  return <TermsContent />;
}
