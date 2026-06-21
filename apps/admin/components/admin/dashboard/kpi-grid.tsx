'use client';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

interface KpiGridProps {
  mtdRevenue: number;
  mtdRevenueTrendPct: number;
  newCustomersThisMonth: number;
  newCustomersTrendPct: number;
  activeAccountCount: number;
  growthRate: number;
}

function formatTrend(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <Badge variant="outline">0.0%</Badge>;
  }
  const positive = pct > 0;
  return (
    <Badge variant="outline">
      {positive ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {formatTrend(pct)}
    </Badge>
  );
}

export function KpiGrid({
  mtdRevenue,
  mtdRevenueTrendPct,
  newCustomersThisMonth,
  newCustomersTrendPct,
  activeAccountCount,
  growthRate,
}: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('admin.dashboard.totalRevenue')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMMK(mtdRevenue)}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={mtdRevenueTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {mtdRevenueTrendPct >= 0
              ? t('admin.dashboard.trendUp')
              : t('admin.dashboard.trendDown')}
            {mtdRevenueTrendPct >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">{t('admin.dashboard.sinceLastMonth')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('admin.dashboard.newCustomers')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {newCustomersThisMonth.toLocaleString('en-US')}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={newCustomersTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {newCustomersTrendPct >= 0
              ? t('admin.dashboard.trendUp')
              : t('admin.dashboard.trendDown')}
            {newCustomersTrendPct >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">{t('admin.dashboard.sinceLastMonth')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('admin.dashboard.activeAccounts')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeAccountCount.toLocaleString('en-US')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {formatTrend(growthRate)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('admin.dashboard.trendUp')} <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('admin.dashboard.sinceLastMonth')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('admin.dashboard.growthRate')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatTrend(growthRate)}
          </CardTitle>
          <CardAction>
            {growthRate >= 0 ? (
              <Badge variant="outline">
                <TrendingUpIcon />
                {formatTrend(growthRate)}
              </Badge>
            ) : (
              <Badge variant="outline">
                <TrendingDownIcon />
                {formatTrend(growthRate)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {growthRate >= 0 ? t('admin.dashboard.trendUp') : t('admin.dashboard.trendDown')}
            {growthRate >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">{t('admin.dashboard.sinceLastMonth')}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
