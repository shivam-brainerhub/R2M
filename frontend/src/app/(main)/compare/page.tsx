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
  getFileUrl,
} from '@/lib/api';

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [compareData, setCompareData] = useState<ProductCompareResponse | null>(null);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Read items from URL or fallback to default
  const itemsParam = searchParams.get('items') || searchParams.get('ids');

  useEffect(() => {
    let ignore = false;
    productsApi.listProducts({ status: 'Active' })
      .then(async (allProds) => {
        if (ignore) return;
        setAllProducts(allProds);

        let targetItems = itemsParam;
        if (!targetItems && allProds.length > 0) {
          targetItems = allProds.slice(0, 3).map((p) => p.slug).join(',');
        }

        if (targetItems) {
          const res = await productsApi.compareProducts(targetItems);
          if (ignore) return;
          setCompareData(res);
        } else {
          setCompareData({ products: [], properties: [] });
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setCompareData({ products: [], properties: [] });
        setIsLoading(false);
      });

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
                className="bg-gold text-navy font-bold px-5 py-2.5 rounded-full hover:bg-gold-bright transition-all text-xs"
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
                    const img = p.primary_image_url || p.images[0]?.image_url || '/images/benevision_n12.jpg';
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
                          <div className="text-red-600 font-bold text-xs uppercase tracking-wider mb-2">
                            {p.brand_name || 'Generic'}
                          </div>

                          {/* Image */}
                          <div className="w-28 h-28 relative overflow-hidden rounded-xl bg-slate-50 mb-3 p-1">
                            <Image
                              src={getMediaUrl(img)}
                              alt={p.name}
                              fill
                              sizes="120px"
                              className="object-contain p-2"
                            />
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
                              <a
                                href={getFileUrl(p.brochure_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-white border border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                title="Download Brochure"
                              >
                                <span className="material-symbols-outlined text-xs!">picture_as_pdf</span>
                                <span>PDF</span>
                              </a>
                            ) : (
                              <span className="flex-1 text-[11px] text-gray-400 text-center py-2">
                                No PDF
                              </span>
                            )}
                            <Link
                              href="/contact"
                              className="flex-1 bg-gold text-navy text-[11px] font-bold py-2 rounded-lg hover:bg-gold-bright transition-all text-center flex items-center justify-center gap-1"
                            >
                              <span>Quote</span>
                              <span className="material-symbols-outlined text-xs!">arrow_forward</span>
                            </Link>
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

                {/* Documentation Section */}
                <tr className="bg-light-blue font-bold text-navy">
                  <td colSpan={productsList.length + 1} className="p-3 text-xs uppercase tracking-wider">
                    Official Documentation
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-700 bg-slate-50/40">
                    Product Brochure
                  </td>
                  {productsList.map((p) => (
                    <td key={p.id} className="p-4">
                      {p.brochure_url ? (
                        <a
                          href={getFileUrl(p.brochure_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs underline"
                        >
                          <span className="material-symbols-outlined text-sm!">picture_as_pdf</span>
                          Download Spec Sheet
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Not available</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">Add Product to Comparison</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-navy p-1"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-2">
              {allProducts.map((p) => {
                const isAlreadyAdded = productsList.some((cp) => cp.slug === p.slug);
                const img = p.primary_image_url || p.images[0]?.image_url || '/images/benevision_n12.jpg';

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <Image
                          src={getMediaUrl(img)}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-navy truncate">{p.name}</div>
                        <div className="text-[11px] text-gray-400 uppercase">{p.brand_name || 'Generic'}</div>
                      </div>
                    </div>

                    <button
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddProduct(p.slug)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-navy text-white hover:bg-navy-light shadow-xs'
                      }`}
                    >
                      {isAlreadyAdded ? 'Added' : 'Compare'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
