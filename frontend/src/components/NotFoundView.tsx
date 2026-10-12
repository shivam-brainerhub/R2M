"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NotFoundView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const quickLinks = [
    { title: 'Product Catalogue', desc: 'Explore all medical equipment', href: '/products', icon: 'medical_services' },
    { title: 'Global Manufacturers', desc: 'Browse Mindray, Philips, Dräger & more', href: '/partners', icon: 'domain' },
    { title: 'Healthcare Sectors', desc: 'Solutions tailored by clinical sector', href: '/sectors', icon: 'local_hospital' },
    { title: 'Request a Quote', desc: 'Get assistance from our medical team', href: '/contact', icon: 'request_quote' },
  ];

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full text-center">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-widest uppercase mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Error 404 &bull; Page Not Found
        </div>

        {/* Big Code & Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-navy tracking-tight mb-4">
          4<span className="text-gold">0</span>4
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4 tracking-tight">
          We couldn&apos;t find the page you&apos;re looking for
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light">
          The link may be outdated, the equipment catalogue page may have moved, or the address was typed incorrectly.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="bg-white rounded-full p-1.5 flex items-center shadow-md border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <span className="material-symbols-outlined text-navy ml-3 mr-2 text-xl!">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalogue by product, brand, or specification..."
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-navy px-2 text-sm placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-gold text-navy font-bold rounded-full px-5 py-2 hover:bg-gold-bright transition-all duration-300 text-xs sm:text-sm shrink-0 shadow-xs hover:scale-105 active:scale-95"
            >
              Search
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-navy-light transition-all duration-300 hover:scale-105 active:scale-95 shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-lg!">home</span>
            Return to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-navy font-semibold px-6 py-3 rounded-full border border-gray-300 hover:border-navy hover:bg-gray-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs text-sm"
          >
            <span className="material-symbols-outlined text-lg!">view_in_ar</span>
            Browse Products
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-navy font-medium px-4 py-3 rounded-full hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg!">arrow_back</span>
            Go Back
          </button>
        </div>

        {/* Quick Links Grid */}
        <div className="text-left border-t border-gray-200 pt-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 text-center">
            Suggested Destinations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex flex-col"
              >
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <span className="material-symbols-outlined text-xl! group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-bold text-navy text-sm group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
