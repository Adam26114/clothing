import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { isAdminRole } from '@workspace/lib/auth';

async function requireAdmin(ctx: {
  auth: Auth;
  db: { get: (id: Id<'users'>) => Promise<Doc<'users'> | null> };
}): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Not authenticated');
  }
  const user = await ctx.db.get(userId);
  if (!user || !isAdminRole(user.role)) {
    throw new ConvexError('Forbidden: admin role required');
  }
}

const SETTINGS_SINGLETON_ID = 'storeSettings:singleton' as Id<'storeSettings'>;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.get(SETTINGS_SINGLETON_ID);
    if (existing) {
      return existing;
    }
    const first = await ctx.db.query('storeSettings').first();
    return first ?? null;
  },
});

export const update = mutation({
  args: {
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('_storage')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.optional(v.boolean()),
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
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const existing =
      (await ctx.db.get(SETTINGS_SINGLETON_ID)) ?? (await ctx.db.query('storeSettings').first());

    const patch: Partial<Doc<'storeSettings'>> = {
      updatedAt: now,
    };
    const optionalKeys = [
      'heroTitle',
      'heroSubtitle',
      'heroImageId',
      'heroCtaLabel',
      'heroCtaLink',
      'saleBannerText',
      'saleBannerLink',
      'announcementBar',
      'contactEmail',
      'contactPhone',
      'socialInstagram',
      'socialFacebook',
      'socialTiktok',
      'pickupStoreName',
      'pickupStoreAddress',
      'pickupStoreHours',
      'lowStockThreshold',
    ] as const;
    for (const key of optionalKeys) {
      if (args[key] !== undefined) {
        (patch as Record<string, unknown>)[key] = args[key];
      }
    }
    if (args.saleBannerEnabled !== undefined) {
      patch.saleBannerEnabled = args.saleBannerEnabled;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    const newDoc = {
      saleBannerEnabled: patch.saleBannerEnabled ?? false,
      ...patch,
    } as Doc<'storeSettings'>;
    return await ctx.db.insert('storeSettings', newDoc);
  },
});
