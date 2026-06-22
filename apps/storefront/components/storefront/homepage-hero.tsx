'use client';

import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { HeroBanner } from './hero-banner';

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
    <HeroBanner
      heroImageColorHex={heroImageColorHex}
      heroImageUrl={heroImageUrl ?? null}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      ctaLabel={ctaLabel}
      ctaLink={ctaLink}
    />
  );
}
