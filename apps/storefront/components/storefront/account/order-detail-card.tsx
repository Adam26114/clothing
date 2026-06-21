'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
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
import { ConfirmationClient } from '../order-confirmation/confirmation-client';

interface OrderDetailCardProps {
  orderId: string;
}

export function OrderDetailCard({ orderId }: OrderDetailCardProps) {
  const order = useQuery(api.orders.getById, { id: orderId as Id<'orders'> });
  const cancel = useMutation(api.orders.cancel);
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancel({ id: orderId as Id<'orders'> });
      toast.success(t('order.cancelOrderSuccess'));
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  if (order && order.status === 'pending') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={<Button variant="outline" size="sm" className="cursor-pointer" />}
            >
              {t('order.cancelOrder')}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('order.cancelOrderConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('order.cancelOrderConfirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelling} className="cursor-pointer">
                  {t('order.cancelOrderConfirmCancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="cursor-pointer"
                >
                  {t('order.cancelOrderConfirmAction')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <ConfirmationClient orderId={orderId} />
      </div>
    );
  }

  return <ConfirmationClient orderId={orderId} />;
}
