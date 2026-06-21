import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';

export type PlaceholderAspectRatio = 'portrait' | 'square' | 'landscape' | 'video' | 'banner';

interface PlaceholderImageProps {
  colorHex?: string | null;
  aspectRatio?: PlaceholderAspectRatio;
  label?: string;
  className?: string;
}

const ASPECT_CLASS: Record<PlaceholderAspectRatio, string> = {
  portrait: 'aspect-3/4',
  square: 'aspect-square',
  landscape: 'aspect-4/3',
  video: 'aspect-video',
  banner: 'aspect-3/4 md:aspect-video',
};

function darken(hex: string, amount: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) {
    return hex;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const factor = 1 - amount;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n * factor)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildGradient(hex?: string | null): string {
  const base = hex ?? '#2A2A2A';
  return `linear-gradient(135deg, ${base} 0%, ${darken(base, 0.25)} 60%, ${darken(base, 0.45)} 100%)`;
}

export function PlaceholderImage({
  colorHex,
  aspectRatio = 'square',
  label,
  className,
}: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={label ?? t('a11y.productImage')}
      data-slot="placeholder-image"
      className={cn(
        'relative w-full overflow-hidden rounded-md',
        ASPECT_CLASS[aspectRatio],
        className
      )}
      style={{ background: buildGradient(colorHex) }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.3) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
