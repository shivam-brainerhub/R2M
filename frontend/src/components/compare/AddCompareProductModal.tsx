"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { productsApi, ProductItem, getMediaUrl } from '@/lib/api';

const PAGE_SIZE = 12;

interface AddCompareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (slug: string) => void;
  existingSlugs: string[];
}

export default function AddCompareProductModal({
  isOpen,
  onClose,
  onSelectProduct,
  existingSlugs,
}: AddCompareProductModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load or search query change
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoading(true);

    productsApi
      .listProducts({
        search: debouncedQuery.trim() || undefined,
        status: 'Active',
        limit: PAGE_SIZE,
        skip: 0,
      })
      .then((data) => {
        if (!active) return;
        setProducts(data);
        setHasMore(data.length === PAGE_SIZE);
        setIsLoading(false);
        // Scroll back to top on new query
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load products for comparison modal', err);
        setProducts([]);
        setHasMore(false);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, debouncedQuery]);

  // Load more products for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextBatch = await productsApi.listProducts({
        search: debouncedQuery.trim() || undefined,
        status: 'Active',
        limit: PAGE_SIZE,
        skip: products.length,
      });

      if (nextBatch.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = nextBatch.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.error('Failed to load more products on scroll', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, debouncedQuery, products.length]);

  // IntersectionObserver for sentinel element at bottom of scroll list
  useEffect(() => {
    if (!isOpen || !sentinelRef.current || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isOpen, hasMore, isLoading, isLoadingMore, handleLoadMore]);

  // OnScroll fallback for container scroll listener
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoading && !isLoadingMore) {
      handleLoadMore();
    }
  };

  // Close on Escape key & disable background body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-navy">Add Product to Comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select medical devices to compare clinical specifications.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-navy p-1.5 rounded-lg cursor-pointer transition-colors"
            aria-label="Close add product modal"
          >
            <span className="material-symbols-outlined text-xl!">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4 pb-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment by name, brand, or SKU..."
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-navy"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-base!">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Product List with Infinite Scroll */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="overflow-y-auto flex-1 py-3 space-y-2.5 pr-1 divide-y divide-gray-100"
        >
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl animate-spin text-blue-600">
                progress_activity
              </span>
              <p className="text-xs text-gray-500 font-medium">Loading equipment catalogue...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-gray-300">
                search_off
              </span>
              <p className="text-xs font-bold text-navy">No products found</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                {searchQuery
                  ? `No active equipment matches "${searchQuery}". Try different keywords.`
                  : 'No active products are currently available in the catalogue.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer pt-1 inline-block"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {products.map((p) => {
                const isAlreadyAdded = existingSlugs.includes(p.slug);
                const img = p.primary_image_url || p.images?.[0]?.image_url;

                return (
                  <div
                    key={p.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                        {img ? (
                          <Image
                            src={getMediaUrl(img)}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-2xl! text-gray-300">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-bold text-navy truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {p.brand_name && (
                            <span className="text-blue-600">{p.brand_name}</span>
                          )}
                          {p.sku && (
                            <>
                              {p.brand_name && <span>&bull;</span>}
                              <span className="font-mono text-gray-400">SKU: {p.sku}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadyAdded ? (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs!">check</span>
                          <span>Added</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectProduct(p.slug)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-navy text-white hover:bg-gold hover:text-navy transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Compare</span>
                          <span className="material-symbols-outlined text-xs!">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="h-2" />

              {/* On-Scroll Loading Indicator */}
              {isLoadingMore && (
                <div className="py-3 flex items-center justify-center gap-2 text-xs text-blue-600 font-medium">
                  <span className="material-symbols-outlined text-base! animate-spin">
                    progress_activity
                  </span>
                  <span>Loading more equipment...</span>
                </div>
              )}

              {/* End of results message */}
              {!hasMore && products.length > 0 && (
                <div className="py-3 text-center text-[11px] text-gray-400 border-t border-gray-100 mt-2">
                  Showing all {products.length} matching products
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{products.length} product(s) loaded</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
