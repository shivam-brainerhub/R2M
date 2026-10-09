import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

import Image from 'next/image';
import Link from 'next/link';

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[50vh] bg-navy overflow-hidden text-center py-20 px-6">
        <div className="absolute inset-0 z-0 w-full">
          <Image
            src="/hero.jpg"
            alt="About SA Healthcare"
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-navy/50 z-10" />
        </div>
        
        <div className="relative z-20 w-full max-w-4xl text-white mt-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg tracking-tight">
            About <span className="text-light-blue">SA Healthcare</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 drop-shadow-md font-light leading-relaxed">
            We are dedicated to providing top-tier healthcare equipment and solutions across Southern Africa. Our mission is to bridge the gap between world-class medical technology and the facilities that need it most.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">OUR MISSION</h2>
              <div className="h-px bg-gold w-12"></div>
            </div>
            <h3 className="text-3xl font-bold text-navy mb-6">Advancing healthcare through technology</h3>
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
              At SA Healthcare, our mission is to empower medical professionals by supplying reliable, innovative, and cost-effective healthcare equipment. We believe that access to the right tools is fundamental to saving lives and improving patient care.
            </p>
            <div className="flex items-start">
               <span className="material-symbols-outlined text-gold text-3xl! mr-4">check_circle</span>
               <p className="text-navy font-semibold">Ensuring quality and compliance in every product we deliver.</p>
            </div>
          </div>
          <div className="relative h-80 md:h-auto min-h-75 rounded-3xl overflow-hidden shadow-xl border border-gray-200">
             <Image 
               src="/mission.jpg" 
               alt="Advancing healthcare through technology"
               fill
               className="object-cover"
               sizes="(max-width: 768px) 100vw, 50vw"
             />
          </div>
        </div>
      </section>

      {/* Stats/Highlight Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
           <div>
              <div className="text-4xl md:text-5xl font-bold text-gold mb-2">15+</div>
              <div className="text-gray-300 font-medium">Years of Experience</div>
           </div>
           <div>
              <div className="text-4xl md:text-5xl font-bold text-light-blue mb-2">50+</div>
              <div className="text-gray-300 font-medium">Global Partners</div>
           </div>
           <div>
              <div className="text-4xl md:text-5xl font-bold text-gold mb-2">1000+</div>
              <div className="text-gray-300 font-medium">Products</div>
           </div>
           <div>
              <div className="text-4xl md:text-5xl font-bold text-light-blue mb-2">24/7</div>
              <div className="text-gray-300 font-medium">Customer Support</div>
           </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="h-px bg-gold w-12 hidden md:block"></div>
              <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">OUR VALUES</h2>
              <div className="h-px bg-gold w-12 hidden md:block"></div>
            </div>
            <h3 className="text-4xl font-bold text-navy">What drives us forward</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             {[
               { icon: 'verified_user', title: 'Quality Assurance', desc: 'We strictly partner with leading global brands to ensure the highest standards of safety and efficacy.' },
               { icon: 'handshake', title: 'Integrity & Trust', desc: 'Building long-lasting relationships with our clients through transparency and dependable service.' },
               { icon: 'psychology', title: 'Innovation', desc: 'Continuously seeking out the latest technological advancements to bring better solutions to the market.' },
             ].map((value, idx) => (
               <div key={idx} className="bg-white p-10 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-xl transition-shadow text-center group">
                 <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-4xl! text-blue-600 group-hover:text-white transition-colors">{value.icon}</span>
                 </div>
                 <h4 className="text-xl font-bold text-navy mb-4">{value.title}</h4>
                 <p className="text-gray-600 leading-relaxed">{value.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full mb-12 mt-12">
         <div className="bg-navy rounded-3xl p-10 md:p-14 text-white flex flex-col lg:flex-row items-center justify-between shadow-2xl">
            <div className="flex items-center mb-8 lg:mb-0">
               <span className="material-symbols-outlined text-7xl! text-white mr-8 opacity-90">contact_support</span>
               <div>
                  <h3 className="text-3xl font-bold mb-3">Partner with us today</h3>
                  <p className="text-gray-300 text-lg max-w-xl">Whether you are looking to source equipment or become a supplier, our team is ready to assist you.</p>
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 lg:mt-0 shrink-0">
               <Link href="/contact" className="bg-gold text-navy font-bold px-8 py-4 rounded-full hover:bg-gold-bright transition-colors flex items-center justify-center shadow-lg shadow-gold/20">
                  Contact Us <span className="material-symbols-outlined ml-2">arrow_forward</span>
               </Link>
               <Link href="/supplier" className="bg-transparent border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
                  Become a Supplier
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}
