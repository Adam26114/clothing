import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { DEFAULT_PAGE_SIZE } from '@workspace/lib/constants';

const sortValidator = v.optional(
  v.union(
    v.literal('newest'),
    v.literal('oldest'),
    v.literal('price-asc'),
    v.literal('price-desc'),
    v.literal('name-asc'),
    v.literal('name-desc')
  )
);

export interface ProductListItem {
  _id: Id<'products'>;
  _creationTime: number;
  sku?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: Id<'categories'>;
  basePrice?: number;
  salePrice?: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
  colorVariants: Doc<'products'>['colorVariants'];
  totalStock: number;
}

function computeTotalStock(product: Doc<'products'>): number {
  let total = 0;
  for (const variant of product.colorVariants) {
    for (const qty of Object.values(variant.stock)) {
      total += qty;
    }
  }
  return total;
}

export function toProductListItem(product: Doc<'products'>): ProductListItem {
  return {
    ...product,
    totalStock: computeTotalStock(product),
  };
}

export const list = query({
  args: {
    categorySlug: v.optional(v.string()),
    search: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    sort: sortValidator,
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = Math.max(0, args.page ?? 0);

    let categoryId: Id<'categories'> | undefined;
    if (args.categorySlug) {
      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug!))
        .unique();
      if (category) {
        categoryId = category._id;
      } else {
        return {
          items: [] as ProductListItem[],
          total: 0,
          page,
          pageSize,
        };
      }
    }

    const isPublished = args.isPublished ?? true;
    const isFeatured = args.isFeatured;

    let candidates: Doc<'products'>[];
    if (categoryId !== undefined) {
      const byCategory = await ctx.db
        .query('products')
        .withIndex('by_category', (q) => q.eq('categoryId', categoryId!))
        .collect();
      candidates = byCategory;
    } else if (isFeatured !== undefined) {
      const byFeatured = await ctx.db
        .query('products')
        .withIndex('by_featured', (q) => q.eq('isFeatured', isFeatured))
        .collect();
      candidates = byFeatured;
    } else {
      const byActive = await ctx.db
        .query('products')
        .withIndex('by_active', (q) => q.eq('isPublished', isPublished))
        .collect();
      candidates = byActive;
    }

    const search = args.search?.toLowerCase().trim();
    const minPrice = args.minPrice;
    const maxPrice = args.maxPrice;

    const filtered = candidates.filter((product) => {
      if (product.isPublished !== isPublished) {
        return false;
      }
      if (search) {
        const haystack =
          `${product.name} ${product.sku ?? ''} ${product.description}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      if (minPrice !== undefined) {
        const price = product.salePrice ?? product.basePrice ?? 0;
        if (price < minPrice) {
          return false;
        }
      }
      if (maxPrice !== undefined) {
        const price = product.salePrice ?? product.basePrice ?? Number.MAX_SAFE_INTEGER;
        if (price > maxPrice) {
          return false;
        }
      }
      return true;
    });

    const sort = args.sort ?? 'newest';
    const effectivePrice = (p: Doc<'products'>): number => p.salePrice ?? p.basePrice ?? 0;

    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'price-asc':
          return effectivePrice(a) - effectivePrice(b);
        case 'price-desc':
          return effectivePrice(b) - effectivePrice(a);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    const total = filtered.length;
    const start = page * pageSize;
    const items = filtered.slice(start, start + pageSize).map(toProductListItem);

    return {
      items,
      total,
      page,
      pageSize,
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!product) {
      return null;
    }
    return toProductListItem(product);
  },
});

export const getById = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      return null;
    }
    return toProductListItem(product);
  },
});
