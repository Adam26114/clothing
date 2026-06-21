'use client';

import { useCartMergeOnAuth } from '@workspace/lib/cart/merge';
import { toast } from 'sonner';

export function CartMergeOnAuth() {
  useCartMergeOnAuth({
    onShowToast: (message) => {
      toast.success(message);
    },
  });
  return null;
}
