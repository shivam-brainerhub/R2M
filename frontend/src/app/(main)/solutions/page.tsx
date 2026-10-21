import SolutionsMetricsBanner from "@/components/SolutionsMetricsBanner";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions & Clinical Capabilities | SA Healthcare",
  description:
    "Comprehensive medical equipment solutions for hospitals, intensive care units, emergency suites, and clinics across Southern Africa.",
};

export default function SolutionsPage() {
  const clinicalSolutions = [
    {
      title: "Critical Care & ICU Environments",
      icon: "monitor_heart",
      tag: "Critical Care",
      searchQuery: "Patient Monitor",
      description:
        "Continuous multi-parameter hemodynamic monitoring, invasive pressures, and integrated patient data systems for intensive care units and step-down wards.",
      equipment: [
        "Multi-Parameter Patient Monitors",
        "Central Nursing Telemetry Stations",
        "Infusion & Syringe Pumps",
        "ICU Mechanical Ventilators",
      ],
      linkText: "Explore ICU Equipment",
    },
    {
      title: "Operating Theatres & Surgical Suites",
      icon: "medical_services",
      tag: "Surgical & Anesthesia",
      searchQuery: "Surgical",
      description:
        "Advanced perioperative solutions combining surgical ergonomics, shadowless lighting, precision electrosurgical generators, and anesthesia delivery.",
      equipment: [
        "Electro-hydraulic Operating Tables",
        "LED Surgical Luminares & Arms",
        "Electrosurgical Generators & Pencils",
        "Anesthesia Workstations",
      ],
      linkText: "Explore Surgical Range",
    },
    {
      title: "Diagnostic Screening & Cardiology",
      icon: "ecg_heart",
      tag: "Diagnostics",
      searchQuery: "Diagnostic",
      description:
        "High-resolution non-invasive diagnostic systems designed for rapid patient intake, cardiac evaluation, and point-of-care clinical imaging.",
      equipment: [
        "12-Channel Resting ECG Machines",
        "Handheld & Cart Point-of-Care Ultrasound",
        "Automated Blood Pressure Screening",
        "Diagnostic Otoscopes & Ophthalmoscopes",
      ],
      linkText: "Explore Diagnostics",
    },
    {
      title: "Hospital Ward & Recovery Infrastructure",
      icon: "bed",
      tag: "Medical Furniture",
      searchQuery: "Bed",
      description:
        "Ergonomically designed patient care beds, treatment recliners, and heavy-duty ward furniture ensuring maximum comfort, hygiene, and nurse efficiency.",
      equipment: [
        "Electric ICU & Ward Profiling Beds",
        "Delivery & Obstetric Examination Couches",
        "Emergency Crash Carts & Procedure Trolleys",
        "Overbed Tables & Patient Lockers",
      ],
      linkText: "Explore Ward Furniture",
    },
    {
      title: "Infection Prevention & Sterilisation",
      icon: "sanitizer",
      tag: "Sterilisation & Hygiene",
      searchQuery: "Autoclave",
      description:
        "Industrial-grade sterilization autoclaves, automated ultrasonic washers, and room decontamination systems to prevent healthcare-acquired infections (HAIs).",
      equipment: [
        "Class B Pre & Post-Vacuum Autoclaves",
        "Multi-frequency Ultrasonic Cleaners",
        "UV-C Room Decontamination Radiators",
        "Sealable Sterilisation Pouches & Indicators",
      ],
      linkText: "Explore Sterilisation Systems",
    },
    {
      title: "Emergency Resuscitation & Pre-Hospital",
      icon: "e911_emergency",
      tag: "Emergency & Resuscitation",
      searchQuery: "Emergency",
      description:
        "Rugged, defibrillation and airway management gear built to withstand the rigorous demands of emergency rooms, ambulances, and trauma response units.",
      equipment: [
        "Automated External Defibrillators (AEDs)",
        "Manual Biphasic Defibrillator-Monitors",
        "Portable Battery Suction Aspirators",
        "Emergency Transport Ventilators",
      ],
      linkText: "Explore Emergency Gear",
    },
  ];

  const methodologySteps = [
    {
      number: "01",
      title: "Clinical Consultation & Sizing",
      description:
        "Our clinical specialists analyze your facility floorplans, caseload volumes, and clinical protocols to recommend the right equipment specifications and quantities.",
      icon: "assignment",
    },
    {
      number: "02",
      title: "Certified Global Sourcing",
      description:
        "We source directly from world-class medical manufacturers adhering to ISO 13485, CE, and FDA standards, with full regulatory compliance verification for Southern Africa.",
      icon: "verified",
    },
    {
      number: "03",
      title: "Installation, Logistics & Commissioning",
      description:
        "White-glove logistics delivers equipment directly to your clinical department, followed by certified biomedical engineering assembly, testing, and electrical safety validation.",
      icon: "build_circle",
    },
    {
      number: "04",
      title: "Clinical Training & Lifecycle Support",
      description:
        "We deliver in-service operator training for doctors and nursing teams, backed by preventative maintenance schedules, calibrated testing, and readily available spare parts.",
      icon: "support_agent",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-900">
      {/* Hero Section */}
      <section className="relative bg-navy text-white py-20 lg:py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-gold text-xs font-bold uppercase tracking-wider mb-6 border border-white/10">
            <span className="material-symbols-outlined text-sm!">
              medical_services
            </span>
            <span>Comprehensive Healthcare Technology</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            What We Do:{" "}
            <span className="text-gold">Turnkey Clinical Solutions</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            From single specialty instruments to turnkey hospital wing fit-outs,
            SA Healthcare combines world-class medical technology, regulatory
            compliance, and localized engineering support across Southern
            Africa.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="bg-gold hover:bg-gold-bright text-navy font-bold px-7 py-3.5 rounded-full shadow-lg transition-all duration-200 active:scale-95 text-sm flex items-center gap-2 group"
            >
              <span>Browse Equipment Catalogue</span>
              <span className="material-symbols-outlined text-base! transition-transform duration-200 group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
            <Link
              href="/quote"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-full border border-white/20 transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base! text-gold">
                request_quote
              </span>
              <span>Request Custom Quotation</span>
            </Link>
            <Link
              href="/resources"
              className="text-gray-300 hover:text-white font-semibold px-5 py-3.5 transition-colors text-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base! text-gold">
                folder_open
              </span>
              <span>Resource Centre</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metric Pillars Banner */}
      <SolutionsMetricsBanner />

      {/* Clinical Solutions Capability Grid */}
      <section className="py-16 lg:py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
            <span>Specialized Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-navy tracking-tight mb-4">
            Tailored Equipment Across Clinical Disciplines
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Every clinical department has strict workflow demands, accuracy
            tolerances, and safety standards. Our catalogued product suites are
            tailored to meet those precise requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clinicalSolutions.map((sol) => (
            <div
              key={sol.title}
              className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-navy group-hover:text-gold transition-colors duration-300">
                    <span className="material-symbols-outlined text-2xl!">
                      {sol.icon}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {sol.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-navy mb-2.5 group-hover:text-blue-600 transition-colors">
                  {sol.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {sol.description}
                </p>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                    Included Equipment:
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {sol.equipment.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm! text-gold shrink-0">
                          check_circle
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Methodology Section */}
      <section className="bg-white py-16 lg:py-24 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">
              Our Methodology
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-navy tracking-tight mb-4">
              How We Deliver Projects On Time &amp; In Scope
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Procuring hospital infrastructure requires more than shipping
              boxes. We follow a rigorous 4-step delivery pipeline ensuring zero
              clinical downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {methodologySteps.map((step) => (
              <div
                key={step.number}
                className="relative bg-slate-50 rounded-2xl p-6 border border-gray-200/80 hover:border-gold transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-gold font-mono">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center text-navy">
                    <span className="material-symbols-outlined text-xl!">
                      {step.icon}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Central Resource Centre Promo Banner */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto bg-linear-to-r from-navy via-navy-light to-navy text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gold/30 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-base!">
                library_books
              </span>
              <span>Tenders, Architectural Planning &amp; Compliance</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Need Official Technical Datasheets or Manuals?
            </h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Explore our central Resource Centre to download manufacturer
              brochures, user guides, electrical spec sheets, and CE/ISO
              certificates for every product in our catalogue.
            </p>
          </div>

          <div className="relative z-10 shrink-0 flex flex-wrap gap-4">
            <Link
              href="/resources"
              className="bg-gold hover:bg-gold-bright text-navy font-bold px-6 py-3.5 rounded-full shadow-lg transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
            >
              <span>Visit Resource Centre</span>
              <span className="material-symbols-outlined text-base!">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Consultation & RFQ CTA */}
      <section className="bg-slate-100 py-16 px-6 text-center border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mb-4">
            Equipping a New Facility or Upgrading Wards?
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-8 leading-relaxed">
            Our experienced team works closely with hospital managers, clinical
            directors, procurement committees, and biomedical engineers to
            tailor solutions within budgetary requirements.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/quote"
              className="bg-navy hover:bg-navy-light text-white font-bold px-8 py-3.5 rounded-full shadow-lg transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base! text-gold">
                shopping_cart
              </span>
              <span>Build an RFQ Quote</span>
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-50 text-navy font-bold px-8 py-3.5 rounded-full border border-gray-300 shadow-xs transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base! text-blue-600">
                call
              </span>
              <span>Contact Clinical Sales</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
