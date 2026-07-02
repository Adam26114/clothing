'use client';

import { useState } from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';
import { SIZE_OPTIONS } from '@workspace/lib/constants';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';

interface SizeSelectorProps {
  selectedSizes: string[];
  stockBySize: Record<string, number>;
  selectedSize: string | null;
  onSelect: (size: string) => void;
  className?: string;
}

export function SizeSelector({
  selectedSizes,
  stockBySize,
  selectedSize,
  onSelect,
  className,
}: SizeSelectorProps) {
  const [open, setOpen] = useState(false);

  const available = SIZE_OPTIONS.filter((size) => selectedSizes.includes(size));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {available.map((size) => {
          const stock = stockBySize[size] ?? 0;
          const isOos = stock === 0;
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={
                isOos ? t('a11y.sizeOos', 'en', { size }) : t('a11y.sizeOption', 'en', { size })
              }
              disabled={isOos}
              onClick={() => {
                if (!isOos) {
                  onSelect(size);
                }
              }}
              className={cn(
                'inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
                'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-40',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="link" size="sm" className="text-muted-foreground self-start px-0">
              {t('pdp.sizeGuide')}
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdp.sizeGuideTitle')}</DialogTitle>
            <DialogDescription>{t('pdp.sizeGuideDescription')}</DialogDescription>
          </DialogHeader>
          <div className="text-muted-foreground text-xs">
            <p>{t('pdp.relatedHeading')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
