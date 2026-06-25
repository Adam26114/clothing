import { describe, expect, test } from 'bun:test';
import { convexTest } from 'convex-test';
import { Glob } from 'bun';
import type { Id } from '../_generated/dataModel';
import schema from '../schema';
import { api } from '../_generated/api';

const glob = new Glob('../**/*.ts');
const modulePaths = Array.from(glob.scanSync({ cwd: import.meta.dir }));
const modules: Record<string, () => Promise<unknown>> = {};
for (const relativePath of modulePaths) {
  const absolutePath = `${import.meta.dir}/${relativePath}`;
  modules[relativePath] = () => import(absolutePath);
}

const t = convexTest(schema, modules);

async function seedAdmin(): Promise<Id<'users'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      name: 'Test Admin',
      email: 'admin@convex-test.local',
      role: 'admin',
      isActive: true,
      createdAt: Date.now(),
    });
  });
}

async function seedCustomer(): Promise<Id<'users'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      name: 'Test Customer',
      email: 'customer@convex-test.local',
      role: 'customer',
      isActive: true,
      createdAt: Date.now(),
    });
  });
}

async function seedOrder(
  customerId: Id<'users'>,
  overrides: Partial<{
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    shippingFee: number;
    total: number;
    createdAt: number;
  }> = {}
): Promise<Id<'orders'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('orders', {
      orderNumber: `ORD-TEST-${Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0')}`,
      customerId,
      customerInfo: {
        name: 'Test Customer',
        email: 'customer@convex-test.local',
        phone: '+95 9 000 000 000',
        address: 'No. 1, Test Road, Yangon',
      },
      items: [],
      subtotal: overrides.subtotal ?? 50_000,
      shippingFee: overrides.shippingFee ?? 0,
      total: overrides.total ?? 50_000,
      deliveryMethod: 'pickup',
      paymentMethod: 'cod',
      status: overrides.status ?? 'pending',
      createdAt: overrides.createdAt ?? Date.now(),
      updatedAt: overrides.createdAt ?? Date.now(),
    });
  });
}

function asUser(userId: Id<'users'>) {
  return t.withIdentity({ subject: `${userId}|test-session` });
}

describe('orders.customerStats', () => {
  test('returns zero counts for a customer with no orders', async () => {
    const adminId = await seedAdmin();
    const customerId = await seedCustomer();

    const stats = await asUser(adminId).query(api.orders.customerStats, { customerId });

    expect(stats).toEqual({ totalOrders: 0, totalSpent: 0, ltvMonths: 0 });
  });

  test('counts non-cancelled orders and excludes cancelled ones from totalSpent', async () => {
    const adminId = await seedAdmin();
    const customerId = await seedCustomer();

    await seedOrder(customerId, { status: 'delivered', total: 40_000 });
    await seedOrder(customerId, { status: 'shipped', total: 60_000 });
    await seedOrder(customerId, { status: 'cancelled', total: 99_999 });

    const stats = await asUser(adminId).query(api.orders.customerStats, { customerId });

    expect(stats.totalOrders).toBe(3);
    expect(stats.totalSpent).toBe(100_000);
  });

  test('rejects callers without an admin role', async () => {
    const customerId = await seedCustomer();

    const asSelf = asUser(customerId);
    await expect(asSelf.query(api.orders.customerStats, { customerId })).rejects.toThrow(
      /admin role required/
    );
  });
});
