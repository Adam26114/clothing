'use client';

import { useCartMergeOnAuth } from '@workspace/lib/cart/merge';
import { useWishlistMergeOnAuth } from '@workspace/lib/wishlist';
import { toast } from 'sonner';

export function AuthMerge() {
  useCartMergeOnAuth({
    onShowToast: (message) => {
      toast.success(message);
    },
  });
  useWishlistMergeOnAuth({
    onShowToast: (message) => {
      toast.success(message);
    },
  });
  return null;
}
