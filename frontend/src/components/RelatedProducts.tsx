"use client";

import { useQuoteCart } from "@/context/QuoteCartContext";
import { ProductItem, getMediaUrl, productsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RelatedProductsProps {
  currentProductSlug: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  onAddToCartToast?: (message: string) => void;
  onAddCompare?: (slug: string) => void;
}

export default function RelatedProducts({
  currentProductSlug,
  title,
  subtitle,
  tag,
  onAddToCartToast,
  onAddCompare,
}: RelatedProductsProps) {
  const router = useRouter();
  const { addItem } = useQuoteCart();
  const [related, setRelated] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    productsApi
      .getRelatedProducts(currentProductSlug, 4)
      .then((items) => {
        if (!active) return;
        setRelated(items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRelated([]);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentProductSlug]);

  if (isLoading) {
    return (
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-md mb-2" />
            <div className="h-4 w-72 bg-slate-100 animate-pulse rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3" />
                <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-5 w-full bg-slate-200 rounded mb-3" />
              </div>
              <div className="h-10 bg-slate-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Gracefully hide section if no related items found
  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-gold block mb-1">
            {tag || "Clinical Recommendations"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            {title || "Related Equipment & Solutions"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {subtitle ||
              "Explore clinically comparable medical devices and complementary equipment in this category."}
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-blue-600 transition-colors shrink-0"
        >
          <span>View full catalogue</span>
          <span className="material-symbols-outlined text-sm!">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((item) => {
          const imgUrl =
            item.primary_image_url ||
            item.images?.[0]?.image_url ||
            "/images/benevision_n12.jpg";

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 p-4 md:p-5 flex flex-col justify-between group relative"
            >
              <div>
                {/* Brand & Category header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 truncate max-w-35">
                    {item.brand_name || "Generic"}
                  </span>
                  {item.subcategory_name && (
                    <span className="text-[11px] font-medium text-gray-500 bg-slate-50 border border-gray-200 px-2 py-0.5 rounded-md truncate max-w-30">
                      {item.subcategory_name}
                    </span>
                  )}
                </div>

                {/* Product Thumbnail */}
                <Link
                  href={`/products/${item.slug}`}
                  className="w-full aspect-square bg-slate-50/50 rounded-xl flex items-center justify-center mb-3 border border-gray-100 overflow-hidden relative group-hover:border-blue-200 transition-colors"
                >
                  <Image
                    src={getMediaUrl(imgUrl)}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Title */}
                <Link
                  href={`/products/${item.slug}`}
                  className="block group-hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-bold text-navy text-sm sm:text-base line-clamp-2 leading-snug">
                    {item.name}
                  </h3>
                </Link>

                {item.short_description && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                    {item.short_description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addItem({
                      productId: String(item.id),
                      productName: item.name,
                      slug: item.slug,
                      sku: item.sku,
                      brandName: item.brand_name,
                      imageUrl: item.primary_image_url,
                      categoryName: item.category_name,
                      quantity: 1,
                    });
                    if (onAddToCartToast) {
                      onAddToCartToast(`Added "${item.name}" to Quote Cart!`);
                    }
                  }}
                  className="flex-1 bg-navy text-white text-xs font-bold py-2.5 px-3 rounded-xl hover:bg-navy-light transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  title="Add to Quote Cart"
                >
                  <span className="material-symbols-outlined text-base!">
                    add_shopping_cart
                  </span>
                  <span>Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddCompare) {
                      onAddCompare(item.slug);
                    } else {
                      router.push(`/compare?items=${item.slug}`);
                    }
                  }}
                  className="p-2 border border-gray-200 text-gray-600 hover:text-navy hover:border-navy rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  title="Compare with other equipment"
                  aria-label={`Compare ${item.name}`}
                >
                  <span className="material-symbols-outlined text-lg!">
                    compare_arrows
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
