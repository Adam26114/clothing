import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { DEFAULT_INVENTORY_PAGE_SIZE } from '@workspace/lib/constants';
import { isAdminRole } from '@workspace/lib/auth';
import { setStockForVariant } from './orders';

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

export interface InventoryRow {
  _id: string;
  productId: Id<'products'>;
  productName: string;
  productSlug: string;
  categoryId: Id<'categories'>;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
  updatedAt: number;
}

export const list = query({
  args: {
    lowStock: v.optional(v.boolean()),
    outOfStock: v.optional(v.boolean()),
    categoryId: v.optional(v.id('categories')),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const pageSize = args.pageSize ?? DEFAULT_INVENTORY_PAGE_SIZE;
    const page = Math.max(0, args.page ?? 0);
    const search = args.search?.toLowerCase().trim();

    const products = await ctx.db.query('products').collect();

    const rows: InventoryRow[] = [];
    for (const product of products) {
      if (args.categoryId !== undefined && product.categoryId !== args.categoryId) {
        continue;
      }
      for (const variant of product.colorVariants) {
        for (const [size, qty] of Object.entries(variant.stock)) {
          if (args.outOfStock === true && qty !== 0) {
            continue;
          }
          if (args.outOfStock === false && qty === 0) {
            continue;
          }
          if (args.lowStock === true && !(qty > 0 && qty < 5)) {
            continue;
          }
          if (args.lowStock === false && qty > 0 && qty < 5) {
            continue;
          }
          if (search) {
            const haystack = `${product.name} ${variant.colorName}`.toLowerCase();
            if (!haystack.includes(search)) {
              continue;
            }
          }
          rows.push({
            _id: `${product._id}:${variant.id}:${size}`,
            productId: product._id,
            productName: product.name,
            productSlug: product.slug,
            categoryId: product.categoryId,
            variantId: variant.id,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            size,
            stock: qty,
            updatedAt: product.updatedAt,
          });
        }
      }
    }

    rows.sort((a, b) => {
      if (a.productName !== b.productName) {
        return a.productName.localeCompare(b.productName);
      }
      if (a.variantId !== b.variantId) {
        return a.variantId.localeCompare(b.variantId);
      }
      return a.size.localeCompare(b.size);
    });

    const total = rows.length;
    const start = page * pageSize;
    const items = rows.slice(start, start + pageSize);
    return { items, total, page, pageSize };
  },
});

export const setStock = mutation({
  args: {
    productId: v.id('products'),
    variantId: v.string(),
    size: v.string(),
    qty: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.qty < 0) {
      throw new ConvexError('Quantity must be non-negative');
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    const variant = product.colorVariants.find((v) => v.id === args.variantId);
    if (!variant) {
      throw new ConvexError('Variant not found');
    }
    if (!variant.selectedSizes.includes(args.size)) {
      throw new ConvexError(`Size ${args.size} is not available for this variant`);
    }
    const updated = setStockForVariant(product, args.variantId, args.size, args.qty);
    await ctx.db.patch(args.productId, {
      colorVariants: updated.colorVariants,
      updatedAt: Date.now(),
    });
    return { productId: args.productId, variantId: args.variantId, size: args.size, qty: args.qty };
  },
});
