'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

import {
  SectionCards as SectionCardsGrid,
  type SectionCard,
} from '@workspace/ui/components/section-cards';

function trendLabel(pct: number): string {
  return pct >= 0 ? t('admin.dashboard.trendUp') : t('admin.dashboard.trendDown');
}

export function SectionCards() {
  const stats = useQuery(api.orders.dashboardStats, {});

  if (stats === undefined || stats === null) {
    return null;
  }

  const cards: ReadonlyArray<SectionCard> = [
    {
      title: t('admin.dashboard.totalRevenue'),
      value: formatMMK(stats.mtdRevenue),
      trendPct: stats.mtdRevenueTrendPct,
      footerPrimary: trendLabel(stats.mtdRevenueTrendPct),
      footerSecondary: t('admin.dashboard.sinceLastMonth'),
    },
    {
      title: t('admin.dashboard.newCustomers'),
      value: stats.newCustomersThisMonth.toLocaleString('en-US'),
      trendPct: stats.newCustomersTrendPct,
      footerPrimary: trendLabel(stats.newCustomersTrendPct),
      footerSecondary: t('admin.dashboard.sinceLastMonth'),
    },
    {
      title: t('admin.dashboard.ordersToday'),
      value: stats.ordersToday.toLocaleString('en-US'),
      footerPrimary: t('admin.dashboard.ordersTodayGmv', 'en', {
        amount: formatMMK(stats.ordersTodayGmv),
      }),
      footerSecondary: t('admin.dashboard.sinceLastMonth'),
    },
    {
      title: t('admin.dashboard.activeProducts'),
      value: stats.productCountActive.toLocaleString('en-US'),
      footerPrimary: t('admin.dashboard.productCountSummary', 'en', {
        active: stats.productCountActive,
        inactive: stats.productCountInactive,
      }),
      footerSecondary: t('admin.dashboard.sinceLastMonth'),
    },
  ];

  return <SectionCardsGrid cards={cards} />;
}
