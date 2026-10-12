import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
};

export default function Contact() {
  return (
    <div className="bg-light-blue min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-300">Speak to our team for expert guidance and tailored solutions for your facility.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2">
           <h2 className="text-2xl font-bold text-navy mb-6">Get in Touch</h2>
           <ContactForm />
        </div>

        <div className="md:w-1/2">
           <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-full">
              <h3 className="text-xl font-bold text-navy mb-6">Contact Information</h3>
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-gold text-2xl!">location_on</span>
                    <div>
                       <h4 className="font-semibold text-navy">Head Office</h4>
                       <p className="text-gray-600 mt-1">123 Healthcare Blvd, Medical District<br/>Johannesburg, 2000, South Africa</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-gold text-2xl!">phone</span>
                    <div>
                       <h4 className="font-semibold text-navy">Phone</h4>
                       <p className="text-gray-600 mt-1">+27 11 450 3000</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-gold text-2xl!">mail</span>
                    <div>
                       <h4 className="font-semibold text-navy">Email</h4>
                       <p className="text-gray-600 mt-1">info@sahcare.co.za</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
