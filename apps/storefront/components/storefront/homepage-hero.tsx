'use client';

import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

interface HomepageHeroProps {
  heroImageId?: Id<'_storage'>;
  heroImageColorHex?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
}

export function HomepageHero({
  heroImageId,
  heroImageColorHex,
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaLink,
}: HomepageHeroProps) {
  const heroImageUrl = useQuery(
    api.storage.getUrl,
    heroImageId ? { storageId: heroImageId } : 'skip'
  );

  return (
    <section
      className="border-border bg-muted/30 relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border md:aspect-[21/9]"
      style={heroImageColorHex ? { backgroundColor: heroImageColorHex } : undefined}
    >
      {heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : null}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        {eyebrow ? <p className="text-sm tracking-wider uppercase">{eyebrow}</p> : null}
        {title ? (
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg">{subtitle}</p>
        ) : null}
        {ctaLabel && ctaLink ? (
          <a
            href={ctaLink}
            className="bg-foreground text-background hover:bg-foreground/90 mt-2 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
