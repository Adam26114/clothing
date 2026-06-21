import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

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
