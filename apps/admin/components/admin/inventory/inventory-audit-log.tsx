'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { HistoryIcon, XIcon } from 'lucide-react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui/components/drawer';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { EmptyState } from '@workspace/ui/components/empty-state';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { t } from '@workspace/lib/i18n';

interface InventoryAuditLogProps {
  productId: Id<'products'>;
  productName: string;
  trigger: React.ReactNode;
}

const whenFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatWhen(timestamp: number): string {
  try {
    return whenFormatter.format(new Date(timestamp));
  } catch {
    return String(timestamp);
  }
}

export function InventoryAuditLog({ productId, productName, trigger }: InventoryAuditLogProps) {
  const [open, setOpen] = React.useState(false);
  const entries = useQuery(api.stockAudit.listByProduct, { productId, limit: 200 });

  const isLoading = entries === undefined;
  const hasEntries = !isLoading && entries.length > 0;

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-w-xl">
        <DrawerHeader className="flex-row items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <DrawerTitle>{t('admin.inventory.audit.title')}</DrawerTitle>
            <DrawerDescription>
              {t('admin.inventory.audit.showFor', 'en', { product: productName })}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              className="shrink-0 cursor-pointer"
            >
              <XIcon aria-hidden />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <DataTableSkeleton columnCount={6} rowCount={6} className="border-0" />
            ) : !hasEntries ? (
              <EmptyState
                icon={<HistoryIcon className="size-10" strokeWidth={1.5} />}
                title={t('admin.inventory.audit.empty')}
                className="m-4"
              />
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>{t('admin.inventory.audit.columns.when')}</TableHead>
                    <TableHead>{t('admin.inventory.audit.columns.variant')}</TableHead>
                    <TableHead>{t('admin.inventory.audit.columns.size')}</TableHead>
                    <TableHead className="text-end">
                      {t('admin.inventory.audit.columns.delta')}
                    </TableHead>
                    <TableHead>{t('admin.inventory.audit.columns.reason')}</TableHead>
                    <TableHead>{t('admin.inventory.audit.columns.actor')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <span className="text-sm tabular-nums">{formatWhen(entry.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{entry.variantId}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{entry.size}</span>
                      </TableCell>
                      <TableCell className="text-end">{renderDelta(entry.delta)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`admin.inventory.audit.reason.${entry.reason}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderActor(entry)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function renderDelta(delta: number): React.ReactNode {
  if (delta > 0) {
    return (
      <span className="text-primary font-medium tabular-nums">
        {t('admin.inventory.audit.deltaPositive', 'en', { n: delta })}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="text-destructive font-medium tabular-nums">
        {t('admin.inventory.audit.deltaNegative', 'en', { n: delta })}
      </span>
    );
  }
  return <span className="text-muted-foreground tabular-nums">0</span>;
}

interface ActorEntry {
  actorName: string | null;
  actorEmail: string | null;
}

function renderActor(entry: ActorEntry): React.ReactNode {
  const name = entry.actorName ?? entry.actorEmail;
  if (name) {
    return <span className="text-sm">{name}</span>;
  }
  return (
    <span className="text-muted-foreground text-sm">{t('admin.inventory.audit.actorSystem')}</span>
  );
}
