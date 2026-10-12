"use client";

import { useState } from 'react';

interface CategoryItem {
  id: string;
  code: string;
  title: string;
  desc: string;
  icon: string;
  productCount: number;
}

interface BrandItem {
  id: string;
  name: string;
  country: string;
  desc: string;
  featuredInSlider: boolean;
  productCount: number;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: '1', code: '01', title: 'Diagnostic and Measure', desc: 'Patient monitors, ECG, ultrasound, thermometers, scales.', icon: 'monitor_heart', productCount: 4 },
  { id: '2', code: '02', title: 'Furniture', desc: 'Hospital beds, operating tables and medical furniture.', icon: 'bed', productCount: 0 },
  { id: '3', code: '03', title: 'Disposables and Care Supplies', desc: 'Gloves, gowns, bandages, dressings, tubes, syringes.', icon: 'clean_hands', productCount: 0 },
  { id: '4', code: '04', title: 'Hygiene and Sterilisation', desc: 'Autoclaves, UV sterilisers, cleaning products, disinfectants.', icon: 'sanitizer', productCount: 0 },
  { id: '5', code: '05', title: 'Emergency, Reanimation and Surgery', desc: 'Defibrillators, AEDs, resuscitation, stretchers.', icon: 'medical_services', productCount: 0 },
  { id: '6', code: '06', title: 'Living Aid', desc: 'Wheelchairs, crutches, walkers, patient transfer aids.', icon: 'accessible', productCount: 0 },
  { id: '7', code: '07', title: 'Instruments', desc: 'Scissors, forceps, speculums, laryngoscopes, otoscopes.', icon: 'content_cut', productCount: 0 },
  { id: '8', code: '08', title: 'Lab', desc: 'Laboratory equipment, fridges, containers, petri dishes.', icon: 'science', productCount: 0 },
  { id: '9', code: '09', title: 'Veterinary', desc: 'Veterinary equipment, instruments and consumables.', icon: 'pets', productCount: 0 },
];

const INITIAL_BRANDS: BrandItem[] = [
  { id: '1', name: 'Mindray', country: 'Global / Shenzhen', desc: 'Pioneering patient monitoring, life support and diagnostic solutions.', featuredInSlider: true, productCount: 1 },
  { id: '2', name: 'Philips', country: 'Netherlands', desc: 'Advanced clinical patient surveillance, imaging and acute monitoring.', featuredInSlider: true, productCount: 1 },
  { id: '3', name: 'Dräger', country: 'Germany', desc: 'Medical technology specialist in acute point-of-care and anaesthesia.', featuredInSlider: true, productCount: 1 },
  { id: '4', name: 'Contec', country: 'Global', desc: 'Specialised electronic patient monitoring, pulse oximetry and ECG.', featuredInSlider: true, productCount: 1 },
  { id: '5', name: 'Baxter', country: 'USA', desc: 'Essential hospital healthcare products and fluid management systems.', featuredInSlider: true, productCount: 0 },
];

export default function AdminCategoriesBrandsPage() {
  const [viewSection, setViewSection] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<BrandItem[]>(INITIAL_BRANDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleBrandSlider = (id: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const next = !b.featuredInSlider;
          showToast(`${b.name} ${next ? 'added to' : 'removed from'} homepage slider`);
          return { ...b, featuredInSlider: next };
        }
        return b;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
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
            Categories &amp; Medical Brands
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize catalogue classification taxonomy and maintain partner manufacturer profiles.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewSection('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewSection === 'categories'
                ? 'bg-navy text-white shadow-xs'
                : 'text-gray-600 hover:text-navy'
            }`}
          >
            <span className="material-symbols-outlined text-base!">category</span>
            Product Categories ({categories.length})
          </button>
          <button
            onClick={() => setViewSection('brands')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewSection === 'brands'
                ? 'bg-navy text-white shadow-xs'
                : 'text-gray-600 hover:text-navy'
            }`}
          >
            <span className="material-symbols-outlined text-base!">domain</span>
            Manufacturers ({brands.length})
          </button>
        </div>
      </div>

      {/* Section 1: Categories Grid */}
      {viewSection === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl!">{cat.icon}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-gold bg-navy/5 px-2.5 py-0.5 rounded-md">
                    Code: {cat.code}
                  </span>
                </div>

                <h3 className="font-bold text-navy text-base mb-1">{cat.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{cat.desc}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{cat.productCount} Active Product(s)</span>
                <span className="text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  <span>Edit Taxonomy</span>
                  <span className="material-symbols-outlined text-xs!">edit</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Manufacturers Table */}
      {viewSection === 'brands' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-navy">Partner Medical Brands</h2>
              <p className="text-xs text-gray-500">Configure brand profiles, origin and toggle inclusion in the homepage BrandSlider.</p>
            </div>
            <button
              onClick={() => showToast('Manufacturer registration dialog is available in this mode.')}
              className="bg-navy text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl hover:bg-navy-light transition-all cursor-pointer"
            >
              + Add Manufacturer
            </button>
          </div>

          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Brand Name</th>
                <th className="px-4 py-3.5">Country / Headquarters</th>
                <th className="px-4 py-3.5">Speciality Description</th>
                <th className="px-4 py-3.5">Homepage Slider</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-navy text-sm">{b.name}</div>
                    <div className="text-[11px] text-gray-400 font-medium">{b.productCount} catalogue products</div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                    {b.country}
                  </td>
                  <td className="px-4 py-4 text-gray-600 max-w-sm text-xs leading-relaxed">
                    {b.desc}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleBrandSlider(b.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        b.featuredInSlider
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${b.featuredInSlider ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                      {b.featuredInSlider ? 'Featured on Slider' : 'Hidden from Slider'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => showToast(`Editing ${b.name} details`)}
                      className="p-1.5 text-gray-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg!">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
