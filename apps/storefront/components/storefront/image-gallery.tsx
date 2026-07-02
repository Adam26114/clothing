'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';

import { PlaceholderImage } from './placeholder-image';

export interface GalleryColorVariant {
  id: string;
  colorName: string;
  colorHex: string;
}

interface ImageGalleryProps {
  colorVariants: GalleryColorVariant[];
  selectedVariantId: string;
  className?: string;
}

const SLIDE_COUNT = 4;

export function ImageGallery({ colorVariants, selectedVariantId, className }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    emblaApi.scrollTo(0);
  }, [emblaApi, selectedVariantId]);

  const currentVariant =
    colorVariants.find((variant) => variant.id === selectedVariantId) ?? colorVariants[0];

  if (!currentVariant) {
    return null;
  }

  const slides = Array.from({ length: SLIDE_COUNT }, (_, i) => i);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="md:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((index) => (
              <div key={index} className="min-w-0 flex-[0_0_100%]">
                <PlaceholderImage
                  colorHex={currentVariant.colorHex}
                  aspectRatio="portrait"
                  label={t('a11y.galleryView', 'en', {
                    color: currentVariant.colorName,
                    index: index + 1,
                  })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {slides.map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={t('a11y.galleryGoToSlide', 'en', { index: index + 1 })}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className={cn(
                'size-2 cursor-pointer rounded-full transition-colors',
                selectedIndex === index ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>
      <div className="hidden gap-3 md:flex">
        <div className="flex flex-col gap-2">
          {slides.map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={t('a11y.galleryShowView', 'en', { index: index + 1 })}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className={cn(
                'border-border cursor-pointer overflow-hidden rounded-md border-2 transition-colors',
                selectedIndex === index ? 'border-primary' : 'hover:border-muted border-transparent'
              )}
            >
              <PlaceholderImage
                colorHex={currentVariant.colorHex}
                aspectRatio="square"
                label={t('a11y.galleryThumbnail', 'en', {
                  color: currentVariant.colorName,
                  index: index + 1,
                })}
                className="w-20"
              />
            </button>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {slides.map((index) => (
            <PlaceholderImage
              key={index}
              colorHex={currentVariant.colorHex}
              aspectRatio="portrait"
              label={t('a11y.galleryView', 'en', {
                color: currentVariant.colorName,
                index: index + 1,
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
