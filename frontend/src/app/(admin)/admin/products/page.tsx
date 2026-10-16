"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  productsApi,
  categoriesApi,
  brandsApi,
  propertiesApi,
  sectorsApi,
  ProductItem,
  ProductStatsResponse,
  CategoryItem,
  BrandItem,
  PropertyItem,
  SectorItem,
  ProductPropertyItem,
  ProductImageItem,
  getMediaUrl,
  ApiError,
} from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';
import PropertyCombobox from '@/components/admin/PropertyCombobox';

const ATTACHED_DOC_TYPES = [
  { value: 'Brochure', label: 'Brochure', icon: 'picture_as_pdf' },
  { value: 'Specifications', label: 'Specifications', icon: 'analytics' },
  { value: 'User Manual', label: 'User Manual', icon: 'menu_book' },
  { value: 'Certificate', label: 'Certificate', icon: 'verified' },
];

export default function AdminProductsPage() {
  const { token } = useAuth();

  // Primary Data State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stats, setStats] = useState<ProductStatsResponse | null>(null);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyItem[]>([]);
  const [availableSectors, setAvailableSectors] = useState<SectorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; sku?: string }>({});

  // Product Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('');
  const [brandId, setBrandId] = useState<number | ''>('');
  const [selectedSectorIds, setSelectedSectorIds] = useState<number[]>([]);
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [selectedBrochureFile, setSelectedBrochureFile] = useState<File | null>(null);

  // Additional Attached Documents State (Multiple document types: brochures, spec sheets, user manuals, certificates)
  interface AttachedDocItemState {
    id: string;
    title: string;
    file_url?: string;
    type: string;
    file?: File;
  }
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocItemState[]>([]);

  // Images State (Supports both existing server URLs and locally staged files)
  interface ImageItemState {
    id: string;
    image_url?: string;
    file?: File;
    previewUrl: string;
    alt_text?: string | null;
    is_primary?: boolean;
    display_order?: number;
  }
  const [images, setImages] = useState<ImageItemState[]>([]);

  // Dynamic Properties State
  interface PropertyRowState {
    id: string;
    property_id?: number;
    name: string;
    value: string;
    isCustom: boolean;
  }
  const [propertyRows, setPropertyRows] = useState<PropertyRowState[]>([]);

  // Properties Manager Modal State
  const [isPropsModalOpen, setIsPropsModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropGroup, setNewPropGroup] = useState('');
  const [isCreatingProp, setIsCreatingProp] = useState(false);
  const [editingPropId, setEditingPropId] = useState<number | null>(null);
  const [editingPropName, setEditingPropName] = useState('');
  const [editingPropGroup, setEditingPropGroup] = useState('');
  const [isSavingProp, setIsSavingProp] = useState(false);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = useCallback(async () => {
    try {
      const [prodsData, statsData, catsData, brandsData, propsData, sectorsData] = await Promise.all([
        productsApi.listProducts({ limit: 100 }),
        productsApi.getStats().catch(() => null),
        categoriesApi.listCategories().catch(() => []),
        brandsApi.listBrands().catch(() => []),
        propertiesApi.listProperties().catch(() => []),
        sectorsApi.listSectors().catch(() => []),
      ]);

      setProducts(prodsData);
      setStats(statsData);
      setAvailableCategories(catsData);
      setAvailableBrands(brandsData);
      setAvailableProperties(propsData);
      setAvailableSectors(sectorsData);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reload products catalogue';
      showToast(msg);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      productsApi.listProducts({ limit: 100 }),
      productsApi.getStats().catch(() => null),
      categoriesApi.listCategories().catch(() => []),
      brandsApi.listBrands().catch(() => []),
      propertiesApi.listProperties().catch(() => []),
      sectorsApi.listSectors().catch(() => []),
    ])
      .then(([prodsData, statsData, catsData, brandsData, propsData, sectorsData]) => {
        if (!active) return;
        setProducts(prodsData);
        setStats(statsData);
        setAvailableCategories(catsData);
        setAvailableBrands(brandsData);
        setAvailableProperties(propsData);
        setAvailableSectors(sectorsData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof ApiError ? err.message : 'Failed to load products catalogue';
        showToast(msg);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBrand =
      brandFilter === 'All' ||
      (p.brand_name && p.brand_name.toLowerCase() === brandFilter.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' ||
      (p.category_name && p.category_name.toLowerCase() === categoryFilter.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
  });

  // Calculate live related products preview for Add/Edit Modal
  const relatedPreview = useMemo(() => {
    if (!categoryId) {
      return { level: 'none' as const, count: 0, items: [] as ProductItem[] };
    }

    const currentId = editingProduct?.id;
    const activeProds = products.filter((p) => p.status === 'Active' && p.id !== currentId);

    const matches: ProductItem[] = [];
    const seenIds = new Set<number>();

    // Priority 1: Same subcategory
    if (subcategoryId) {
      const subcatMatches = activeProds.filter((p) => p.subcategory_id === subcategoryId);
      if (brandId) {
        subcatMatches.sort((a, b) => {
          if (a.brand_id === brandId && b.brand_id !== brandId) return -1;
          if (b.brand_id === brandId && a.brand_id !== brandId) return 1;
          return 0;
        });
      }
      for (const p of subcatMatches) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          matches.push(p);
        }
      }
    }

    // Priority 2: Same category fallback
    if (matches.length < 4) {
      const catMatches = activeProds.filter(
        (p) => p.category_id === categoryId && !seenIds.has(p.id)
      );
      if (brandId) {
        catMatches.sort((a, b) => {
          if (a.brand_id === brandId && b.brand_id !== brandId) return -1;
          if (b.brand_id === brandId && a.brand_id !== brandId) return 1;
          return 0;
        });
      }
      for (const p of catMatches) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          matches.push(p);
        }
      }
    }

    return {
      level: subcategoryId ? ('subcategory' as const) : ('category' as const),
      count: matches.length,
      items: matches.slice(0, 4),
    };
  }, [categoryId, subcategoryId, brandId, products, editingProduct]);

  // Close Product Modal & Revoke any temporary object URLs
  const handleCloseProductModal = () => {
    images.forEach((img) => {
      if (img.previewUrl?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(img.previewUrl);
        } catch {}
      }
    });
    setSelectedBrochureFile(null);
    setIsProductModalOpen(false);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormErrors({});
    setName('');
    setSlug('');
    setSku('');
    setCategoryId('');
    setSubcategoryId('');
    setBrandId('');
    setSelectedSectorIds([]);
    setShortDesc('');
    setDesc('');
    setStatus('Active');
    setBrochureUrl('');
    setSelectedBrochureFile(null);
    setMetaTitle('');
    setMetaDescription('');
    setImages([]);
    setPropertyRows([]);
    setAttachedDocs([]);
    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormErrors({});
    setName(product.name);
    setSlug(product.slug);
    setSku(product.sku || '');
    setCategoryId(product.category_id || '');
    setSubcategoryId(product.subcategory_id || '');
    setBrandId(product.brand_id || '');
    setSelectedSectorIds(product.sectors ? product.sectors.map((s) => s.id) : []);
    setShortDesc(product.short_description || '');
    setDesc(product.description || '');
    setStatus(product.status);
    setBrochureUrl(product.brochure_url || '');
    setSelectedBrochureFile(null);
    setMetaTitle(product.meta_title || '');
    setMetaDescription(product.meta_description || '');

    // Map Attached Documents
    if (product.documents && product.documents.length > 0) {
      setAttachedDocs(
        product.documents.map((d, idx) => ({
          id: `existing-doc-${d.id || idx}`,
          title: d.title,
          file_url: d.file_url,
          type: d.type || 'Brochure',
        }))
      );
    } else {
      setAttachedDocs([]);
    }

    // Map Images (Existing server images)
    if (product.images && product.images.length > 0) {
      setImages(
        product.images.map((img, idx) => ({
          id: `existing-${img.id || idx}`,
          image_url: img.image_url,
          previewUrl: getMediaUrl(img.image_url),
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          display_order: img.display_order ?? idx,
        }))
      );
    } else if (product.primary_image_url) {
      setImages([
        {
          id: 'existing-0',
          image_url: product.primary_image_url,
          previewUrl: getMediaUrl(product.primary_image_url),
          is_primary: true,
          display_order: 0,
        },
      ]);
    } else {
      setImages([]);
    }

    // Map Properties
    if (product.properties && product.properties.length > 0) {
      setPropertyRows(
        product.properties.map((p, idx) => ({
          id: `row-${idx}`,
          property_id: p.property_id,
          name: p.name,
          value: p.value,
          isCustom: !availableProperties.some(
            (ap) => ap.name.toLowerCase() === p.name.toLowerCase()
          ),
        }))
      );
    } else if (product.specifications && Object.keys(product.specifications).length > 0) {
      setPropertyRows(
        Object.entries(product.specifications).map(([k, v], idx) => ({
          id: `row-${idx}`,
          name: k,
          value: String(v),
          isCustom: !availableProperties.some(
            (ap) => ap.name.toLowerCase() === k.toLowerCase()
          ),
        }))
      );
    } else {
      setPropertyRows([]);
    }

    setIsProductModalOpen(true);
  };

  // Image Selection Handler (Staged locally, uploads only on Save Product)
  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    const newImg: ImageItemState = {
      id: `staged-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: preview,
      alt_text: name ? `${name} photo` : 'Product photo',
      is_primary: images.length === 0,
      display_order: images.length,
    };
    setImages((prev) => [...prev, newImg]);
    e.target.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(removed.previewUrl);
        } catch {}
      }
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length > 0 && !next.some((i) => i.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  // Brochure Selection Handler (Staged locally, uploads only on Save Product)
  const handleSelectBrochureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedBrochureFile(file);
    e.target.value = '';
  };

  const handleRemoveBrochure = () => {
    setSelectedBrochureFile(null);
    setBrochureUrl('');
  };

  // Attached Document Helpers
  const handleAddAttachedDocFile = (e: React.ChangeEvent<HTMLInputElement>, defaultType: string = 'Brochure') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const newDoc: AttachedDocItemState = {
      id: `staged-doc-${Date.now()}-${Math.random()}`,
      title: cleanFileName,
      type: defaultType,
      file,
    };
    setAttachedDocs((prev) => [...prev, newDoc]);
    e.target.value = '';
  };

  const handleRemoveAttachedDoc = (index: number) => {
    setAttachedDocs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateAttachedDocTitle = (index: number, newTitle: string) => {
    setAttachedDocs((prev) =>
      prev.map((d, idx) => (idx === index ? { ...d, title: newTitle } : d))
    );
  };

  const handleUpdateAttachedDocType = (index: number, newType: string) => {
    setAttachedDocs((prev) =>
      prev.map((d, idx) => (idx === index ? { ...d, type: newType } : d))
    );
  };

  // Dynamic Property Helpers
  const handleAddPropertyRow = () => {
    const unusedProp = availableProperties.find(
      (ap) => !propertyRows.some((pr) => pr.name.toLowerCase() === ap.name.toLowerCase())
    );
    const newRow: PropertyRowState = {
      id: `row-${Date.now()}`,
      property_id: unusedProp ? unusedProp.id : undefined,
      name: unusedProp ? unusedProp.name : '',
      value: '',
      isCustom: false,
    };
    setPropertyRows((prev) => [...prev, newRow]);
  };

  const handleRemovePropertyRow = (id: string) => {
    setPropertyRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handlePropertyRowChange = (id: string, field: 'name' | 'value' | 'isCustom', val: string | boolean) => {
    setPropertyRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleCreatePropertyInline = async (propName: string): Promise<PropertyItem | null> => {
    const cleanName = propName.trim();
    if (!cleanName) return null;
    if (!token) {
      showToast('Admin session required to create property');
      return null;
    }

    try {
      const created = await propertiesApi.createProperty(token, {
        name: cleanName,
        group: 'General',
      });
      setAvailableProperties((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      showToast(`Created specification property "${created.name}"`);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create property';
      showToast(msg);
      return null;
    }
  };


  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; sku?: string } = {};
    if (!name.trim()) errors.name = 'Product name is required';
    if (!sku.trim()) errors.sku = 'Model SKU is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (!token) {
      showToast('Admin session required. Please sign in as an administrator.');
      return;
    }

    const formattedProperties: ProductPropertyItem[] = propertyRows
      .filter((r) => r.name.trim() && r.value.trim())
      .map((r) => ({
        property_id: r.property_id,
        name: r.name.trim(),
        value: r.value.trim(),
      }));

    try {
      setIsSubmitting(true);

      // Step 1: Upload staged brochure file if one was selected
      let finalBrochureUrl = brochureUrl.trim() || undefined;
      if (selectedBrochureFile) {
        const uploadRes = await productsApi.uploadBrochure(token, selectedBrochureFile);
        finalBrochureUrl = uploadRes.url;
      }

      // Step 2: Upload staged images that have a local File object
      const finalImages: ProductImageItem[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let finalImgUrl = img.image_url;
        if (img.file) {
          const uploadRes = await productsApi.uploadImage(token, img.file);
          finalImgUrl = uploadRes.url;
        }
        if (finalImgUrl) {
          finalImages.push({
            image_url: finalImgUrl,
            alt_text: img.alt_text || (name.trim() ? `${name.trim()} photo` : 'Product photo'),
            is_primary: !!img.is_primary,
            display_order: i,
          });
        }
      }

      if (finalImages.length > 0 && !finalImages.some((i) => i.is_primary)) {
        finalImages[0].is_primary = true;
      }

      // Step 3: Upload staged attached documents if any
      const finalDocs = [];
      for (const docItem of attachedDocs) {
        let finalDocUrl = docItem.file_url;
        if (docItem.file) {
          const uploadRes = await productsApi.uploadBrochure(token, docItem.file);
          finalDocUrl = uploadRes.url;
        }
        if (finalDocUrl) {
          finalDocs.push({
            title: docItem.title.trim() || 'Product Document',
            file_url: finalDocUrl,
            type: docItem.type || 'Brochure',
          });
        }
      }

      if (editingProduct) {
        const payload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sku: sku.trim(),
          category_id: categoryId ? Number(categoryId) : null,
          subcategory_id: subcategoryId ? Number(subcategoryId) : null,
          brand_id: brandId ? Number(brandId) : null,
          sector_ids: selectedSectorIds,
          short_description: shortDesc.trim() || undefined,
          description: desc.trim() || undefined,
          status,
          brochure_url: finalBrochureUrl,
          documents: finalDocs,
          meta_title: metaTitle.trim() || undefined,
          meta_description: metaDescription.trim() || undefined,
          images: finalImages,
          properties: formattedProperties,
        };

        const updated = await productsApi.updateProduct(token, editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Updated product "${updated.name}" successfully!`);
      } else {
        const payload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sku: sku.trim(),
          category_id: categoryId ? Number(categoryId) : null,
          subcategory_id: subcategoryId ? Number(subcategoryId) : null,
          brand_id: brandId ? Number(brandId) : null,
          sector_ids: selectedSectorIds,
          short_description: shortDesc.trim() || undefined,
          description: desc.trim() || undefined,
          status,
          brochure_url: finalBrochureUrl,
          documents: finalDocs,
          meta_title: metaTitle.trim() || undefined,
          meta_description: metaDescription.trim() || undefined,
          images: finalImages,
          properties: formattedProperties,
        };

        const created = await productsApi.createProduct(token, payload);
        setProducts((prev) => [created, ...prev]);
        showToast(`Created product "${created.name}" successfully!`);
      }

      handleCloseProductModal();
      reloadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save product';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (product: ProductItem) => {
    if (!token) {
      showToast('Admin session required');
      return;
    }

    try {
      const updated = await productsApi.toggleStatus(token, product.id);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast(`Changed "${product.name}" status to ${updated.status}`);
      productsApi.getStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to toggle status';
      showToast(msg);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: ProductItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
      return;
    }
    if (!token) {
      showToast('Admin session required');
      return;
    }

    try {
      await productsApi.deleteProduct(token, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Deleted product "${product.name}"`);
      productsApi.getStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete product';
      showToast(msg);
    }
  };

  // Create Standalone Property in Manager Modal
  const handleCreateStandaloneProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    if (!token) {
      showToast('Admin session required');
      return;
    }

    try {
      setIsCreatingProp(true);
      const created = await propertiesApi.createProperty(token, {
        name: newPropName.trim(),
        group: newPropGroup.trim() || undefined,
      });
      setAvailableProperties((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPropName('');
      setNewPropGroup('');
      showToast(`Created specification property "${created.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create property';
      showToast(msg);
    } finally {
      setIsCreatingProp(false);
    }
  };

  // Delete Property in Manager Modal
  const handleDeleteProperty = async (prop: PropertyItem) => {
    if (!confirm(`Are you sure you want to delete property "${prop.name}"?`)) return;
    if (!token) {
      showToast('Admin session required');
      return;
    }

    try {
      await propertiesApi.deleteProperty(token, prop.id);
      setAvailableProperties((prev) => prev.filter((p) => p.id !== prop.id));
      showToast(`Deleted property "${prop.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete property';
      showToast(msg);
    }
  };

  // Edit Property in Manager Modal
  const handleStartEditProperty = (prop: PropertyItem) => {
    setEditingPropId(prop.id);
    setEditingPropName(prop.name);
    setEditingPropGroup(prop.group || '');
  };

  const handleCancelEditProperty = () => {
    setEditingPropId(null);
    setEditingPropName('');
    setEditingPropGroup('');
  };

  const handleSaveEditProperty = async (propId: number) => {
    const cleanName = editingPropName.trim();
    if (!cleanName) {
      showToast('Property name cannot be empty');
      return;
    }
    if (!token) {
      showToast('Admin session required');
      return;
    }

    try {
      setIsSavingProp(true);
      const cleanGroup = editingPropGroup.trim();
      const updated = await propertiesApi.updateProperty(token, propId, {
        name: cleanName,
        group: cleanGroup ? cleanGroup : null,
      });


      setAvailableProperties((prev) =>
        prev
          .map((p) => (p.id === propId ? updated : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      // Also update any specification rows in current form using this property
      setPropertyRows((prev) =>
        prev.map((r) =>
          r.property_id === propId || r.name.toLowerCase() === cleanName.toLowerCase()
            ? { ...r, name: updated.name, property_id: updated.id }
            : r
        )
      );

      handleCancelEditProperty();
      showToast(`Updated property "${updated.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update property';
      showToast(msg);
    } finally {
      setIsSavingProp(false);
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

      {/* Header with Title, Actions & Properties Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Catalogue &amp; Specification Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Product Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage medical products, brochures, and dynamic specification properties for comparisons.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsPropsModalOpen(true)}
            className="bg-white border border-gray-200 text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! text-blue-600">tune</span>
            Manage Properties ({availableProperties.length})
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg!">add_box</span>
            Add New Product
          </button>
        </div>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Products</p>
            <span className="material-symbols-outlined text-blue-600 text-xl!">inventory_2</span>
          </div>
          <p className="text-2xl font-black text-navy mt-1">
            {stats ? stats.total_products : products.length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <span className="text-emerald-600 font-bold">{stats?.active_products ?? products.filter((p) => p.status === 'Active').length} Active</span>
            {' '}&bull;{' '}
            <span className="text-gray-400 font-bold">{stats?.draft_products ?? products.filter((p) => p.status === 'Draft').length} Draft</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brochures Attached</p>
            <span className="material-symbols-outlined text-red-600 text-xl!">picture_as_pdf</span>
          </div>
          <p className="text-2xl font-black text-navy mt-1">
            {stats ? stats.with_brochure_count : products.filter((p) => p.brochure_url).length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Cloud-ready storage
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Brands</p>
            <span className="material-symbols-outlined text-emerald-600 text-xl!">domain</span>
          </div>
          <p className="text-2xl font-black text-navy mt-1">
            {stats ? stats.total_brands : availableBrands.length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Across {stats ? stats.total_categories : availableCategories.length} categories
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comparison Props</p>
            <span className="material-symbols-outlined text-amber-600 text-xl!">compare_arrows</span>
          </div>
          <p className="text-2xl font-black text-navy mt-1">
            {stats ? stats.total_properties : availableProperties.length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Unified specifications
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, brand, or SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-navy"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <CustomSelect
            value={brandFilter}
            onChange={(val) => setBrandFilter(val)}
            options={[
              { value: 'All', label: 'All Brands' },
              ...availableBrands.map((b) => ({ value: b.name, label: b.name })),
            ]}
            size="sm"
            variant="slate"
            className="min-w-32"
          />

          <CustomSelect
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: 'All', label: 'All Categories' },
              ...availableCategories.map((c) => ({ value: c.name, label: c.name })),
            ]}
            size="sm"
            variant="slate"
            className="min-w-36"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Draft', label: 'Draft' },
            ]}
            size="sm"
            variant="slate"
            className="min-w-32"
          />

          <div className="text-xs text-gray-500 font-semibold px-2">
            {filteredProducts.length} items
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Product &amp; SKU</th>
                <th className="px-4 py-3.5">Brand</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Images</th>
                <th className="px-4 py-3.5">Brochure</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-3xl animate-spin text-blue-600 mb-2">
                      progress_activity
                    </span>
                    <p className="text-xs">Loading products catalogue...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                      inventory_2
                    </span>
                    No products matched your search or filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const displayImage = p.primary_image_url || p.images[0]?.image_url || '/images/benevision_n12.jpg';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Product, Slug & SKU */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                            <Image
                              src={getMediaUrl(displayImage)}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="font-bold text-navy hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                              <span>{p.name}</span>
                              <span className="material-symbols-outlined text-xs! opacity-0 group-hover:opacity-100 transition-opacity">
                                open_in_new
                              </span>
                            </Link>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>SKU: {p.sku || 'N/A'}</span>
                              <span className="text-gray-300">&bull;</span>
                              <span className="text-blue-500 font-mono text-[10px]">/{p.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold text-xs uppercase px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100">
                          {p.brand_name || 'Generic'}
                        </span>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="px-4 py-4 text-gray-600 whitespace-nowrap text-xs">
                        <div className="font-semibold text-navy">{p.category_name || 'Unassigned'}</div>
                        {p.subcategory_name && (
                          <div className="text-[11px] text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">
                            <span className="text-gray-400">↳</span> {p.subcategory_name}
                          </div>
                        )}
                        {p.sectors && p.sectors.length > 0 && (
                          <div
                            className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 mt-1 border border-blue-100/60"
                            title={p.sectors.map((s) => s.name).join(', ')}
                          >
                            <span className="material-symbols-outlined text-[12px]!">health_and_safety</span>
                            {p.sectors.length} {p.sectors.length === 1 ? 'Sector' : 'Sectors'}
                          </div>
                        )}
                      </td>

                      {/* Images Count */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs!">photo_library</span>
                          {p.images?.length || (p.primary_image_url ? 1 : 0)} photos
                        </span>
                      </td>

                      {/* Brochure Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {p.brochure_url ? (
                          <a
                            href={getMediaUrl(p.brochure_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs!">picture_as_pdf</span>
                            View PDF
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400">None</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                            p.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'Active' ? 'bg-emerald-600' : 'bg-gray-500'
                            }`}
                          ></span>
                          {p.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <span className="material-symbols-outlined text-lg!">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <span className="material-symbols-outlined text-lg!">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 h-[92vh] max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Fixed Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Medical Product'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specify product catalogue metadata, images, specifications and brochure.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="text-gray-400 hover:text-navy p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} noValidate className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block mb-3">
                  1. Product Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingProduct && !slug) {
                          // Auto generate friendly slug
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="e.g. BeneVision N12"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl outline-none text-navy font-medium transition-colors ${
                        formErrors.name
                          ? 'bg-red-50/30 border border-red-400 focus:border-red-500'
                          : 'bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Model SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        if (formErrors.sku) setFormErrors((prev) => ({ ...prev, sku: undefined }));
                      }}
                      placeholder="e.g. MN-N12-001"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl outline-none text-navy font-mono transition-colors ${
                        formErrors.sku
                          ? 'bg-red-50/30 border border-red-400 focus:border-red-500'
                          : 'bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white'
                      }`}
                    />
                    {formErrors.sku && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.sku}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Slug (for SEO)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. benevision-n12"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Catalogue Status
                    </label>
                    <CustomSelect
                      value={status}
                      onChange={(val) => setStatus(val as 'Active' | 'Draft')}
                      options={[
                        { value: 'Active', label: 'Active (Published on live catalogue)' },
                        { value: 'Draft', label: 'Draft (Hidden from public views)' },
                      ]}
                      size="md"
                      variant="slate"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Brand / Manufacturer
                    </label>
                    <CustomSelect
                      value={brandId === '' ? '' : String(brandId)}
                      onChange={(val) => setBrandId(val ? Number(val) : '')}
                      options={[
                        { value: '', label: 'Select Brand' },
                        ...availableBrands.map((b) => ({ value: String(b.id), label: b.name })),
                      ]}
                      placeholder="Select Brand"
                      size="md"
                      variant="slate"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <CustomSelect
                      value={categoryId === '' ? '' : String(categoryId)}
                      onChange={(val) => {
                        const newCatId = val ? Number(val) : '';
                        setCategoryId(newCatId);
                        setSubcategoryId('');
                      }}
                      options={[
                        { value: '', label: 'Select Category' },
                        ...availableCategories.map((c) => ({ value: String(c.id), label: c.name })),
                      ]}
                      placeholder="Select Category"
                      size="md"
                      variant="slate"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Subcategory
                    </label>
                    <CustomSelect
                      value={subcategoryId === '' ? '' : String(subcategoryId)}
                      onChange={(val) => setSubcategoryId(val ? Number(val) : '')}
                      disabled={!categoryId}
                      options={[
                        { value: '', label: categoryId ? '-- None (No Subcategory) --' : 'Select Category first' },
                        ...(availableCategories
                          .find((c) => c.id === categoryId)
                          ?.subcategories?.map((sub) => ({ value: String(sub.id), label: sub.name })) || []),
                      ]}
                      placeholder={categoryId ? '-- None (No Subcategory) --' : 'Select Category first'}
                      size="md"
                      variant="slate"
                      className="w-full"
                    />
                  </div>

                  {/* Related Products: Quick Logic & Preview */}
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap text-gray-700">
                        <span className="material-symbols-outlined text-blue-600 text-base!">auto_awesome</span>
                        <span className="font-bold text-navy">Related Products:</span>
                        <span className="text-gray-600">
                          Matched by <strong className="text-blue-700">Subcategory</strong> &gt; Category &gt; Brand.
                        </span>
                      </div>

                      <div>
                        {subcategoryId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            <span className="material-symbols-outlined text-xs!">check_circle</span>
                            Exact Subcategory Match ({relatedPreview.count})
                          </span>
                        ) : categoryId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200" title="Select a subcategory for accurate equipment matching">
                            <span className="material-symbols-outlined text-xs!">warning</span>
                            Category Fallback &bull; Select subcategory for best match
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Select Category to preview</span>
                        )}
                      </div>
                    </div>

                    {/* Compact Chip Preview */}
                    {categoryId && relatedPreview.items.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto pt-2 mt-2 border-t border-slate-200/60">
                        {relatedPreview.items.map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0 text-[11px] shadow-2xs"
                            title={`${item.name} (${item.brand_name || 'Generic'})`}
                          >
                            <div className="w-15 h-15 relative bg-slate-50 rounded shrink-0 overflow-hidden">
                              {item.primary_image_url || item.images[0]?.image_url ? (
                                <Image
                                  src={getMediaUrl(item.primary_image_url || item.images[0]?.image_url || '')}
                                  alt={item.name}
                                  fill
                                  sizes="16px"
                                  className="object-contain"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-xs! text-gray-300">inventory_2</span>
                              )}
                            </div>
                            <span className="font-semibold text-navy max-w-28 truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Healthcare Sectors Multi-Select */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Healthcare Sectors
                        </label>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Select the clinical sectors where this equipment is used (used for catalogue sidebar filtering and sector landing pages).
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSectorIds(availableSectors.map((s) => s.id))}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSectorIds([])}
                          className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableSectors.map((sec) => {
                        const isSelected = selectedSectorIds.includes(sec.id);
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setSelectedSectorIds((prev) =>
                                prev.includes(sec.id)
                                  ? prev.filter((id) => id !== sec.id)
                                  : [...prev, sec.id]
                              );
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs ring-1 ring-blue-600/20'
                                : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                            }`}
                          >
                            <span className="truncate pr-2">{sec.name}</span>
                            <span
                              className={`material-symbols-outlined text-base! shrink-0 transition-colors ${
                                isSelected ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            >
                              {isSelected ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Descriptions & SEO */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block mb-3">
                  2. Descriptions
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Short Overview (Catalogue Cards)
                    </label>
                    <input
                      type="text"
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      placeholder="e.g. 12.1 multi-parameter patient monitor with capacitive touchscreen."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Full Clinical Description
                    </label>
                    <textarea
                      rows={3}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Detailed technical overview and clinical indications..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Images & Brochure */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block mb-3">
                  3. Images &amp; Brochure
                </h3>

                <div className="space-y-4">
                  {/* Images Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Product Photo Gallery ({images.length} images)
                      </label>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-base!">add_photo_alternate</span>
                        <span>Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSelectImageFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {images.length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                        No product images yet. Click &quot;Add Photo&quot; to stage photos (uploaded on Save).
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            className={`p-2 rounded-xl border relative flex flex-col items-center bg-slate-50 group ${
                              img.is_primary ? 'border-gold ring-2 ring-gold/30' : 'border-gray-200'
                            }`}
                          >
                            {img.file && (
                              <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wide">
                                Staged
                              </span>
                            )}
                            <div className="w-full h-24 relative overflow-hidden rounded-lg bg-white mb-2">
                              <Image
                                src={img.previewUrl}
                                alt={img.alt_text || 'Photo'}
                                fill
                                sizes="100px"
                                unoptimized={img.previewUrl.startsWith('blob:')}
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="w-full flex items-center justify-between text-[11px] gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase cursor-pointer ${
                                  img.is_primary
                                    ? 'bg-gold text-navy'
                                    : 'bg-white text-gray-500 hover:text-navy border border-gray-200'
                                }`}
                              >
                                {img.is_primary ? 'Primary' : 'Set Primary'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                title="Remove photo"
                              >
                                <span className="material-symbols-outlined text-sm!">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Brochure PDF (Upload Only on Save) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Brochure / Datasheet (PDF)
                    </label>

                    {selectedBrochureFile ? (
                      <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                            <span className="material-symbols-outlined text-2xl!">upload_file</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-navy truncate">
                              {selectedBrochureFile.name}
                            </div>
                            <div className="text-[11px] text-blue-700 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold">
                                {(selectedBrochureFile.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                              <span>&bull;</span>
                              <span className="bg-blue-200/60 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                Staged (Uploads on Save)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm!">refresh</span>
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleSelectBrochureFile}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveBrochure}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove staged brochure"
                          >
                            <span className="material-symbols-outlined text-base!">delete</span>
                          </button>
                        </div>
                      </div>
                    ) : brochureUrl ? (
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-red-200/80 rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                            <span className="material-symbols-outlined text-2xl!">picture_as_pdf</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-navy truncate">
                              {brochureUrl.split('/').pop() || 'Brochure.pdf'}
                            </div>
                            <a
                              href={getMediaUrl(brochureUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span>Preview Attached PDF</span>
                              <span className="material-symbols-outlined text-[12px]!">open_in_new</span>
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm!">refresh</span>
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleSelectBrochureFile}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveBrochure}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove attached brochure"
                          >
                            <span className="material-symbols-outlined text-base!">delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-6 bg-slate-50 hover:bg-blue-50/20 cursor-pointer transition-all group">
                        <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-blue-600 mb-2 transition-colors">
                          upload_file
                        </span>
                        <span className="text-xs font-bold text-navy group-hover:text-blue-700">
                          Click to Select Brochure PDF
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">
                          Accepts PDF, DOC, DOCX up to 30MB (Uploaded only when saving product)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleSelectBrochureFile}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Additional Attached Documents (Multiple Document Types) */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                          Multiple Document Types (Spec Sheets, Manuals, Certificates)
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Attach supplementary documentation, clinical user guides, and regulatory certificates.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs">
                        <span className="material-symbols-outlined text-sm!">add</span>
                        <span>Add Document</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleAddAttachedDocFile(e, 'Specifications')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {attachedDocs.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl bg-slate-50/50 text-gray-400 text-xs">
                        No additional documents attached yet. Click &quot;Add Document&quot; above to attach manuals, technical sheets, or certificates.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {attachedDocs.map((doc, idx) => (
                          <div
                            key={doc.id || idx}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="material-symbols-outlined text-lg! text-blue-600 shrink-0">
                                description
                              </span>
                              <input
                                type="text"
                                value={doc.title}
                                onChange={(e) => handleUpdateAttachedDocTitle(idx, e.target.value)}
                                placeholder="Document Title (e.g. Clinical User Manual)"
                                className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-navy focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <CustomSelect
                                value={doc.type || 'Brochure'}
                                onChange={(val) => handleUpdateAttachedDocType(idx, val)}
                                options={
                                  doc.type && !ATTACHED_DOC_TYPES.some((o) => o.value.toLowerCase() === doc.type.toLowerCase())
                                    ? [...ATTACHED_DOC_TYPES, { value: doc.type, label: doc.type, icon: 'description' }]
                                    : ATTACHED_DOC_TYPES
                                }
                                size="sm"
                                variant="white"
                                className="w-full sm:w-44"
                              />

                              {doc.file_url && (
                                <a
                                  href={getMediaUrl(doc.file_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-white transition-colors"
                                  title="Preview document"
                                >
                                  <span className="material-symbols-outlined text-base!">open_in_new</span>
                                </a>
                              )}

                              {doc.file && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                  Staged
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveAttachedDoc(idx)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Remove document"
                              >
                                <span className="material-symbols-outlined text-base!">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Dynamic Properties for Side-by-Side Comparison */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                    4. Product Specifications &amp; Comparison Properties
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPropertyRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base!">add</span>
                    Add Specification
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Assign values to standard platform properties, or create a new property on-the-fly. These values are automatically aligned in the side-by-side comparison matrix.
                </p>

                {propertyRows.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                    No specifications configured. Click &quot;Add Specification&quot; to set properties like Display Size, Battery Life, Parameters, etc.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {propertyRows.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50 border border-gray-200/80 rounded-xl"
                      >
                        {/* Property Combobox (Searchable + Inline Creatable) */}
                        <div className="sm:w-1/3">
                          <PropertyCombobox
                            value={row.name}
                            propertyId={row.property_id}
                            availableProperties={availableProperties}
                            excludeNames={propertyRows.filter((r) => r.id !== row.id).map((r) => r.name)}
                            onChange={(name, propertyId) => {
                              setPropertyRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, name, property_id: propertyId, isCustom: false }
                                    : r
                                )
                              );
                            }}
                            onCreateProperty={handleCreatePropertyInline}
                            placeholder="Select or create property..."
                          />
                        </div>


                        {/* Value Input */}
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) => handlePropertyRowChange(row.id, 'value', e.target.value)}
                            placeholder="e.g. 12.1&quot; Touchscreen, Yes, 4.5 kg"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none text-navy"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePropertyRow(row.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove row"
                          >
                            <span className="material-symbols-outlined text-base!">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-slate-50/90 flex items-center justify-between shrink-0 rounded-b-3xl">
                <div className="text-xs text-gray-500">
                  {editingProduct ? 'Editing existing product' : 'Fill all required fields to register product'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseProductModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-navy text-white font-semibold px-6 py-2 rounded-xl hover:bg-navy-light transition-all text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>
                          {selectedBrochureFile || images.some((i) => i.file)
                            ? 'Uploading & Saving...'
                            : 'Saving...'}
                        </span>
                      </>
                    ) : (
                      editingProduct ? 'Save Changes' : 'Create Product'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties Management Modal */}
      {isPropsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">tune</span>
                  Catalogue Properties Manager
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Predefined product specifications used in comparison tables and filters.
                </p>
              </div>
              <button
                onClick={() => setIsPropsModalOpen(false)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            {/* Create Standalone Property Form */}
            <form onSubmit={handleCreateStandaloneProperty} className="py-4 border-b border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Add Standard Specification Property
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  placeholder="e.g. Laser Wavelength, Pacing Mode"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-semibold"
                />
                <input
                  type="text"
                  value={newPropGroup}
                  onChange={(e) => setNewPropGroup(e.target.value)}
                  placeholder="Group (e.g. Display, Power)"
                  className="w-36 px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                />
                <button
                  type="submit"
                  disabled={isCreatingProp || !newPropName.trim()}
                  className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-navy-light transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isCreatingProp ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>

            {/* Properties List */}
            <div className="overflow-y-auto flex-1 py-3 space-y-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Defined Properties ({availableProperties.length})
              </div>
              {availableProperties.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No properties defined yet.
                </div>
              ) : (
                availableProperties.map((prop) => {
                  const isEditing = editingPropId === prop.id;

                  if (isEditing) {
                    return (
                      <div
                        key={prop.id}
                        className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-fadeIn shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1">
                              Property Name
                            </label>
                            <input
                              type="text"
                              value={editingPropName}
                              onChange={(e) => setEditingPropName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditProperty(prop.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditProperty();
                                }
                              }}
                              placeholder="Property Name"
                              autoFocus
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-navy font-bold"
                            />
                          </div>
                          <div className="sm:w-40">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1">
                              Group
                            </label>
                            <input
                              type="text"
                              value={editingPropGroup}
                              onChange={(e) => setEditingPropGroup(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditProperty(prop.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditProperty();
                                }
                              }}
                              placeholder="Group (optional)"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-navy font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-blue-100">
                          <span>Used in {prop.product_count} products</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleCancelEditProperty}
                              disabled={isSavingProp}
                              className="px-2.5 py-1 text-xs text-gray-500 hover:text-navy hover:bg-white rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditProperty(prop.id)}
                              disabled={isSavingProp || !editingPropName.trim()}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              {isSavingProp ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-xs!">check</span>
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={prop.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-gray-100 rounded-xl hover:bg-slate-100/70 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-navy">{prop.name}</span>
                          {prop.group && (
                            <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                              {prop.group}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Used in {prop.product_count} products
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditProperty(prop)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit property"
                        >
                          <span className="material-symbols-outlined text-base!">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(prop)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete property"
                        >
                          <span className="material-symbols-outlined text-base!">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => {
                  handleCancelEditProperty();
                  setIsPropsModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-navy"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
