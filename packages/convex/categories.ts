import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireAdmin } from './authHelpers';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('categories').collect();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query('categories')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
    return active.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    return category ?? null;
  },
});

export type CategoryWithChildren = Doc<'categories'> & {
  children: Doc<'categories'>[];
};

export const listAsTree = query({
  args: {},
  handler: async (ctx): Promise<CategoryWithChildren[]> => {
    const all = await ctx.db.query('categories').collect();
    const sorted = all.sort((a, b) => a.sortOrder - b.sortOrder);
    const byParent = new Map<string, Doc<'categories'>[]>();
    const roots: Doc<'categories'>[] = [];
    for (const category of sorted) {
      if (category.parentId) {
        const list = byParent.get(category.parentId) ?? [];
        list.push(category);
        byParent.set(category.parentId, list);
      } else {
        roots.push(category);
      }
    }
    return roots.map((root) => ({
      ...root,
      children: byParent.get(root._id) ?? [],
    }));
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query('categories').collect();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) {
      throw new ConvexError('Category slug already in use');
    }
    let sortOrder = args.sortOrder;
    if (sortOrder === undefined) {
      const all = await ctx.db.query('categories').collect();
      const max = all.reduce((m, c) => (c.sortOrder > m ? c.sortOrder : m), 0);
      sortOrder = max + 10;
    }
    const now = Date.now();
    return await ctx.db.insert('categories', {
      name: args.name,
      slug: args.slug,
      description: args.description,
      parentId: args.parentId,
      sortOrder,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('categories'),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError('Category not found');
    }
    if (args.slug !== undefined && args.slug !== category.slug) {
      const dup = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', args.slug!))
        .unique();
      if (dup && dup._id !== args.id) {
        throw new ConvexError('Category slug already in use');
      }
    }
    const patch: Partial<Doc<'categories'>> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.slug !== undefined) patch.slug = args.slug;
    if (args.description !== undefined) patch.description = args.description;
    if (args.parentId !== undefined) patch.parentId = args.parentId;
    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError('Category not found');
    }
    await ctx.db.patch(args.id, { isActive: !category.isActive, updatedAt: Date.now() });
    return { id: args.id, isActive: !category.isActive };
  },
});
