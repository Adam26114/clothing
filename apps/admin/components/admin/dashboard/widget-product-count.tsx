'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

interface WidgetProductCountProps {
  active: number;
  inactive: number;
}

export function WidgetProductCount({ active, inactive }: WidgetProductCountProps) {
  const total = active + inactive;
  const activePct = total === 0 ? 0 : Math.round((active / total) * 100);
  return (
    <Card>
      <CardHeader>
        <CardDescription>{t('admin.dashboard.productCount')}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {total.toLocaleString('en-US')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            {t('admin.dashboard.productCountSummary', 'en', { active, inactive })}
          </span>
          <div
            className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={activePct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-primary h-full transition-all duration-150 ease-out"
              style={{ width: `${activePct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
