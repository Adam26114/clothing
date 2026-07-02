'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { SearchIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';
import { formatMMK } from '@workspace/lib/formatMMK';
import { api } from '@workspace/convex/_generated/api';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command';
import { Skeleton } from '@workspace/ui/components/skeleton';

const DEBOUNCE_MS = 300;
const RESULT_PAGE_SIZE = 8;

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    const handle = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('');
      setDebounced('');
    }
    onOpenChange(nextOpen);
  };

  const shouldSearch = open && debounced.length > 0;
  const result = useQuery(
    api.products.list,
    shouldSearch ? { search: debounced, isPublished: true, pageSize: RESULT_PAGE_SIZE } : 'skip'
  );

  const items = useMemo(() => result?.items ?? [], [result]);
  const showSkeleton = shouldSearch && result === undefined;

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('search.placeholder')}
      description={t('search.placeholder')}
      showCloseButton
    >
      <CommandInput value={query} onValueChange={setQuery} placeholder={t('search.placeholder')} />
      <CommandList>
        {!shouldSearch ? (
          <CommandEmpty>{t('search.typeToSearch')}</CommandEmpty>
        ) : showSkeleton ? (
          <SearchSkeleton />
        ) : items.length === 0 ? (
          <CommandEmpty>{t('search.noResults')}</CommandEmpty>
        ) : (
          <CommandGroup heading={t('search.placeholder')}>
            {items.map((item) => {
              const price = item.salePrice ?? item.basePrice ?? 0;
              const primaryHex = item.colorVariants[0]?.colorHex ?? null;
              return (
                <CommandItem
                  key={item._id}
                  value={`${item.name} ${item.sku ?? ''}`}
                  onSelect={() => handleSelect(item.slug)}
                  className="cursor-pointer"
                >
                  <span
                    aria-hidden
                    className="border-border inline-block size-6 shrink-0 rounded-md border"
                    style={{ background: primaryHex ?? 'var(--muted)' }}
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-muted-foreground text-xs">{formatMMK(price)}</span>
                  </span>
                  <SearchIcon aria-hidden className="text-muted-foreground size-3.5" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function SearchSkeleton() {
  return (
    <div className={cn('flex flex-col gap-2 px-2 py-2')}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-6 rounded-md" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
