import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 print:p-0 print:m-0">
        {children}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
