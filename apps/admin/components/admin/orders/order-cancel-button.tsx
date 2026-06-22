'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { BanIcon } from 'lucide-react';
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

interface OrderCancelButtonProps {
  orderId: Id<'orders'>;
  disabled?: boolean;
}

export function OrderCancelButton({ orderId, disabled = false }: OrderCancelButtonProps) {
  const cancel = useMutation(api.orders.cancel);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleConfirm = React.useCallback(async () => {
    setPending(true);
    try {
      await cancel({ id: orderId });
      toast.success(t('admin.orders.success.cancel'));
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.orders.error.cancel');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [cancel, orderId]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled || pending}
            className="cursor-pointer"
          />
        }
      >
        <BanIcon className="me-1.5 size-4" aria-hidden />
        {t('admin.orders.detail.cancelOrder')}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.orders.detail.cancelConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.orders.detail.cancelConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            {t('admin.orders.detail.cancelConfirmCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="cursor-pointer"
          >
            {t('admin.orders.detail.cancelConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
