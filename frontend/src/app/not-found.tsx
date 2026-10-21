import ClientProviders from "@/components/ClientProviders";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotFoundView from "@/components/NotFoundView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <NotFoundView />
      </main>
      <Footer />
    </ClientProviders>
  );
}
