import type { Metadata } from "next";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Sectors",
};

export default function SectorsPage() {
  const sectors = [
    { 
      title: 'Hospitals & Healthcare Groups', 
      icon: 'domain',
      description: 'Comprehensive medical equipment and advanced systems designed for large-scale hospital environments and healthcare networks. We supply everything from critical care monitors to fully equipped surgical theatres.',
      features: ['ICU & Critical Care', 'Surgical Equipment', 'Patient Monitoring', 'Centralized Systems']
    },
    { 
      title: 'Clinics & Primary Care', 
      icon: 'medical_information',
      description: 'Essential diagnostic and treatment tools tailored for day clinics, primary care physicians, and outpatient facilities. Reliable, easy-to-use equipment that ensures swift patient turnover.',
      features: ['Diagnostic Sets', 'Vital Signs Monitors', 'Point-of-Care Ultrasound', 'Consumables']
    },
    { 
      title: 'Pharmacies & Retail Healthcare', 
      icon: 'local_pharmacy',
      description: 'Healthcare screening and retail medical devices perfect for pharmacy clinics and wellness centers. From blood pressure monitors to rapid diagnostic tests.',
      features: ['Blood Pressure Monitors', 'Glucose Testing', 'Thermometry', 'Wellness Screening']
    },
    { 
      title: 'Public Healthcare', 
      icon: 'account_balance',
      description: 'Durable and cost-effective medical solutions built to withstand the high-volume demands of public healthcare institutions and government facilities.',
      features: ['High-Durability Equipment', 'Bulk Supply', 'Scalable Solutions', 'Training & Support']
    },
    { 
      title: 'Laboratories', 
      icon: 'biotech',
      description: 'High-precision instruments and laboratory technology required for accurate diagnostics, pathology, and clinical research.',
      features: ['Analyzers', 'Centrifuges', 'Microscopes', 'Cold Chain Storage']
    },
    { 
      title: 'Specialist Care', 
      icon: 'favorite',
      description: 'Advanced, specialized equipment for specific medical fields including cardiology, obstetrics, gynecology, and emergency medicine.',
      features: ['Cardiology (ECG)', 'Fetal Monitors', 'Defibrillators', 'Endoscopy']
    },
    { 
      title: 'Veterinary Practices', 
      icon: 'pets',
      description: 'Adapted medical and surgical equipment specifically calibrated and designed for veterinary care, ensuring the best outcomes for animal patients.',
      features: ['Vet Ultrasound', 'Vet Anesthesia', 'Vet Monitoring', 'Surgical Instruments']
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="bg-navy py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Healthcare Sectors</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
            We provide tailored healthcare technology and medical equipment solutions across a diverse range of medical sectors. Find the specialized tools your facility needs.
          </p>
        </div>
      </section>

      {/* Sectors List */}
      <section className="px-6 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {sectors.map((sector, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row gap-8 hover:shadow-md transition-shadow">
              
              {/* Icon & Title */}
              <div className="md:w-1/3 flex flex-col items-start border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl!">{sector.icon}</span>
                </div>
                <h2 className="text-2xl font-bold text-navy mb-4 leading-tight">{sector.title}</h2>
                <Link href="/products" className="text-blue-600 font-semibold flex items-center hover:text-blue-800 transition-colors group mt-auto">
                  View relevant products 
                  <span className="material-symbols-outlined text-sm! ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>

              {/* Description & Features */}
              <div className="md:w-2/3 flex flex-col justify-center">
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {sector.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sector.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center text-gray-700 bg-gray-50 py-2 px-4 rounded-lg border border-gray-100">
                      <span className="material-symbols-outlined text-gold mr-3 text-xl!">check_circle</span>
                      <span className="font-medium text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full mt-10">
         <div className="bg-light-blue rounded-3xl p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between border border-blue-100 shadow-sm">
            <div className="flex items-center mb-8 lg:mb-0 max-w-2xl">
               <span className="material-symbols-outlined text-7xl! text-blue-600 mr-8">support_agent</span>
               <div>
                  <h3 className="text-3xl font-bold text-navy mb-3">Need specialized advice?</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Our team of medical equipment specialists can help you equip your facility with the exact tools you need.
                  </p>
               </div>
            </div>
            <Link href="/contact" className="bg-navy text-white font-bold px-10 py-4 rounded-full hover:bg-blue-900 transition-colors flex items-center shrink-0 shadow-md">
               Contact our team <span className="material-symbols-outlined ml-2">arrow_forward</span>
            </Link>
         </div>
      </section>
    </div>
  );
}
