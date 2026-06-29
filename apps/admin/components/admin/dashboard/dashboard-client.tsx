'use client';

import * as React from 'react';
import { useAction, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboardIcon, LineChartIcon, PackageIcon, ShoppingBagIcon } from 'lucide-react';
import { api } from '@workspace/convex/_generated/api';
import type { SentryStats } from '@workspace/convex/sentry';
import { Sentry } from '@workspace/lib/sentry';
import { t } from '@workspace/lib/i18n';

import { Card } from '@workspace/ui/components/card';
import { ChartAreaInteractive } from '@workspace/ui/components/chart-area-interactive';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';

import { OrdersTableClient } from '@/app/(routes)/orders/orders-table-client';
import { InventoryTableClient } from '@/app/(routes)/inventory/inventory-table-client';

import { DashboardSkeleton } from './dashboard-skeleton';
import { LowStockTable } from './low-stock-table';
import { RecentOrdersTable } from './recent-orders-table';
import { SectionCards } from './section-cards';
import { WidgetSentryErrors } from './widget-sentry-errors';

const TAB_VALUES = ['overview', 'visitors', 'orders', 'inventory'] as const;
type TabValue = (typeof TAB_VALUES)[number];

const DEFAULT_TAB: TabValue = 'overview';

function isTabValue(value: string | null | undefined): value is TabValue {
  return typeof value === 'string' && (TAB_VALUES as ReadonlyArray<string>).includes(value);
}

export function DashboardClient() {
  const stats = useQuery(api.orders.dashboardStats, {});

  const fetchSentryStats = useAction(api.sentry.sentryStats);
  const [sentryStats, setSentryStats] = React.useState<SentryStats | undefined>(undefined);
  const [sentryLoadError, setSentryLoadError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetchSentryStats({})
      .then((result) => {
        if (cancelled) {
          return;
        }
        setSentryStats(result);
        setSentryLoadError(false);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        Sentry.captureException(err, {
          tags: { component: 'WidgetSentryErrors', action: 'sentryStats' },
        });
        setSentryLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSentryStats]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab: TabValue = React.useMemo(() => {
    const tab = searchParams.get('tab');
    return isTabValue(tab) ? tab : DEFAULT_TAB;
  }, [searchParams]);

  const handleTabChange = React.useCallback(
    (next: string) => {
      if (!isTabValue(next)) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_TAB) {
        params.delete('tab');
      } else {
        params.set('tab', next);
      }
      const query = params.toString();
      const href = query.length > 0 ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (stats === undefined || stats === null) {
    return <DashboardSkeleton />;
  }

  return (
    <Tabs defaultValue={initialTab} onValueChange={handleTabChange} className="gap-4">
      <TabsList>
        <TabsTrigger value="overview" className="cursor-pointer">
          <LayoutDashboardIcon className="size-4" aria-hidden />
          {t('admin.dashboard.tabOverview')}
        </TabsTrigger>
        <TabsTrigger value="visitors" className="cursor-pointer">
          <LineChartIcon className="size-4" aria-hidden />
          {t('admin.dashboard.tabVisitors')}
        </TabsTrigger>
        <TabsTrigger value="orders" className="cursor-pointer">
          <ShoppingBagIcon className="size-4" aria-hidden />
          {t('admin.dashboard.tabOrders')}
        </TabsTrigger>
        <TabsTrigger value="inventory" className="cursor-pointer">
          <PackageIcon className="size-4" aria-hidden />
          {t('admin.dashboard.tabInventory')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="flex flex-col gap-4">
        <SectionCards />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentOrdersTable className="lg:col-span-2" />
          <LowStockTable className="lg:col-span-1" />
        </div>
        <WidgetSentryErrors stats={sentryStats} loadError={sentryLoadError} />
      </TabsContent>
      <TabsContent value="visitors" className="flex flex-col gap-4">
        <ChartAreaInteractive title={t('admin.dashboard.visitorsChartTitle')} />
      </TabsContent>
      <TabsContent value="orders" className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">{t('admin.dashboard.tabOrdersHint')}</p>
        <Card className="overflow-hidden p-0">
          <OrdersTableClient hideHeader />
        </Card>
      </TabsContent>
      <TabsContent value="inventory" className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">{t('admin.dashboard.tabInventoryHint')}</p>
        <Card className="overflow-hidden p-0">
          <InventoryTableClient hideHeader />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
