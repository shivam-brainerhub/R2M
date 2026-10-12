"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { brandsApi, getMediaUrl } from '@/lib/api';

const DEFAULT_BRANDS = [
  { name: 'Mindray', logo: '/media/brands/mindray.png' },
  { name: 'CONTEC', logo: '/media/brands/contec.png' },
  { name: 'Dräger', logo: '/media/brands/draeger.png' },
  { name: 'Welch Allyn', logo: '/media/brands/welch_allyn.png' },
  { name: 'BD', logo: '/media/brands/bd.png' },
  { name: '3M', logo: '/media/brands/3m.png' },
  { name: 'Philips', logo: '/media/brands/philips.png' },
  { name: 'Baxter', logo: '/media/brands/baxter.png' }
];

export default function BrandSlider() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<{ name: string; logo: string }[]>(DEFAULT_BRANDS);

  useEffect(() => {
    brandsApi
      .listBrands({ featured_in_slider: true })
      .then((data) => {
        if (data && data.length > 0) {
          setBrands(
            data.map((b) => ({
              name: b.name,
              logo: getMediaUrl(b.logo_url) || `/media/brands/${b.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
            }))
          );
        }
      })
      .catch(() => {
        // Keep DEFAULT_BRANDS on error
      });
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center space-x-0 md:space-x-6 relative">
      {/* Left Arrow */}
      <button 
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-16 z-10 bg-white border border-gray-200 text-gray-400 rounded-full w-12 h-12 items-center justify-center hover:text-navy hover:border-navy transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 shadow-sm hover:shadow-md"
        aria-label="Scroll left"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {/* Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none w-full scroll-smooth"
      >
        {brands.map((brand) => (
          <div 
            key={brand.name} 
            className="flex-none w-36 md:w-48 bg-white border border-gray-100 h-24 md:h-26 rounded-2xl flex items-center justify-center p-4 md:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer active:scale-[0.98] snap-start relative overflow-hidden"
          >
            {/* Logo Layer */}
            <div className="absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-300 group-hover:opacity-0">
              <Image 
                src={brand.logo} 
                alt={`${brand.name} Logo`} 
                width={120} 
                height={60} 
                className="object-contain w-auto h-auto max-w-full max-h-full" 
              />
            </div>
            
            {/* Text Overlay Layer */}
            <div className="absolute inset-0 flex items-center justify-center bg-navy/95 opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-2">
              <span className="font-bold text-base md:text-lg text-white text-center tracking-wide">
                {brand.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button 
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-16 z-10 bg-white border border-gray-200 text-gray-400 rounded-full w-12 h-12 items-center justify-center hover:text-navy hover:border-navy transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 shadow-sm hover:shadow-md"
        aria-label="Scroll right"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}
