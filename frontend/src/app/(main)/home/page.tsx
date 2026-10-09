import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row min-h-162.5 bg-navy overflow-hidden">

        {/* Background Image */}
        <div className="absolute inset-0 z-0 w-full">
          <Image
            src="/hero.jpg"
            alt="Hospital Background"
            fill
            sizes="100vw"
            className="object-cover object-center lg:object-right opacity-60"
            priority
          />

          <div className="absolute inset-0 bg-linear-to-r from-navy/80 via-navy/20 to-transparent z-10" />
        </div>


        {/* =========================================================
            LEFT SIDE CONTENT
            ========================================================= */}
        <div className="relative z-20 w-full lg:w-2/3 flex items-center py-24 px-6 lg:px-12 xl:px-24">
          <div className="w-full max-w-2xl text-white">

            <h1 className="text-5xl md:text-[5.5rem] font-bold mb-6 leading-none drop-shadow-lg tracking-tight">
              Healthcare <br />
              without <span className="text-light-blue">limits.</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 text-gray-200 drop-shadow-md max-w-lg font-light leading-relaxed">
              Explore SA Healthcare&apos;s growing digital healthcare catalogue.
              Search products, brochures and technical specifications from
              trusted global manufacturers.
            </p>

            {/* Search */}
            <div className="bg-white rounded-full p-1.5 flex items-center shadow-2xl w-full max-w-3xl mb-8">
              <span className="material-symbols-outlined text-navy ml-4 mr-2 text-2xl!">
                search
              </span>

              <input
                type="text"
                placeholder="Search by product, model number, manufacturer, brochure or technical specification..."
                className="flex-1 bg-transparent border-none outline-none text-navy px-2 text-sm placeholder-gray-400"
              />

              <button className="bg-gold text-navy font-bold rounded-full px-8 py-3.5 flex items-center hover:bg-gold-bright transition-colors text-sm shrink-0">
                Search
                <span className="material-symbols-outlined ml-1 text-sm! font-bold">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="text-white font-medium text-sm mr-2">
                Popular searches:
              </span>

              {[
                'Patient Monitor',
                'Hospital Bed',
                'ECG',
                'Pulse Oximeter',
                'Infusion Pump',
                'Defibrillator',
                'Ultrasound'
              ].map(term => (
                <span
                  key={term}
                  className="border border-white/60 text-white rounded-full px-5 py-1.5 hover:bg-white/10 cursor-pointer transition-colors backdrop-blur-sm text-xs font-medium"
                >
                  {term}
                </span>
              ))}
            </div>

          </div>
        </div>


        {/* =========================================================
            RIGHT ORGANIC WHITE SECTION
            ========================================================= */}

        {/* Desktop */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-1/5 z-20 pointer-events-none overflow-visible">

          <svg width="0" height="0" className="absolute">
            <clipPath id="wave-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0.15 0 C 0.1 0.3, 0.25 0.7, 0.15 1 L 1 1 L 1 0 Z" />
            </clipPath>
            <clipPath id="wave-1" clipPathUnits="objectBoundingBox">
              <path d="M 0.1 0 C 0.9 0.3, 0 0.7, 0.3 1 L 1 1 L 1 0 Z" />
            </clipPath>
            <clipPath id="wave-2" clipPathUnits="objectBoundingBox">
              <path d="M 0.4 0 C 0.8 0.4, 0.1 0.8, 0.4 1 L 1 1 L 1 0 Z" />
            </clipPath>
          </svg>

          {/* Layer 1 (Back, Bottom Slope) */}
          <div className="absolute top-[-20%] bottom-[-54%] right-0 w-[150%] z-0 filter-[drop-shadow(-15px_-10px_40px_rgba(37,99,235,0.15))]">
             <div className="absolute inset-0 bg-white rotate-25 origin-bottom-right [clip-path:url(#wave-1)]" />
          </div>

          {/* Layer 3 (Middle, Top Slope) */}
          <div className="absolute top-[-20%] bottom-[-20%] right-0 w-[130%] z-10 filter-[drop-shadow(-15px_0_40px_rgba(37,99,235,0.15))]">
             <div className="absolute inset-0 bg-white rotate-[-18deg] origin-top-right [clip-path:url(#wave-clip)]" />
          </div>

          {/* Layer 2 (Front, Bottom Slope) */}
          <div className="absolute top-[-20%] bottom-[-54%] left-10 w-full z-20 filter-[drop-shadow(-20px_-10px_40px_rgba(37,99,235,0.15))]">
             <div className="absolute inset-0 bg-white rotate-20 origin-bottom-right translate-x-[4%] [clip-path:url(#wave-2)]" />
          </div>

          {/* Right-side content */}
          <div
            className="
              absolute
              top-1/3
              -translate-y-1/2
              right-0
              w-full
              pr-4
              pl-15
              xl:pl-34
              text-navy
              pointer-events-auto
              z-30
            "
          >

            <div className="flex flex-col">
              <h2 className="text-md xl:text-xl font-bold tracking-[0.15em] text-navy">
                TRUST<br />
                ACCESS<br />
                INNOVATION<br />
                IMPACT
              </h2>

              <div className="h-1.5 w-12 bg-gold my-2" />
              <div className="h-1.5 w-12 my-6" />

              <h2 className="text-md xl:text-xl font-bold text-navy">
                A HEALTHIER<br />
                TOMORROW<br />
                TOGETHER.
              </h2>

              <div className="h-1.5 w-12 bg-gold mt-2" />
            </div>

          </div>
        </div>


        {/* =========================================================
            MOBILE RIGHT SECTION
            ========================================================= */}

        <div className="lg:hidden relative z-20 bg-white px-8 py-16 text-navy">

          <div className="flex flex-col">
            <h2 className="text-md font-bold text-navy">
              TRUST<br />
              ACCESS<br />
              INNOVATION<br />
              IMPACT
            </h2>

            <div className="h-1.5 w-12 bg-gold my-2" />
            <div className="h-1.5 w-12 my-6" />

            <h2 className="text-md font-bold text-navy">
              A HEALTHIER<br />
              TOMORROW<br />
              TOGETHER.
            </h2>

            <div className="h-1.5 w-12 bg-gold mt-2" />
          </div>

        </div>

      </section>
      {/* Categories */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">PRODUCT CATEGORIES</h2>
            <div className="h-px bg-gold w-12"></div>
          </div>
          <h3 className="text-4xl font-bold text-navy mb-12">Find the products you need</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: '01', title: 'Diagnostic and Measure', desc: 'Patient monitors, ECG, ultrasound, thermometers, glucose meters, scales and more.', icon: 'monitor_heart' },
              { id: '02', title: 'Furniture', desc: 'Hospital beds, operating tables and medical furniture.', icon: 'bed' },
              { id: '03', title: 'Disposables and Care Supplies', desc: 'Gloves, gowns, bandages, dressings, tubes, syringes and general care supplies.', icon: 'clean_hands' },
              { id: '04', title: 'Hygiene, Disinfection and Sterilisation', desc: 'Autoclaves, UV sterilisers, cleaning products, sanitisers and disinfectants.', icon: 'sanitizer' },
              { id: '05', title: 'Emergency, Reanimation and Surgery', desc: 'Defibrillators, AEDs, resuscitation equipment, stretchers, surgical equipment and more.', icon: 'medical_services' },
              { id: '06', title: 'Living Aid', desc: 'Wheelchairs, crutches, walkers, bathroom aids, patient transfer aids and daily living support.', icon: 'accessible' },
              { id: '07', title: 'Instruments', desc: 'Scissors, forceps, speculums, laryngoscopes, otoscopes and instrument sets.', icon: 'content_cut' },
              { id: '08', title: 'Lab', desc: 'Laboratory equipment, fridges, freezers, containers, petri dishes, tubes and lab disposables.', icon: 'science' },
              { id: '09', title: 'Veterinary', desc: 'Veterinary equipment, instruments and consumables.', icon: 'pets' },
            ].map(cat => (
              <Link href="/products" key={cat.id} className="bg-white p-1 md:p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow group flex items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-blue-600 bg-blue-50 rounded-full group-hover:scale-105 transition-transform shrink-0 mr-6">
                  <span className="material-symbols-outlined text-5xl!">{cat.icon}</span>
                </div>
                <div className="flex-1 pr-4">
                  <div className="text-gold text-sm font-bold mb-1">{cat.id}</div>
                  <h4 className="text-navy font-bold text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">{cat.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{cat.desc}</p>
                </div>
                <span className="material-symbols-outlined text-blue-600 font-bold self-center">chevron_right</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Healthcare Sectors */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">HEALTHCARE SECTORS</h2>
            <div className="h-px bg-gold w-12"></div>
          </div>
          <h3 className="text-4xl font-bold text-navy mb-12">Browse by healthcare sector</h3>
          
          <div className="flex overflow-x-auto pb-6 gap-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {[
              { title: 'Hospitals &\nHealthcare Groups', icon: 'domain' },
              { title: 'Clinics &\nPrimary Care', icon: 'medical_information' },
              { title: 'Pharmacies &\nRetail Healthcare', icon: 'local_pharmacy' },
              { title: 'Public\nHealthcare', icon: 'account_balance' },
              { title: 'Laboratories', icon: 'biotech' },
              { title: 'Specialist\nCare', icon: 'favorite' },
              { title: 'Veterinary\nPractices', icon: 'pets' },
            ].map((sector, idx) => (
              <Link href="/sectors" key={idx} className="snap-start flex-none w-50 bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center group">
                <span className="material-symbols-outlined text-5xl! text-blue-300 mb-6 group-hover:scale-110 transition-transform">{sector.icon}</span>
                <h4 className="text-navy font-bold text-sm whitespace-pre-line group-hover:text-blue-600 transition-colors leading-tight">{sector.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Our Manufacturers */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">OUR MANUFACTURERS</h2>
            <div className="h-px bg-gold w-12"></div>
          </div>
          <h3 className="text-4xl font-bold text-navy mb-12">World-leading medical brands</h3>
          
          <div className="flex items-center space-x-6">
             <button className="bg-white border border-gray-200 text-gray-400 rounded-full w-12 h-12 flex items-center justify-center hover:text-navy hover:border-navy transition-colors shrink-0 shadow-sm">
                <span className="material-symbols-outlined">chevron_left</span>
             </button>
             <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
               {['mindray', 'CONTEC', 'Dräger', 'Welch Allyn', 'BD', '3M'].map((brand) => (
                 <div key={brand} className="bg-white border border-gray-100 h-26 rounded-2xl flex items-center justify-center p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] group transition-transform hover:-translate-y-1">
                   <span className="font-bold text-xl text-navy">{brand}</span>
                 </div>
               ))}
             </div>
             <button className="bg-white border border-gray-200 text-gray-400 rounded-full w-12 h-12 flex items-center justify-center hover:text-navy hover:border-navy transition-colors shrink-0 shadow-sm">
                <span className="material-symbols-outlined">chevron_right</span>
             </button>
          </div>
        </div>
      </section>

      {/* Why SA Healthcare */}
      <section className="py-20 px-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-12">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">WHY SA HEALTHCARE</h2>
            <div className="h-px bg-gold w-12"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
             <div className="flex items-start md:pr-8 pt-8 md:pt-0">
                <span className="material-symbols-outlined text-5xl! text-navy mr-6">language</span>
                <div>
                   <h4 className="text-navy font-bold text-xl mb-3">Trusted Global Manufacturers</h4>
                   <p className="text-gray-500 text-sm leading-relaxed">A comprehensive range of products from leading brands worldwide.</p>
                </div>
             </div>
             <div className="flex items-start md:px-8 pt-8 md:pt-0">
                <span className="material-symbols-outlined text-5xl! text-navy mr-6">description</span>
                <div>
                   <h4 className="text-navy font-bold text-xl mb-3">Brochures & Technical Information</h4>
                   <p className="text-gray-500 text-sm leading-relaxed">Every product includes downloadable brochures and technical specifications.</p>
                </div>
             </div>
             <div className="flex items-start md:px-8 pt-8 md:pt-0">
                <span className="material-symbols-outlined text-5xl! text-navy mr-6">chat</span>
                <div>
                   <h4 className="text-navy font-bold text-xl mb-3">Request a Quote</h4>
                   <p className="text-gray-500 text-sm leading-relaxed">Receive personalised assistance from our healthcare specialists.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Become a Supplier */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full mt-4">
         <div className="bg-orange-50 rounded-3xl p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between border border-orange-200">
            <div className="flex items-center mb-8 lg:mb-0 max-w-2xl">
               <span className="material-symbols-outlined text-7xl! text-navy mr-8">handshake</span>
               <div>
                  <h3 className="text-3xl font-bold text-navy mb-3">Become a Supplier</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Are you a healthcare manufacturer looking to expand your reach across Southern Africa? We&apos;d love to hear from you.</p>
               </div>
            </div>
            <Link href="/supplier" className="bg-gold text-navy font-bold px-10 py-4 rounded-full hover:bg-gold-bright transition-colors flex items-center shrink-0 shadow-lg shadow-gold/20">
               Become a Supplier <span className="material-symbols-outlined ml-2">arrow_forward</span>
            </Link>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full mb-12">
         <div className="bg-navy rounded-3xl p-10 md:p-14 text-white flex flex-col lg:flex-row items-center justify-between shadow-2xl">
            <div className="flex items-center mb-8 lg:mb-0">
               <span className="material-symbols-outlined text-7xl! text-white mr-8 opacity-90">receipt_long</span>
               <div>
                  <h3 className="text-3xl font-bold mb-3">Need a quotation or product advice?</h3>
                  <p className="text-gray-300 text-lg">Speak to our team for expert guidance and tailored solutions for your facility.</p>
               </div>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-6 md:gap-8 mt-8 lg:mt-0">
               <Link href="/contact" className="bg-gold text-navy font-bold px-8 md:px-10 py-4 rounded-full hover:bg-gold-bright transition-colors flex items-center shrink-0 shadow-lg shadow-gold/20">
                  Request a Quote <span className="material-symbols-outlined ml-2">arrow_forward</span>
               </Link>
               
               <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 border-white/20">
                  <a href="tel:+1234567890" className="flex items-center text-white hover:text-gold transition-colors shrink-0 group">
                     <span className="material-symbols-outlined mr-3 text-3xl! group-hover:scale-110 transition-transform">call</span>
                     <span className="font-semibold whitespace-nowrap text-lg">Get in Touch</span>
                  </a>
                  <a href="mailto:info@sahealthcare.com" className="flex items-center text-white hover:text-gold transition-colors shrink-0 group">
                     <span className="material-symbols-outlined mr-3 text-3xl! group-hover:scale-110 transition-transform">mail</span>
                     <span className="font-semibold whitespace-nowrap text-lg">Email Us</span>
                  </a>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
