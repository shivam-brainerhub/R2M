"use client";

import { BrandItem, brandsApi, getMediaUrl } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ManufacturersPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    brandsApi
      .listBrands()
      .then((data) => {
        setBrands(data || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-light-blue min-h-screen pb-20">
      {/* Banner Section */}
      <div className="bg-navy text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Our Manufacturers</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            We are proud to partner with the world&apos;s leading healthcare
            brands. By bringing top-tier medical devices and equipment to
            Southern Africa, we ensure facilities operate with trusted,
            globally-recognized technology.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-gray-500">
              Loading partner manufacturers...
            </p>
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">
              domain_disabled
            </span>
            <h3 className="text-lg font-bold text-navy mb-1">
              No brands found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Manufacturers are being added to our catalogue.
            </p>
            <Link
              href="/products"
              className="bg-navy text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-navy-light transition-colors"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((m) => {
              const logoSrc = getMediaUrl(m.logo_url);
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-[0.98] p-8 flex flex-col group"
                >
                  <div className="h-24 flex items-center justify-center mb-6">
                    {logoSrc ? (
                      <div className="relative w-full h-full max-w-50 transition-all duration-300">
                        <Image
                          src={logoSrc}
                          alt={`${m.name} Logo`}
                          fill
                          sizes="200px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-navy font-black text-xl flex items-center justify-center border border-blue-100">
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-navy">{m.name}</h3>
                    {m.country && (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {m.country}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                    {m.description ||
                      "Specialized manufacturer of medical equipment and clinical solutions."}
                  </p>

                  <div className="mt-auto">
                    <Link
                      href={`/products?brand=${encodeURIComponent(m.name)}`}
                      className="inline-flex items-center justify-center w-full bg-white border-2 border-navy text-navy font-bold py-3 rounded-full hover:bg-navy hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    >
                      View {m.name} Products
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Become a Partner CTA */}
      <section className="px-6 max-w-7xl mx-auto w-full mt-8">
        <div className="bg-gold rounded-3xl p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between shadow-lg">
          <div className="flex items-center mb-8 lg:mb-0 max-w-2xl">
            <span className="material-symbols-outlined text-6xl! text-navy mr-6">
              public
            </span>
            <div>
              <h3 className="text-2xl font-bold text-navy mb-2">
                Are you a medical manufacturer?
              </h3>
              <p className="text-navy/80 text-lg">
                Partner with us to distribute your healthcare solutions across
                our network.
              </p>
            </div>
          </div>
          <Link
            href="/supplier"
            className="bg-navy text-white font-bold px-8 py-4 rounded-full hover:bg-navy/90 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center shrink-0 shadow-lg group"
          >
            Become a Supplier{" "}
            <span className="material-symbols-outlined ml-2 transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
