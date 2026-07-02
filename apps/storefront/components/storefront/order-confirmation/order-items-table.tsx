import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

import { PlaceholderImage } from '../placeholder-image';

interface OrderItemsTableProps {
  items: Array<{
    productId: string;
    colorVariantId: string;
    name: string;
    size: string;
    color: string;
    colorHex: string;
    quantity: number;
    price: number;
  }>;
  className?: string;
}

export function OrderItemsTable({ items, className }: OrderItemsTableProps) {
  return (
    <div className={cn('border-border bg-card rounded-xl border p-4 sm:p-6', className)}>
      <h2 className="mb-4 text-base font-semibold">{t('order.itemsHeading')}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">{t('order.itemName')}</TableHead>
            <TableHead className="text-end">{t('order.itemQuantity')}</TableHead>
            <TableHead className="text-end">{t('order.itemPrice')}</TableHead>
            <TableHead className="text-end">{t('order.total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <TableRow key={`${item.productId}-${item.colorVariantId}-${item.size}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted h-14 w-14 shrink-0 overflow-hidden rounded-md">
                      <PlaceholderImage
                        colorHex={item.colorHex}
                        aspectRatio="square"
                        label={item.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{item.name}</span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <span
                          aria-hidden
                          className="border-border inline-block size-2.5 rounded-full border"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{item.color}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {t('cart.size')}: {item.size}
                        </span>
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-end text-sm tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-foreground text-end text-sm font-medium tabular-nums">
                  {formatMMK(item.price)}
                </TableCell>
                <TableCell className="text-end text-sm font-semibold tabular-nums">
                  {formatMMK(lineTotal)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
