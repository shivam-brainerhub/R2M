"use client";

import BrochureDownloadButton from "@/components/BrochureDownloadButton";
import RelatedProducts from "@/components/RelatedProducts";
import { useQuoteCart } from "@/context/QuoteCartContext";
import { ApiError, ProductItem, getMediaUrl, productsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem } = useQuoteCart();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
        const msg = err instanceof ApiError ? err.message : "Product not found";
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
          <p className="text-sm font-semibold text-gray-500">
            Loading product details...
          </p>
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
            The medical product you are looking for may have been retired or the
            link is incorrect.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-navy-light transition-colors"
          >
            <span className="material-symbols-outlined text-sm!">
              arrow_back
            </span>
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
        ? [
            {
              image_url: product.primary_image_url,
              is_primary: true,
              display_order: 0,
            },
          ]
        : [];

  const currentImage =
    galleryImages[selectedImageIndex] || galleryImages[0] || null;

  return (
    <div className="bg-white min-h-screen pb-20 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-white text-xl!">
            check_circle
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {toastMessage}
          </span>
          <Link
            href="/quote"
            className="ml-2 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1 rounded-lg font-bold underline"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-light-blue py-3.5 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-xs sm:text-sm text-gray-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="material-symbols-outlined text-xs!">
            chevron_right
          </span>
          <Link href="/products" className="hover:text-navy">
            Products
          </Link>
          <span className="material-symbols-outlined text-xs!">
            chevron_right
          </span>
          {product.category_name && (
            <>
              <Link
                href={`/products?category=${encodeURIComponent(
                  product.category_name,
                )}`}
                className="hover:text-navy"
              >
                {product.category_name}
              </Link>
              <span className="material-symbols-outlined text-xs!">
                chevron_right
              </span>
            </>
          )}
          <span className="text-navy font-semibold truncate max-w-xs">
            {product.name}
          </span>
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
                  <span className="material-symbols-outlined text-8xl!">
                    inventory_2
                  </span>
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
                        ? "border-navy ring-2 ring-navy/20 shadow-xs"
                        : "border-gray-200 opacity-70 hover:opacity-100"
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

            {product.sectors && product.sectors.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Sectors:
                </span>
                {product.sectors.map((sec) => (
                  <Link
                    key={sec.id}
                    href={`/products?sector=${encodeURIComponent(sec.name)}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]!">
                      health_and_safety
                    </span>
                    <span>{sec.name}</span>
                  </Link>
                ))}
              </div>
            )}

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
                      <span className="text-gray-500 text-xs font-medium">
                        {prop.name}
                      </span>
                      <span className="font-bold text-navy mt-0.5">
                        {prop.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                type="button"
                onClick={() => {
                  addItem({
                    productId: String(product.id),
                    productName: product.name,
                    slug: product.slug,
                    sku: product.sku,
                    brandName: product.brand_name,
                    imageUrl: product.primary_image_url,
                    categoryName: product.category_name,
                    quantity: 1, // Quantity managed only in cart
                  });
                  router.push("/quote");
                }}
                className="flex-1 bg-gold text-navy font-bold py-3.5 px-6 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center flex justify-center items-center text-sm shadow-md cursor-pointer"
              >
                <span>Request a Quote</span>
                <span className="material-symbols-outlined ml-2 text-lg!">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addItem({
                    productId: String(product.id),
                    productName: product.name,
                    slug: product.slug,
                    sku: product.sku,
                    brandName: product.brand_name,
                    imageUrl: product.primary_image_url,
                    categoryName: product.category_name,
                    quantity: 1, // Quantity managed only in cart
                  });
                  showToast(`Added "${product.name}" to Quote Cart!`);
                }}
                className="flex-1 bg-navy text-white font-bold py-3.5 px-6 rounded-xl hover:bg-navy-light transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center flex justify-center items-center text-sm shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined mr-2 text-lg!">
                  add_shopping_cart
                </span>
                <span>Add to Quote Cart</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/compare?items=${product.slug}`)}
                className="sm:w-auto bg-white border-2 border-navy text-navy font-bold py-3.5 px-4 rounded-xl hover:bg-slate-50 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center flex justify-center items-center text-sm cursor-pointer"
                title="Add to Compare"
              >
                <span className="material-symbols-outlined text-lg!">
                  compare_arrows
                </span>
              </button>
            </div>

            {/* Official Documentation & Resources (Item 3) */}
            {((product.documents && product.documents.length > 0) ||
              product.brochure_url) && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-600">
                    folder_open
                  </span>
                  Official Documentation &amp; Downloads
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {(product.documents && product.documents.length > 0
                    ? product.documents
                    : [
                        {
                          id: 0,
                          title: `${product.name} Brochure`,
                          file_url: product.brochure_url!,
                          type: "Brochure",
                        },
                      ]
                  ).map((doc, idx) => {
                    const isManual = doc.type.toLowerCase().includes("manual");
                    const isCert = doc.type.toLowerCase().includes("cert");
                    const isSpec = doc.type.toLowerCase().includes("spec");
                    const iconName = isManual
                      ? "menu_book"
                      : isCert
                        ? "verified"
                        : isSpec
                          ? "analytics"
                          : "picture_as_pdf";
                    const iconColor = isManual
                      ? "text-teal-600"
                      : isCert
                        ? "text-amber-600"
                        : isSpec
                          ? "text-blue-600"
                          : "text-red-500";

                    return (
                      <BrochureDownloadButton
                        key={idx}
                        brochureUrl={doc.file_url}
                        className="w-full flex items-center text-blue-600 hover:text-blue-800 p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-gray-200/80 transition-all group cursor-pointer text-left"
                      >
                        <span
                          className={`material-symbols-outlined mr-3 text-2xl! ${iconColor}`}
                        >
                          {iconName}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-navy group-hover:text-blue-700 truncate">
                              {doc.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                              {doc.type}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            Verified manufacturer document • Click to download
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-lg! text-gray-400 group-hover:text-blue-600 transition-colors">
                          download
                        </span>
                      </BrochureDownloadButton>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Recommendations & Related Products */}
        <RelatedProducts
          currentProductSlug={product.slug}
          onAddToCartToast={showToast}
        />
      </div>
    </div>
  );
}
