'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  resourcesApi,
  categoriesApi,
  brandsApi,
  ResourceItem,
  CategoryItem,
  BrandItem,
} from '@/lib/api';
import BrochureDownloadButton from '@/components/BrochureDownloadButton';
import CustomSelect from '@/components/CustomSelect';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Documents', icon: 'folder_open' },
  { value: 'brochure', label: 'Brochures', icon: 'picture_as_pdf' },
  { value: 'specifications', label: 'Tech Specs', icon: 'analytics' },
  { value: 'user manual', label: 'User Manuals', icon: 'menu_book' },
  { value: 'certificate', label: 'Certificates', icon: 'verified' },
];

function ResourceCentreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state initialized from URL search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'all');

  // Load Categories & Brands for dropdown filters
  useEffect(() => {
    categoriesApi.listCategories().then(setCategories).catch(() => {});
    brandsApi.listBrands().then(setBrands).catch(() => {});
  }, []);

  // Fetch Resources from API
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const params: { search?: string; type?: string; category?: string; brand?: string } = {};
    if (search.trim()) params.search = search.trim();
    if (selectedType !== 'all') params.type = selectedType;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedBrand !== 'all') params.brand = selectedBrand;

    resourcesApi
      .listResources(params)
      .then((data) => {
        if (!active) return;
        setResources(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load resources', err);
        setResources([]);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, selectedType, selectedCategory, selectedBrand]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all';

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-navy text-white py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-gold text-xs font-bold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            <span>Dedicated Resource Centre</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-3 tracking-tight">
            Medical Documentation &amp; Technical Library
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Search and download verified manufacturer brochures, comprehensive technical datasheets, clinical user manuals, and regulatory compliance certificates across our entire medical equipment catalogue.
          </p>

          {/* Search Box in Hero */}
          <div className="mt-8 max-w-2xl relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document title, product name, model number, or brand..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-navy rounded-2xl border-none shadow-lg text-sm sm:text-base focus:ring-2 focus:ring-gold outline-none"
            />
            <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400 text-2xl pointer-events-none">
              search
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-navy p-0.5 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls Bar: Type Tabs & Dropdown Filters */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs mb-8 space-y-4">
          {/* Document Type Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DOCUMENT_TYPES.map((t) => {
              const active = selectedType.toLowerCase() === t.value.toLowerCase();
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(t.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200 hover:text-navy'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${active ? 'text-gold' : 'text-gray-500'}`}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Dropdowns & Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="min-w-44">
                <CustomSelect
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.slug || c.name, label: c.name })),
                  ]}
                  size="sm"
                  variant="slate"
                />
              </div>

              {/* Brand Filter */}
              <div className="min-w-40">
                <CustomSelect
                  value={selectedBrand}
                  onChange={(val) => setSelectedBrand(val)}
                  options={[
                    { value: 'all', label: 'All Brands' },
                    ...brands.map((b) => ({ value: b.slug || b.name, label: b.name })),
                  ]}
                  size="sm"
                  variant="slate"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-gray-500">
              Showing <span className="font-bold text-navy">{resources.length}</span> documents
            </div>
          </div>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-4xl animate-spin text-blue-600 mb-3">
              progress_activity
            </span>
            <p className="text-xs text-gray-500 font-semibold">Accessing verified document repository...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <span className="material-symbols-outlined text-3xl">folder_off</span>
            </div>
            <h3 className="text-lg font-bold text-navy">No documentation found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We couldn&apos;t find any documents matching your current search and filter criteria. Try adjusting your query or reset filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 bg-navy text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-navy-light transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((item) => {
              const isManual = item.type.toLowerCase().includes('manual');
              const isCert = item.type.toLowerCase().includes('cert');
              const isSpec = item.type.toLowerCase().includes('spec');
              const iconName = isManual ? 'menu_book' : isCert ? 'verified' : isSpec ? 'analytics' : 'picture_as_pdf';
              const badgeBg = isManual ? 'bg-teal-50 text-teal-800 border-teal-200' : isCert ? 'bg-amber-50 text-amber-800 border-amber-200' : isSpec ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-red-50 text-red-800 border-red-200';
              const iconColor = isManual ? 'text-teal-600' : isCert ? 'text-amber-600' : isSpec ? 'text-blue-600' : 'text-red-500';

              return (
                <div
                  key={`${item.id}-${item.file_url}`}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                        <span className="material-symbols-outlined text-sm">{iconName}</span>
                        <span>{item.type}</span>
                      </span>

                      {item.brand_name && (
                        <span className="text-[11px] font-bold text-gray-500 bg-slate-50 border border-gray-200 px-2 py-0.5 rounded-md">
                          {item.brand_name}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-navy text-sm sm:text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.product_name && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          Product:{' '}
                          {item.product_slug ? (
                            <Link
                              href={`/products/${item.product_slug}`}
                              className="text-navy hover:underline font-semibold"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-navy">{item.product_name}</span>
                          )}
                        </p>
                      )}
                      {item.category_name && (
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {item.category_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Verified Download</span>
                    </div>

                    <BrochureDownloadButton
                      brochureUrl={item.file_url}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Download</span>
                    </BrochureDownloadButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceCentrePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
            progress_activity
          </span>
        </div>
      }
    >
      <ResourceCentreContent />
    </Suspense>
  );
}
