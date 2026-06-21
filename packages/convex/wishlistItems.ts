import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

type AuthedCtx = { auth: Auth };

async function requireUserId(ctx: AuthedCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Not authenticated');
  }
  return userId;
}

async function requireUser(
  ctx: AuthedCtx & { db: { get: (id: Id<'users'>) => Promise<Doc<'users'> | null> } }
): Promise<Doc<'users'>> {
  const userId = await requireUserId(ctx);
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError('User not found');
  }
  return user;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { items: [], total: 0 };
    }
    const rows = await ctx.db
      .query('wishlistItems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const productIds = [...new Set(rows.map((r) => r.productId))];
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));
    const productMap = new Map<Id<'products'>, Doc<'products'>>();
    for (const product of products) {
      if (product) {
        productMap.set(product._id, product);
      }
    }

    const items = rows.map((row) => {
      const product = productMap.get(row.productId);
      const variant = row.colorVariantId
        ? product?.colorVariants.find((cv) => cv.id === row.colorVariantId)
        : null;
      const unitPrice = product?.salePrice ?? product?.basePrice ?? 0;
      return {
        _id: row._id,
        productId: row.productId,
        productSlug: product?.slug ?? '',
        productName: product?.name ?? '',
        colorVariantId: row.colorVariantId ?? null,
        colorName: variant?.colorName ?? null,
        colorHex: variant?.colorHex ?? null,
        size: row.size ?? null,
        imageId: variant?.images[0] ?? null,
        unitPrice,
        addedAt: row.addedAt,
      };
    });

    return { items, total: items.length };
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { count: 0 };
    }
    const rows = await ctx.db
      .query('wishlistItems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return { count: rows.length };
  },
});

export const add = mutation({
  args: {
    productId: v.id('products'),
    colorVariantId: v.string(),
    size: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    const variant = product.colorVariants.find((cv) => cv.id === args.colorVariantId);
    if (!variant) {
      throw new ConvexError('Color variant not found');
    }
    if (!variant.selectedSizes.includes(args.size)) {
      throw new ConvexError('Size not available for this variant');
    }
    const existing = await ctx.db
      .query('wishlistItems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
      .then((rows) =>
        rows.find(
          (r) =>
            r.productId === args.productId &&
            r.colorVariantId === args.colorVariantId &&
            r.size === args.size
        )
      );
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert('wishlistItems', {
      userId,
      productId: args.productId,
      colorVariantId: args.colorVariantId,
      size: args.size,
      addedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('wishlistItems') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) {
      throw new ConvexError('Wishlist item not found');
    }
    if (row.userId !== user._id) {
      throw new ConvexError('Forbidden');
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('wishlistItems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});
