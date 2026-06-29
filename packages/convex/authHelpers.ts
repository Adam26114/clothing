import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { isAdminRole } from '@workspace/lib/auth';

type Ctx = QueryCtx | MutationCtx;

/**
 * Resolve the current BA subject (the BA user id) to our internal `users` row.
 * Returns `null` when the caller is not signed in.
 *
 * Used by every query/mutation that needs to know the internal user id (for
 * cart, wishlist, order ownership checks). The lookup is cheap — one indexed
 * read on `users.betterAuthUserId`.
 */
export async function getInternalUserId(ctx: Ctx): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const user = await ctx.db
    .query('users')
    .withIndex('betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
    .unique();
  return user?._id ?? null;
}

export async function getCurrentUser(ctx: Ctx): Promise<Doc<'users'> | null> {
  const id = await getInternalUserId(ctx);
  if (!id) {
    return null;
  }
  return await ctx.db.get(id);
}

export async function requireUserId(ctx: Ctx): Promise<Id<'users'>> {
  const id = await getInternalUserId(ctx);
  if (!id) {
    throw new ConvexError('Not authenticated');
  }
  return id;
}

export async function requireUser(ctx: Ctx): Promise<Doc<'users'>> {
  const id = await requireUserId(ctx);
  const user = await ctx.db.get(id);
  if (!user) {
    throw new ConvexError('User not found');
  }
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<'users'>> {
  const user = await requireUser(ctx);
  if (!isAdminRole(user.role)) {
    throw new ConvexError('Forbidden: admin role required');
  }
  return user;
}
