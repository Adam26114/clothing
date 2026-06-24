import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { isAdminRole } from '@workspace/lib/auth';
import { Sentry } from './sentry-init';

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
