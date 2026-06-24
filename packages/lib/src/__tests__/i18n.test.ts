import { describe, expect, test } from 'bun:test';
import { t } from '../i18n';

describe('t() — simple placeholders', () => {
  test('substitutes a single placeholder', () => {
    expect(t('pdp.lowStock', 'en', { count: 3 })).toBe('Only 3 left');
  });

  test('substitutes multiple placeholders', () => {
    expect(t('plp.count', 'en', { count: 5, total: 20 })).toBe('Showing 5 of 20 pieces');
  });

  test('keeps the placeholder when the param is missing', () => {
    expect(t('plp.count', 'en', { count: 5 })).toBe('Showing 5 of {total} pieces');
  });

  test('returns the template with placeholders intact when params are undefined', () => {
    expect(t('pdp.lowStock')).toBe('Only {count} left');
  });

  test('returns the key when the key is unknown', () => {
    expect(t('definitely.not.a.key')).toBe('definitely.not.a.key');
  });
});

describe('t() — ICU plural (real keys)', () => {
  test('order.itemsCount renders "one" for count = 1', () => {
    expect(t('order.itemsCount', 'en', { count: 1 })).toBe('1 item');
  });

  test('order.itemsCount renders "other" for count = 0', () => {
    expect(t('order.itemsCount', 'en', { count: 0 })).toBe('0 items');
  });

  test('order.itemsCount renders "other" for count = 5', () => {
    expect(t('order.itemsCount', 'en', { count: 5 })).toBe('5 items');
  });

  test('admin.users.detail.itemsCount renders "one" for count = 1', () => {
    expect(t('admin.users.detail.itemsCount', 'en', { count: 1 })).toBe('1 order');
  });

  test('admin.users.detail.itemsCount renders "other" for count = 7', () => {
    expect(t('admin.users.detail.itemsCount', 'en', { count: 7 })).toBe('7 orders');
  });
});

describe('t() — ICU plural with embedded placeholders', () => {
  test('admin.dashboard.lowStockItem expands sibling placeholders', () => {
    expect(
      t('admin.dashboard.lowStockItem', 'en', {
        product: 'Oxford Classic',
        color: 'White',
        size: 'M',
      })
    ).toBe('Oxford Classic (White / M)');
  });
});
