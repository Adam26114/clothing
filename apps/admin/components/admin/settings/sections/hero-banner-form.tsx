'use client';

import * as React from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { ImagePlusIcon, Loader2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { t } from '@workspace/lib/i18n';

export interface HeroBannerFormState {
  heroTitle: string;
  heroSubtitle: string;
  heroImageId: Id<'_storage'> | null;
  heroCtaLabel: string;
  heroCtaLink: string;
}

interface HeroBannerFormProps {
  state: HeroBannerFormState;
  onChange: (next: HeroBannerFormState) => void;
  onCtaLinkError: (hasError: boolean) => void;
}

export function HeroBannerForm({ state, onChange, onCtaLinkError }: HeroBannerFormProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const deleteAt = useMutation(api.storage.deleteAt);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const heroImageUrl = useQuery(
    api.storage.getUrl,
    state.heroImageId ? { storageId: state.heroImageId } : 'skip'
  );

  const ctaLinkError = state.heroCtaLink.length > 0 && !state.heroCtaLink.startsWith('/');

  React.useEffect(() => {
    onCtaLinkError(ctaLinkError);
  }, [ctaLinkError, onCtaLinkError]);

  const handleFile = React.useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        const data: unknown = await response.json();
        if (
          data &&
          typeof data === 'object' &&
          'storageId' in data &&
          typeof (data as { storageId: unknown }).storageId === 'string'
        ) {
          const storageId = (data as { storageId: string }).storageId as Id<'_storage'>;
          onChange({ ...state, heroImageId: storageId });
        } else {
          throw new Error('Invalid upload response');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.settings.error.update');
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, onChange, state]
  );

  const handleRemove = React.useCallback(async () => {
    const previousId = state.heroImageId;
    onChange({ ...state, heroImageId: null });
    if (!previousId) {
      return;
    }
    try {
      await deleteAt({ storageId: previousId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.settings.error.update');
      toast.error(message);
    }
  }, [deleteAt, onChange, state]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="settings-hero-title">{t('admin.settings.hero.title')}</Label>
        <Input
          id="settings-hero-title"
          type="text"
          value={state.heroTitle}
          onChange={(event) => onChange({ ...state, heroTitle: event.target.value })}
          placeholder={t('admin.settings.hero.titlePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="settings-hero-subtitle">{t('admin.settings.hero.subtitle')}</Label>
        <Textarea
          id="settings-hero-subtitle"
          rows={2}
          value={state.heroSubtitle}
          onChange={(event) => onChange({ ...state, heroSubtitle: event.target.value })}
          placeholder={t('admin.settings.hero.subtitlePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label>{t('admin.settings.hero.image')}</Label>
        <div className="border-border bg-muted/30 relative aspect-[16/9] w-full overflow-hidden rounded-lg border">
          {state.heroImageId && heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt={t('admin.settings.hero.image')}
                width={1600}
                height={900}
                unoptimized
                className="size-full object-cover"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                onClick={() => void handleRemove()}
                aria-label={t('admin.settings.hero.removeImage')}
                className="absolute end-2 top-2 cursor-pointer"
              >
                <XIcon className="size-4" aria-hidden />
              </Button>
            </>
          ) : uploading ? (
            <div className="flex size-full flex-col items-center justify-center gap-2">
              <Loader2Icon className="text-muted-foreground size-6 animate-spin" aria-hidden />
              <p className="text-muted-foreground text-xs">{t('admin.products.form.uploading')}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-muted/40 focus-visible:ring-ring/50 flex size-full cursor-pointer flex-col items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ImagePlusIcon className="text-muted-foreground size-8" aria-hidden />
              <p className="text-muted-foreground text-xs">{t('admin.settings.hero.imageHint')}</p>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
              event.target.value = '';
            }
          }}
          className="hidden"
        />
        {state.heroImageId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer self-start"
          >
            <ImagePlusIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.products.form.uploadFile')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-hero-cta-label">{t('admin.settings.hero.ctaLabel')}</Label>
        <Input
          id="settings-hero-cta-label"
          type="text"
          value={state.heroCtaLabel}
          onChange={(event) => onChange({ ...state, heroCtaLabel: event.target.value })}
          placeholder={t('admin.settings.hero.ctaLabelPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-hero-cta-link">{t('admin.settings.hero.ctaLink')}</Label>
        <Input
          id="settings-hero-cta-link"
          type="text"
          value={state.heroCtaLink}
          onChange={(event) => onChange({ ...state, heroCtaLink: event.target.value })}
          placeholder={t('admin.settings.hero.ctaLinkPlaceholder')}
          aria-invalid={ctaLinkError}
        />
        {ctaLinkError ? (
          <p className="text-destructive text-xs">{t('admin.settings.error.invalidCtaLink')}</p>
        ) : null}
      </div>
    </div>
  );
}
