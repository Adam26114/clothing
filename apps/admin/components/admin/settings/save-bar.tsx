'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import type { SettingsFormState } from './settings-types';

interface SaveBarProps {
  state: SettingsFormState;
  disabled: boolean;
  onSaved: (saved: SettingsFormState) => void;
  onDiscard: () => void;
}

export function SaveBar({ state, disabled, onSaved, onDiscard }: SaveBarProps) {
  const update = useMutation(api.storeSettings.update);
  const [pending, setPending] = React.useState(false);

  const handleSave = React.useCallback(async () => {
    if (disabled || pending) {
      return;
    }
    setPending(true);
    try {
      const cleanString = (value: string): string | undefined => {
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      };
      const args = {
        heroTitle: cleanString(state.heroTitle),
        heroSubtitle: cleanString(state.heroSubtitle),
        heroImageId: state.heroImageId ?? undefined,
        heroCtaLabel: cleanString(state.heroCtaLabel),
        heroCtaLink: cleanString(state.heroCtaLink),
        saleBannerEnabled: state.saleBannerEnabled,
        saleBannerText: cleanString(state.saleBannerText),
        saleBannerLink: cleanString(state.saleBannerLink),
        announcementBar: cleanString(state.announcementBar),
        contactEmail: cleanString(state.contactEmail),
        contactPhone: cleanString(state.contactPhone),
        socialInstagram: cleanString(state.socialInstagram),
        socialFacebook: cleanString(state.socialFacebook),
        socialTiktok: cleanString(state.socialTiktok),
        pickupStoreName: cleanString(state.pickupStoreName),
        pickupStoreAddress: cleanString(state.pickupStoreAddress),
        pickupStoreHours: cleanString(state.pickupStoreHours),
      };
      await update(args);
      onSaved(state);
      toast.success(t('admin.settings.save.saved'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.settings.error.update');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [disabled, onSaved, pending, state, update]);

  return (
    <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <p className="text-muted-foreground text-sm">{t('admin.settings.save.dirty')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={pending}
            className="cursor-pointer"
          >
            {t('admin.settings.save.discard')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={disabled || pending}
            className="cursor-pointer"
          >
            {pending ? <Loader2Icon className="me-1.5 size-3.5 animate-spin" aria-hidden /> : null}
            {pending ? t('admin.settings.save.saving') : t('admin.settings.save.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
