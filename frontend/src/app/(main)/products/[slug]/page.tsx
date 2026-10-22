import { getMediaUrl, ProductItem } from "@/lib/api";
import { getApiUrl, getCanonicalUrl, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProduct(slug: string): Promise<ProductItem | null> {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`Error fetching product ${slug} on server:`, err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  const siteUrl = getSiteUrl();

  if (!product) {
    return {
      title: "Medical Product Not Found",
      description: "The requested medical device could not be found.",
    };
  }

  const title =
    product.meta_title ||
    `${product.name}${
      product.brand_name ? ` by ${product.brand_name}` : ""
    } | SA Healthcare`;

  const description =
    product.meta_description ||
    product.short_description ||
    product.description?.slice(0, 160) ||
    `Specifications, technical details and quote requests for ${product.name} from SA Healthcare.`;

  const canonicalUrl = getCanonicalUrl(`/products/${product.slug}`);

  const rawImageUrl =
    product.primary_image_url ||
    (product.images && product.images[0]?.image_url);
  const absoluteImageUrl = rawImageUrl
    ? rawImageUrl.startsWith("http")
      ? rawImageUrl
      : `${siteUrl}${getMediaUrl(rawImageUrl)}`
    : `${siteUrl}/hero.jpg`;

  const keywords = [
    product.name,
    product.brand_name || "",
    product.category_name || "",
    product.subcategory_name || "",
    product.sku || "",
    ...(product.sectors?.map((s) => s.name) || []),
    "medical equipment South Africa",
    "hospital medical device",
    "healthcare equipment procurement",
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: absoluteImageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  const siteUrl = getSiteUrl();

  const rawImageUrl =
    product?.primary_image_url ||
    (product?.images && product.images[0]?.image_url);
  const absoluteImageUrl = rawImageUrl
    ? rawImageUrl.startsWith("http")
      ? rawImageUrl
      : `${siteUrl}${getMediaUrl(rawImageUrl)}`
    : `${siteUrl}/hero.jpg`;

  // Schema.org MedicalDevice / Product JSON-LD
  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": ["Product", "MedicalDevice"],
        name: product.name,
        image: absoluteImageUrl,
        description: product.description || product.short_description,
        sku: product.sku || undefined,
        mpn: product.sku || undefined,
        brand: product.brand_name
          ? {
              "@type": "Brand",
              name: product.brand_name,
            }
          : undefined,
        category: product.category_name || undefined,
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/products/${product.slug}`,
          priceCurrency: "ZAR",
          price: "0",
          priceValidUntil: "2027-12-31",
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  // Schema.org BreadcrumbList JSON-LD
  const breadcrumbSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Products",
            item: `${siteUrl}/products`,
          },
          ...(product.category_name
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.category_name,
                  item: `${siteUrl}/products?category=${encodeURIComponent(
                    product.category_name,
                  )}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: product.name,
                  item: `${siteUrl}/products/${product.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.name,
                  item: `${siteUrl}/products/${product.slug}`,
                },
              ]),
        ],
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
