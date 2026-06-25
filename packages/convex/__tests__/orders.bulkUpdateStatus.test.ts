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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' = 'pending'
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
      status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

function asUser(t: ReturnType<typeof convexTest>, userId: Id<'users'>) {
  return t.withIdentity({ subject: `${userId}|test-session` });
}

describe('orders.bulkUpdateStatus', () => {
  test('updates all selected orders', async () => {
    const { t, adminId } = await setup();
    const a = await seedOrder(t, 'pending');
    const b = await seedOrder(t, 'pending');
    const c = await seedOrder(t, 'pending');

    const result = await asUser(t, adminId).mutation(api.orders.bulkUpdateStatus, {
      ids: [a, b, c],
      status: 'confirmed',
    });

    expect(result).toEqual({ updated: 3, skipped: 0 });

    const updated = await t.run(async (ctx) => {
      const [oa, ob, oc] = await Promise.all([ctx.db.get(a), ctx.db.get(b), ctx.db.get(c)]);
      return [oa?.status, ob?.status, oc?.status];
    });
    expect(updated).toEqual(['confirmed', 'confirmed', 'confirmed']);
  });

  test('skips orders that are already at the target status', async () => {
    const { t, adminId } = await setup();
    const alreadyConfirmed = await seedOrder(t, 'confirmed');
    const pending = await seedOrder(t, 'pending');

    const result = await asUser(t, adminId).mutation(api.orders.bulkUpdateStatus, {
      ids: [alreadyConfirmed, pending],
      status: 'confirmed',
    });

    expect(result).toEqual({ updated: 1, skipped: 1 });
  });

  test('skips cancelled orders when the target is not cancelled', async () => {
    const { t, adminId } = await setup();
    const cancelled = await seedOrder(t, 'cancelled');
    const pending = await seedOrder(t, 'pending');

    const result = await asUser(t, adminId).mutation(api.orders.bulkUpdateStatus, {
      ids: [cancelled, pending],
      status: 'shipped',
    });

    expect(result).toEqual({ updated: 1, skipped: 1 });
  });

  test('returns zeros for an empty id list', async () => {
    const { t, adminId } = await setup();

    const result = await asUser(t, adminId).mutation(api.orders.bulkUpdateStatus, {
      ids: [],
      status: 'shipped',
    });

    expect(result).toEqual({ updated: 0, skipped: 0 });
  });

  test('rejects callers without an admin role', async () => {
    const { t } = await setup();
    const customerId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        name: 'Test Customer',
        email: 'customer@convex-test.local',
        role: 'customer',
        isActive: true,
        createdAt: Date.now(),
      });
    });
    const orderId = await seedOrder(t, 'pending');

    await expect(
      asUser(t, customerId).mutation(api.orders.bulkUpdateStatus, {
        ids: [orderId],
        status: 'shipped',
      })
    ).rejects.toThrow(/admin role required/);
  });
});
