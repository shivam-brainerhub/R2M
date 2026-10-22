import { getApiUrl, getSiteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export const revalidate = 3600; // Revalidate sitemap every hour

const SECTORS_LIST = [
  "Hospitals & Healthcare Groups",
  "Clinics & Primary Care",
  "Pharmacies & Retail Healthcare",
  "Public Healthcare",
  "Laboratories",
  "Specialist Care",
  "Veterinary Practices",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const apiUrl = getApiUrl();
  const now = new Date();

  // Core Static Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sectors`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/solutions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/supplier`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Sector landing filter routes
  const sectorRoutes: MetadataRoute.Sitemap = SECTORS_LIST.map((sector) => ({
    url: `${baseUrl}/products?sector=${encodeURIComponent(sector)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  let brandRoutes: MetadataRoute.Sitemap = [];

  // Fetch Dynamic Products
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      productRoutes = items
        .filter(
          (product: { slug?: string; status?: string; is_active?: boolean }) =>
            Boolean(product.slug) &&
            product.is_active !== false &&
            (product.status
              ? product.status.toLowerCase() !== "archived"
              : true),
        )
        .map(
          (product: {
            slug: string;
            updated_at?: string;
            created_at?: string;
          }) => ({
            url: `${baseUrl}/products/${product.slug}`,
            lastModified:
              product.updated_at || product.created_at
                ? new Date(product.updated_at || product.created_at!)
                : now,
            changeFrequency: "weekly" as const,
            priority: 0.85,
          }),
        );
    }
  } catch (err) {
    console.warn("Sitemap: Could not fetch products from backend:", err);
  }

  // Fetch Dynamic Categories
  try {
    const catRes = await fetch(`${apiUrl}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (catRes.ok) {
      const categories = await catRes.json();
      if (Array.isArray(categories)) {
        categoryRoutes = categories
          .filter((cat: { name?: string }) => Boolean(cat.name))
          .map((cat: { name: string; updated_at?: string }) => ({
            url: `${baseUrl}/products?category=${encodeURIComponent(cat.name)}`,
            lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }));
      }
    }
  } catch (err) {
    console.warn("Sitemap: Could not fetch categories from backend:", err);
  }

  // Fetch Dynamic Brands
  try {
    const brandRes = await fetch(`${apiUrl}/api/brands`, {
      next: { revalidate: 3600 },
    });
    if (brandRes.ok) {
      const brands = await brandRes.json();
      if (Array.isArray(brands)) {
        brandRoutes = brands
          .filter(
            (b: { name?: string; product_count?: number }) =>
              Boolean(b.name) &&
              (b.product_count === undefined || b.product_count > 0),
          )
          .map((brand: { name: string; updated_at?: string }) => ({
            url: `${baseUrl}/products?brand=${encodeURIComponent(brand.name)}`,
            lastModified: brand.updated_at ? new Date(brand.updated_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.75,
          }));
      }
    }
  } catch (err) {
    console.warn("Sitemap: Could not fetch brands from backend:", err);
  }

  return [
    ...staticRoutes,
    ...sectorRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...productRoutes,
  ];
}
