'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';

interface ActiveToggleProps {
  productId: Id<'products'>;
  isPublished: boolean;
}

export function ActiveToggle({ productId, isPublished }: ActiveToggleProps) {
  const togglePublished = useMutation(api.products.togglePublished);
  const [optimistic, setOptimistic] = React.useState<boolean | null>(null);
  const [pending, setPending] = React.useState(false);

  const displayed = optimistic ?? isPublished;

  const handleChange = React.useCallback(
    async (next: boolean) => {
      if (pending) {
        return;
      }
      setOptimistic(next);
      setPending(true);
      try {
        await togglePublished({ id: productId });
      } catch (err: unknown) {
        setOptimistic(!next);
        const message = err instanceof Error ? err.message : t('admin.products.error.softDelete');
        toast.error(message);
      } finally {
        setPending(false);
        window.setTimeout(() => setOptimistic(null), 300);
      }
    },
    [pending, productId, togglePublished]
  );

  return (
    <Switch
      size="sm"
      checked={displayed}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label={t('admin.products.columns.active')}
      className="cursor-pointer"
    />
  );
}
