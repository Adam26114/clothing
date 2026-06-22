'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { BanIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
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

interface SoftDeleteActionProps {
  productId: Id<'products'>;
  productName: string;
  onDeleted?: () => void;
  renderTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SoftDeleteAction({
  productId,
  productName,
  onDeleted,
  renderTrigger = true,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SoftDeleteActionProps) {
  const softDelete = useMutation(api.products.softDelete);
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      controlledOnOpenChange?.(next);
    },
    [isControlled, controlledOnOpenChange]
  );

  const handleConfirm = React.useCallback(async () => {
    setPending(true);
    try {
      await softDelete({ id: productId });
      toast.success(t('admin.products.success.softDelete'));
      setOpen(false);
      onDeleted?.();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.products.error.softDelete');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [softDelete, productId, onDeleted, router, setOpen]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {renderTrigger ? (
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={pending}
            />
          }
        >
          <BanIcon className="me-1.5 size-4" aria-hidden />
          {t('admin.common.actions.delete')}
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.products.form.removeVariantConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {productName ? `${productName} — ` : ''}
            {t('admin.products.form.removeVariantConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            {t('admin.products.form.removeVariantConfirmCancel')}
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
            {t('admin.products.form.removeVariantConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
