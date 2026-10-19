"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  productsApi,
  SearchSuggestionsResponse,
  SearchSuggestionProduct,
  SearchSuggestionCategory,
  SearchSuggestionBrand,
  getMediaUrl,
} from '@/lib/api';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface PredictiveSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  placeholder?: string;
  size?: 'md' | 'lg';
  className?: string;
  placement?: 'auto' | 'top' | 'bottom';
}

interface DropdownCoords {
  placement: 'top' | 'bottom';
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

export default function PredictiveSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search by product, model number, manufacturer...',
  size = 'lg',
  className = '',
  placement = 'auto',
}: PredictiveSearchBarProps) {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = useRef(false);

  // Measure container position relative to viewport and calculate whether to flip upside/downside
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // If completely scrolled out of viewport, close dropdown
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const NAVBAR_HEIGHT = 70;
    const SAFETY_MARGIN = 16;
    const GAP = 8;
    const DROPDOWN_IDEAL_HEIGHT = 380;

    const spaceAbove = Math.max(0, rect.top - NAVBAR_HEIGHT - GAP);
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - GAP);

    let chosenPlacement: 'top' | 'bottom';
    if (placement === 'top') {
      chosenPlacement = 'top';
    } else if (placement === 'bottom') {
      chosenPlacement = 'bottom';
    } else {
      // Dynamic: open upside if space below is cramped (< 360px) and space above offers more clearance
      chosenPlacement = spaceBelow < 360 && spaceAbove > spaceBelow ? 'top' : 'bottom';
    }

    const availableHeight = chosenPlacement === 'top' ? spaceAbove - SAFETY_MARGIN : spaceBelow - SAFETY_MARGIN;
    const maxHeight = Math.min(DROPDOWN_IDEAL_HEIGHT, Math.max(160, availableHeight));

    // Clamp horizontally to avoid viewport overflow
    const screenMargin = 12;
    const maxAvailableWidth = window.innerWidth - screenMargin * 2;
    const width = Math.min(rect.width, maxAvailableWidth);
    const left = Math.max(screenMargin, Math.min(rect.left, window.innerWidth - width - screenMargin));
    const topVal = rect.bottom + GAP;
    const bottomVal = window.innerHeight - rect.top + GAP;

    setDropdownCoords((prev) => {
      if (
        prev &&
        prev.placement === chosenPlacement &&
        Math.round(prev.left) === Math.round(left) &&
        Math.round(prev.width) === Math.round(width) &&
        Math.round(prev.top ?? 0) === Math.round(topVal) &&
        Math.round(prev.bottom ?? 0) === Math.round(bottomVal) &&
        Math.round(prev.maxHeight) === Math.round(maxHeight)
      ) {
        return prev;
      }
      return {
        placement: chosenPlacement,
        left,
        width,
        top: topVal,
        bottom: bottomVal,
        maxHeight,
      };
    });
  }, [placement]);

  // Reposition on open, content change, scroll, or resize
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = (e: Event) => {
      // Do not reposition if scroll event originates from inside the dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, suggestions, updatePosition]);

  // Debounced search suggestions fetch
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 1) {
      return;
    }

    // Do not fetch or open if this value change was auto-filled or changed externally (not typed by user)
    if (!isUserTypingRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Re-verify that user is still actively focused and typing in this input
      if (!isUserTypingRef.current || document.activeElement !== inputRef.current) {
        return;
      }

      setIsLoading(true);
      try {
        const res = await productsApi.getSuggestions(trimmed, 6);
        if (!isUserTypingRef.current || document.activeElement !== inputRef.current) {
          return;
        }
        setSuggestions(res);
        updatePosition();
        setIsOpen(true);
      } catch (err) {
        console.error('Failed to fetch predictive search suggestions', err);
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, updatePosition]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        isUserTypingRef.current = false;
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isUserTypingRef.current = false;
    setIsOpen(false);
    inputRef.current?.blur();
    onSubmit(value);
  };

  const handleSelectProduct = (product: SearchSuggestionProduct) => {
    isUserTypingRef.current = false;
    setIsOpen(false);
    router.push(`/products/${product.slug}`);
  };

  const handleSelectCategory = (category: SearchSuggestionCategory) => {
    isUserTypingRef.current = false;
    setIsOpen(false);
    router.push(`/products?category=${encodeURIComponent(category.name)}`);
  };

  const handleSelectBrand = (brand: SearchSuggestionBrand) => {
    isUserTypingRef.current = false;
    setIsOpen(false);
    router.push(`/products?brand=${encodeURIComponent(brand.name)}`);
  };

  const handleClear = () => {
    isUserTypingRef.current = false;
    onChange('');
    setSuggestions(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTypingRef.current = true;
    const nextVal = e.target.value;
    onChange(nextVal);
    if (!nextVal.trim()) {
      setSuggestions(null);
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const hasResults =
    suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.brands.length > 0);

  const isLarge = size === 'lg';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleFormSubmit}
        className={`bg-white rounded-full flex items-center shadow-lg transition-all duration-200 border border-gray-200 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 ${
          isLarge ? 'p-1 md:p-1.5' : 'p-1'
        }`}
      >
        <span
          className={`material-symbols-outlined text-navy shrink-0 ${
            isLarge ? 'ml-3 md:ml-4 mr-1 md:mr-2 text-xl md:text-2xl!' : 'ml-2.5 mr-1 text-lg!'
          }`}
        >
          search
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (isUserTypingRef.current && value.trim() && hasResults) {
              updatePosition();
              setIsOpen(true);
            }
          }}
          onBlur={(e) => {
            if (
              !containerRef.current?.contains(e.relatedTarget as Node) &&
              !dropdownRef.current?.contains(e.relatedTarget as Node)
            ) {
              isUserTypingRef.current = false;
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              isUserTypingRef.current = false;
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none text-navy placeholder-gray-400 font-medium ${
            isLarge ? 'px-2 text-xs sm:text-sm' : 'px-2 text-xs sm:text-sm'
          }`}
        />

        {isLoading ? (
          <div className="mr-2 shrink-0 animate-spin text-gray-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-base!">progress_activity</span>
          </div>
        ) : value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-navy mr-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            aria-label="Clear input"
          >
            <span className="material-symbols-outlined text-sm! block">close</span>
          </button>
        ) : null}

        <button
          type="submit"
          className={`bg-gold text-navy font-bold rounded-full flex items-center hover:bg-gold-bright transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-xs cursor-pointer group ${
            isLarge
              ? 'px-4 md:px-7 py-2 md:py-3 text-xs sm:text-sm'
              : 'px-3.5 py-1.5 text-xs'
          }`}
        >
          <span>Search</span>
          <span
            className={`material-symbols-outlined font-bold transition-transform duration-200 group-hover:translate-x-0.5 ${
              isLarge ? 'ml-1 text-sm!' : 'ml-0.5 text-xs!'
            }`}
          >
            arrow_forward
          </span>
        </button>
      </form>

      {/* Autocomplete Predictive Dropdown Menu (Portaled dynamically) */}
      {isMounted &&
        isOpen &&
        dropdownCoords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              maxHeight: `${dropdownCoords.maxHeight}px`,
              zIndex: 100,
              ...(dropdownCoords.placement === 'top'
                ? { bottom: `${dropdownCoords.bottom}px` }
                : { top: `${dropdownCoords.top}px` }),
            }}
            className={`bg-white rounded-2xl border border-gray-200/90 overflow-hidden divide-y divide-gray-100 text-left animate-in fade-in-0 duration-150 backdrop-blur-md flex flex-col ${
              dropdownCoords.placement === 'top'
                ? 'origin-bottom zoom-in-95 shadow-[0_-12px_32px_rgba(0,0,0,0.18)]'
                : 'origin-top zoom-in-95 shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
            }`}
          >
            {hasResults ? (
              <div className="overflow-y-auto divide-y divide-gray-100 flex-1 min-h-0 overscroll-contain">
                {/* Products Section */}
                {suggestions.products.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Products ({suggestions.products.length})</span>
                      <span className="text-[9px] font-normal text-gray-400">Click to view details</span>
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.products.map((p) => {
                        const img = p.primary_image_url || '/images/benevision_n12.jpg';
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                          >
                            <div className="w-10 h-10 bg-slate-50 rounded-lg p-1 shrink-0 relative overflow-hidden border border-gray-100 flex items-center justify-center">
                              <Image
                                src={getMediaUrl(img)}
                                alt={p.name}
                                fill
                                sizes="40px"
                                className="object-contain p-0.5"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-navy group-hover:text-blue-600 truncate transition-colors">
                                  {p.name}
                                </span>
                                {p.sku && (
                                  <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                    {p.sku}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                {p.brand_name && (
                                  <span className="font-semibold text-gray-700">{p.brand_name}</span>
                                )}
                                {p.brand_name && p.category_name && <span>•</span>}
                                {p.category_name && <span className="truncate">{p.category_name}</span>}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-300 group-hover:text-gold text-lg! transition-transform group-hover:translate-x-1 shrink-0">
                              chevron_right
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categories Section */}
                {suggestions.categories.length > 0 && (
                  <div className="p-2 bg-slate-50/50">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Categories
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-3 py-1">
                      {suggestions.categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCategory(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gold hover:text-navy text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-sm! text-blue-600 group-hover:text-gold">
                            category
                          </span>
                          <span>{c.name}</span>
                          {c.product_count > 0 && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({c.product_count})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brands / Manufacturers Section */}
                {suggestions.brands.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Manufacturers
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-3 py-1">
                      {suggestions.brands.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleSelectBrand(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gold hover:text-navy text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-sm! text-teal-600 group-hover:text-gold">
                            verified
                          </span>
                          <span>{b.name}</span>
                          {b.product_count > 0 && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({b.product_count})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 flex-1 min-h-0">
                <span className="material-symbols-outlined text-2xl! text-gray-400 mb-1 block">
                  search_off
                </span>
                <span>No direct matches for &quot;{value}&quot;</span>
                <div className="mt-1 text-[11px] text-gray-400">
                  Press Enter to search full descriptions and specifications
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div
              onClick={handleFormSubmit}
              className="px-4 py-3 bg-slate-50 hover:bg-gold/10 text-xs font-bold text-navy flex items-center justify-between cursor-pointer transition-colors group shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base! text-gold">manage_search</span>
                <span>
                  Search entire catalogue for <span className="text-blue-600">&quot;{value}&quot;</span>
                </span>
              </div>
              <span className="material-symbols-outlined text-sm! text-gray-400 group-hover:text-navy transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
