'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';

interface PaginationLoadMoreProps {
  total: number;
  page: number;
  pageSize: number;
  className?: string;
  paramName?: string;
}

export function PaginationLoadMore({
  total,
  page,
  pageSize,
  className,
  paramName = 'page',
}: PaginationLoadMoreProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const shown = (page + 1) * pageSize;
  const hasMore = shown < total;
  if (!hasMore) {
    return null;
  }

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, String(page + 1));
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={cn('flex justify-center pt-4', className)}>
      <Button
        variant="outline"
        onClick={handleLoadMore}
        disabled={pending}
        className="cursor-pointer"
      >
        {t('plp.loadMore')}
      </Button>
    </div>
  );
}
