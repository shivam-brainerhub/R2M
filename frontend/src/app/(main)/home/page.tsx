import HomeContent from "@/components/HomeContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Explore SA Healthcare's digital healthcare catalogue, products, brochures and specifications.",
};

export default function Home() {
  return <HomeContent />;
}
