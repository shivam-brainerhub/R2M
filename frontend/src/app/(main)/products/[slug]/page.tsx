"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { productsApi, ProductItem, getMediaUrl, ApiError } from '@/lib/api';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    productsApi
      .getProduct(slug)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof ApiError ? err.message : 'Product not found';
        setError(msg);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
            progress_activity
          </span>
          <p className="text-sm font-semibold text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md space-y-4">
          <span className="material-symbols-outlined text-5xl text-gray-300">
            inventory_2
          </span>
          <h1 className="text-2xl font-bold text-navy">Product Not Found</h1>
          <p className="text-sm text-gray-500">
            The medical product you are looking for may have been retired or the link is incorrect.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-navy-light transition-colors"
          >
            <span className="material-symbols-outlined text-sm!">arrow_back</span>
            Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : product.primary_image_url
      ? [{ image_url: product.primary_image_url, is_primary: true, display_order: 0 }]
      : [];

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0] || null;

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="bg-light-blue py-3.5 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-xs sm:text-sm text-gray-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="material-symbols-outlined text-xs!">chevron_right</span>
          <Link href="/products" className="hover:text-navy">
            Products
          </Link>
          <span className="material-symbols-outlined text-xs!">chevron_right</span>
          {product.category_name && (
            <>
              <Link href={`/products?category=${encodeURIComponent(product.category_name)}`} className="hover:text-navy">
                {product.category_name}
              </Link>
              <span className="material-symbols-outlined text-xs!">chevron_right</span>
            </>
          )}
          <span className="text-navy font-semibold truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Product Image Gallery with Multiple Photos */}
          <div className="md:w-1/2 flex flex-col">
            <div className="bg-white border border-gray-100 rounded-3xl aspect-square flex items-center justify-center relative p-8 overflow-hidden shadow-xs">
              {currentImage && currentImage.image_url ? (
                <Image
                  src={getMediaUrl(currentImage.image_url)}
                  alt={currentImage.alt_text || product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-6 transition-all duration-300"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 space-y-3">
                  <span className="material-symbols-outlined text-8xl!">inventory_2</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    No image available
                  </span>
                </div>
              )}
              {product.brand_name && (
                <div className="absolute top-6 left-6 text-red-600 font-bold text-xl tracking-tight uppercase">
                  {product.brand_name}
                </div>
              )}
            </div>

            {/* Thumbnail selector if images exist */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 bg-white rounded-xl border relative overflow-hidden shrink-0 p-1 cursor-pointer transition-all ${
                      selectedImageIndex === idx
                        ? 'border-navy ring-2 ring-navy/20 shadow-xs'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={getMediaUrl(img.image_url)}
                      alt={img.alt_text || `Photo ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="md:w-1/2">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {product.brand_name && (
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100">
                  {product.brand_name}
                </span>
              )}
              {product.category_name && (
                <span className="text-xs text-gray-500 font-medium bg-slate-50 px-2.5 py-0.5 rounded-md border border-gray-200">
                  {product.category_name}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-mono text-gray-400">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3 tracking-tight">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {product.description && (
              <p className="text-gray-700 leading-relaxed mb-8 text-sm sm:text-base">
                {product.description}
              </p>
            )}

            {/* Dynamic Key Specifications Table */}
            {product.properties && product.properties.length > 0 && (
              <div className="bg-light-blue p-6 rounded-2xl mb-8 border border-blue-100/50">
                <h2 className="font-bold text-navy text-sm uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                  Key Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs sm:text-sm">
                  {product.properties.map((prop, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-gray-500 text-xs font-medium">{prop.name}</span>
                      <span className="font-bold text-navy mt-0.5">{prop.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/contact"
                className="flex-1 bg-gold text-navy font-bold py-3.5 px-6 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center flex justify-center items-center text-sm shadow-md"
              >
                Request a Quote <span className="material-symbols-outlined ml-2 text-lg!">arrow_forward</span>
              </Link>
              <button
                type="button"
                onClick={() => router.push(`/compare?items=${product.slug}`)}
                className="flex-1 bg-white border-2 border-navy text-navy font-bold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center flex justify-center items-center text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined mr-2 text-lg!">compare_arrows</span> Add to Compare
              </button>
            </div>

            {/* Brochure & Resources */}
            {product.brochure_url && (
              <div className="space-y-3 pt-2">
                <a
                  href={getMediaUrl(product.brochure_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-gray-200/80 transition-all group"
                >
                  <span className="material-symbols-outlined mr-3 text-2xl! text-red-500">
                    picture_as_pdf
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-navy group-hover:text-blue-700">
                      Product Brochure &amp; Datasheet
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      Download official manufacturer documentation
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-lg! text-gray-400 group-hover:text-blue-600 transition-colors">
                    download
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
