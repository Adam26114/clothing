import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { LOW_STOCK_THRESHOLD } from '@workspace/lib/constants';

interface StockIndicatorProps {
  totalStock: number;
  className?: string;
}

type StockVariant = 'destructive' | 'warning' | 'success';

export function StockIndicator({ totalStock, className }: StockIndicatorProps) {
  let label: string;
  let variant: StockVariant;

  if (totalStock === 0) {
    label = t('pdp.outOfStock');
    variant = 'destructive';
  } else if (totalStock < LOW_STOCK_THRESHOLD) {
    label = t('pdp.lowStock', 'en', { count: totalStock });
    variant = 'warning';
  } else {
    label = t('pdp.inStock');
    variant = 'success';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium',
        variant === 'destructive' && 'text-destructive',
        variant === 'warning' && 'text-foreground',
        variant === 'success' && 'text-primary',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block size-2 rounded-full',
          variant === 'destructive' && 'bg-destructive',
          variant === 'warning' && 'bg-foreground',
          variant === 'success' && 'bg-primary'
        )}
      />
      {label}
    </div>
  );
}
