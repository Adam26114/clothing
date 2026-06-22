'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

interface SizeStockGridProps {
  sizes: string[];
  stock: Record<string, number>;
  onStockChange: (size: string, qty: number) => void;
}

export function SizeStockGrid({ sizes, stock, onStockChange }: SizeStockGridProps) {
  if (sizes.length === 0) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sizes.map((size) => {
        const value = stock[size] ?? 0;
        return (
          <div key={size} className="flex flex-col gap-1">
            <Label htmlFor={`stock-${size}`} className="font-mono text-xs uppercase">
              {size}
            </Label>
            <Input
              id={`stock-${size}`}
              type="number"
              min="0"
              step="1"
              value={Number.isFinite(value) ? value : 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                onStockChange(size, Number.isFinite(next) ? Math.max(0, next) : 0);
              }}
              className="tabular-nums"
            />
          </div>
        );
      })}
    </div>
  );
}
