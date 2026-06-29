import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireAdmin } from './authHelpers';

interface AuditEntry {
  productId: Id<'products'>;
  variantId: string;
  size: string;
  delta: number;
  reason: 'order_placed' | 'order_cancelled' | 'order_restored' | 'manual_adjustment';
  actorId?: Id<'users'>;
  orderId?: Id<'orders'>;
}

export const record = internalMutation({
  args: {
    productId: v.id('products'),
    variantId: v.string(),
    size: v.string(),
    delta: v.number(),
    reason: v.union(
      v.literal('order_placed'),
      v.literal('order_cancelled'),
      v.literal('order_restored'),
      v.literal('manual_adjustment')
    ),
    actorId: v.optional(v.id('users')),
    orderId: v.optional(v.id('orders')),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('stockAudit', {
      productId: args.productId,
      variantId: args.variantId,
      size: args.size,
      delta: args.delta,
      reason: args.reason,
      actorId: args.actorId,
      orderId: args.orderId,
      createdAt: Date.now(),
    });
  },
});

export const recordMany = internalMutation({
  args: {
    entries: v.array(
      v.object({
        productId: v.id('products'),
        variantId: v.string(),
        size: v.string(),
        delta: v.number(),
        reason: v.union(
          v.literal('order_placed'),
          v.literal('order_cancelled'),
          v.literal('order_restored'),
          v.literal('manual_adjustment')
        ),
        actorId: v.optional(v.id('users')),
        orderId: v.optional(v.id('orders')),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.entries.length === 0) {
      return;
    }
    const now = Date.now();
    for (const entry of args.entries) {
      const record: AuditEntry & { createdAt: number } = { ...entry, createdAt: now };
      await ctx.db.insert('stockAudit', record);
    }
  },
});

export const listByProduct = query({
  args: {
    productId: v.id('products'),
    variantId: v.optional(v.string()),
    size: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 100;
    const all = await ctx.db
      .query('stockAudit')
      .withIndex('by_product_created', (q) => q.eq('productId', args.productId))
      .order('desc')
      .collect();
    const filtered = all.filter((entry) => {
      if (args.variantId !== undefined && entry.variantId !== args.variantId) {
        return false;
      }
      if (args.size !== undefined && entry.size !== args.size) {
        return false;
      }
      return true;
    });
    const sliced = filtered.slice(0, limit);
    const actorIds = Array.from(
      new Set(
        sliced.map((entry) => entry.actorId).filter((id): id is Id<'users'> => id !== undefined)
      )
    );
    const actorDocs = await Promise.all(actorIds.map((id) => ctx.db.get(id)));
    const actorMap = new Map<Id<'users'>, { name?: string; email?: string }>();
    actorIds.forEach((id, index) => {
      const doc = actorDocs[index];
      if (doc) {
        actorMap.set(id, { name: doc.name, email: doc.email });
      }
    });
    return sliced.map((entry) => {
      const actor = entry.actorId !== undefined ? actorMap.get(entry.actorId) : undefined;
      return {
        ...entry,
        actorName: actor?.name ?? null,
        actorEmail: actor?.email ?? null,
      };
    });
  },
});
