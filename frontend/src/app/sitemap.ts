import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:8000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/solutions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sectors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/supplier`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      productRoutes = items
        .filter((product: { slug?: string; is_active?: boolean }) => product.slug && product.is_active !== false)
        .map((product: { slug: string; updated_at?: string; created_at?: string }) => ({
          url: `${baseUrl}/products/${product.slug}`,
          lastModified: product.updated_at || product.created_at ? new Date(product.updated_at || product.created_at!) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (err) {
    // Graceful fallback during build if backend is offline
    console.warn('Could not fetch products for dynamic sitemap:', err);
  }

  return [...staticRoutes, ...productRoutes];
}
