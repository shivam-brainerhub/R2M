"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  productsApi,
  ProductItem,
  CategoryItem,
  ProductFilterOptionsResponse,
  CategoryFilterOption,
  getMediaUrl,
} from '@/lib/api';

import { useQuoteCart } from '@/context/QuoteCartContext';
import BrochureDownloadButton from '@/components/BrochureDownloadButton';

const CATEGORY_ICON_MAP: Record<string, string> = {
  'diagnostic-and-measure': 'monitor_heart',
  'furniture': 'bed',
  'disposables-and-care-supplies': 'clean_hands',
  'hygiene-and-sterilisation': 'sanitizer',
  'hygiene-disinfection-and-sterilisation': 'sanitizer',
  'emergency-reanimation-and-surgery': 'medical_services',
  'living-aid': 'accessible',
  'instruments': 'content_cut',
  'lab': 'science',
  'veterinary': 'pets',
};

const POPULAR_SEARCH_KEYWORDS = [
  'Patient Monitor',
  'Hospital Bed',
  'ECG',
  'Pulse Oximeter',
  'Infusion Pump',
  'Defibrillator',
  'Ultrasound',
];

function getCategoryIcon(cat: CategoryFilterOption | CategoryItem): string {
  if (cat.icon && cat.icon.trim() && cat.icon !== 'category') return cat.icon;
  if (cat.slug && CATEGORY_ICON_MAP[cat.slug]) return CATEGORY_ICON_MAP[cat.slug];
  const nameLower = cat.name.toLowerCase();
  for (const [slugKey, iconName] of Object.entries(CATEGORY_ICON_MAP)) {
    if (nameLower.includes(slugKey.replace(/-/g, ' '))) return iconName;
  }
  return 'medical_services';
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlBrand = searchParams.get('brand') || '';

  const { addItem } = useQuoteCart();
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Primary Data
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Search & Navigation Filters
  // searchInput: what the user is typing in the box (does NOT call API on input)
  // activeSearch: the committed search query currently executed and loaded from API
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [activeSearch, setActiveSearch] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Accordion Expand/Collapse States
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isBrandExpanded, setIsBrandExpanded] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
  const [showMoreProperties, setShowMoreProperties] = useState<Record<string, boolean>>({});
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(false);

  // Filter Selection States
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlBrand ? [urlBrand] : []);
  const [selectedPropertyFilters, setSelectedPropertyFilters] = useState<Record<string, string[]>>({});
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);

  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedSort, setSelectedSort] = useState('A-Z');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Initial Data (Filter options from in-memory cache, products filtered by urlSearch if provided)
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlBrand) {
      setSelectedBrands([urlBrand]);
    }

    Promise.all([
      productsApi.getFilterOptions().catch(() => null),
      productsApi.listProducts({
        search: urlSearch.trim() || undefined,
        status: 'Active',
        limit: 500,
      }),
    ])
      .then(([filtersData, prods]) => {
        if (!active) return;
        setFilterOptions(filtersData);
        setProducts(prods);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync if URL search changes externally (e.g. navigation from Home page search)
  useEffect(() => {
    if (urlSearch !== activeSearch) {
      setSearchInput(urlSearch);
      setActiveSearch(urlSearch);
      setIsLoading(true);
      productsApi
        .listProducts({
          search: urlSearch.trim() || undefined,
          status: 'Active',
          limit: 500,
        })
        .then((prods) => {
          setProducts(prods);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [urlSearch, activeSearch]);

  // Execute Search: called ONLY when user hits search (Enter or button click)
  const handleExecuteSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      setSearchInput(query);
      setActiveSearch(trimmed);

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set('search', trimmed);
      } else {
        params.delete('search');
      }
      const qs = params.toString();
      router.replace(`/products${qs ? `?${qs}` : ''}`, { scroll: false });

      setIsLoading(true);
      productsApi
        .listProducts({
          search: trimmed || undefined,
          status: 'Active',
          limit: 500,
        })
        .then((prods) => {
          setProducts(prods);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    },
    [router, searchParams]
  );

  // Quick Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Toggle favorite
  const toggleFavorite = (slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Toggle comparison selection
  const handleSelectCompare = (slug: string) => {
    setSelectedProducts((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Add to Quote Action
  const handleAddToQuote = (product: ProductItem) => {
    addItem({
      productId: String(product.id),
      productName: product.name,
      slug: product.slug,
      sku: product.sku,
      brandName: product.brand_name,
      imageUrl: product.primary_image_url,
      categoryName: product.category_name,
      quantity: 1, // Quantity managed only in cart
    });
    showToast(`Added "${product.name}" to Quote Request!`);
  };


  // Toggle category expansion and selection
  const handleCategoryClick = (cat: CategoryItem) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat.slug]: !prev[cat.slug],
    }));

    if (selectedCategory !== cat.name && selectedCategory !== cat.slug) {
      setSelectedCategory(cat.name);
      setSelectedSubcategory(null);
    }
  };

  const handleSubcategoryClick = (cat: CategoryItem, subName: string) => {
    setSelectedCategory(cat.name);
    setSelectedSubcategory(subName);
  };

  const handleResetCategory = () => {
    setSelectedCategory('All');
    setSelectedSubcategory(null);
    setExpandedCategories({});
  };

  // Brand Toggle
  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  // Property Filter Toggle
  const togglePropertyFilter = (propName: string, value: string) => {
    setSelectedPropertyFilters((prev) => {
      const currentValues = prev[propName] || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      if (updatedValues.length === 0) {
        const copy = { ...prev };
        delete copy[propName];
        return copy;
      }

      return {
        ...prev,
        [propName]: updatedValues,
      };
    });
  };

  // Availability Toggle
  const toggleAvailability = (type: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Clear all refined search filters
  const handleClearAllRefine = () => {
    setSelectedBrands([]);
    setSelectedPropertyFilters({});
    setSelectedAvailability([]);
  };

  const activeRefineFiltersCount =
    selectedBrands.length +
    Object.values(selectedPropertyFilters).reduce((acc, curr) => acc + curr.length, 0) +
    selectedAvailability.length;

  // Precomputed Filter Options from Backend (Cached in Memory)
  const categories = filterOptions?.categories || [];
  const brandFilterList = filterOptions?.brands || [];
  const dynamicPropertyGroups = filterOptions?.properties || [];
  const availabilityCounts = useMemo(() => {
    if (!filterOptions?.availability) {
      return { activeCount: 0, brochureCount: 0 };
    }
    return {
      activeCount: filterOptions.availability.active_count,
      brochureCount: filterOptions.availability.brochure_count,
    };
  }, [filterOptions]);

  // Reset pagination to page 1 whenever any filter changes (render-phase state adjustment)
  const filterKey = `${activeSearch}_${selectedCategory}_${selectedSubcategory}_${selectedBrands.join(',')}_${JSON.stringify(selectedPropertyFilters)}_${selectedAvailability}_${selectedSort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }


  // FILTER PRODUCTS
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search filter
      if (activeSearch.trim() !== '') {
        const term = activeSearch.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesBrand = Boolean(p.brand_name && p.brand_name.toLowerCase().includes(term));
        const matchesSku = Boolean(p.sku && p.sku.toLowerCase().includes(term));
        const matchesDesc = Boolean(
          p.short_description && p.short_description.toLowerCase().includes(term)
        );
        const matchesProps = Boolean(
          p.properties?.some((prop) => prop.value && prop.value.toLowerCase().includes(term))
        );

        if (!matchesName && !matchesBrand && !matchesSku && !matchesDesc && !matchesProps) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'All') {
        const matchesCat =
          p.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category_id?.toString() === selectedCategory;
        if (!matchesCat) return false;
      }

      // 3. Subcategory filter
      if (selectedSubcategory) {
        const matchesSub =
          p.subcategory_name?.toLowerCase() === selectedSubcategory.toLowerCase() ||
          p.subcategory_id?.toString() === selectedSubcategory;
        if (!matchesSub) return false;
      }

      // 4. Brand filter (multi-select)
      if (selectedBrands.length > 0) {
        if (!p.brand_name || !selectedBrands.includes(p.brand_name)) {
          return false;
        }
      }

      // 5. Dynamic Property Filters (multi-select per property)
      for (const [propName, desiredValues] of Object.entries(selectedPropertyFilters)) {
        if (!desiredValues || desiredValues.length === 0) continue;
        const matchingProp = p.properties?.find(
          (prop) => prop.name.toLowerCase() === propName.toLowerCase()
        );
        if (!matchingProp || !desiredValues.includes(matchingProp.value.trim())) {
          return false;
        }
      }

      // 6. Availability filter
      if (selectedAvailability.length > 0) {
        if (selectedAvailability.includes('active') && p.status !== 'Active') {
          return false;
        }
        if (selectedAvailability.includes('brochure') && !p.brochure_url) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    activeSearch,
    selectedCategory,
    selectedSubcategory,
    selectedBrands,
    selectedPropertyFilters,
    selectedAvailability,
  ]);

  // SORT PRODUCTS
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (selectedSort === 'A-Z') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === 'Z-A') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (selectedSort === 'Newest') {
      list.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (selectedSort === 'Oldest') {
      list.sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
    }
    return list;
  }, [filteredProducts, selectedSort]);


  // Paginated Products
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // Selected Category Information for Breadcrumbs & Title
  const activeCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.slug === selectedCategory
  );

  return (
    <div className="bg-light-blue/40 min-h-screen pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-gold/50 animate-slide-up">
          <span className="material-symbols-outlined text-gold">check_circle</span>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <Link href="/quote" className="text-xs text-gold underline hover:text-white ml-2">
            View Quote
          </Link>
        </div>
      )}

      {/* Banner matching SAHC Catalogue */}
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2.5 tracking-tight">Browse the Catalogue</h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-xl">
              Explore our range of medical products from trusted global manufacturers.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteSearch(searchInput);
              }}
              className="bg-white rounded-full p-1.5 flex items-center shadow-lg overflow-hidden border border-gray-200"
            >
              <span className="material-symbols-outlined text-gray-400 ml-3 shrink-0">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product, model number, manufacturer..."
                className="flex-1 bg-transparent border-none outline-none text-navy px-3 min-w-0 w-full text-xs sm:text-sm placeholder:text-gray-400"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => handleExecuteSearch('')}
                  className="text-gray-400 hover:text-navy mr-2 p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-sm! block">close</span>
                </button>
              ) : null}
              <button
                type="submit"
                className="bg-gold text-navy font-bold px-4 py-2 rounded-full hover:bg-gold-bright transition-all text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Search</span>
                <span className="material-symbols-outlined text-xs!">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>

        {/* Popular Searches Pills */}
        <div className="max-w-7xl mx-auto mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-300 font-semibold mr-1">Popular searches:</span>
          {POPULAR_SEARCH_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => handleExecuteSearch(keyword)}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeSearch.toLowerCase() === keyword.toLowerCase()
                  ? 'bg-gold text-navy font-bold border-gold'
                  : 'bg-navy-light/60 text-gray-200 border-white/20 hover:border-gold hover:text-white'
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle Header */}
        <div className="md:hidden flex items-center justify-between bg-white p-3.5 rounded-xl shadow-xs border border-gray-100">
          <div>
            <span className="font-bold text-navy text-sm">{sortedProducts.length} Products</span>
            {activeRefineFiltersCount > 0 && (
              <span className="ml-2 text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {activeRefineFiltersCount} filtered
              </span>
            )}
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center text-xs font-semibold text-navy bg-light-blue/80 hover:bg-light-blue px-3.5 py-1.5 rounded-full border border-blue-200 shadow-xs gap-1.5"
          >
            <span className="material-symbols-outlined text-sm!">tune</span> Filters
          </button>
        </div>

        {/* Mobile Filter Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300 ${
            showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setShowMobileFilters(false)}
        />

        {/* SIDEBAR FILTERS (DESKTOP & MOBILE DRAWER) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto md:relative md:transform-none md:w-72 lg:w-80 md:shadow-none md:bg-transparent md:z-auto md:overflow-visible shrink-0 ${
            showMobileFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-5 md:p-0 space-y-3 min-h-full">
            {/* Mobile Drawer Title */}
            <div className="flex justify-between items-center md:hidden pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-navy">Filter Products</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:text-navy"
                aria-label="Close filters"
              >
                <span className="material-symbols-outlined text-base! block">close</span>
              </button>
            </div>

            {/* CARD 1: PRODUCT CATEGORIES (COLLAPSIBLE ACCORDION) */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-bold text-navy text-base tracking-tight">Product Categories</h3>
                {selectedCategory !== 'All' && (
                  <button
                    onClick={handleResetCategory}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* All Categories Option */}
              <div
                onClick={handleResetCategory}
                className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold transition-all mb-2 ${
                  selectedCategory === 'All'
                    ? 'bg-navy text-white shadow-xs'
                    : 'text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base!">apps</span>
                  <span>All Categories</span>
                </div>
                <span className={`font-mono text-xs ${selectedCategory === 'All' ? 'text-gray-300' : 'text-gray-400'}`}>
                  ({filterOptions?.total_products ?? products.length})
                </span>
              </div>

              {/* Categories Accordion List */}
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isCatSelected =
                    selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                    selectedCategory === cat.slug;
                  const isExpanded = Boolean(expandedCategories[cat.slug]);
                  const catProductCount = cat.product_count;

                  // Subcategories list
                  const subcategoriesList = cat.subcategories || [];

                  return (
                    <div
                      key={cat.id}
                      className={`rounded-xl transition-all border ${
                        isCatSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      {/* Category Header Row */}
                      <div
                        onClick={() => handleCategoryClick(cat)}
                        className="p-2 flex items-center justify-between cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`material-symbols-outlined text-lg! shrink-0 transition-colors ${
                              isCatSelected ? 'text-blue-700' : 'text-blue-600 group-hover:text-blue-700'
                            }`}
                          >
                            {getCategoryIcon(cat)}
                          </span>
                          <span
                            className={`text-xs sm:text-sm truncate ${
                              isCatSelected ? 'font-bold text-navy' : 'font-medium text-gray-800'
                            }`}
                          >
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {subcategoriesList.length === 0 && (
                            <span className="text-[11px] font-mono text-gray-400">
                              ({catProductCount})
                            </span>
                          )}
                          <span
                            className={`material-symbols-outlined text-base! transition-transform duration-200 ${
                              isCatSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-navy'
                            }`}
                          >
                            {isExpanded ? 'expand_more' : 'chevron_right'}
                          </span>
                        </div>
                      </div>

                      {/* Subcategories (Expanded Dropdown Accordion) */}
                      {isExpanded && subcategoriesList.length > 0 && (
                        <div className="px-3 pb-3 pt-1 space-y-1 border-t border-blue-100/70 bg-white/70 rounded-b-xl">
                          {/* All in Category option */}
                          <div
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setSelectedSubcategory(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-colors ${
                              isCatSelected && !selectedSubcategory
                                ? 'bg-blue-100 text-blue-900 font-bold'
                                : 'text-gray-600 hover:text-navy hover:bg-slate-100/70'
                            }`}
                          >
                            <span>All {cat.name}</span>
                            <span className="text-gray-400 font-mono text-[11px]">({catProductCount})</span>
                          </div>

                          {/* Subcategory Items */}
                          {subcategoriesList.map((sub) => {
                            const isSubSelected =
                              isCatSelected &&
                              (selectedSubcategory === sub.name || selectedSubcategory === sub.slug);
                            const subProductCount = sub.product_count;

                            return (
                              <div
                                key={sub.id}
                                onClick={() => handleSubcategoryClick(cat, sub.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-colors ${
                                  isSubSelected
                                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                                    : 'text-gray-600 hover:text-navy hover:bg-slate-100/70'
                                }`}
                              >
                                <span className="truncate pr-2">{sub.name}</span>
                                <span className="font-mono text-[11px] text-gray-400 shrink-0">
                                  ({subProductCount})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: REFINE YOUR SEARCH (MANUFACTURER & DYNAMIC PROPERTY GROUPS) */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 sm:p-5 space-y-2">
              {/* Section Header with Clear All button */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-navy text-base tracking-tight">Refine your search</h3>
                  {activeRefineFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {activeRefineFiltersCount}
                    </span>
                  )}
                </div>
                {activeRefineFiltersCount > 0 && (
                  <button
                    onClick={handleClearAllRefine}
                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* 1. COLLAPSIBLE MANUFACTURER (BRAND) FILTER */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsBrandExpanded(!isBrandExpanded)}
                  className="w-full flex items-center justify-between text-left py-1 text-navy font-bold text-sm select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Manufacturer</span>
                    {selectedBrands.length > 0 && (
                      <span className="text-[11px] text-blue-600 font-normal">
                        ({selectedBrands.length})
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-navy text-lg! transition-transform">
                    {isBrandExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isBrandExpanded && (
                  <div className="mt-2.5 space-y-1.5">
                    {(showAllBrands ? brandFilterList : brandFilterList.slice(0, 5)).map((b) => {
                      const isChecked = selectedBrands.includes(b.name);
                      return (
                        <label
                          key={b.name}
                          className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-700 py-1 hover:text-navy select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBrand(b.name)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={`flex-1 truncate ${isChecked ? 'font-bold text-navy' : ''}`}>
                            {b.name}
                          </span>
                          <span className="text-gray-400 font-mono text-[11px]">({b.count})</span>
                        </label>
                      );
                    })}

                    {brandFilterList.length > 5 && (
                      <button
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1 pt-1.5"
                      >
                        <span>{showAllBrands ? 'Show less' : 'Show more'}</span>
                        <span className="material-symbols-outlined text-xs!">
                          {showAllBrands ? 'expand_less' : 'chevron_right'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. DYNAMIC PROPERTY GROUPS EXTRACTED FROM PRODUCTS */}
              {dynamicPropertyGroups.map((propGroup) => {
                const isExpanded = Boolean(expandedProperties[propGroup.name]);
                const showAll = Boolean(showMoreProperties[propGroup.name]);
                const selectedForThisProp = selectedPropertyFilters[propGroup.name] || [];

                return (
                  <div key={propGroup.name} className="border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProperties((prev) => ({
                          ...prev,
                          [propGroup.name]: !prev[propGroup.name],
                        }))
                      }
                      className="w-full flex items-center justify-between text-left py-1 text-navy font-bold text-sm select-none group"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className="truncate">{propGroup.name}</span>
                        {selectedForThisProp.length > 0 && (
                          <span className="text-[11px] text-blue-600 font-normal shrink-0">
                            ({selectedForThisProp.length})
                          </span>
                        )}
                        {propGroup.group && (
                          <span className="text-[10px] text-gray-400 font-normal shrink-0 hidden lg:inline">
                            · {propGroup.group}
                          </span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-navy text-lg! transition-transform shrink-0">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-1.5">
                        {(showAll ? propGroup.options : propGroup.options.slice(0, 5)).map((opt) => {
                          const isChecked = selectedForThisProp.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-700 py-1 hover:text-navy select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePropertyFilter(propGroup.name, opt.value)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className={`flex-1 truncate ${isChecked ? 'font-bold text-navy' : ''}`}>
                                {opt.value}
                              </span>
                              <span className="text-gray-400 font-mono text-[11px]">({opt.count})</span>
                            </label>
                          );
                        })}

                        {propGroup.options.length > 5 && (
                          <button
                            onClick={() =>
                              setShowMoreProperties((prev) => ({
                                ...prev,
                                [propGroup.name]: !prev[propGroup.name],
                              }))
                            }
                            className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1 pt-1.5"
                          >
                            <span>{showAll ? 'Show less' : 'Show more'}</span>
                            <span className="material-symbols-outlined text-xs!">
                              {showAll ? 'expand_less' : 'chevron_right'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 3. AVAILABILITY FILTER */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                  className="w-full flex items-center justify-between text-left py-1 text-navy font-bold text-sm select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Availability</span>
                    {selectedAvailability.length > 0 && (
                      <span className="text-[11px] text-blue-600 font-normal">
                        ({selectedAvailability.length})
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-navy text-lg! transition-transform">
                    {isAvailabilityExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isAvailabilityExpanded && (
                  <div className="mt-2.5 space-y-1.5">
                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-700 py-1 hover:text-navy select-none">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes('active')}
                        onChange={() => toggleAvailability('active')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1">In Stock / Active</span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        ({availabilityCounts.activeCount})
                      </span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-700 py-1 hover:text-navy select-none">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes('brochure')}
                        onChange={() => toggleAvailability('brochure')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1">Brochure</span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        ({availabilityCounts.brochureCount})
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Apply Button */}
            <div className="md:hidden pt-2">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-navy text-white font-bold py-3 rounded-xl shadow-md text-sm hover:bg-navy-light transition-all"
              >
                Show {sortedProducts.length} Results
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCT CATALOGUE VIEW */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb matching SAHC Catalogue */}
          <nav className="text-xs text-gray-500 flex items-center flex-wrap gap-1 mb-3">
            <Link href="/" className="hover:text-navy hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <Link href="/products" className="hover:text-navy hover:underline">
              Products
            </Link>
            {selectedCategory !== 'All' && (
              <>
                <span>&gt;</span>
                <span
                  onClick={selectedSubcategory ? () => setSelectedSubcategory(null) : undefined}
                  className={selectedSubcategory ? 'hover:text-navy hover:underline cursor-pointer' : 'text-gray-800 font-semibold'}
                >
                  {activeCategoryObj ? activeCategoryObj.name : selectedCategory}
                </span>
              </>
            )}
            {selectedSubcategory && (
              <>
                <span>&gt;</span>
                <span className="text-navy font-bold">{selectedSubcategory}</span>
              </>
            )}
          </nav>

          {/* Header Row with Title */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              {activeSearch
                ? `Search results for "${activeSearch}"`
                : selectedSubcategory ||
                  (selectedCategory === 'All'
                    ? 'All Products'
                    : activeCategoryObj?.name || selectedCategory)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-2xl">
              {activeSearch
                ? `Showing medical equipment matching "${activeSearch}".`
                : activeCategoryObj?.description ||
                  'Explore our catalogue of patient monitors, hospital beds, and clinical equipment from trusted global manufacturers.'}
            </p>
          </div>

          {/* Results Toolbar: Count, Active Search Badge, Grid/List Switcher, Sort Dropdown */}
          <div className="relative z-30 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 mb-6 shadow-2xs gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-navy text-sm sm:text-base">
                {sortedProducts.length} Products
              </span>
              {activeSearch && (
                <div className="inline-flex items-center gap-1.5 bg-gold/20 text-navy font-semibold px-2.5 py-1 rounded-full text-xs border border-gold/40">
                  <span>Search: &ldquo;{activeSearch}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch('')}
                    className="hover:text-red-600 cursor-pointer flex items-center"
                    title="Clear search"
                  >
                    <span className="material-symbols-outlined text-xs!">close</span>
                  </button>
                </div>
              )}
              {activeRefineFiltersCount > 0 && (
                <button
                  onClick={handleClearAllRefine}
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-md font-medium"
                >
                  <span>Clear filters</span>
                  <span className="material-symbols-outlined text-xs!">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              {/* View Switcher Icons */}
              <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-light-blue text-navy'
                      : 'text-gray-400 hover:text-navy'
                  }`}
                  aria-label="Grid view"
                >
                  <span className="material-symbols-outlined text-lg! block">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-light-blue text-navy'
                      : 'text-gray-400 hover:text-navy'
                  }`}
                  aria-label="List view"
                >
                  <span className="material-symbols-outlined text-lg! block">view_list</span>
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between border border-gray-200 rounded-lg py-1.5 px-3 text-gray-700 bg-white hover:border-blue-400 hover:text-navy transition-colors text-xs font-semibold shadow-xs gap-2 cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="font-bold text-navy">{selectedSort}</span>
                  <span className="material-symbols-outlined text-gray-400 text-sm!">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1 text-xs">
                    {['A-Z', 'Z-A', 'Newest', 'Oldest', 'Most Popular'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedSort(option);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-light-blue transition-colors flex items-center justify-between cursor-pointer ${
                          selectedSort === option
                            ? 'text-navy font-bold bg-light-blue/50'
                            : 'text-gray-700 hover:text-navy'
                        }`}
                      >
                        <span>{option}</span>
                        {selectedSort === option && (
                          <span className="material-symbols-outlined text-xs! text-blue-600">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCTS LISTING */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-xs border border-gray-100">
              <span className="material-symbols-outlined text-4xl! animate-spin text-blue-600 mb-2">
                progress_activity
              </span>
              <p className="text-xs text-gray-500 font-semibold">Loading catalogue products...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-xs border border-gray-100">
              <span className="material-symbols-outlined text-5xl! text-gray-300 mb-3">
                inventory_2
              </span>
              <h3 className="text-lg font-bold text-navy">No products match your criteria</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try clearing some of your search filters or selecting another category.
              </p>
              <button
                onClick={() => {
                  handleClearAllRefine();
                  handleResetCategory();
                  handleExecuteSearch('');
                }}
                className="mt-4 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-navy-light transition-colors shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={`relative z-10 ${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'flex flex-col gap-4'
              }`}
            >
              {paginatedProducts.map((p) => {
                const img =
                  p.primary_image_url || p.images[0]?.image_url || '/images/benevision_n12.jpg';
                const isSelected = selectedProducts.includes(p.slug);
                const isFavorited = favorites.includes(p.slug);

                return (
                  <div
                    key={p.id}
                    className={`bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow p-4 md:p-5 flex flex-col group relative ${
                      viewMode === 'list' ? 'sm:flex-row sm:items-stretch sm:gap-6' : 'h-full justify-between'
                    }`}
                  >
                    {/* Product Photo Box (With Brand & Wishlist header if in Grid View) */}
                    <div className={viewMode === 'list' ? 'w-full sm:w-48 md:w-52 shrink-0 flex flex-col justify-center' : 'w-full'}>
                      {viewMode === 'grid' && (
                        <div className="w-full flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-red-600">
                            {p.brand_name || 'Generic'}
                          </span>
                          <button
                            onClick={() => toggleFavorite(p.slug)}
                            className={`p-1 rounded-full transition-colors cursor-pointer ${
                              isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-500'
                            }`}
                            title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
                          >
                            <span className="material-symbols-outlined text-xl!">
                              {isFavorited ? 'favorite' : 'favorite_border'}
                            </span>
                          </button>
                        </div>
                      )}

                      <Link
                        href={`/products/${p.slug}`}
                        className={
                          viewMode === 'list'
                            ? 'w-full aspect-square bg-slate-50/50 rounded-xl flex items-center justify-center p-2 border border-gray-100 overflow-hidden relative group-hover:border-blue-200 transition-colors'
                            : 'w-full aspect-square bg-white rounded-xl flex items-center justify-center mb-3 border border-gray-100 overflow-hidden relative group-hover:border-blue-200 transition-colors'
                        }
                      >
                        <Image
                          src={getMediaUrl(img)}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                    </div>

                    {/* Info Block */}
                    <div className="flex-1 flex flex-col justify-between mt-3 sm:mt-0">
                      <div>
                        {viewMode === 'list' && (
                          <div className="w-full flex items-center justify-between mb-1.5">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600">
                              {p.brand_name || 'Generic'}
                            </span>
                            <button
                              onClick={() => toggleFavorite(p.slug)}
                              className={`p-1 rounded-full transition-colors cursor-pointer ${
                                isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-500'
                              }`}
                              title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                              <span className="material-symbols-outlined text-xl!">
                                {isFavorited ? 'favorite' : 'favorite_border'}
                              </span>
                            </button>
                          </div>
                        )}

                        <Link href={`/products/${p.slug}`}>
                          <h3 className="font-bold text-navy text-sm md:text-base leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                        {p.short_description && (
                          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {p.short_description}
                          </p>
                        )}

                        {/* Specs & Brochure Links */}
                        <div className="mt-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                          <Link
                            href={`/products/${p.slug}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                          >
                            <span className="material-symbols-outlined text-base!">description</span>
                            <span>View Specs</span>
                          </Link>

                          {p.brochure_url && (
                            <BrochureDownloadButton
                              brochureUrl={p.brochure_url}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base!">download</span>
                              <span>Download Brochure</span>
                            </BrochureDownloadButton>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Bar: Compare & Request a Quote button */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between w-full gap-2">
                        <label className="flex items-center space-x-1.5 text-gray-600 cursor-pointer hover:text-navy select-none text-xs">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-gold focus:ring-gold w-4 h-4 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectCompare(p.slug)}
                          />
                          <span className="font-medium">Compare</span>
                        </label>

                        <button
                          onClick={() => handleAddToQuote(p)}
                          className="bg-gold text-navy font-bold px-4 py-1.5 rounded-full hover:bg-gold-bright transition-all text-xs active:scale-95 shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Get a Quote</span>
                          <span className="material-symbols-outlined text-xs!">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-navy">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-navy">
                  {Math.min(currentPage * pageSize, sortedProducts.length)}
                </span>{' '}
                of <span className="font-bold text-navy">{sortedProducts.length}</span> products
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">chevron_left</span>
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-navy text-white shadow-xs'
                          : 'border border-gray-200 text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm!">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Compare Bar (exact match to uploaded design) */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-navy text-white px-5 sm:px-6 py-3.5 rounded-2xl shadow-2xl z-50 animate-slide-up border border-white/10 flex items-center justify-between gap-4 sm:gap-6 backdrop-blur-md">
          {/* Left: Balance Icon + Selected Count */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined text-2xl! sm:text-3xl! text-gold">balance</span>
            <span className="font-semibold text-white text-xs sm:text-sm md:text-base whitespace-nowrap">
              {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected
            </span>
          </div>

          {/* Middle: Selected Products with Thumbnails & Names */}
          <div className="flex-1 flex items-center gap-4 sm:gap-6 overflow-x-auto py-1 px-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {selectedProducts.map((slug) => {
              const product = products.find((p) => p.slug === slug);
              const img =
                product?.primary_image_url ||
                product?.images[0]?.image_url ||
                '/images/benevision_n12.jpg';

              return (
                <div key={slug} className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  {/* Thumbnail Box */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                    <Image
                      src={getMediaUrl(img)}
                      alt={product ? product.name : slug}
                      fill
                      sizes="48px"
                      className="object-contain p-0.5"
                    />
                  </div>

                  {/* Brand & Model */}
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white text-xs leading-tight">
                      {product?.brand_name || 'Generic'}
                    </span>
                    <span className="text-gray-300 text-xs truncate max-w-25 sm:max-w-32.5 leading-tight mt-0.5">
                      {product?.name || slug}
                    </span>
                  </div>

                  {/* Remove X Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectCompare(slug)}
                    className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                    title="Remove from compare"
                    aria-label={`Remove ${product ? product.name : slug} from compare`}
                  >
                    <span className="material-symbols-outlined text-sm! block">close</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Vertical Divider & Compare Products Button */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="h-8 w-px bg-white/20 hidden md:block" />

            <Link
              href={`/compare?items=${selectedProducts.join(',')}`}
              className="bg-gold text-navy font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-gold-bright transition-all active:scale-95 text-xs sm:text-sm whitespace-nowrap shadow-lg flex items-center gap-2"
            >
              <span>Compare Products</span>
              <span className="material-symbols-outlined text-sm!">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-light-blue/40">
          <span className="material-symbols-outlined text-4xl animate-spin text-navy">
            progress_activity
          </span>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
