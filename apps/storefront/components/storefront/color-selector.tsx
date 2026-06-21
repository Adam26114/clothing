'use client';

import { cn } from '@workspace/lib/cn';

export interface ColorSwatch {
  id: string;
  colorName: string;
  colorHex: string;
}

interface ColorSelectorProps {
  swatches: ColorSwatch[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ColorSelector({ swatches, selectedId, onSelect, className }: ColorSelectorProps) {
  if (swatches.length === 0) {
    return null;
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="radiogroup">
      {swatches.map((swatch) => {
        const isSelected = swatch.id === selectedId;
        return (
          <button
            key={swatch.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={swatch.colorName}
            onClick={() => onSelect(swatch.id)}
            className={cn(
              'border-border cursor-pointer rounded-full border p-0.5 transition-all',
              'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
              isSelected
                ? 'ring-foreground ring-2 ring-offset-2'
                : 'hover:ring-muted-foreground/40 hover:ring-1'
            )}
          >
            <span
              aria-hidden
              className="block size-6 rounded-full border border-black/10"
              style={{ backgroundColor: swatch.colorHex }}
            />
          </button>
        );
      })}
    </div>
  );
}
