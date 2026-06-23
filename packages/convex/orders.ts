import { ConvexError, v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Auth } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { DEFAULT_PAGE_SIZE, SHIPPING_FEE, STORE_PICKUP_FEE } from '@workspace/lib/constants';
import { isAdminRole } from '@workspace/lib/auth';

interface OrderItemInput {
  productId: Id<'products'>;
  colorVariantId: string;
  size: string;
  quantity: number;
}

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

async function nextOrderNumber(ctx: {
  db: {
    query: (table: 'orders') => {
      withIndex: (index: 'by_orderNumber') => {
        collect: () => Promise<Doc<'orders'>[]>;
      };
    };
  };
}): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const ordersThisYear = await ctx.db.query('orders').withIndex('by_orderNumber').collect();
  const matching = ordersThisYear.filter((o: Doc<'orders'>) => o.orderNumber.startsWith(prefix));
  const maxSeq = matching.reduce((max: number, o: Doc<'orders'>) => {
    const tail = o.orderNumber.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  const next = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${next}`;
}

interface ValidatedItem {
  product: Doc<'products'>;
  variant: Doc<'products'>['colorVariants'][number];
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function validateItems(
  products: Map<Id<'products'>, Doc<'products'> | null>,
  items: OrderItemInput[]
): { validated: ValidatedItem[]; missing: string[]; oos: string[] } {
  const validated: ValidatedItem[] = [];
  const missing: string[] = [];
  const oos: string[] = [];

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      missing.push(`product:${item.productId}`);
      continue;
    }
    if (!product.isPublished) {
      missing.push(`product:${product._id}`);
      continue;
    }
    const variant = product.colorVariants.find((v) => v.id === item.colorVariantId);
    if (!variant) {
      missing.push(`variant:${item.colorVariantId}`);
      continue;
    }
    if (!variant.selectedSizes.includes(item.size)) {
      oos.push(`${product.name} - size ${item.size} unavailable`);
      continue;
    }
    const available = variant.stock[item.size] ?? 0;
    if (available < item.quantity) {
      oos.push(`${product.name} (${variant.colorName} / ${item.size}): only ${available} in stock`);
      continue;
    }
    const unitPrice = product.salePrice ?? product.basePrice ?? 0;
    validated.push({
      product,
      variant,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    });
  }

  return { validated, missing, oos };
}

function decrementStock(
  product: Doc<'products'>,
  variantId: string,
  size: string,
  qty: number
): Doc<'products'> {
  const colorVariants = product.colorVariants.map((variant) => {
    if (variant.id !== variantId) {
      return variant;
    }
    const current = variant.stock[size] ?? 0;
    const next = Math.max(0, current - qty);
    return {
      ...variant,
      stock: { ...variant.stock, [size]: next },
    };
  });
  return { ...product, colorVariants };
}

function incrementStock(
  product: Doc<'products'>,
  variantId: string,
  size: string,
  qty: number
): Doc<'products'> {
  const colorVariants = product.colorVariants.map((variant) => {
    if (variant.id !== variantId) {
      return variant;
    }
    const current = variant.stock[size] ?? 0;
    return {
      ...variant,
      stock: { ...variant.stock, [size]: current + qty },
    };
  });
  return { ...product, colorVariants };
}

export function setStockForVariant(
  product: Doc<'products'>,
  variantId: string,
  size: string,
  qty: number
): Doc<'products'> {
  const colorVariants = product.colorVariants.map((variant) => {
    if (variant.id !== variantId) {
      return variant;
    }
    return {
      ...variant,
      stock: { ...variant.stock, [size]: qty },
    };
  });
  return { ...product, colorVariants };
}

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('confirmed'),
        v.literal('processing'),
        v.literal('shipped'),
        v.literal('delivered'),
        v.literal('cancelled')
      )
    ),
    customerId: v.optional(v.id('users')),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError('Not authenticated');
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    const isAdmin = isAdminRole(user.role);
    const filterCustomerId = isAdmin ? args.customerId : userId;

    const all = await ctx.db.query('orders').collect();
    const search = args.search?.toLowerCase().trim();

    const filtered = all.filter((order) => {
      if (filterCustomerId !== undefined && order.customerId !== filterCustomerId) {
        return false;
      }
      if (args.status && order.status !== args.status) {
        return false;
      }
      if (search) {
        const haystack =
          `${order.orderNumber} ${order.customerInfo.name} ${order.customerInfo.email} ${order.customerInfo.phone}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt - a.createdAt);
    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = Math.max(0, args.page ?? 0);
    const total = filtered.length;
    const start = page * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  },
});

export const getById = query({
  args: { id: v.id('orders') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError('Not authenticated');
    }
    const order = await ctx.db.get(args.id);
    if (!order) {
      return null;
    }
    const user = await ctx.db.get(userId);
    const isAdmin = user ? isAdminRole(user.role) : false;
    if (!isAdmin && order.customerId !== userId) {
      throw new ConvexError('Forbidden');
    }
    return order;
  },
});

export const create = mutation({
  args: {
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.string(),
    }),
    items: v.array(
      v.object({
        productId: v.id('products'),
        colorVariantId: v.string(),
        size: v.string(),
        quantity: v.number(),
      })
    ),
    deliveryMethod: v.union(v.literal('shipping'), v.literal('pickup')),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      throw new ConvexError('Order must contain at least one item');
    }
    const userId = await getAuthUserId(ctx);

    const productIds = [...new Set(args.items.map((i) => i.productId))];
    const productResults = await Promise.all(productIds.map((id) => ctx.db.get(id)));
    const productMap = new Map<Id<'products'>, Doc<'products'> | null>();
    for (const product of productResults) {
      if (product) {
        productMap.set(product._id, product);
      } else {
        productMap.set(productIds[productResults.indexOf(product)] as Id<'products'>, null);
      }
    }

    const { validated, missing, oos } = validateItems(productMap, args.items);
    if (missing.length > 0) {
      throw new ConvexError(`Items not available: ${missing.join(', ')}`);
    }
    if (oos.length > 0) {
      throw new ConvexError(`Out of stock: ${oos.join('; ')}`);
    }
    if (validated.length !== args.items.length) {
      throw new ConvexError('Some items could not be validated');
    }

    const now = Date.now();
    for (const item of validated) {
      const decremented = decrementStock(
        productMap.get(item.product._id)!,
        item.variant.id,
        item.size,
        item.quantity
      );
      await ctx.db.patch(item.product._id, {
        colorVariants: decremented.colorVariants,
        updatedAt: now,
      });
    }

    const subtotal = validated.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = args.deliveryMethod === 'shipping' ? SHIPPING_FEE : STORE_PICKUP_FEE;
    const total = subtotal + shippingFee;
    const orderNumber = await nextOrderNumber(ctx);

    const orderItems = validated.map((item) => ({
      productId: item.product._id,
      colorVariantId: item.variant.id,
      name: item.product.name,
      size: item.size,
      color: item.variant.colorName,
      colorHex: item.variant.colorHex,
      quantity: item.quantity,
      price: item.unitPrice,
    }));

    const orderId = await ctx.db.insert('orders', {
      orderNumber,
      customerId: userId ?? undefined,
      customerInfo: args.customerInfo,
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      deliveryMethod: args.deliveryMethod,
      paymentMethod: 'cod' as const,
      status: 'pending' as const,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    if (userId) {
      const cartItems = await ctx.db
        .query('cartItems')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();
      for (const ci of cartItems) {
        const matching = args.items.find(
          (i) =>
            i.productId === ci.productId &&
            i.colorVariantId === ci.colorVariantId &&
            i.size === ci.size
        );
        if (matching) {
          await ctx.db.delete(ci._id);
        }
      }
    }

    return { orderId, orderNumber };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('orders'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('processing'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled')
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new ConvexError('Order not found');
    }
    if (order.status === 'cancelled' && args.status !== 'cancelled') {
      throw new ConvexError('Cannot resume a cancelled order');
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const cancel = mutation({
  args: { id: v.id('orders') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError('Not authenticated');
    }
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new ConvexError('Order not found');
    }
    const user = await ctx.db.get(userId);
    const isAdmin = user ? isAdminRole(user.role) : false;
    if (!isAdmin && order.customerId !== userId) {
      throw new ConvexError('Forbidden');
    }
    if (order.status === 'cancelled') {
      return args.id;
    }
    if (!isAdmin && order.status !== 'pending') {
      throw new ConvexError('Only pending orders can be cancelled by the customer');
    }

    const now = Date.now();
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        continue;
      }
      const restored = incrementStock(product, item.colorVariantId, item.size, item.quantity);
      await ctx.db.patch(item.productId, {
        colorVariants: restored.colorVariants,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.id, {
      status: 'cancelled' as const,
      updatedAt: now,
    });
    return args.id;
  },
});

export const restore = mutation({
  args: { id: v.id('orders') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new ConvexError('Order not found');
    }
    if (order.status !== 'cancelled') {
      throw new ConvexError('Only cancelled orders can be restored');
    }

    const now = Date.now();
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        continue;
      }
      const variant = product.colorVariants.find((v) => v.id === item.colorVariantId);
      if (!variant) {
        throw new ConvexError(`Variant ${item.colorVariantId} not found for ${item.name}`);
      }
      const available = variant.stock[item.size] ?? 0;
      if (available < item.quantity) {
        throw new ConvexError(
          `Insufficient stock to restore ${item.name} (${variant.colorName} / ${item.size}): only ${available} available`
        );
      }
      const decremented = decrementStock(product, item.colorVariantId, item.size, item.quantity);
      await ctx.db.patch(item.productId, {
        colorVariants: decremented.colorVariants,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.id, {
      status: 'pending' as const,
      updatedAt: now,
    });
    return args.id;
  },
});

export const adminList = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('confirmed'),
        v.literal('processing'),
        v.literal('shipped'),
        v.literal('delivered'),
        v.literal('cancelled')
      )
    ),
    customerId: v.optional(v.id('users')),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query('orders').collect();
    const search = args.search?.toLowerCase().trim();

    const filtered = all.filter((order) => {
      if (args.customerId !== undefined && order.customerId !== args.customerId) {
        return false;
      }
      if (args.status && order.status !== args.status) {
        return false;
      }
      if (search) {
        const haystack =
          `${order.orderNumber} ${order.customerInfo.name} ${order.customerInfo.email} ${order.customerInfo.phone}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt - a.createdAt);
    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = Math.max(0, args.page ?? 0);
    const total = filtered.length;
    const start = page * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  },
});

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(d: Date = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = new Date();
    const todayStart = startOfToday();
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(addMonths(now, -1));

    const allOrders = await ctx.db.query('orders').collect();
    const allUsers = await ctx.db.query('users').collect();
    const allProducts = await ctx.db.query('products').collect();

    const ordersToday = allOrders.filter((o) => o.createdAt >= todayStart);
    const ordersTodayGmv = ordersToday.reduce((sum, o) => sum + o.total, 0);

    const pendingCount = allOrders.filter((o) => o.status === 'pending').length;

    const mtdOrders = allOrders.filter((o) => o.createdAt >= monthStart);
    const mtdRevenue = mtdOrders.reduce((sum, o) => sum + o.total, 0);

    const prevMonthOrders = allOrders.filter(
      (o) => o.createdAt >= prevMonthStart && o.createdAt < monthStart
    );
    const prevMonthRevenue = prevMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const mtdRevenueTrendPct =
      prevMonthRevenue === 0
        ? mtdRevenue > 0
          ? 100
          : 0
        : ((mtdRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

    const newCustomersThisMonth = allUsers.filter((u) => u.createdAt >= monthStart).length;
    const newCustomersPrevMonth = allUsers.filter(
      (u) => u.createdAt >= prevMonthStart && u.createdAt < monthStart
    ).length;
    const newCustomersTrendPct =
      newCustomersPrevMonth === 0
        ? newCustomersThisMonth > 0
          ? 100
          : 0
        : ((newCustomersThisMonth - newCustomersPrevMonth) / newCustomersPrevMonth) * 100;

    const sortedOrders = [...allOrders].sort((a, b) => b.createdAt - a.createdAt);
    const recentOrders = sortedOrders.slice(0, 10);

    const productCountActive = allProducts.filter((p) => p.isPublished).length;
    const productCountInactive = allProducts.length - productCountActive;

    const customerCount = allUsers.filter((u) => u.role === 'customer').length;
    const activeAccountCount = allUsers.filter((u) => u.isActive).length;

    return {
      ordersToday: ordersToday.length,
      ordersTodayGmv,
      pendingCount,
      mtdRevenue,
      mtdRevenueTrendPct,
      newCustomersThisMonth,
      newCustomersTrendPct,
      recentOrders,
      productCountActive,
      productCountInactive,
      customerCount,
      activeAccountCount,
    };
  },
});

export const customerStats = query({
  args: { customerId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_customer', (q) => q.eq('customerId', args.customerId))
      .collect();
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
  },
});
