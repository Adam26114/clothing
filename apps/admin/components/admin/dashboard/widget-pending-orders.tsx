'use client';

import Link from 'next/link';
import { TriangleAlertIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

interface WidgetPendingOrdersProps {
  count: number;
}

export function WidgetPendingOrders({ count }: WidgetPendingOrdersProps) {
  const hasPending = count > 0;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{t('admin.dashboard.pendingOrders')}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {count.toLocaleString('en-US')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {hasPending ? (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <TriangleAlertIcon className="text-destructive size-3.5" aria-hidden />
              <span>{t('admin.dashboard.review')}</span>
            </div>
          ) : null}
          <Button
            render={<Link href="/orders?status=pending" />}
            variant={hasPending ? 'default' : 'outline'}
            size="sm"
            className="w-fit cursor-pointer"
          >
            {t('admin.dashboard.review')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
