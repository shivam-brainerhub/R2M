"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { brandsApi, getMediaUrl } from '@/lib/api';

const DEFAULT_BRANDS = [
  { name: 'Mindray', logo: '/media/brands/mindray.png' },
  { name: 'Philips', logo: '/media/brands/philips.png' },
  { name: 'Dräger', logo: '/media/brands/draeger.png' },
  { name: 'Welch Allyn', logo: '/media/brands/welch_allyn.png' },
  { name: 'BD', logo: '/media/brands/bd.png' },
  { name: '3M', logo: '/media/brands/3m.png' },
  { name: 'Contec', logo: '/media/brands/contec.png' },
  { name: 'Rossmax', logo: '/media/brands/rossmax.png' },
  { name: 'Sturdy', logo: '/media/brands/sturdy.png' },
  { name: 'Progetti Medical', logo: '/media/brands/progetti_medical.png' },
  { name: 'Baxter', logo: '/media/brands/baxter.png' },
];

interface SliderBrand {
  name: string;
  logo: string | null;
}

export default function BrandSlider() {
  const [brands, setBrands] = useState<SliderBrand[]>(DEFAULT_BRANDS);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    brandsApi
      .listBrands({ featured_in_slider: true })
      .then((data) => {
        if (data && data.length > 0) {
          setBrands(
            data.map((b) => ({
              name: b.name,
              logo: b.logo_url ? getMediaUrl(b.logo_url) : null,
            }))
          );
        }
      })
      .catch(() => {
        // Keep DEFAULT_BRANDS on error
      });
  }, []);

  // Ensure there are enough items for a seamless infinite loop across all resolutions
  const loopMultiplier = brands.length < 8 ? 4 : 2;
  const displayBrands = Array.from({ length: loopMultiplier }).flatMap(() => brands);

  return (
    <div className="relative w-full py-8 px-2 overflow-hidden select-none">
      {/* Infinite Marquee Track */}
      <div className="animate-marquee flex items-center [animation-duration:90s]">
        {displayBrands.map((brand, idx) => {
          const hasValidLogo = Boolean(brand.logo && !failedImages[`${brand.name}-${idx}`]);

          return (
            <Link
              key={`${brand.name}-${idx}`}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              title={`View ${brand.name} products`}
              className="flex-none mx-6 md:mx-10 flex items-center justify-center h-20 md:h-24 group transition-transform duration-300 hover:scale-110 cursor-pointer"
            >
              {hasValidLogo && brand.logo ? (
                <div className="relative h-18 md:h-22 w-44 md:w-52 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} Logo`}
                    width={220}
                    height={90}
                    style={{ width: 'auto', height: 'auto' }}
                    className="object-contain max-h-16 md:max-h-20 max-w-42.5 md:max-w-50"
                    onError={() => {
                      setFailedImages((prev) => ({ ...prev, [`${brand.name}-${idx}`]: true }));
                    }}
                  />
                </div>
              ) : (
                <span className="font-bold text-navy text-lg md:text-xl tracking-wide whitespace-nowrap group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
