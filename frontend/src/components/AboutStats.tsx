'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/api';

export default function AboutStats() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    productsApi
      .getStats()
      .then((data) => {
        if (!active) return;
        const count = data.active_products ?? data.total_products;
        setProductCount(typeof count === 'number' ? count : null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load product stats:', err);
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const displayCount =
    productCount !== null
      ? productCount > 0
        ? `${productCount}+`
        : '0'
      : null;

  return (
    <section className="py-16 bg-navy text-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div className="text-4xl md:text-5xl font-bold text-gold mb-2">15+</div>
          <div className="text-gray-300 font-medium">Years of Experience</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-light-blue mb-2">50+</div>
          <div className="text-gray-300 font-medium">Global Partners</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-gold mb-2 flex items-center justify-center min-h-12">
            {isLoading && productCount === null ? (
              <span className="inline-block w-16 h-10 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              displayCount ?? '0'
            )}
          </div>
          <div className="text-gray-300 font-medium">Products</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-light-blue mb-2">24/7</div>
          <div className="text-gray-300 font-medium">Customer Support</div>
        </div>
      </div>
    </section>
  );
}
