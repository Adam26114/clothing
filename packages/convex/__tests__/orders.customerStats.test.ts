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

function freshT() {
  return convexTest(schema, modules);
}

async function seedAdmin(t: ReturnType<typeof convexTest>, baId: string): Promise<Id<'users'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      betterAuthUserId: baId,
      name: 'Test Admin',
      email: 'admin@convex-test.local',
      role: 'admin',
      isActive: true,
      createdAt: Date.now(),
    });
  });
}

async function seedCustomer(t: ReturnType<typeof convexTest>, baId: string): Promise<Id<'users'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      betterAuthUserId: baId,
      name: 'Test Customer',
      email: 'customer@convex-test.local',
      role: 'customer',
      isActive: true,
      createdAt: Date.now(),
    });
  });
}

async function seedOrder(
  t: ReturnType<typeof convexTest>,
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

function asUser(
  t: ReturnType<typeof convexTest>,
  userId: Id<'users'>,
  role: 'admin' | 'customer' = 'admin'
) {
  return t.withIdentity({ subject: role === 'admin' ? 'test-ba-admin' : 'test-ba-customer' });
}

describe('orders.customerStats', () => {
  test('returns zero counts for a customer with no orders', async () => {
    const t = freshT();
    const adminBaId = `test-ba-admin-${Math.random().toString(36).slice(2, 10)}`;
    const customerBaId = `test-ba-customer-${Math.random().toString(36).slice(2, 10)}`;
    const adminId = await seedAdmin(t, adminBaId);
    const customerId = await seedCustomer(t, customerBaId);

    const stats = await t
      .withIdentity({ subject: adminBaId })
      .query(api.orders.customerStats, { customerId });

    expect(stats).toEqual({ totalOrders: 0, totalSpent: 0, ltvMonths: 0 });
  });

  test('counts non-cancelled orders and excludes cancelled ones from totalSpent', async () => {
    const t = freshT();
    const adminBaId = `test-ba-admin-${Math.random().toString(36).slice(2, 10)}`;
    const customerBaId = `test-ba-customer-${Math.random().toString(36).slice(2, 10)}`;
    const adminId = await seedAdmin(t, adminBaId);
    const customerId = await seedCustomer(t, customerBaId);

    await seedOrder(t, customerId, { status: 'delivered', total: 40_000 });
    await seedOrder(t, customerId, { status: 'shipped', total: 60_000 });
    await seedOrder(t, customerId, { status: 'cancelled', total: 99_999 });

    const stats = await t
      .withIdentity({ subject: adminBaId })
      .query(api.orders.customerStats, { customerId });

    expect(stats.totalOrders).toBe(3);
    expect(stats.totalSpent).toBe(100_000);
  });

  test('rejects callers without an admin role', async () => {
    const t = freshT();
    const customerBaId = `test-ba-customer-${Math.random().toString(36).slice(2, 10)}`;
    const customerId = await seedCustomer(t, customerBaId);

    await expect(
      t.withIdentity({ subject: customerBaId }).query(api.orders.customerStats, { customerId })
    ).rejects.toThrow(/admin role required/);
  });
});
