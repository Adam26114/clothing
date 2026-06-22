'use client';

import * as React from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

interface OrderItem {
  productId: Id<'products'>;
  colorVariantId: string;
  name: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  price: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('admin.orders.detail.itemsHeading', 'en', { count: items.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-16">
                  <span className="sr-only">{t('admin.orders.items.thumbnail')}</span>
                </TableHead>
                <TableHead>{t('admin.orders.items.name')}</TableHead>
                <TableHead>{t('admin.orders.items.color')}</TableHead>
                <TableHead>{t('admin.orders.items.size')}</TableHead>
                <TableHead className="text-end">{t('admin.orders.items.quantity')}</TableHead>
                <TableHead className="text-end">{t('admin.orders.items.unitPrice')}</TableHead>
                <TableHead className="text-end">{t('admin.orders.items.lineTotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <OrderItemRow
                  key={`${item.productId}-${item.colorVariantId}-${item.size}-${index}`}
                  item={item}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderItemRowProps {
  item: OrderItem;
}

function OrderItemRow({ item }: OrderItemRowProps) {
  const product = useQuery(api.products.adminGetById, { id: item.productId });
  const variant = product?.colorVariants.find((v) => v.id === item.colorVariantId);
  const firstImageId = variant?.images[0] ?? null;

  return (
    <TableRow>
      <TableCell>
        <ItemThumbnail storageId={firstImageId} colorHex={item.colorHex} alt={item.name} />
      </TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="border-border inline-block size-3 rounded-full border"
            style={{ backgroundColor: item.colorHex }}
          />
          <span>{item.color}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{item.size}</TableCell>
      <TableCell className="text-end tabular-nums">{item.quantity}</TableCell>
      <TableCell className="text-end tabular-nums">{formatMMK(item.price)}</TableCell>
      <TableCell className="text-end font-medium tabular-nums">
        {formatMMK(item.price * item.quantity)}
      </TableCell>
    </TableRow>
  );
}

interface ItemThumbnailProps {
  storageId: Id<'_storage'> | null;
  colorHex: string;
  alt: string;
}

function ItemThumbnail({ storageId, colorHex, alt }: ItemThumbnailProps) {
  const url = useQuery(api.storage.getUrl, storageId ? { storageId } : 'skip');

  if (!storageId || url === undefined || url === null) {
    return (
      <div
        className="border-border size-12 shrink-0 rounded-md border"
        style={{ backgroundColor: colorHex }}
        aria-label={t('admin.orders.items.imagePlaceholder')}
      />
    );
  }

  return (
    <div className="border-border size-12 shrink-0 overflow-hidden rounded-md border">
      <Image
        src={url}
        alt={alt}
        width={48}
        height={48}
        unoptimized
        className="size-full object-cover"
      />
    </div>
  );
}

export type { OrderItem };
