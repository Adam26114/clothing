'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { SectionCards, type SectionCard } from '@workspace/ui/components/section-cards';
import { t } from '@workspace/lib/i18n';

function trendLabel(pct: number): string {
  return pct >= 0 ? t('admin.dashboard.trendUp') : t('admin.dashboard.trendDown');
}

export function ProductsStats() {
  const stats = useQuery(api.products.productStats, {});

  if (stats === undefined) {
    return null;
  }

  const cards: ReadonlyArray<SectionCard> = [
    {
      title: t('admin.products.stats.totalProducts'),
      value: stats.totalProducts.toLocaleString('en-US'),
      footerPrimary: t('admin.products.stats.activeSummary', 'en', {
        active: stats.activeProducts,
        inactive: stats.inactiveProducts,
      }),
      footerSecondary: t('admin.products.stats.featuredSummary', 'en', {
        count: stats.featuredProducts,
      }),
    },
    {
      title: t('admin.products.stats.activeProducts'),
      value: stats.activeProducts.toLocaleString('en-US'),
      trendPct: stats.activeProductsTrendPct,
      footerPrimary: trendLabel(stats.activeProductsTrendPct),
      footerSecondary: t('admin.products.stats.sinceLastMonth'),
    },
    {
      title: t('admin.products.stats.totalSold'),
      value: stats.totalSoldThisMonth.toLocaleString('en-US'),
      trendPct: stats.totalSoldTrendPct,
      footerPrimary: trendLabel(stats.totalSoldTrendPct),
      footerSecondary: t('admin.products.stats.sinceLastMonth'),
    },
    {
      title: t('admin.products.stats.lowStock'),
      value: stats.lowStockVariants.toLocaleString('en-US'),
      footerPrimary: t('admin.products.stats.lowStockSummary', 'en', { threshold: 5 }),
      footerSecondary: t('admin.products.stats.sinceLastMonth'),
    },
  ];

  return <SectionCards cards={cards} />;
}
