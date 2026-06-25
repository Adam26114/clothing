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

async function setup() {
  const t = convexTest(schema, modules);
  const adminId = await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      name: 'Test Admin',
      email: 'admin@convex-test.local',
      role: 'admin',
      isActive: true,
      createdAt: Date.now(),
    });
  });
  return { t, adminId };
}

async function seedOrder(
  t: ReturnType<typeof convexTest>,
  overrides: Partial<{
    createdAt: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  }> = {}
): Promise<Id<'orders'>> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('orders', {
      orderNumber: `ORD-TEST-${Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0')}`,
      customerId: undefined,
      customerInfo: {
        name: 'Test Customer',
        email: 'customer@convex-test.local',
        phone: '+95 9 000 000 000',
        address: 'No. 1, Test Road, Yangon',
      },
      items: [],
      subtotal: 50_000,
      shippingFee: 0,
      total: 50_000,
      deliveryMethod: 'pickup',
      paymentMethod: 'cod',
      status: overrides.status ?? 'pending',
      createdAt: overrides.createdAt ?? Date.now(),
      updatedAt: overrides.createdAt ?? Date.now(),
    });
  });
}

function asUser(t: ReturnType<typeof convexTest>, userId: Id<'users'>) {
  return t.withIdentity({ subject: `${userId}|test-session` });
}

describe('orders.adminList date range filter', () => {
  test('returns all orders when no date bounds are supplied', async () => {
    const { t, adminId } = await setup();
    await seedOrder(t, { createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() });

    const result = await asUser(t, adminId).query(api.orders.adminList, { pageSize: 100 });

    expect(result.total).toBe(3);
  });

  test('excludes orders older than dateFrom', async () => {
    const { t, adminId } = await setup();
    await seedOrder(t, { createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() });

    const dateFrom = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const result = await asUser(t, adminId).query(api.orders.adminList, {
      dateFrom,
      pageSize: 100,
    });

    expect(result.total).toBe(2);
  });

  test('excludes orders newer than dateTo', async () => {
    const { t, adminId } = await setup();
    await seedOrder(t, { createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 });
    await seedOrder(t, { createdAt: Date.now() });

    const dateTo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const result = await asUser(t, adminId).query(api.orders.adminList, {
      dateTo,
      pageSize: 100,
    });

    expect(result.total).toBe(1);
  });
});
