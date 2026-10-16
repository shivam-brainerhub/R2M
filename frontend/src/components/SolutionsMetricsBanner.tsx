'use client';

import { useEffect, useState } from 'react';
import { brandsApi, BrandItem } from '@/lib/api';

export default function SolutionsMetricsBanner() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    brandsApi
      .listBrands()
      .then((data) => {
        if (!active) return;
        setBrands(data || []);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load brands for solutions metrics:', err);
        if (active) {
          setIsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Live dynamic count when loaded, fallback to '19+' if offline/loading
  const countDisplay = isLoaded && brands.length > 0 ? `${brands.length}+` : '19+';

  // Dynamic manufacturer names preview from live brands
  const brandNamesDisplay =
    brands.length > 0
      ? `${brands.slice(0, 4).map((b) => b.name).join(', ')} & more`
      : 'Mindray, Stryker, Philips, Contec & more';

  return (
    <section className="bg-white border-y border-gray-200/80 px-6 py-8 relative z-20 shadow-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="p-3">
          <div className="text-3xl lg:text-4xl font-extrabold text-navy transition-all duration-300">
            {countDisplay}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
            Global Manufacturer Brands
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate" title={brandNamesDisplay}>
            {brandNamesDisplay}
          </div>
        </div>
        <div className="p-3">
          <div className="text-3xl lg:text-4xl font-extrabold text-navy">100%</div>
          <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
            SAHPRA &amp; CE Compliant
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Fully certified medical devices</div>
        </div>
        <div className="p-3">
          <div className="text-3xl lg:text-4xl font-extrabold text-navy">Full</div>
          <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">Lifecycle Care</div>
          <div className="text-xs text-gray-500 mt-0.5">Install, calibrate, train &amp; support</div>
        </div>
        <div className="p-3">
          <div className="text-3xl lg:text-4xl font-extrabold text-navy">SADC</div>
          <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">Regional Reach</div>
          <div className="text-xs text-gray-500 mt-0.5">
            South Africa &amp; cross-border distribution
          </div>
        </div>
      </div>
    </section>
  );
}
