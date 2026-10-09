import type { Metadata } from "next";

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
           <form className="flex flex-col gap-5">
             <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">First Name</label>
                   <input type="text" placeholder="John" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Last Name</label>
                   <input type="text" placeholder="Doe" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-navy">Email Address</label>
                <input type="email" placeholder="john@example.com" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-navy">Organization</label>
                <input type="text" placeholder="Your Hospital or Clinic" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-navy">Message</label>
                <textarea placeholder="How can we help you?" rows={5} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none"></textarea>
             </div>
             <button type="submit" className="bg-gold text-navy font-bold py-3 rounded-full hover:bg-gold-bright transition-colors mt-2 flex justify-center items-center">
               Send Message <span className="material-symbols-outlined ml-2 text-sm!">send</span>
             </button>
           </form>
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
