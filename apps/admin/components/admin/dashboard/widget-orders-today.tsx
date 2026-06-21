'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

interface WidgetOrdersTodayProps {
  ordersToday: number;
  gmv: number;
}

export function WidgetOrdersToday({ ordersToday, gmv }: WidgetOrdersTodayProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{t('admin.dashboard.ordersToday')}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {ordersToday.toLocaleString('en-US')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {t('admin.dashboard.gmv')}
          </span>
          <span className="text-xl font-semibold tabular-nums">{formatMMK(gmv)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
