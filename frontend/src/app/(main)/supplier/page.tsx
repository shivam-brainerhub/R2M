import type { Metadata } from "next";
import SupplierForm from "@/components/supplier/SupplierForm";

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

           <SupplierForm />
        </div>
      </div>
    </div>
  );
}
