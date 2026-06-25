import type { MetadataRoute } from 'next';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@workspace/convex/_generated/api';

const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return [
      { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
      { url: `${SITE_URL}/cart`, changeFrequency: 'never', priority: 0.3 },
    ];
  }

  const [products, categories] = await Promise.all([
    fetchQuery(api.products.listForSitemap).catch(() => []),
    fetchQuery(api.categories.listActive).catch(() => []),
  ]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/new`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/sale`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
