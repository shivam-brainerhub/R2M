"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  categoriesApi,
  brandsApi,
  CategoryItem,
  BrandItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateBrandPayload,
  UpdateBrandPayload,
  ApiError,
  getMediaUrl,
} from '@/lib/api';

const POPULAR_CATEGORY_ICONS = [
  'monitor_heart',
  'bed',
  'clean_hands',
  'sanitizer',
  'medical_services',
  'accessible',
  'content_cut',
  'science',
  'pets',
  'cardiology',
  'vaccines',
  'emergency',
  'local_hospital',
  'biotech',
  'stethoscope',
  'vital_signs',
];

export default function AdminCategoriesBrandsPage() {
  const { token } = useAuth();

  const [viewSection, setViewSection] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryPayload>({
    name: '',
    code: '',
    description: '',
    icon: 'category',
  });
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [brandFormData, setBrandFormData] = useState<CreateBrandPayload>({
    name: '',
    country: '',
    description: '',
    logo_url: '',
    website_url: '',
    featured_in_slider: true,
  });
  const [brandFormError, setBrandFormError] = useState<string | null>(null);
  const [isBrandSubmitting, setIsBrandSubmitting] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    type: 'category' | 'brand';
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline Category Deletion State (Confirm directly in specific card, no alert)
  const [confirmingDeleteCategoryId, setConfirmingDeleteCategoryId] = useState<number | null>(null);
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInlineDeleteCategory = async (cat: CategoryItem) => {
    if (!token) {
      showToast('Authentication required to delete category');
      return;
    }

    setIsDeletingCategoryId(cat.id);
    try {
      await categoriesApi.deleteCategory(token, cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast(`Category "${cat.name}" deleted successfully`);
      setConfirmingDeleteCategoryId(null);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete category';
      showToast(msg);
    } finally {
      setIsDeletingCategoryId(null);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catsData, brandsData] = await Promise.all([
        categoriesApi.listCategories(),
        brandsApi.listBrands(),
      ]);
      setCategories(catsData);
      setBrands(brandsData);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to connect to backend server';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([categoriesApi.listCategories(), brandsApi.listBrands()])
      .then(([catsData, brandsData]) => {
        if (!isMounted) return;
        setCategories(catsData);
        setBrands(brandsData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof ApiError ? err.message : 'Failed to connect to backend server';
        setError(msg);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered lists
  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.code && c.code.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  const filteredBrands = brands.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      (b.country && b.country.toLowerCase().includes(term)) ||
      (b.description && b.description.toLowerCase().includes(term))
    );
  });

  // Slider Toggle Handler
  const handleToggleBrandSlider = async (brand: BrandItem) => {
    if (!token) {
      showToast('Authentication required to update brands');
      return;
    }

    try {
      const res = await brandsApi.toggleSlider(token, brand.id);
      setBrands((prev) =>
        prev.map((b) =>
          b.id === brand.id ? { ...b, featured_in_slider: res.featured_in_slider } : b
        )
      );
      showToast(res.message);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to toggle homepage slider';
      showToast(msg);
    }
  };

  // Open Category Create/Edit
  const handleOpenCategoryModal = (cat?: CategoryItem) => {
    setCategoryFormError(null);
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        name: cat.name,
        code: cat.code || '',
        description: cat.description || '',
        icon: cat.icon || 'category',
      });
    } else {
      setEditingCategory(null);
      // Generate next code
      const nextCodeNum = categories.length + 1;
      const defaultCode = nextCodeNum < 10 ? `0${nextCodeNum}` : `${nextCodeNum}`;
      setCategoryFormData({
        name: '',
        code: defaultCode,
        description: '',
        icon: 'category',
      });
    }
    setIsCategoryModalOpen(true);
  };

  // Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setCategoryFormError('Category name is required.');
      return;
    }

    if (!token) {
      setCategoryFormError('Authentication required. Please re-login.');
      return;
    }

    setIsCategorySubmitting(true);
    setCategoryFormError(null);

    try {
      if (editingCategory) {
        const payload: UpdateCategoryPayload = {
          name: categoryFormData.name.trim(),
          code: categoryFormData.code?.trim() || undefined,
          description: categoryFormData.description?.trim() || undefined,
          icon: categoryFormData.icon?.trim() || 'category',
        };
        const updated = await categoriesApi.updateCategory(token, editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast(`Category "${updated.name}" updated successfully`);
      } else {
        const payload: CreateCategoryPayload = {
          name: categoryFormData.name.trim(),
          code: categoryFormData.code?.trim() || undefined,
          description: categoryFormData.description?.trim() || undefined,
          icon: categoryFormData.icon?.trim() || 'category',
        };
        const created = await categoriesApi.createCategory(token, payload);
        setCategories((prev) => [...prev, created]);
        showToast(`Category "${created.name}" created successfully`);
      }
      setIsCategoryModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save category';
      setCategoryFormError(msg);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  // Open Brand Create/Edit
  const handleOpenBrandModal = (brand?: BrandItem) => {
    setBrandFormError(null);
    setSelectedLogoFile(null);
    if (brand) {
      setEditingBrand(brand);
      setLogoPreview(brand.logo_url ? getMediaUrl(brand.logo_url) : null);
      setBrandFormData({
        name: brand.name,
        country: brand.country || '',
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        website_url: brand.website_url || '',
        featured_in_slider: brand.featured_in_slider,
      });
    } else {
      setEditingBrand(null);
      setLogoPreview(null);
      setBrandFormData({
        name: '',
        country: '',
        description: '',
        logo_url: '',
        website_url: '',
        featured_in_slider: true,
      });
    }
    setIsBrandModalOpen(true);
  };

  // Brand Submit
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandFormData.name.trim()) {
      setBrandFormError('Brand name is required.');
      return;
    }

    if (!token) {
      setBrandFormError('Authentication required. Please re-login.');
      return;
    }

    setIsBrandSubmitting(true);
    setBrandFormError(null);

    try {
      let finalLogoUrl = brandFormData.logo_url;

      // If user selected a new logo file from PC, upload it first
      if (selectedLogoFile) {
        const uploadResult = await brandsApi.uploadLogo(token, selectedLogoFile);
        finalLogoUrl = uploadResult.url;
      }

      if (editingBrand) {
        const payload: UpdateBrandPayload = {
          name: brandFormData.name.trim(),
          country: brandFormData.country?.trim() || undefined,
          description: brandFormData.description?.trim() || undefined,
          logo_url: finalLogoUrl?.trim() || undefined,
          website_url: brandFormData.website_url?.trim() || undefined,
          featured_in_slider: brandFormData.featured_in_slider,
        };
        const updated = await brandsApi.updateBrand(token, editingBrand.id, payload);
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast(`Brand "${updated.name}" updated successfully`);
      } else {
        const payload: CreateBrandPayload = {
          name: brandFormData.name.trim(),
          country: brandFormData.country?.trim() || undefined,
          description: brandFormData.description?.trim() || undefined,
          logo_url: finalLogoUrl?.trim() || undefined,
          website_url: brandFormData.website_url?.trim() || undefined,
          featured_in_slider: brandFormData.featured_in_slider,
        };
        const created = await brandsApi.createBrand(token, payload);
        setBrands((prev) => [...prev, created]);
        showToast(`Brand "${created.name}" created successfully`);
      }
      setIsBrandModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save brand';
      setBrandFormError(msg);
    } finally {
      setIsBrandSubmitting(false);
    }
  };

  // Delete Action Handler
  const handleConfirmDelete = async () => {
    if (!deleteModal || !token) return;

    setIsDeleting(true);
    try {
      if (deleteModal.type === 'category') {
        await categoriesApi.deleteCategory(token, deleteModal.id);
        setCategories((prev) => prev.filter((c) => c.id !== deleteModal.id));
        showToast(`Category "${deleteModal.name}" deleted successfully`);
      } else {
        await brandsApi.deleteBrand(token, deleteModal.id);
        setBrands((prev) => prev.filter((b) => b.id !== deleteModal.id));
        showToast(`Brand "${deleteModal.name}" deleted successfully`);
      }
      setDeleteModal(null);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete item';
      showToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification (Topmost layer above all modals & backdrops) */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-100 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-950/20 border border-emerald-500/80 flex items-center gap-3 animate-scale-in">
          <span className="material-symbols-outlined text-white text-xl!">check_circle</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Categories &amp; Medical Brands
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Maintain healthcare catalogue taxonomy and manage partner manufacturers connected to backend PostgreSQL.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-xl shadow-xs">
            <button
              onClick={() => {
                setViewSection('categories');
                setSearchTerm('');
              }}
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
              onClick={() => {
                setViewSection('brands');
                setSearchTerm('');
              }}
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

          <button
            onClick={() => {
              if (viewSection === 'categories') {
                handleOpenCategoryModal();
              } else {
                handleOpenBrandModal();
              }
            }}
            className="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base!">add</span>
            {viewSection === 'categories' ? 'Add Category' : 'Add Manufacturer'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              viewSection === 'categories'
                ? 'Search categories by title, code or keywords...'
                : 'Search manufacturers by brand name, country...'
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-navy focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-2 text-gray-500 hover:text-navy hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-gray-200"
          >
            <span className="material-symbols-outlined text-lg!">refresh</span>
          </button>
          <span className="text-xs text-gray-500 font-medium">
            Showing{' '}
            <strong className="text-navy">
              {viewSection === 'categories' ? filteredCategories.length : filteredBrands.length}
            </strong>{' '}
            records
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg!">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="font-bold underline hover:text-red-900 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="w-16 h-5 rounded-md bg-slate-200" />
              </div>
              <div className="w-3/4 h-5 rounded bg-slate-200" />
              <div className="w-full h-10 rounded bg-slate-100" />
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <div className="w-24 h-4 rounded bg-slate-200" />
                <div className="w-16 h-4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* SECTION 1: PRODUCT CATEGORIES GRID */}
          {viewSection === 'categories' && (
            <div>
              {filteredCategories.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-2xl!">category</span>
                  </div>
                  <h3 className="text-base font-bold text-navy mb-1">No Categories Found</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {searchTerm
                      ? `No category matching "${searchTerm}". Try a different keyword.`
                      : 'No product categories currently configured in the database.'}
                  </p>
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="bg-navy text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-navy-light transition-all cursor-pointer"
                  >
                    + Add New Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden min-h-47.5"
                    >
                      {/* Inline Card Deletion Confirmation UI */}
                      {confirmingDeleteCategoryId === cat.id && (
                        <div className="absolute inset-0 z-20 bg-white/98 backdrop-blur-xs p-5 flex flex-col justify-between animate-scale-in border-2 border-rose-300 rounded-2xl shadow-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                                <span className="material-symbols-outlined text-xl!">warning</span>
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                                Confirm Deletion
                              </span>
                            </div>
                            <h4 className="font-bold text-navy text-sm truncate">
                              Delete &quot;{cat.name}&quot;?
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                              {cat.product_count > 0 ? (
                                <span className="text-rose-600 font-semibold">
                                  Warning: {cat.product_count} active product(s) linked to this category!
                                </span>
                              ) : (
                                'Permanently remove this category. This action cannot be undone.'
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              disabled={isDeletingCategoryId === cat.id}
                              onClick={() => setConfirmingDeleteCategoryId(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingCategoryId === cat.id}
                              onClick={() => handleInlineDeleteCategory(cat)}
                              className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isDeletingCategoryId === cat.id ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm!">delete</span>
                                  <span>Confirm Delete</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-2xl!">
                              {cat.icon || 'category'}
                            </span>
                          </div>
                          {cat.code && (
                            <span className="text-xs font-bold font-mono text-gold bg-navy/5 px-2.5 py-0.5 rounded-md">
                              Code: {cat.code}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-navy text-base mb-1">{cat.name}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                          {cat.description || 'No descriptive summary provided.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-500">
                          <strong className="text-navy">{cat.product_count}</strong> Active Product(s)
                        </span>

                        {/* Actions in bottom right */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            title="Edit Category"
                            className="p-1.5 text-gray-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
                          >
                            <span className="material-symbols-outlined text-base!">edit</span>
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteCategoryId(cat.id)}
                            title="Delete Category"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base!">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: MANUFACTURERS TABLE */}
          {viewSection === 'brands' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-navy">Partner Medical Brands</h2>
                  <p className="text-xs text-gray-500">
                    Configure manufacturer profiles, country origins and live inclusion in homepage BrandSlider.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenBrandModal()}
                  className="bg-navy text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl hover:bg-navy-light transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm!">add</span>
                  Add Manufacturer
                </button>
              </div>

              {filteredBrands.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-500">
                  No medical brands matched your current criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3.5">Brand Name</th>
                        <th className="px-4 py-3.5">Country / HQ</th>
                        <th className="px-4 py-3.5">Speciality Description</th>
                        <th className="px-4 py-3.5">Homepage Slider</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBrands.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {b.logo_url ? (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-gray-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getMediaUrl(b.logo_url)}
                                    alt={b.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      // Fallback on missing image
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-navy/5 text-navy font-black text-xs flex items-center justify-center shrink-0">
                                  {b.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-navy text-sm flex items-center gap-2">
                                  <span>{b.name}</span>
                                  {b.website_url && (
                                    <a
                                      href={b.website_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-blue-600"
                                      title={b.website_url}
                                    >
                                      <span className="material-symbols-outlined text-xs!">open_in_new</span>
                                    </a>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium">
                                  {b.product_count} catalogue products
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                            {b.country || 'International'}
                          </td>
                          <td className="px-4 py-4 text-gray-600 max-w-md text-xs leading-relaxed">
                            {b.description || 'Global healthcare device manufacturer.'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleBrandSlider(b)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                b.featured_in_slider
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                              }`}
                              title="Click to toggle homepage slider display"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  b.featured_in_slider ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                                }`}
                              />
                              {b.featured_in_slider ? 'Featured on Slider' : 'Hidden from Slider'}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenBrandModal(b)}
                                title="Edit Brand Details"
                                className="p-1.5 text-gray-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-lg!">edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    type: 'brand',
                                    id: b.id,
                                    name: b.name,
                                  })
                                }
                                title="Delete Brand"
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-lg!">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-navy">
                {editingCategory ? 'Edit Product Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            {categoryFormError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base!">error</span>
                <span>{categoryFormError}</span>
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="block font-bold text-gray-700">Category Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    placeholder="e.g. Diagnostic and Measure"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-700">Code</label>
                  <input
                    type="text"
                    value={categoryFormData.code || ''}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, code: e.target.value })
                    }
                    placeholder="e.g. 01"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Icon (Material Symbol)</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl!">
                      {categoryFormData.icon || 'category'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={categoryFormData.icon || ''}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, icon: e.target.value })
                    }
                    placeholder="e.g. monitor_heart, bed, science"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {POPULAR_CATEGORY_ICONS.slice(0, 10).map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() =>
                        setCategoryFormData({ ...categoryFormData, icon: iconName })
                      }
                      className={`p-1 rounded-md text-xs border transition-colors ${
                        categoryFormData.icon === iconName
                          ? 'bg-navy text-white border-navy'
                          : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                      }`}
                      title={iconName}
                    >
                      <span className="material-symbols-outlined text-base!">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Description / Scope</label>
                <textarea
                  rows={3}
                  value={categoryFormData.description || ''}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  placeholder="Outline the medical devices or surgical supplies categorized under this group..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCategorySubmitting}
                  className="px-5 py-2 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCategorySubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-navy">
                {editingBrand ? 'Edit Medical Brand' : 'Register Manufacturer'}
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            {brandFormError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base!">error</span>
                <span>{brandFormError}</span>
              </div>
            )}

            <form onSubmit={handleBrandSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-700">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={brandFormData.name}
                    onChange={(e) =>
                      setBrandFormData({ ...brandFormData, name: e.target.value })
                    }
                    placeholder="e.g. Mindray"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-700">Country / Origin</label>
                  <input
                    type="text"
                    value={brandFormData.country || ''}
                    onChange={(e) =>
                      setBrandFormData({ ...brandFormData, country: e.target.value })
                    }
                    placeholder="e.g. Germany, Netherlands"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Brand Logo Image (Upload from PC)</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-gray-200 rounded-xl">
                  {logoPreview ? (
                    <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                      <span className="material-symbols-outlined text-2xl!">image</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      id="brand-logo-upload"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedLogoFile(file);
                          const objectUrl = URL.createObjectURL(file);
                          setLogoPreview(objectUrl);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="brand-logo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-navy text-navy font-semibold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-base!">upload</span>
                      <span>{logoPreview ? 'Change Logo Image' : 'Choose Logo Image'}</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1 truncate">
                      {selectedLogoFile ? selectedLogoFile.name : (brandFormData.logo_url || 'PNG, JPG, WebP, SVG (saved to /media/brands)')}
                    </p>
                  </div>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLogoFile(null);
                        setLogoPreview(null);
                        setBrandFormData({ ...brandFormData, logo_url: '' });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <span className="material-symbols-outlined text-lg!">close</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Official Website URL</label>
                <input
                  type="url"
                  value={brandFormData.website_url || ''}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, website_url: e.target.value })
                  }
                  placeholder="https://www.example.com"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Speciality / Profile Summary</label>
                <textarea
                  rows={3}
                  value={brandFormData.description || ''}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, description: e.target.value })
                  }
                  placeholder="Clinical domain, diagnostic equipment focus, medical device specialties..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-navy text-xs sm:text-sm leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-navy text-xs">Featured on Homepage Slider</div>
                  <div className="text-[11px] text-gray-500">
                    Include this manufacturer in the live carousel on the customer homepage.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={brandFormData.featured_in_slider}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, featured_in_slider: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBrandSubmitting}
                  className="px-5 py-2 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBrandSubmitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Register Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl!">warning</span>
            </div>
            <h3 className="font-bold text-lg text-navy mb-1">
              Delete {deleteModal.type === 'category' ? 'Category' : 'Manufacturer'}?
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-navy">{deleteModal.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
