"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  productsApi,
  ProductCompareResponse,
  ProductItem,
  getMediaUrl,
} from '@/lib/api';
import BrochureDownloadButton from '@/components/BrochureDownloadButton';
import AddCompareProductModal from '@/components/compare/AddCompareProductModal';
import RelatedProducts from '@/components/RelatedProducts';
import { useQuoteCart } from '@/context/QuoteCartContext';

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useQuoteCart();

  const [compareData, setCompareData] = useState<ProductCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Read items from URL or fallback to default
  const itemsParam = searchParams.get('items') || searchParams.get('ids');

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    const loadComparison = async () => {
      try {
        const targetItems = itemsParam?.trim();
        if (targetItems) {
          const res = await productsApi.compareProducts(targetItems);
          if (ignore) return;
          setCompareData(res);
        } else {
          setCompareData({ products: [], properties: [] });
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load comparison data', err);
          setCompareData({ products: [], properties: [] });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadComparison();

    return () => {
      ignore = true;
    };
  }, [itemsParam]);

  const handleRemoveProduct = (slug: string) => {
    if (!compareData) return;
    const remaining = compareData.products.filter((p) => p.slug !== slug).map((p) => p.slug);
    if (remaining.length > 0) {
      router.push(`/compare?items=${remaining.join(',')}`);
    } else {
      router.push('/compare?items=');
      setCompareData({ products: [], properties: [] });
    }
  };

  const handleAddProduct = (slug: string) => {
    setIsAddModalOpen(false);
    if (!compareData) return;
    const existing = compareData.products.map((p) => p.slug);
    if (!existing.includes(slug)) {
      const updated = [...existing, slug];
      router.push(`/compare?items=${updated.join(',')}`);
    }
  };

  const handleClearAll = () => {
    router.push('/compare?items=');
    setCompareData({ products: [], properties: [] });
  };

  const productsList = compareData?.products || [];
  const propertiesList = compareData?.properties || [];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Compare Products</h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Compare medical device features and clinical specifications side-by-side to determine the ideal clinical solution.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-light-blue p-4 md:p-6 rounded-2xl mb-8 gap-4 shadow-xs border border-blue-100">
          <div className="flex items-center text-navy font-bold text-base md:text-lg">
            <span className="material-symbols-outlined mr-2 md:mr-3 text-2xl md:text-3xl! text-blue-700">
              scale
            </span>
            Comparing {productsList.length} products
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            {productsList.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center text-xs sm:text-sm px-2 cursor-pointer"
              >
                <span className="material-symbols-outlined mr-1 text-base!">delete</span>
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gold text-navy font-bold px-4 py-2 rounded-full hover:bg-gold-bright transition-all duration-300 active:scale-95 flex items-center text-xs sm:text-sm shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined mr-1 text-base!">add</span>
              Add Product to Compare
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl animate-spin text-blue-600 mb-2">
              progress_activity
            </span>
            <p className="text-xs text-gray-500 font-semibold">Generating comparison matrix...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <span className="material-symbols-outlined text-6xl text-gray-300">
              compare_arrows
            </span>
            <h2 className="text-xl font-bold text-navy">No Products Selected</h2>
            <p className="text-xs text-gray-500">
              Select products from the catalogue or click &quot;Add Product to Compare&quot; to inspect specifications side-by-side.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gold text-navy font-bold px-5 py-2.5 rounded-full hover:bg-gold-bright transition-all text-xs cursor-pointer shadow-xs"
              >
                Choose Products
              </button>
            </div>
          </div>
        ) : (
          /* Comparison Table */
          <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse min-w-187.5">
              {/* Product Headers */}
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="p-5 w-1/4 align-bottom pb-8">
                    <div className="text-lg font-black text-navy uppercase tracking-wider">
                      Specifications
                    </div>
                    <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                      Aligned clinical properties
                    </p>
                  </th>
                  {productsList.map((p) => {
                    const img = p.primary_image_url || p.images?.[0]?.image_url;
                    return (
                      <th key={p.id} className="p-4 align-top w-1/4 min-w-55">
                        <div className="relative bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col items-center text-center h-full">
                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveProduct(p.slug)}
                            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 p-1 rounded-full cursor-pointer transition-colors"
                            title="Remove from comparison"
                          >
                            <span className="material-symbols-outlined text-base!">close</span>
                          </button>

                          {/* Brand */}
                          {p.brand_name && (
                            <div className="text-red-600 font-bold text-xs uppercase tracking-wider mb-2">
                              {p.brand_name}
                            </div>
                          )}

                          {/* Image */}
                          <div className="w-28 h-28 relative overflow-hidden rounded-xl bg-slate-50 mb-3 p-1 flex items-center justify-center">
                            {img ? (
                              <Image
                                src={getMediaUrl(img)}
                                alt={p.name}
                                fill
                                sizes="120px"
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-4xl text-gray-300">
                                inventory_2
                              </span>
                            )}
                          </div>

                          {/* Name & SKU */}
                          <Link
                            href={`/products/${p.slug}`}
                            className="font-bold text-navy hover:text-blue-600 text-sm line-clamp-2 transition-colors mb-1"
                          >
                            {p.name}
                          </Link>
                          {p.sku && (
                            <span className="text-[10px] text-gray-400 font-mono mb-3">
                              SKU: {p.sku}
                            </span>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 w-full mt-auto pt-3 border-t border-gray-100">
                            {p.brochure_url ? (
                              <BrochureDownloadButton
                                brochureUrl={p.brochure_url}
                                className="flex-1 bg-white border border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                title="Download Brochure"
                              >
                                <span className="material-symbols-outlined text-xs!">picture_as_pdf</span>
                                <span>PDF</span>
                              </BrochureDownloadButton>
                            ) : (
                              <span className="flex-1 text-[11px] text-gray-400 text-center py-2">
                                No PDF
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const primaryImg = p.primary_image_url || p.images?.[0]?.image_url;
                                addItem({
                                  productId: String(p.id),
                                  productName: p.name,
                                  slug: p.slug,
                                  sku: p.sku,
                                  brandName: p.brand_name,
                                  imageUrl: primaryImg,
                                  categoryName: p.category_name,
                                  quantity: 1,
                                });
                                router.push('/quote');
                              }}
                              className="flex-1 bg-gold text-navy text-[11px] font-bold py-2 rounded-lg hover:bg-gold-bright transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Quote</span>
                              <span className="material-symbols-outlined text-xs!">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Dynamic Property Rows */}
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {propertiesList.map((prop, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-gray-700 bg-slate-50/40 whitespace-nowrap">
                      <span>{prop.name}</span>
                      {prop.group && (
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {prop.group}
                        </span>
                      )}
                    </td>
                    {productsList.map((p) => {
                      const val = prop.values[p.slug];
                      if (!val) {
                        return (
                          <td key={p.id} className="p-4 text-gray-300 font-mono">
                            &mdash;
                          </td>
                        );
                      }
                      if (val.toLowerCase() === 'yes') {
                        return (
                          <td key={p.id} className="p-4 text-emerald-600 font-bold">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-base!">check_circle</span>
                              Yes
                            </span>
                          </td>
                        );
                      }
                      if (val.toLowerCase() === 'no') {
                        return (
                          <td key={p.id} className="p-4 text-gray-400">
                            No
                          </td>
                        );
                      }
                      return (
                        <td key={p.id} className="p-4 text-navy font-semibold">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Documentation Section (Items 2 & 3) */}
                <tr className="bg-light-blue font-bold text-navy">
                  <td colSpan={productsList.length + 1} className="p-3 text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-blue-700">folder_open</span>
                      <span>Official Manufacturer Documentation</span>
                    </div>
                  </td>
                </tr>

                {[
                  { key: 'brochure', label: 'Product Brochure', icon: 'picture_as_pdf', color: 'text-red-500' },
                  { key: 'spec', label: 'Technical Specifications', icon: 'analytics', color: 'text-blue-600' },
                  { key: 'manual', label: 'User Manual & Instructions', icon: 'menu_book', color: 'text-teal-600' },
                  { key: 'cert', label: 'Declaration of Conformity', icon: 'verified', color: 'text-amber-600' },
                ].map((docType) => (
                  <tr key={docType.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-gray-700 bg-slate-50/40">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-base! ${docType.color}`}>
                          {docType.icon}
                        </span>
                        <span>{docType.label}</span>
                      </div>
                    </td>
                    {productsList.map((p) => {
                      const matchedDocs: { title: string; file_url: string; type: string }[] = [];
                      if (p.documents && p.documents.length > 0) {
                        const matching = p.documents.filter((d) =>
                          d.type.toLowerCase().includes(docType.key.toLowerCase())
                        );
                        matchedDocs.push(...matching);
                      }
                      if (docType.key === 'brochure' && p.brochure_url) {
                        const exists = matchedDocs.some((d) => d.file_url === p.brochure_url);
                        if (!exists) {
                          matchedDocs.unshift({
                            title: `${p.name} Brochure`,
                            file_url: p.brochure_url,
                            type: 'Brochure',
                          });
                        }
                      }

                      return (
                        <td key={p.id} className="p-4 align-top">
                          {matchedDocs.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {matchedDocs.map((doc, dIdx) => (
                                <BrochureDownloadButton
                                  key={dIdx}
                                  brochureUrl={doc.file_url}
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline cursor-pointer group text-left"
                                  title={`Download ${doc.title}`}
                                >
                                  <span className="material-symbols-outlined text-sm! shrink-0 text-blue-500 group-hover:text-blue-700">
                                    download
                                  </span>
                                  <span className="truncate max-w-[200px]" title={doc.title}>
                                    {doc.title || `Download ${doc.type || 'Doc'}`}
                                  </span>
                                </BrochureDownloadButton>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Not available</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Similar Products Carousel / Grid (Item 8) */}
        {!isLoading && productsList.length > 0 && productsList[0] && (
          <RelatedProducts
            currentProductSlug={productsList[0].slug}
            tag="Similar Medical Devices"
            title={productsList[0].category_name ? `Similar ${productsList[0].category_name}` : 'Similar Medical Devices'}
            subtitle="Other models you may also be interested in comparing side-by-side."
            onAddCompare={handleAddProduct}
          />
        )}
      </div>

      {/* Add Product Modal */}
      <AddCompareProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectProduct={handleAddProduct}
        existingSlugs={productsList.map((p) => p.slug)}
      />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
            progress_activity
          </span>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
