"use client";

import { useState } from 'react';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'company'>('hero');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hero Content State
  const [heroContent, setHeroContent] = useState({
    headlinePart1: 'Healthcare',
    headlinePart2: 'without',
    headlineAccent: 'limits.',
    subheading: 'Explore SA Healthcare\'s growing digital healthcare catalogue. Search products, brochures and technical specifications from trusted global manufacturers.',
    showSearchBar: true,
  });

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'SA Healthcare',
    phone: '+27 11 555 0100',
    tollFree: '0800 123 456',
    email: 'info@sahealthcare.com',
    salesEmail: 'quotes@sahealthcare.com',
    physicalAddress: '15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa',
    hours: 'Monday – Friday: 08:00 – 17:00 (SAST)',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (section: string) => {
    showToast(`Saved ${section} settings successfully! Changes will reflect on live site.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl border border-gold/40 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-gold text-xl!">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Site Content &amp; CMS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Update marketing copy, hero slogans, search bar visibility, and contact details.
          </p>
        </div>

        <button
          onClick={() => handleSave(activeTab === 'hero' ? 'Homepage Hero' : 'Company & Contact Info')}
          className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg!">save</span>
          Save Current Section
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-navy text-white shadow-xs'
              : 'text-gray-600 hover:text-navy hover:bg-white'
          }`}
        >
          <span className="material-symbols-outlined text-base!">view_headline</span>
          <span>Homepage Hero &amp; Search</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'bg-navy text-white shadow-xs'
              : 'text-gray-600 hover:text-navy hover:bg-white'
          }`}
        >
          <span className="material-symbols-outlined text-base!">apartment</span>
          <span>Contact &amp; Company Info</span>
        </button>
      </div>

      {/* Tab 1: Hero Section */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-navy">Homepage Hero Typography &amp; Search Configuration</h2>
            <p className="text-xs text-gray-500">Configure the main hero presentation and searchbar visibility on /home.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Headline Line 1
              </label>
              <input
                type="text"
                value={heroContent.headlinePart1}
                onChange={(e) => setHeroContent({ ...heroContent, headlinePart1: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Headline Line 2
              </label>
              <input
                type="text"
                value={heroContent.headlinePart2}
                onChange={(e) => setHeroContent({ ...heroContent, headlinePart2: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Accent Word (Light Blue)
              </label>
              <input
                type="text"
                value={heroContent.headlineAccent}
                onChange={(e) => setHeroContent({ ...heroContent, headlineAccent: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-blue-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Hero Paragraph Subtitle
            </label>
            <textarea
              rows={3}
              value={heroContent.subheading}
              onChange={(e) => setHeroContent({ ...heroContent, subheading: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy leading-relaxed"
            />
          </div>

          {/* Checkbox to show searchbar */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-gray-200">
            <div>
              <span className="font-bold text-navy text-sm block">Show Hero Search Bar</span>
              <span className="text-xs text-gray-500">Toggle whether the catalogue search input is displayed in the homepage hero section.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={heroContent.showSearchBar}
                onChange={(e) => setHeroContent({ ...heroContent, showSearchBar: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => handleSave('Homepage Hero')}
              className="bg-navy text-white font-semibold px-5 py-2 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer"
            >
              Save Hero Changes
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Company & Contact Info */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-navy">Corporate &amp; Contact Details</h2>
            <p className="text-xs text-gray-500">Contact information displayed across the site header, footer, and contact page.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={companyInfo.companyName}
                onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                General Support Email
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Sales &amp; Quotations Email
              </label>
              <input
                type="email"
                value={companyInfo.salesEmail}
                onChange={(e) => setCompanyInfo({ ...companyInfo, salesEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Physical Office Address
            </label>
            <input
              type="text"
              value={companyInfo.physicalAddress}
              onChange={(e) => setCompanyInfo({ ...companyInfo, physicalAddress: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Operating Hours
            </label>
            <input
              type="text"
              value={companyInfo.hours}
              onChange={(e) => setCompanyInfo({ ...companyInfo, hours: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => handleSave('Company & Contact Info')}
              className="bg-navy text-white font-semibold px-5 py-2 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer"
            >
              Save Company Info
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
