'use client';

import Link from 'next/link';
import { CheckCircle2Icon } from 'lucide-react';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

export interface LowStockItem {
  productId: Id<'products'>;
  productSlug: string;
  productName: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
}

interface WidgetLowStockProps {
  items: LowStockItem[];
}

export function WidgetLowStock({ items }: WidgetLowStockProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>{t('admin.dashboard.lowStockAlert')}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {items.length.toLocaleString('en-US')}
        </CardTitle>
        <CardAction>
          <Button
            render={<Link href="/inventory" />}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            {t('admin.dashboard.manageInventory')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2Icon className="text-primary size-4" aria-hidden />
            <span>{t('admin.dashboard.noLowStock')}</span>
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => {
              const key = `${item.productId}-${item.variantId}-${item.size}`;
              return (
                <li key={key} className="flex items-center gap-3 border-b py-2 last:border-b-0">
                  <span
                    aria-hidden
                    className="border-border inline-block size-3 shrink-0 rounded-full border"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {t('admin.dashboard.lowStockItem', 'en', {
                      product: item.productName,
                      color: item.colorName,
                      size: item.size,
                    })}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${
                      item.stock === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {t('admin.dashboard.lowStockQuantity', 'en', { count: item.stock })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
