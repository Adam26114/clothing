import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin } from './authHelpers';
import { Sentry } from './sentry_init';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    try {
      return await ctx.storage.generateUploadUrl();
    } catch (err) {
      Sentry.captureException(err, { tags: { mutation: 'storage.generateUploadUrl' } });
      throw err;
    }
  },
});

export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteAt = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (url === null) {
      throw new ConvexError('Storage file not found');
    }
    await ctx.storage.delete(args.storageId);
    return args.storageId;
  },
});
