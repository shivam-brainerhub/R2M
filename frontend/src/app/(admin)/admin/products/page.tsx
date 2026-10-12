"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { categoriesApi, brandsApi, CategoryItem, BrandItem } from '@/lib/api';

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  desc: string;
  image: string;
  brochureUrl?: string;
  specs: { [key: string]: string };
  status: 'Active' | 'Draft';
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: '1',
    name: 'BeneVision N12',
    brand: 'Mindray',
    category: 'Diagnostic and Measure',
    sku: 'MN-N12-001',
    desc: '12.1" multi-parameter patient monitor with capacitive touchscreen.',
    image: '/images/benevision_n12.jpg',
    brochureUrl: '/brochures/benevision_n12.pdf',
    specs: { 'Display Size': '12.1" Touchscreen', 'Battery Life': 'Up to 4 hours', 'Parameters': 'ECG, SpO2, NIBP, Temp' },
    status: 'Active',
  },
  {
    id: '2',
    name: 'IntelliVue MX450',
    brand: 'Philips',
    category: 'Diagnostic and Measure',
    sku: 'PH-MX450-002',
    desc: 'Flexible, high-performance patient monitor for acute care.',
    image: '/images/intellivue_mx450.jpg',
    brochureUrl: '/brochures/intellivue_mx450.pdf',
    specs: { 'Display Size': '12.0" Touchscreen', 'Battery Life': 'Up to 5 hours', 'Weight': '4.5 kg' },
    status: 'Active',
  },
  {
    id: '3',
    name: 'Infinity M300',
    brand: 'Dräger',
    category: 'Diagnostic and Measure',
    sku: 'DR-M300-003',
    desc: 'Compact patient monitor and telemetry for continuous patient surveillance.',
    image: '/images/infinity_m300.jpg',
    brochureUrl: '/brochures/infinity_m300.pdf',
    specs: { 'Telemetry': 'Built-in Wi-Fi', 'Display': 'Color OLED', 'Battery Life': '14 hours' },
    status: 'Active',
  },
  {
    id: '4',
    name: 'CMS8000',
    brand: 'Contec',
    category: 'Diagnostic and Measure',
    sku: 'CT-CMS8000-004',
    desc: 'Multi-parameter patient monitor for bedside clinical monitoring.',
    image: '/images/contec_cms8000.jpg',
    brochureUrl: '/brochures/cms8000.pdf',
    specs: { 'Display': '12.1" TFT LCD', 'Alarms': '3-level audible/visual', 'Battery': 'Rechargeable lithium' },
    status: 'Active',
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);

  useEffect(() => {
    categoriesApi.listCategories().then(setAvailableCategories).catch(() => {});
    brandsApi.listBrands().then(setAvailableBrands).catch(() => {});
  }, []);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState<Partial<ProductItem>>({
    name: '',
    brand: 'Mindray',
    category: 'Diagnostic and Measure',
    sku: '',
    desc: '',
    image: '/images/benevision_n12.jpg',
    status: 'Active',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; sku?: string }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'All' || p.brand.toLowerCase() === brandFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesBrand && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormErrors({});
    setFormData({
      name: '',
      brand: 'Mindray',
      category: 'Diagnostic and Measure',
      sku: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      desc: '',
      image: '/images/benevision_n12.jpg',
      brochureUrl: '/brochures/sample.pdf',
      specs: { 'Display': 'High resolution', 'Warranty': '2 Years' },
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormErrors({});
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; sku?: string } = {};
    if (!formData.name?.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.sku?.trim()) {
      errors.sku = 'Model SKU is required';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? ({ ...item, ...formData } as ProductItem)
            : item
        )
      );
      showToast(`Updated product "${formData.name}" successfully!`);
    } else {
      const newProduct: ProductItem = {
        id: String(Date.now()),
        name: formData.name || 'Untitled Product',
        brand: formData.brand || 'Mindray',
        category: formData.category || 'Diagnostic and Measure',
        sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        desc: formData.desc || '',
        image: formData.image || '/images/benevision_n12.jpg',
        brochureUrl: formData.brochureUrl,
        specs: formData.specs || {},
        status: (formData.status as 'Active' | 'Draft') || 'Active',
      };
      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Added new product "${newProduct.name}" to catalogue!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the catalogue?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Removed product "${name}"`);
    }
  };

  const handleToggleStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'Active' ? 'Draft' : 'Active';
          showToast(`Changed status of "${p.name}" to ${nextStatus}`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl border border-gold/40 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-gold text-xl!">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Product Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, update, organize categories and configure downloadable brochures for all products.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2 shadow-md shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg!">add_box</span>
          Add New Product
        </button>
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

        {/* Brand & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-navy font-medium outline-none focus:border-blue-500"
          >
            <option value="All">All Brands</option>
            {availableBrands.length > 0
              ? availableBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))
              : ['Mindray', 'Philips', 'Dräger', 'Contec', 'Baxter'].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl text-navy font-medium outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>

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
                <th className="px-4 py-3.5">Brochure</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                      inventory_2
                    </span>
                    No products matched your search or filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Product & SKU */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/products/${p.id}`} target="_blank" className="font-bold text-navy hover:text-blue-600 transition-colors flex items-center gap-1">
                            <span>{p.name}</span>
                            <span className="material-symbols-outlined text-xs! opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                          </Link>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            SKU: {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-xs uppercase px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        {p.brand}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap text-xs">
                      {p.category}
                    </td>

                    {/* Brochure Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {p.brochureUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          <span className="material-symbols-outlined text-xs!">picture_as_pdf</span>
                          PDF Attached
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">None</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          p.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-600' : 'bg-gray-500'}`}></span>
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
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <span className="material-symbols-outlined text-lg!">delete</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-navy">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Medical Product'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specify product catalogue metadata, model details and downloadable assets.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} noValidate className="overflow-y-auto flex-1 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. BeneVision N12"
                    className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl outline-none text-navy font-medium transition-colors ${
                      formErrors.name
                        ? 'bg-red-50/30 border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                        : 'bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                      <span className="material-symbols-outlined text-sm!">error</span>
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Model SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, sku: e.target.value });
                      if (formErrors.sku) setFormErrors((prev) => ({ ...prev, sku: undefined }));
                    }}
                    placeholder="e.g. MN-N12-001"
                    className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl outline-none text-navy font-mono transition-colors ${
                      formErrors.sku
                        ? 'bg-red-50/30 border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                        : 'bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                  {formErrors.sku && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                      <span className="material-symbols-outlined text-sm!">error</span>
                      <span>{formErrors.sku}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Brand / Manufacturer *
                  </label>
                  <select
                    value={formData.brand || (availableBrands[0]?.name || 'Mindray')}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-medium"
                  >
                    {availableBrands.length > 0
                      ? availableBrands.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))
                      : ['Mindray', 'Philips', 'Dräger', 'Contec', 'Baxter'].map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category || (availableCategories[0]?.name || 'Diagnostic and Measure')}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-medium"
                  >
                    {availableCategories.length > 0
                      ? availableCategories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))
                      : [
                          'Diagnostic and Measure',
                          'Furniture',
                          'Disposables and Care Supplies',
                          'Hygiene and Sterilisation',
                          'Emergency, Reanimation and Surgery',
                        ].map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formData.desc || ''}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Summary overview displayed on catalogue cards..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Image File Path
                  </label>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/images/benevision_n12.jpg"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Brochure PDF Path
                  </label>
                  <input
                    type="text"
                    value={formData.brochureUrl || ''}
                    onChange={(e) => setFormData({ ...formData, brochureUrl: e.target.value })}
                    placeholder="/brochures/benevision_n12.pdf"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Catalogue Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData({ ...formData, status: 'Active' })}
                    />
                    <span>Active (Published on live catalogue)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Draft'}
                      onChange={() => setFormData({ ...formData, status: 'Draft' })}
                    />
                    <span>Draft (Hidden from public catalogue)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-navy text-white font-semibold px-5 py-2 rounded-xl hover:bg-navy-light transition-all text-xs shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
