import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { DEFAULT_PAGE_SIZE, LOW_STOCK_THRESHOLD } from '@workspace/lib/constants';
import { isAdminRole } from '@workspace/lib/auth';

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

const measurementSchema = v.object({
  shoulder: v.number(),
  chest: v.number(),
  sleeve: v.number(),
  waist: v.number(),
  length: v.number(),
});

const colorVariantSchema = v.object({
  id: v.string(),
  colorName: v.string(),
  colorHex: v.string(),
  images: v.array(v.id('_storage')),
  selectedSizes: v.array(v.string()),
  stock: v.record(v.string(), v.number()),
  measurements: v.optional(v.record(v.string(), measurementSchema)),
});

async function requireAdmin(ctx: {
  auth: Auth;
  db: { get: (id: Id<'users'>) => Promise<Doc<'users'> | null> };
}): Promise<Doc<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Not authenticated');
  }
  const user = await ctx.db.get(userId);
  if (!user || !isAdminRole(user.role)) {
    throw new ConvexError('Forbidden: admin role required');
  }
  return user;
}

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

export const adminList = query({
  args: {
    categorySlug: v.optional(v.string()),
    search: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    sort: sortValidator,
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
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
        return { items: [] as ProductListItem[], total: 0, page, pageSize };
      }
    }

    let candidates: Doc<'products'>[];
    if (categoryId !== undefined) {
      candidates = await ctx.db
        .query('products')
        .withIndex('by_category', (q) => q.eq('categoryId', categoryId!))
        .collect();
    } else if (args.isPublished !== undefined) {
      candidates = await ctx.db
        .query('products')
        .withIndex('by_active', (q) => q.eq('isPublished', args.isPublished!))
        .collect();
    } else if (args.isFeatured !== undefined) {
      candidates = await ctx.db
        .query('products')
        .withIndex('by_featured', (q) => q.eq('isFeatured', args.isFeatured!))
        .collect();
    } else {
      candidates = await ctx.db.query('products').collect();
    }

    const search = args.search?.toLowerCase().trim();

    const filtered = candidates.filter((product) => {
      if (args.isPublished !== undefined && product.isPublished !== args.isPublished) {
        return false;
      }
      if (args.isFeatured !== undefined && product.isFeatured !== args.isFeatured) {
        return false;
      }
      if (search) {
        const haystack =
          `${product.name} ${product.sku ?? ''} ${product.description}`.toLowerCase();
        if (!haystack.includes(search)) {
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

    return { items, total, page, pageSize };
  },
});

export const adminGetById = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    sku: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    colorVariants: v.array(colorVariantSchema),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) {
      throw new ConvexError('Slug already in use');
    }
    const now = Date.now();
    return await ctx.db.insert('products', {
      sku: args.sku,
      name: args.name,
      slug: args.slug,
      description: args.description,
      categoryId: args.categoryId,
      basePrice: args.basePrice,
      salePrice: args.salePrice,
      isFeatured: args.isFeatured,
      isPublished: args.isPublished,
      createdAt: now,
      updatedAt: now,
      colorVariants: args.colorVariants,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('products'),
    sku: v.optional(v.string()),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    colorVariants: v.optional(v.array(colorVariantSchema)),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    if (args.slug !== undefined && args.slug !== product.slug) {
      const dup = await ctx.db
        .query('products')
        .withIndex('by_slug', (q) => q.eq('slug', args.slug!))
        .unique();
      if (dup && dup._id !== args.id) {
        throw new ConvexError('Slug already in use');
      }
    }
    const patch: Partial<Doc<'products'>> = { updatedAt: Date.now() };
    if (args.sku !== undefined) patch.sku = args.sku;
    if (args.name !== undefined) patch.name = args.name;
    if (args.slug !== undefined) patch.slug = args.slug;
    if (args.description !== undefined) patch.description = args.description;
    if (args.categoryId !== undefined) patch.categoryId = args.categoryId;
    if (args.basePrice !== undefined) patch.basePrice = args.basePrice;
    if (args.salePrice !== undefined) patch.salePrice = args.salePrice;
    if (args.isFeatured !== undefined) patch.isFeatured = args.isFeatured;
    if (args.isPublished !== undefined) patch.isPublished = args.isPublished;
    if (args.colorVariants !== undefined) patch.colorVariants = args.colorVariants;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const softDelete = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    await ctx.db.patch(args.id, { isPublished: false, updatedAt: Date.now() });
    return args.id;
  },
});

export const togglePublished = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    await ctx.db.patch(args.id, { isPublished: !product.isPublished, updatedAt: Date.now() });
    return { id: args.id, isPublished: !product.isPublished };
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    await ctx.db.patch(args.id, { isFeatured: !product.isFeatured, updatedAt: Date.now() });
    return { id: args.id, isFeatured: !product.isFeatured };
  },
});

export const lowStockCount = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 20;
    const products = await ctx.db.query('products').collect();
    const items: Array<{
      productId: Id<'products'>;
      productSlug: string;
      productName: string;
      variantId: string;
      colorName: string;
      colorHex: string;
      size: string;
      stock: number;
    }> = [];
    for (const product of products) {
      for (const variant of product.colorVariants) {
        for (const [size, qty] of Object.entries(variant.stock)) {
          if (qty < LOW_STOCK_THRESHOLD) {
            items.push({
              productId: product._id,
              productSlug: product.slug,
              productName: product.name,
              variantId: variant.id,
              colorName: variant.colorName,
              colorHex: variant.colorHex,
              size,
              stock: qty,
            });
          }
        }
      }
    }
    items.sort((a, b) => a.stock - b.stock);
    return items.slice(0, limit);
  },
});
