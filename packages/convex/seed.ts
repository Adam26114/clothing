import { v, ConvexError } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { createAuth } from './auth';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL'] as const;

const DEFAULT_CATEGORIES: Array<{
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  children: Array<{
    slug: string;
    name: string;
    description?: string;
    sortOrder: number;
  }>;
}> = [
  {
    slug: 'men',
    name: 'Men',
    description: 'Shirts for men',
    sortOrder: 10,
    children: [
      {
        slug: 'men-casual',
        name: 'Casual Shirts',
        description: 'Everyday casual shirts',
        sortOrder: 11,
      },
      {
        slug: 'men-formal',
        name: 'Formal Shirts',
        description: 'Office and event formal shirts',
        sortOrder: 12,
      },
      {
        slug: 'men-new',
        name: 'New Arrivals',
        description: 'Latest men’s shirts',
        sortOrder: 13,
      },
    ],
  },
  {
    slug: 'women',
    name: 'Women',
    description: 'Shirts for women',
    sortOrder: 20,
    children: [
      {
        slug: 'women-casual',
        name: 'Casual Shirts',
        description: 'Everyday casual shirts',
        sortOrder: 21,
      },
      {
        slug: 'women-formal',
        name: 'Formal Shirts',
        description: 'Office and event formal shirts',
        sortOrder: 22,
      },
      {
        slug: 'women-new',
        name: 'New Arrivals',
        description: 'Latest women’s shirts',
        sortOrder: 23,
      },
    ],
  },
  {
    slug: 'new',
    name: 'New',
    description: 'Newly added across the catalog',
    sortOrder: 30,
    children: [],
  },
  {
    slug: 'sale',
    name: 'Sale',
    description: 'Discounted shirts',
    sortOrder: 40,
    children: [],
  },
];

interface VariantSeed {
  id: string;
  colorName: string;
  colorHex: string;
  stock: Record<string, number>;
}

interface ProductSeed {
  slug: string;
  sku: string;
  name: string;
  description: string;
  categorySlug: string;
  basePrice: number;
  salePrice?: number;
  isFeatured: boolean;
  variants: VariantSeed[];
}

const SAMPLE_PRODUCTS: ProductSeed[] = [
  {
    slug: 'oxford-classic-white',
    sku: 'KHT-M-001',
    name: 'Oxford Classic White',
    description:
      'A timeless Oxford shirt in crisp white cotton. A wardrobe staple for every occasion.',
    categorySlug: 'men-casual',
    basePrice: 38000,
    salePrice: 32000,
    isFeatured: true,
    variants: [
      {
        id: 'variant-001',
        colorName: 'White',
        colorHex: '#FFFFFF',
        stock: { S: 12, M: 18, L: 14, XL: 8 },
      },
      {
        id: 'variant-002',
        colorName: 'Sky Blue',
        colorHex: '#A7C7E7',
        stock: { S: 6, M: 10, L: 8, XL: 4 },
      },
    ],
  },
  {
    slug: 'linen-relaxed-beige',
    sku: 'KHT-M-002',
    name: 'Linen Relaxed Beige',
    description: 'Breathable relaxed-fit linen shirt in soft beige. Perfect for warm weather.',
    categorySlug: 'men-casual',
    basePrice: 45000,
    isFeatured: true,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Beige',
        colorHex: '#D2B48C',
        stock: { S: 8, M: 12, L: 10, XL: 6 },
      },
      {
        id: 'variant-002',
        colorName: 'Olive',
        colorHex: '#6B7C32',
        stock: { S: 4, M: 8, L: 6, XL: 3 },
      },
    ],
  },
  {
    slug: 'slim-formal-navy',
    sku: 'KHT-M-003',
    name: 'Slim Formal Navy',
    description:
      'Tailored slim-fit formal shirt in deep navy. Ideal for the office and formal events.',
    categorySlug: 'men-formal',
    basePrice: 42000,
    isFeatured: false,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Navy',
        colorHex: '#001F3F',
        stock: { S: 10, M: 16, L: 12, XL: 8 },
      },
    ],
  },
  {
    slug: 'poplin-classic-rose',
    sku: 'KHT-W-001',
    name: 'Poplin Classic Rose',
    description:
      'Soft poplin shirt in dusty rose. A flattering, versatile addition to any wardrobe.',
    categorySlug: 'women-casual',
    basePrice: 36000,
    salePrice: 30000,
    isFeatured: true,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Dusty Rose',
        colorHex: '#DCAE96',
        stock: { S: 8, M: 14, L: 12, XL: 6 },
      },
      {
        id: 'variant-002',
        colorName: 'White',
        colorHex: '#FFFFFF',
        stock: { S: 6, M: 10, L: 8, XL: 4 },
      },
    ],
  },
  {
    slug: 'silk-blouse-charcoal',
    sku: 'KHT-W-002',
    name: 'Silk Blouse Charcoal',
    description: 'Elegant silk-blend blouse in charcoal. A refined choice for evening occasions.',
    categorySlug: 'women-formal',
    basePrice: 58000,
    isFeatured: true,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Charcoal',
        colorHex: '#36454F',
        stock: { S: 4, M: 8, L: 6, XL: 2 },
      },
      {
        id: 'variant-002',
        colorName: 'Burgundy',
        colorHex: '#722F37',
        stock: { S: 3, M: 6, L: 5, XL: 2 },
      },
    ],
  },
  {
    slug: 'camp-collar-sage',
    sku: 'KHT-M-004',
    name: 'Camp Collar Sage',
    description: 'Relaxed camp-collar shirt in sage green. The perfect weekend piece.',
    categorySlug: 'men-casual',
    basePrice: 39000,
    isFeatured: false,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Sage',
        colorHex: '#9CAF88',
        stock: { S: 6, M: 10, L: 8, XL: 4 },
      },
    ],
  },
  {
    slug: 'pleated-blush',
    sku: 'KHT-W-003',
    name: 'Pleated Blush',
    description: 'Soft pleated shirt in blush pink. Light, airy, and effortlessly polished.',
    categorySlug: 'women-casual',
    basePrice: 41000,
    isFeatured: false,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Blush',
        colorHex: '#DE6FA1',
        stock: { S: 5, M: 9, L: 7, XL: 3 },
      },
    ],
  },
  {
    slug: 'oversized-stripe',
    sku: 'KHT-M-005',
    name: 'Oversized Stripe',
    description: 'Oversized shirt with classic stripes in blue and white. A modern essential.',
    categorySlug: 'men-casual',
    basePrice: 40000,
    salePrice: 34000,
    isFeatured: true,
    variants: [
      {
        id: 'variant-001',
        colorName: 'Blue Stripe',
        colorHex: '#3B5BA5',
        stock: { S: 7, M: 12, L: 10, XL: 5 },
      },
      {
        id: 'variant-002',
        colorName: 'Black Stripe',
        colorHex: '#1A1A1A',
        stock: { S: 4, M: 8, L: 6, XL: 3 },
      },
    ],
  },
];

interface SeedAdminResult {
  created: boolean;
  reason?: string;
  userId?: Id<'users'>;
  betterAuthUserId?: string;
}

interface SeedCtx {
  runQuery: <Q extends import('convex/server').FunctionReference<'query', 'internal'>>(
    query: Q,
    args: Q['_args']
  ) => Promise<unknown>;
  runMutation: <M extends import('convex/server').FunctionReference<'mutation', 'internal'>>(
    mutation: M,
    args: M['_args']
  ) => Promise<unknown>;
}

/**
 * Create (or upsert) the seed admin/super-admin. Better Auth runs inside the
 * Convex action via `createAuth(ctx)`; the user is signed up via
 * `auth.api.signUpEmail` and then mirrored into our `users` table so cart /
 * wishlist / orders have a stable foreign key.
 */
async function seedAdminUser(
  ctx: SeedCtx,
  args: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'super-admin';
  }
): Promise<SeedAdminResult> {
  const auth = createAuth(ctx as unknown as Parameters<typeof createAuth>[0]);

  const existing = (await ctx.runQuery(internal.seedInternal.findUserByEmail, {
    email: args.email,
  })) as { _id: Id<'users'>; betterAuthUserId: string } | null;

  if (existing) {
    await ctx.runMutation(internal.seedInternal.updateUserRole, {
      userId: existing._id,
      role: args.role,
    });
    return {
      created: false,
      userId: existing._id,
      betterAuthUserId: existing.betterAuthUserId,
    };
  }

  let result: { user?: { id: string; email: string; name: string } };
  try {
    result = (await auth.api.signUpEmail({
      body: {
        email: args.email,
        password: args.password,
        name: args.name,
      },
    })) as typeof result;
  } catch (err) {
    return {
      created: false,
      reason: `Better Auth signUpEmail failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!result.user?.id) {
    return { created: false, reason: 'Better Auth signUpEmail did not return a user id' };
  }

  const userId = (await ctx.runMutation(internal.users.upsertFromBetterAuth, {
    betterAuthUserId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: args.role,
    isActive: true,
  })) as Id<'users'>;

  return {
    created: true,
    userId,
    betterAuthUserId: result.user.id,
  };
}

export const run = action({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (process.env.CONVEX_DEPLOY_TYPE === 'production' && !args.force) {
      throw new ConvexError('Refusing to seed a production deployment without force=true');
    }

    const summary: {
      categories: { created: number; skipped: number };
      products: { created: number; skipped: number };
      storeSettings: { created: boolean };
      admin: SeedAdminResult;
      superAdmin: SeedAdminResult;
    } = {
      categories: { created: 0, skipped: 0 },
      products: { created: 0, skipped: 0 },
      storeSettings: { created: false },
      admin: { created: false },
      superAdmin: { created: false },
    };

    const existingCategories = (await ctx.runQuery(
      internal.seedInternal.listCategories,
      {}
    )) as unknown[];
    if (existingCategories.length === 0) {
      const now = Date.now();
      for (const cat of DEFAULT_CATEGORIES) {
        const id = (await ctx.runMutation(internal.seedInternal.insertCategory, {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })) as Id<'categories'>;
        summary.categories.created++;
        for (const child of cat.children) {
          await ctx.runMutation(internal.seedInternal.insertCategory, {
            name: child.name,
            slug: child.slug,
            description: child.description,
            sortOrder: child.sortOrder,
            isActive: true,
            parentId: id,
            createdAt: now,
            updatedAt: now,
          });
          summary.categories.created++;
        }
      }
    } else {
      summary.categories.skipped = existingCategories.length;
    }

    const existingProducts = (await ctx.runQuery(
      internal.seedInternal.listProducts,
      {}
    )) as unknown[];
    if (existingProducts.length === 0) {
      const allCategories = (await ctx.runQuery(
        internal.seedInternal.listCategories,
        {}
      )) as Array<{ _id: Id<'categories'>; slug: string }>;
      const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
      const now = Date.now();
      for (const product of SAMPLE_PRODUCTS) {
        const category = bySlug.get(product.categorySlug);
        if (!category) {
          throw new ConvexError(`Category not found: ${product.categorySlug}`);
        }
        await ctx.runMutation(internal.seedInternal.insertProduct, {
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: category._id,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          isFeatured: product.isFeatured,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
          colorVariants: product.variants.map((v) => ({
            id: v.id,
            colorName: v.colorName,
            colorHex: v.colorHex,
            images: [],
            selectedSizes: [...SHIRT_SIZES],
            stock: v.stock,
          })),
        });
        summary.products.created++;
      }
    } else {
      summary.products.skipped = existingProducts.length;
    }

    const existingSettings = (await ctx.runQuery(
      internal.seedInternal.getStoreSettings,
      {}
    )) as unknown;
    if (!existingSettings) {
      await ctx.runMutation(internal.seedInternal.insertStoreSettings, {
        heroTitle: 'New season. New shirts.',
        heroSubtitle: 'Crafted in Myanmar. Worn everywhere.',
        heroCtaLabel: 'Shop new arrivals',
        heroCtaLink: '/new',
        saleBannerEnabled: true,
        saleBannerText: 'End of season sale — up to 25% off select shirts.',
        saleBannerLink: '/sale',
        announcementBar: 'Free shipping on orders over Ks 100,000',
        contactEmail: 'hello@khit.example',
        contactPhone: '+95 9 000 000 000',
        socialInstagram: 'https://instagram.com/khit',
        socialFacebook: 'https://facebook.com/khit',
        socialTiktok: 'https://tiktok.com/@khit',
        pickupStoreName: 'Khit Yangon Flagship',
        pickupStoreAddress: 'No. 12, Shwedagon Pagoda Road, Yangon',
        pickupStoreHours: 'Mon–Sun, 10:00–20:00',
        updatedAt: Date.now(),
      });
      summary.storeSettings.created = true;
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      summary.admin = {
        created: false,
        reason: 'SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set',
      };
    } else {
      summary.admin = await seedAdminUser(ctx, {
        email,
        password,
        name: 'Khit Admin',
        role: 'admin',
      });
    }

    const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
    if (!superAdminEmail || !superAdminPassword) {
      summary.superAdmin = {
        created: false,
        reason: 'SEED_SUPER_ADMIN_EMAIL or SEED_SUPER_ADMIN_PASSWORD not set',
      };
    } else {
      summary.superAdmin = await seedAdminUser(ctx, {
        email: superAdminEmail,
        password: superAdminPassword,
        name: 'Khit Super Admin',
        role: 'super-admin',
      });
    }

    return summary;
  },
});

/**
 * Reset the admin password. Best-effort: if a user already exists for the
 * seeded email, the call is a no-op (the password is whatever was last set
 * in BA). If the BA user is missing, we recreate it. We intentionally do not
 * call `changePassword` here because Convex actions can't carry the BA
 * session cookie across calls without extra plumbing.
 */
export const resetAdminPassword = action({
  args: {},
  handler: async (ctx) => {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new ConvexError('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set');
    }

    const existing = (await ctx.runQuery(internal.seedInternal.findUserByEmail, {
      email,
    })) as {
      _id: Id<'users'>;
      betterAuthUserId: string;
      role: 'customer' | 'admin' | 'super-admin';
    } | null;

    if (!existing) {
      throw new ConvexError(
        `No users row for ${email}. Run the full seed first to create the Better Auth user.`
      );
    }

    const auth = createAuth(ctx as unknown as Parameters<typeof createAuth>[0]);

    let signInOk = false;
    try {
      await auth.api.signInEmail({ body: { email, password } });
      signInOk = true;
    } catch {
      signInOk = false;
    }

    if (signInOk) {
      return {
        userId: existing._id,
        email,
        passwordReset: false,
        alreadyMatched: true,
        orphansDeleted: [] as Id<'users'>[],
      };
    }

    return {
      userId: existing._id,
      email,
      passwordReset: false,
      alreadyMatched: false,
      message:
        'Existing BA user has a different password. To rotate it, sign in via the app and use the forgot-password flow, or clear the BA user record manually.',
      orphansDeleted: [] as Id<'users'>[],
    };
  },
});
