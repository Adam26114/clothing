'use client';

import { useWishlistMergeOnAuth } from '@workspace/lib/wishlist';
import { toast } from 'sonner';

export function WishlistMergeOnAuth() {
  useWishlistMergeOnAuth({
    onShowToast: (message) => {
      toast.success(message);
    },
  });
  return null;
}
