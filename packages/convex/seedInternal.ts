import { ConvexError, v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const listCategories = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('categories').collect();
  },
});

export const insertCategory = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    parentId: v.optional(v.id('categories')),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('categories', args);
  },
});

export const listProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('products').collect();
  },
});

export const findCategoryBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
  },
});

export const insertProduct = internalMutation({
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
    createdAt: v.number(),
    updatedAt: v.number(),
    colorVariants: v.array(
      v.object({
        id: v.string(),
        colorName: v.string(),
        colorHex: v.string(),
        images: v.array(v.id('_storage')),
        selectedSizes: v.array(v.string()),
        stock: v.record(v.string(), v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('products', args);
  },
});

export const getStoreSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('storeSettings').first();
  },
});

export const insertStoreSettings = internalMutation({
  args: {
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('_storage')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.boolean(),
    saleBannerText: v.optional(v.string()),
    saleBannerLink: v.optional(v.string()),
    announcementBar: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTiktok: v.optional(v.string()),
    pickupStoreName: v.optional(v.string()),
    pickupStoreAddress: v.optional(v.string()),
    pickupStoreHours: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('storeSettings', args);
  },
});

export const findUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email))
      .unique();
  },
});

export const updateUserRole = internalMutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
  },
  handler: async (ctx, args) => {
    const target: Id<'users'> = args.userId;
    await ctx.db.patch(target, { role: args.role });
    return target;
  },
});

export const promoteSuperAdmin = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError('User not found');
    }
    if (user.role === 'super-admin') {
      return args.userId;
    }
    await ctx.db.patch(args.userId, { role: 'super-admin' });
    return args.userId;
  },
});
