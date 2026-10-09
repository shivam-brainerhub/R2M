import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supplier",
};

export default function Supplier() {
  return (
    <div className="bg-light-blue min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Become a Supplier</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Are you a healthcare manufacturer looking to expand your reach across Southern Africa? Partner with SA Healthcare to distribute your world-class medical solutions.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-100 shadow-lg">
           <h2 className="text-2xl font-bold text-navy mb-6 border-b pb-4">Supplier Enquiry Form</h2>
           <p className="text-gray-600 mb-8">
             Please provide your company details and product range below. Our procurement team will review your application and contact you.
           </p>

           <form className="flex flex-col gap-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Company Name</label>
                   <input type="text" placeholder="Your Manufacturing Co." className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Website</label>
                   <input type="url" placeholder="https://www.example.com" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Contact Person Name</label>
                   <input type="text" placeholder="Jane Doe" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Job Title</label>
                   <input type="text" placeholder="Sales Director" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Email Address</label>
                   <input type="email" placeholder="jane@example.com" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-semibold text-navy">Phone Number</label>
                   <input type="tel" placeholder="+1 234 567 8900" className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none" />
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-navy">Primary Product Categories</label>
                <select className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none bg-white text-gray-700">
                  <option value="">Select a category...</option>
                  <option value="diagnostic">Diagnostic and Measure</option>
                  <option value="furniture">Furniture</option>
                  <option value="disposables">Disposables and Care Supplies</option>
                  <option value="hygiene">Hygiene, Disinfection and Sterilisation</option>
                  <option value="emergency">Emergency, Reanimation and Surgery</option>
                  <option value="living_aid">Living Aid</option>
                  <option value="instruments">Instruments</option>
                  <option value="lab">Lab</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="other">Other</option>
                </select>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-navy">Company & Product Overview</label>
                <textarea placeholder="Briefly introduce your company and the range of products you manufacture." rows={5} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-gold focus:outline-none"></textarea>
             </div>

             <button type="submit" className="bg-gold text-navy font-bold py-4 rounded-full hover:bg-gold-bright transition-colors mt-4 flex justify-center items-center text-lg">
               Submit Enquiry <span className="material-symbols-outlined ml-2">send</span>
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}
