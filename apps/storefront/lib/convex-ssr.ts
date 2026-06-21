import 'server-only';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@workspace/convex/_generated/api';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';
import type { ProductListItem } from '@workspace/convex/products';

type StoreSettingsDoc = Doc<'storeSettings'>;
type CategoryDoc = Doc<'categories'>;

interface ProductListResult {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

let cached: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  if (cached) {
    return cached;
  }
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return null;
  }
  cached = new ConvexHttpClient(url);
  return cached;
}

export interface HomepageData {
  settings: StoreSettingsDoc | null;
  categories: CategoryDoc[];
  featured: ProductListResult | null;
}

export async function loadHomepageData(): Promise<HomepageData> {
  const client = getClient();
  if (!client) {
    return { settings: null, categories: [], featured: null };
  }
  const [settings, categories, featured] = await Promise.all([
    client.query(api.storeSettings.get, {}).catch(() => null),
    client.query(api.categories.listActive, {}).catch(() => [] as CategoryDoc[]),
    client
      .query(api.products.list, {
        isFeatured: true,
        isPublished: true,
        pageSize: 8,
      })
      .catch(() => null),
  ]);
  return {
    settings: (settings as StoreSettingsDoc | null) ?? null,
    categories: (categories as CategoryDoc[]) ?? [],
    featured: (featured as ProductListResult | null) ?? null,
  };
}

export interface CategoryPageData {
  category: CategoryDoc | null;
  products: ProductListResult | null;
  parentCategory: CategoryDoc | null;
}

export async function loadCategoryPageData(
  categorySlug: string,
  subcategorySlug?: string
): Promise<CategoryPageData> {
  const client = getClient();
  if (!client) {
    return { category: null, products: null, parentCategory: null };
  }
  const targetSlug = subcategorySlug ?? categorySlug;
  const [category, parentCategory, products] = await Promise.all([
    client.query(api.categories.getBySlug, { slug: targetSlug }).catch(() => null),
    subcategorySlug
      ? client.query(api.categories.getBySlug, { slug: categorySlug }).catch(() => null)
      : Promise.resolve(null),
    client
      .query(api.products.list, {
        categorySlug: targetSlug,
        isPublished: true,
        pageSize: 20,
      })
      .catch(() => null),
  ]);
  return {
    category: (category as CategoryDoc | null) ?? null,
    parentCategory: (parentCategory as CategoryDoc | null) ?? null,
    products: (products as ProductListResult | null) ?? null,
  };
}

export async function loadProductData(slug: string): Promise<{
  product: ProductListItem | null;
}> {
  const client = getClient();
  if (!client) {
    return { product: null };
  }
  const product = await client.query(api.products.getBySlug, { slug }).catch(() => null);
  return { product: (product as ProductListItem | null) ?? null };
}

export async function loadCategoryChildren(parentId: Id<'categories'>) {
  const client = getClient();
  if (!client) {
    return [];
  }
  const all = await client.query(api.categories.listActive, {}).catch(() => [] as CategoryDoc[]);
  return (all as CategoryDoc[]).filter((c) => c.parentId === parentId);
}
