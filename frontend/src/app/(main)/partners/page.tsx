import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners",
};

import Image from 'next/image';
import Link from 'next/link';

export default function ManufacturersPage() {
  const manufacturers = [
    { 
      id: 'mindray', 
      name: 'Mindray', 
      logo: '/logos/mindray.png', 
      desc: 'A leading global developer, manufacturer, and supplier of medical devices whose mission is to deliver high-quality, richly featured medical products making healthcare more accessible.',
      categories: ['Patient Monitors', 'Ultrasound', 'Anesthesia']
    },
    { 
      id: 'philips', 
      name: 'Philips', 
      logo: '/logos/philips.png', 
      desc: 'Improving people\'s health and well-being through meaningful innovation in cardiovascular care, oncology, and minimally invasive treatment.',
      categories: ['Imaging Systems', 'Patient Care', 'Diagnostic ECG']
    },
    { 
      id: 'draeger', 
      name: 'Dräger', 
      logo: '/logos/draeger.png', 
      desc: 'An international leader in the fields of medical and safety technology. Dräger products protect, support and save lives.',
      categories: ['Ventilation', 'Incubators', 'Monitoring']
    },
    { 
      id: 'contec', 
      name: 'CONTEC', 
      logo: '/logos/contec.png', 
      desc: 'Dedicated to research, manufacture and distribution of medical instruments. A highly trusted brand in telemedicine and diagnostic equipment.',
      categories: ['Pulse Oximeters', 'ECG', 'Fetal Monitors']
    },
    { 
      id: 'welch_allyn', 
      name: 'Welch Allyn', 
      logo: '/logos/welch_allyn.png', 
      desc: 'Now part of Baxter, advancing front-line care with innovative diagnostic instruments and connected solutions.',
      categories: ['Physical Assessment', 'Vital Signs', 'Cardiopulmonary']
    },
    { 
      id: 'bd', 
      name: 'BD', 
      logo: '/logos/bd.png', 
      desc: 'One of the largest global medical technology companies in the world, advancing the world of health by improving medical discovery and care delivery.',
      categories: ['Surgical Systems', 'Infusion', 'Lab Equipment']
    },
    { 
      id: '3m', 
      name: '3M', 
      logo: '/logos/3m.png', 
      desc: 'Applying science in collaborative ways to improve lives daily. A trusted provider of medical supplies, health care solutions, and infection prevention.',
      categories: ['Wound Care', 'Stethoscopes', 'Sterilization']
    },
    { 
      id: 'baxter', 
      name: 'Baxter', 
      logo: '/logos/baxter.png', 
      desc: 'Advancing healthcare worldwide with a broad portfolio of essential healthcare products.',
      categories: ['Clinical Nutrition', 'Renal Care', 'Surgical Care']
    }
  ];

  return (
    <div className="bg-light-blue min-h-screen pb-20">
      {/* Banner Section */}
      <div className="bg-navy text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Our Manufacturers</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            We are proud to partner with the world&apos;s leading healthcare brands. By bringing top-tier medical devices and equipment to Southern Africa, we ensure facilities operate with trusted, globally-recognized technology.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {manufacturers.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-[0.98] p-8 flex flex-col group">
              <div className="h-24 flex items-center justify-center mb-6">
                <div className="relative w-full h-full max-w-50 transition-all duration-300">
                  <Image 
                    src={m.logo} 
                    alt={`${m.name} Logo`} 
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-navy mb-3">{m.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                {m.desc}
              </p>
              
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {m.categories.map(cat => (
                    <span key={cat} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <Link 
                href={`/products`} 
                className="inline-flex items-center justify-center w-full bg-white border-2 border-navy text-navy font-bold py-3 rounded-full hover:bg-navy hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                View {m.name} Products
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Become a Partner CTA */}
      <section className="px-6 max-w-7xl mx-auto w-full mt-8">
         <div className="bg-gold rounded-3xl p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between shadow-lg">
            <div className="flex items-center mb-8 lg:mb-0 max-w-2xl">
               <span className="material-symbols-outlined text-6xl! text-navy mr-6">public</span>
               <div>
                  <h3 className="text-2xl font-bold text-navy mb-2">Are you a medical manufacturer?</h3>
                  <p className="text-navy/80 text-lg">Partner with us to distribute your healthcare solutions across our network.</p>
               </div>
            </div>
            <Link href="/supplier" className="bg-navy text-white font-bold px-8 py-4 rounded-full hover:bg-navy/90 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center shrink-0 shadow-lg group">
               Become a Supplier <span className="material-symbols-outlined ml-2 transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
            </Link>
         </div>
      </section>
    </div>
  );
}
