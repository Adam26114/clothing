import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { DEFAULT_PAGE_SIZE } from '@workspace/lib/constants';
import { isAdminRole, type UserRole } from '@workspace/lib/auth';
import { Sentry } from './sentry-init';

type AuthedQueryCtx = {
  auth: Auth;
  db: { get: (id: Id<'users'>) => Promise<Doc<'users'> | null> };
};
type AuthedMutationCtx = AuthedQueryCtx & {
  db: AuthedQueryCtx['db'] & {
    patch: (id: Id<'users'>, fields: Partial<Doc<'users'>>) => Promise<void>;
  };
};

async function requireUser(ctx: AuthedQueryCtx): Promise<Doc<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Not authenticated');
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError('User not found');
  }
  return user;
}

async function requireAdmin(ctx: AuthedQueryCtx): Promise<Doc<'users'>> {
  const user = await requireUser(ctx);
  if (!isAdminRole(user.role)) {
    throw new ConvexError('Forbidden: admin role required');
  }
  return user;
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      email: user.email ?? '',
      name: user.name ?? '',
      role: user.role,
      isActive: user.isActive,
    };
  },
});

export const list = query({
  args: {
    role: v.optional(v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin'))),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = Math.max(0, args.page ?? 0);
    const all = await ctx.db.query('users').collect();

    const search = args.search?.toLowerCase().trim();
    const filtered = all.filter((user) => {
      if (args.role && user.role !== args.role) {
        return false;
      }
      if (search) {
        const haystack = `${user.name ?? ''} ${user.email ?? ''} ${user.phone ?? ''}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt - a.createdAt);
    const total = filtered.length;
    const start = page * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  },
});

export const getById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) {
      return null;
    }
    return user;
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
  },
  handler: async (ctx, args) => {
    return await setUserRoleImpl(ctx, args);
  },
});

async function setUserRoleImpl(
  ctx: AuthedMutationCtx,
  args: { userId: Id<'users'>; role: 'customer' | 'admin' | 'super-admin' }
): Promise<Id<'users'>> {
  const actor = await requireAdmin(ctx);
  if (actor.role !== 'super-admin' && args.role !== 'customer') {
    throw new ConvexError('Only super-admin can promote to admin');
  }
  if (args.userId === actor._id && args.role !== 'super-admin') {
    throw new ConvexError('Cannot demote your own super-admin account');
  }
  const target = await ctx.db.get(args.userId);
  if (!target) {
    throw new ConvexError('User not found');
  }
  try {
    await ctx.db.patch(args.userId, { role: args.role });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { mutation: 'users.setRole' },
      extra: { targetUserId: args.userId, newRole: args.role, actorId: actor._id },
    });
    throw err;
  }
  return args.userId;
}

export const setActive = mutation({
  args: {
    userId: v.id('users'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError('User not found');
    }
    await ctx.db.patch(args.userId, { isActive: args.isActive });
    return args.userId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const patch: { name?: string; phone?: string } = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (Object.keys(patch).length === 0) return user._id;
    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

export const adminListStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query('users').collect();
    return {
      customerCount: all.filter((u) => u.role === 'customer').length,
      adminCount: all.filter((u) => u.role === 'admin').length,
      superAdminCount: all.filter((u) => u.role === 'super-admin').length,
      activeCount: all.filter((u) => u.isActive).length,
    };
  },
});

export const setRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
  },
  handler: async (ctx, args) => {
    return await setUserRoleImpl(ctx, args);
  },
});

export const getCustomerHistory = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) {
      return null;
    }
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_customer', (q) => q.eq('customerId', args.id))
      .collect();
    orders.sort((a, b) => b.createdAt - a.createdAt);
    const stats = computeCustomerStats(orders);
    return { user, orders, stats };
  },
});

function computeCustomerStats(orders: Doc<'orders'>[]): {
  totalOrders: number;
  totalSpent: number;
  ltvMonths: number;
} {
  const totalOrders = orders.length;
  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  let ltvMonths = 0;
  if (totalOrders > 0) {
    const sorted = [...orders].sort((a, b) => a.createdAt - b.createdAt);
    const first = new Date(sorted[0]!.createdAt);
    const last = new Date(sorted[sorted.length - 1]!.createdAt);
    const months =
      (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth());
    ltvMonths = Math.max(1, months);
  }
  return { totalOrders, totalSpent, ltvMonths };
}

export type CurrentUserView = {
  _id: Id<'users'>;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
};
