import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ClientProviders from "../../components/ClientProviders";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </ClientProviders>
  );
}
