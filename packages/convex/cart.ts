import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUserId } from './authHelpers';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const items = await ctx.db
      .query('cartItems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));
    const productMap = new Map<Id<'products'>, Doc<'products'>>();
    for (const product of products) {
      if (product) {
        productMap.set(product._id, product);
      }
    }
    return items.map((item) => {
      const product = productMap.get(item.productId);
      const variant = product?.colorVariants.find((v) => v.id === item.colorVariantId);
      return {
        ...item,
        product: product
          ? {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              basePrice: product.basePrice,
              salePrice: product.salePrice,
            }
          : null,
        colorName: variant?.colorName ?? null,
        colorHex: variant?.colorHex ?? null,
        imageId: variant?.images[0] ?? null,
        inStock: (variant?.stock[item.size] ?? 0) >= item.quantity,
      };
    });
  },
});

export const add = mutation({
  args: {
    productId: v.id('products'),
    colorVariantId: v.string(),
    size: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.quantity <= 0) {
      throw new ConvexError('Quantity must be positive');
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    const variant = product.colorVariants.find((v) => v.id === args.colorVariantId);
    if (!variant) {
      throw new ConvexError('Color variant not found');
    }
    if (!variant.selectedSizes.includes(args.size)) {
      throw new ConvexError('Size not available for this variant');
    }
    const available = variant.stock[args.size] ?? 0;
    if (available < args.quantity) {
      throw new ConvexError(`Only ${available} items in stock for size ${args.size}`);
    }
    const now = Date.now();
    const existing = await ctx.db
      .query('cartItems')
      .withIndex('by_user_product_variant', (q) =>
        q
          .eq('userId', userId)
          .eq('productId', args.productId)
          .eq('colorVariantId', args.colorVariantId)
          .eq('size', args.size)
      )
      .unique();
    if (existing) {
      const newQty = existing.quantity + args.quantity;
      if (available < newQty) {
        throw new ConvexError(`Only ${available} items in stock for size ${args.size}`);
      }
      await ctx.db.patch(existing._id, { quantity: newQty, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert('cartItems', {
      userId,
      productId: args.productId,
      colorVariantId: args.colorVariantId,
      size: args.size,
      quantity: args.quantity,
      addedAt: now,
      updatedAt: now,
    });
  },
});

export const updateQty = mutation({
  args: {
    id: v.id('cartItems'),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new ConvexError('Cart item not found');
    }
    if (item.userId !== userId) {
      throw new ConvexError('Forbidden');
    }
    if (args.quantity <= 0) {
      await ctx.db.delete(args.id);
      return null;
    }
    const product = await ctx.db.get(item.productId);
    if (!product) {
      throw new ConvexError('Product not found');
    }
    const variant = product.colorVariants.find((v) => v.id === item.colorVariantId);
    const available = variant?.stock[item.size] ?? 0;
    if (available < args.quantity) {
      throw new ConvexError(`Only ${available} items in stock for size ${item.size}`);
    }
    await ctx.db.patch(args.id, { quantity: args.quantity, updatedAt: Date.now() });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id('cartItems') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new ConvexError('Cart item not found');
    }
    if (item.userId !== userId) {
      throw new ConvexError('Forbidden');
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const mergeGuest = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id('products'),
        colorVariantId: v.string(),
        size: v.string(),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    let merged = 0;
    const skipped: Array<{
      productId: Id<'products'>;
      colorVariantId: string;
      size: string;
      reason: string;
    }> = [];
    const now = Date.now();

    for (const item of args.items) {
      if (item.quantity <= 0) {
        skipped.push({ ...item, reason: 'invalid quantity' });
        continue;
      }
      const product = await ctx.db.get(item.productId);
      if (!product || !product.isPublished) {
        skipped.push({ ...item, reason: 'product unavailable' });
        continue;
      }
      const variant = product.colorVariants.find((v) => v.id === item.colorVariantId);
      if (!variant) {
        skipped.push({ ...item, reason: 'variant not found' });
        continue;
      }
      if (!variant.selectedSizes.includes(item.size)) {
        skipped.push({ ...item, reason: 'size not available' });
        continue;
      }
      const available = variant.stock[item.size] ?? 0;
      if (available < item.quantity) {
        skipped.push({ ...item, reason: `only ${available} in stock` });
        continue;
      }

      const existing = await ctx.db
        .query('cartItems')
        .withIndex('by_user_product_variant', (q) =>
          q
            .eq('userId', userId)
            .eq('productId', item.productId)
            .eq('colorVariantId', item.colorVariantId)
            .eq('size', item.size)
        )
        .unique();

      if (existing) {
        const newQty = existing.quantity + item.quantity;
        if (available < newQty) {
          skipped.push({ ...item, reason: `only ${available} in stock` });
          continue;
        }
        await ctx.db.patch(existing._id, { quantity: newQty, updatedAt: now });
      } else {
        await ctx.db.insert('cartItems', {
          userId,
          productId: item.productId,
          colorVariantId: item.colorVariantId,
          size: item.size,
          quantity: item.quantity,
          addedAt: now,
          updatedAt: now,
        });
      }
      merged++;
    }

    return { merged, skipped };
  },
});
