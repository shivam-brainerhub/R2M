"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BrandSlider from '@/components/BrandSlider';
import {
  contentApi,
  categoriesApi,
  HeroContent,
  CompanyContent,
  WhyUsContent,
  CTAContent,
  CategoryItem,
} from '@/lib/api';
import {
  DEFAULT_HERO,
  DEFAULT_COMPANY,
  DEFAULT_WHY_US,
  DEFAULT_CTA,
  CATEGORY_ICON_MAP,
} from '@/lib/constants';

export default function HomeContent() {
  const router = useRouter();
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const [company, setCompany] = useState<CompanyContent>(DEFAULT_COMPANY);
  const [whyUs, setWhyUs] = useState<WhyUsContent>(DEFAULT_WHY_US);
  const [cta, setCta] = useState<CTAContent>(DEFAULT_CTA);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    contentApi
      .getAll()
      .then((data) => {
        if (data.hero) {
          const heroData = data.hero;
          setHero((prev) => ({
            ...prev,
            headlinePart1: heroData.headlinePart1 || heroData.headline_part1 || prev.headlinePart1,
            headlinePart2: heroData.headlinePart2 || heroData.headline_part2 || prev.headlinePart2,
            headlineAccent: heroData.headlineAccent || heroData.headline_accent || prev.headlineAccent,
            subheading: heroData.subheading || prev.subheading,
            showSearchBar:
              heroData.showSearchBar !== undefined
                ? heroData.showSearchBar
                : heroData.show_search_bar !== undefined
                ? heroData.show_search_bar
                : true,
            searchPlaceholder:
              heroData.searchPlaceholder || heroData.search_placeholder || prev.searchPlaceholder,
            popularSearches:
              heroData.popularSearches || heroData.popular_searches || prev.popularSearches,
            badgeTitle: heroData.badgeTitle || heroData.badge_title || prev.badgeTitle,
            badgeTagline: heroData.badgeTagline || heroData.badge_tagline || prev.badgeTagline,
          }));
        }
        if (data.company) {
          const companyData = data.company;
          setCompany((prev) => ({
            ...prev,
            companyName: companyData.companyName || companyData.company_name || prev.companyName,
            phone: companyData.phone || prev.phone,
            tollFree: companyData.tollFree || companyData.toll_free || prev.tollFree,
            email: companyData.email || prev.email,
            salesEmail: companyData.salesEmail || companyData.sales_email || prev.salesEmail,
            physicalAddress:
              companyData.physicalAddress || companyData.physical_address || prev.physicalAddress,
            hours: companyData.hours || prev.hours,
          }));
        }
        if (data.why_us) {
          const whyUsData = data.why_us;
          setWhyUs((prev) => ({
            ...prev,
            sectionTag: whyUsData.sectionTag || whyUsData.section_tag || prev.sectionTag,
            title: whyUsData.title || prev.title,
            items:
              Array.isArray(whyUsData.items) && whyUsData.items.length > 0
                ? whyUsData.items
                : prev.items,
          }));
        }
        if (data.cta) {
          const ctaData = data.cta;
          setCta((prev) => ({
            ...prev,
            heading: ctaData.heading || prev.heading,
            subheading: ctaData.subheading || prev.subheading,
            buttonText: ctaData.buttonText || ctaData.button_text || prev.buttonText,
            buttonLink: ctaData.buttonLink || ctaData.button_link || prev.buttonLink,
            phone: ctaData.phone || prev.phone,
            email: ctaData.email || prev.email,
          }));
        }
      })
      .catch(() => {
        // Fallback to DEFAULT states gracefully
      });

    categoriesApi
      .listCategories()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {
        // Categories will remain empty or handle gracefully
      });
  }, []);

  const getCatIcon = (cat: CategoryItem) => {
    if (cat.icon && cat.icon.trim() && cat.icon !== 'category') return cat.icon;
    if (cat.slug && CATEGORY_ICON_MAP[cat.slug]) return CATEGORY_ICON_MAP[cat.slug];
    const nameLower = cat.name.toLowerCase();
    for (const [slugKey, iconName] of Object.entries(CATEGORY_ICON_MAP)) {
      if (nameLower.includes(slugKey.replace(/-/g, ' '))) return iconName;
    }
    return 'medical_services';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handlePopularSearchClick = (term: string) => {
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

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

        {/* LEFT SIDE CONTENT */}
        <div className="relative z-20 w-full lg:w-2/3 flex items-center py-12 md:py-24 px-6 lg:px-12 xl:px-24">
          <div className="w-full max-w-2xl text-white">
            <h1 className="text-5xl md:text-[5.5rem] font-bold mb-4 md:mb-6 leading-tight md:leading-none drop-shadow-lg tracking-tight">
              {hero.headlinePart1} <br />
              {hero.headlinePart2} <span className="text-light-blue">{hero.headlineAccent}</span>
            </h1>

            <p className="text-base md:text-xl mb-8 md:mb-10 text-gray-200 drop-shadow-md max-w-lg font-light leading-relaxed">
              {hero.subheading}
            </p>

            {/* Dynamic Search Bar */}
            {hero.showSearchBar && (
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white rounded-full p-1 md:p-1.5 flex items-center shadow-2xl w-full max-w-3xl mb-8"
              >
                <span className="material-symbols-outlined text-navy ml-2 md:ml-4 mr-1 md:mr-2 text-xl md:text-2xl!">
                  search
                </span>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    hero.searchPlaceholder ||
                    'Search by product, model number, manufacturer, brochure or technical specification...'
                  }
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-navy px-2 text-sm placeholder-gray-400 text-ellipsis"
                />

                <button
                  type="submit"
                  className="bg-gold text-navy font-bold rounded-full px-4 md:px-8 py-2 md:py-3.5 flex items-center hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-sm shrink-0 shadow-md hover:shadow-lg group cursor-pointer"
                >
                  Search
                  <span className="material-symbols-outlined ml-1 text-sm! font-bold transition-transform duration-300 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </form>
            )}

            {/* Popular Searches */}
            {hero.popularSearches && hero.popularSearches.length > 0 && (
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="text-white font-medium text-sm mr-2">
                  Popular searches:
                </span>
                {hero.popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handlePopularSearchClick(term)}
                    className="border border-white/60 text-white rounded-full px-5 py-1.5 hover:bg-white/10 cursor-pointer transition-colors backdrop-blur-sm text-xs font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ORGANIC WHITE SECTION (Desktop) */}
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

          {/* Right-side Content */}
          <div className="absolute top-1/3 -translate-y-1/2 right-0 w-full pr-4 pl-15 xl:pl-34 text-navy pointer-events-auto z-30">
            <div className="flex flex-col">
              <h2 className="text-md xl:text-xl font-bold tracking-[0.15em] text-navy whitespace-pre-line leading-relaxed">
                {hero.badgeTitle ? hero.badgeTitle.replace(/ • /g, '\n') : "TRUST\nACCESS\nINNOVATION\nIMPACT"}
              </h2>

              <div className="h-1.5 w-12 bg-gold my-2" />
              <div className="h-1.5 w-12 my-6" />

              <h2 className="text-md xl:text-xl font-bold text-navy whitespace-pre-line leading-relaxed">
                {hero.badgeTagline || "A HEALTHIER\nTOMORROW\nTOGETHER."}
              </h2>

              <div className="h-1.5 w-12 bg-gold mt-2" />
            </div>
          </div>
        </div>

        {/* MOBILE RIGHT SECTION */}
        <div className="lg:hidden relative z-20 bg-white px-6 py-12 text-navy text-center border-b border-gray-100">
          <div className="flex flex-col items-center max-w-sm mx-auto space-y-8">
            <div>
              <h2 className="text-lg font-bold tracking-widest text-navy leading-loose mb-3">
                {hero.badgeTitle || "TRUST • ACCESS • INNOVATION • IMPACT"}
              </h2>
              <div className="h-1 w-16 bg-gold mx-auto rounded-full" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-blue-600 tracking-tight whitespace-pre-line">
                {hero.badgeTagline || "A HEALTHIER\nTOMORROW\nTOGETHER."}
              </h2>
            </div>
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
            {categories.map((cat, idx) => (
              <Link
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                key={cat.id}
                className="bg-white p-1 md:p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] group flex items-center"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-blue-600 bg-blue-50 rounded-full group-hover:scale-105 transition-transform shrink-0 mr-6">
                  <span className="material-symbols-outlined text-5xl!">{getCatIcon(cat)}</span>
                </div>
                <div className="flex-1 pr-4">
                  <div className="text-gold text-sm font-bold mb-1">
                    {cat.code || String(idx + 1).padStart(2, '0')}
                  </div>
                  <h4 className="text-navy font-bold text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{cat.description || ''}</p>
                </div>
                <span className="material-symbols-outlined text-blue-600 font-bold self-center">
                  chevron_right
                </span>
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
              <Link
                href="/sectors"
                key={idx}
                className="snap-start flex-none w-50 bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-[0.98] flex flex-col items-center text-center group"
              >
                <span className="material-symbols-outlined text-5xl! text-blue-300 mb-6 group-hover:scale-110 transition-transform">
                  {sector.icon}
                </span>
                <h4 className="text-navy font-bold text-sm whitespace-pre-line group-hover:text-blue-600 transition-colors leading-tight">
                  {sector.title}
                </h4>
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

          <BrandSlider />
        </div>
      </section>

      {/* Why SA Healthcare (CMS Driven) */}
      <section className="py-20 px-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-12">
            <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              {whyUs.sectionTag || 'WHY SA HEALTHCARE'}
            </h2>
            <div className="h-px bg-gold w-12"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {whyUs.items.map((item, idx) => (
              <div key={idx} className="flex items-start md:px-8 pt-8 md:pt-0 first:md:pl-0">
                <span className="material-symbols-outlined text-5xl! text-navy mr-6 shrink-0">
                  {item.icon}
                </span>
                <div>
                  <h4 className="text-navy font-bold text-xl mb-3">{item.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Supplier */}
      <section className="py-16 px-4 md:px-6 max-w-7xl mx-auto w-full mt-4">
        <div className="bg-orange-50 rounded-3xl p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between border border-orange-200 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center mb-8 lg:mb-0 max-w-2xl">
            <span className="material-symbols-outlined text-6xl md:text-7xl! text-navy mb-4 lg:mb-0 lg:mr-8">
              handshake
            </span>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-navy mb-3">Become a Supplier</h3>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Are you a healthcare manufacturer looking to expand your reach across Southern Africa?
                We&apos;d love to hear from you.
              </p>
            </div>
          </div>
          <Link
            href="/supplier"
            className="bg-gold text-navy font-bold px-8 md:px-10 py-4 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 flex items-center shrink-0 shadow-lg shadow-gold/20 hover:shadow-gold/40 group"
          >
            Become a Supplier{' '}
            <span className="material-symbols-outlined ml-2 transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>

      {/* CTA Section (CMS Driven) */}
      <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto w-full mb-12">
        <div className="bg-navy rounded-3xl p-8 md:p-14 text-white flex flex-col lg:flex-row items-center justify-between shadow-2xl text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center mb-8 lg:mb-0">
            <span className="material-symbols-outlined text-6xl md:text-7xl! text-white mb-4 lg:mb-0 lg:mr-8 opacity-90">
              receipt_long
            </span>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">{cta.heading}</h3>
              <p className="text-gray-300 text-base md:text-lg">{cta.subheading}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-6 md:gap-8 mt-4 lg:mt-0">
            <Link
              href={cta.buttonLink || '/contact'}
              className="bg-gold text-navy font-bold px-8 md:px-10 py-4 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 flex items-center shrink-0 shadow-lg shadow-gold/20 hover:shadow-gold/40 group"
            >
              {cta.buttonText || 'Request a Quote'}{' '}
              <span className="material-symbols-outlined ml-2 transition-transform duration-300 group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-8 border-white/20">
              <a
                href={`tel:${(company.phone || cta.phone || '+27115550100').replace(/\s+/g, '')}`}
                className="flex items-center text-white hover:text-gold transition-colors shrink-0 group"
              >
                <span className="material-symbols-outlined mr-2 md:mr-3 text-2xl md:text-3xl! group-hover:scale-110 transition-transform">
                  call
                </span>
                <span className="font-semibold whitespace-nowrap text-base md:text-lg">
                  {company.phone || cta.phone || 'Get in Touch'}
                </span>
              </a>
              <a
                href={`mailto:${company.salesEmail || company.email || cta.email || 'info@sahealthcare.com'}`}
                className="flex items-center text-white hover:text-gold transition-colors shrink-0 group"
              >
                <span className="material-symbols-outlined mr-2 md:mr-3 text-2xl md:text-3xl! group-hover:scale-110 transition-transform">
                  mail
                </span>
                <span className="font-semibold whitespace-nowrap text-base md:text-lg">Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
