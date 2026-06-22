'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

interface OrderRestoreButtonProps {
  orderId: Id<'orders'>;
}

export function OrderRestoreButton({ orderId }: OrderRestoreButtonProps) {
  const restore = useMutation(api.orders.restore);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleConfirm = React.useCallback(async () => {
    setPending(true);
    try {
      await restore({ id: orderId });
      toast.success(t('admin.orders.success.restore'));
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.orders.error.restore');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [restore, orderId]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="cursor-pointer"
          />
        }
      >
        <RotateCcwIcon className="me-1.5 size-4" aria-hidden />
        {t('admin.orders.detail.restoreOrder')}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.orders.detail.restoreConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.orders.detail.restoreConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            {t('admin.orders.detail.restoreConfirmCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="cursor-pointer"
          >
            {t('admin.orders.detail.restoreConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
