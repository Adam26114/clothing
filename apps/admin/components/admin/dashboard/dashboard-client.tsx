'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { LOW_STOCK_THRESHOLD } from '@workspace/lib/constants';

import { Card, CardContent } from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

import { KpiGrid } from './kpi-grid';
import { WidgetOrdersToday } from './widget-orders-today';
import { WidgetPendingOrders } from './widget-pending-orders';
import { WidgetProductCount } from './widget-product-count';
import { WidgetLowStock } from './widget-low-stock';
import { WidgetRecentOrders } from './widget-recent-orders';
import { VisitorsChart } from './visitors-chart';
import { DashboardSkeleton } from './dashboard-skeleton';

function DashboardError() {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-destructive text-sm">{t('admin.dashboard.errorLoad')}</p>
      </CardContent>
    </Card>
  );
}

function resolveLowStockThreshold(
  settings: { lowStockThreshold?: number } | null | undefined
): number {
  if (settings && typeof settings === 'object' && 'lowStockThreshold' in settings) {
    const value = settings.lowStockThreshold;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return LOW_STOCK_THRESHOLD;
}

export function DashboardClient() {
  const stats = useQuery(api.orders.dashboardStats, {});
  const settings = useQuery(api.storeSettings.get, {});
  const lowStock = useQuery(api.products.lowStockCount, {
    limit: 5,
    threshold: resolveLowStockThreshold(settings),
  });

  if (stats === undefined || lowStock === undefined || settings === undefined) {
    return <DashboardSkeleton />;
  }

  if (stats === null || lowStock === null) {
    return <DashboardError />;
  }

  return (
    <div className="flex flex-col gap-6">
      <KpiGrid
        mtdRevenue={stats.mtdRevenue}
        mtdRevenueTrendPct={stats.mtdRevenueTrendPct}
        newCustomersThisMonth={stats.newCustomersThisMonth}
        newCustomersTrendPct={stats.newCustomersTrendPct}
        activeAccountCount={stats.activeAccountCount}
        growthRate={stats.mtdRevenueTrendPct}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetOrdersToday ordersToday={stats.ordersToday} gmv={stats.ordersTodayGmv} />
        <WidgetPendingOrders count={stats.pendingCount} />
        <WidgetProductCount
          active={stats.productCountActive}
          inactive={stats.productCountInactive}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <WidgetLowStock items={lowStock} />
        <WidgetRecentOrders orders={stats.recentOrders} />
      </div>

      <VisitorsChart />
    </div>
  );
}
