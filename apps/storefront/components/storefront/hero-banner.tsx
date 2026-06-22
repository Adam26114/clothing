import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';

import { PlaceholderImage } from './placeholder-image';

interface HeroBannerProps {
  heroImageColorHex?: string | null;
  heroImageUrl?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  className?: string;
}

export function HeroBanner({
  heroImageColorHex,
  heroImageUrl,
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaLink,
  className,
}: HeroBannerProps) {
  const fallbackHex = '#1F3A3A';
  const displayTitle = title ?? t('homepage.title');
  const displaySubtitle = subtitle ?? t('homepage.description');
  const displayCta = ctaLabel ?? t('homepage.heroCta');
  const displayCtaLink = ctaLink ?? '/new';

  return (
    <section
      className={cn('bg-card text-card-foreground relative overflow-hidden rounded-xl', className)}
    >
      <div className="relative">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={t('a11y.hero')}
            width={1600}
            height={900}
            priority
            unoptimized
            className="aspect-3/4 w-full object-cover md:aspect-video"
          />
        ) : (
          <PlaceholderImage
            colorHex={heroImageColorHex ?? fallbackHex}
            aspectRatio="banner"
            label={t('a11y.hero')}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end gap-4 bg-gradient-to-t from-black/40 via-black/10 to-transparent p-6 md:p-12 lg:p-16">
          {eyebrow ? (
            <p className="text-xs font-medium tracking-widest text-white/80 uppercase md:text-sm">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
            {displayTitle}
          </h1>
          {displaySubtitle ? (
            <p className="max-w-xl text-base text-white/90 md:text-lg">{displaySubtitle}</p>
          ) : null}
          {displayCta ? (
            <div>
              <Button size="lg" render={<Link href={displayCtaLink} />} className="cursor-pointer">
                {displayCta}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
