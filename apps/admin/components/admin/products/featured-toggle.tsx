'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';

interface FeaturedToggleProps {
  productId: Id<'products'>;
  isFeatured: boolean;
}

export function FeaturedToggle({ productId, isFeatured }: FeaturedToggleProps) {
  const toggleFeatured = useMutation(api.products.toggleFeatured);
  const [optimistic, setOptimistic] = React.useState<boolean | null>(null);
  const [pending, setPending] = React.useState(false);

  const displayed = optimistic ?? isFeatured;

  const handleChange = React.useCallback(
    async (next: boolean) => {
      if (pending) {
        return;
      }
      setOptimistic(next);
      setPending(true);
      try {
        await toggleFeatured({ id: productId });
      } catch (err: unknown) {
        setOptimistic(!next);
        const message = err instanceof Error ? err.message : t('admin.products.error.update');
        toast.error(message);
      } finally {
        setPending(false);
        window.setTimeout(() => setOptimistic(null), 300);
      }
    },
    [pending, productId, toggleFeatured]
  );

  return (
    <Switch
      size="sm"
      checked={displayed}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label={t('admin.products.columns.featured')}
      className="cursor-pointer"
    />
  );
}
