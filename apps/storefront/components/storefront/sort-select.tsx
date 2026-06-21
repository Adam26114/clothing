'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'plp.sort.newest' },
  { value: 'oldest', labelKey: 'plp.sort.oldest' },
  { value: 'price-asc', labelKey: 'plp.sort.priceAsc' },
  { value: 'price-desc', labelKey: 'plp.sort.priceDesc' },
  { value: 'name-asc', labelKey: 'plp.sort.nameAsc' },
  { value: 'name-desc', labelKey: 'plp.sort.nameDesc' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

interface SortSelectProps {
  className?: string;
  paramName?: string;
}

export function SortSelect({ className, paramName = 'sort' }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = (searchParams.get(paramName) as SortValue | null) ?? 'newest';

  const handleChange = (value: string | null) => {
    if (!value) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'newest') {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    params.delete('page');
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-muted-foreground text-sm">{t('plp.sortLabel')}</span>
      <Select value={current} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="min-w-40 cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
