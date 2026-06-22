'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import {
  HeroBannerForm,
  type HeroBannerFormState,
} from '@/components/admin/settings/sections/hero-banner-form';
import {
  SaleBannerForm,
  type SaleBannerFormState,
} from '@/components/admin/settings/sections/sale-banner-form';
import { AnnouncementBarForm } from '@/components/admin/settings/sections/announcement-bar-form';
import {
  ContactSocialForm,
  type ContactSocialFormState,
} from '@/components/admin/settings/sections/contact-social-form';
import {
  PickupInfoForm,
  type PickupInfoFormState,
} from '@/components/admin/settings/sections/pickup-info-form';
import { FeaturedProductsManager } from '@/components/admin/settings/sections/featured-products-manager';
import { SaveBar } from '@/components/admin/settings/save-bar';
import { SettingsSkeleton } from '@/components/admin/settings/settings-skeleton';
import { EmptySettings } from '@/components/admin/settings/empty-settings';
import {
  EMPTY_FORM_STATE,
  settingsStateFromDoc,
  type SettingsFormState,
} from '@/components/admin/settings/settings-types';

function isSettingsFormState(value: unknown): value is SettingsFormState {
  return value !== null && typeof value === 'object';
}

export function SettingsClient() {
  const raw = useQuery(api.storeSettings.get, {});
  const [state, setState] = React.useState<SettingsFormState>(EMPTY_FORM_STATE);
  const [hasCtaLinkError, setHasCtaLinkError] = React.useState(false);

  const settings = isSettingsFormState(raw) ? raw : null;
  const isLoading = raw === undefined;

  const baseline = React.useMemo(() => settingsStateFromDoc(settings), [settings]);

  const isDirty = React.useMemo(() => {
    if (isLoading) {
      return false;
    }
    return JSON.stringify(state) !== JSON.stringify(baseline);
  }, [baseline, isLoading, state]);

  const updateHero = React.useCallback((next: HeroBannerFormState) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const updateSale = React.useCallback((next: SaleBannerFormState) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const updateAnnouncement = React.useCallback((next: string) => {
    setState((prev) => ({ ...prev, announcementBar: next }));
  }, []);

  const updateContact = React.useCallback((next: ContactSocialFormState) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const updatePickup = React.useCallback((next: PickupInfoFormState) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const handleSaved = React.useCallback((saved: SettingsFormState) => {
    setState(saved);
  }, []);

  const handleDiscard = React.useCallback(() => {
    setState(baseline);
    setHasCtaLinkError(false);
  }, [baseline]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <SettingsSkeleton />
      </div>
    );
  }

  if (settings === null) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <AdminPageHeader title={t('admin.settings.title')} />
        <EmptySettings />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <AdminPageHeader title={t('admin.settings.title')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.hero')}</CardTitle>
        </CardHeader>
        <CardContent>
          <HeroBannerForm
            state={{
              heroTitle: state.heroTitle,
              heroSubtitle: state.heroSubtitle,
              heroImageId: state.heroImageId,
              heroCtaLabel: state.heroCtaLabel,
              heroCtaLink: state.heroCtaLink,
            }}
            onChange={updateHero}
            onCtaLinkError={setHasCtaLinkError}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.sale')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SaleBannerForm
            state={{
              saleBannerEnabled: state.saleBannerEnabled,
              saleBannerText: state.saleBannerText,
              saleBannerLink: state.saleBannerLink,
            }}
            onChange={updateSale}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.announcement')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementBarForm value={state.announcementBar} onChange={updateAnnouncement} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.featured')}</CardTitle>
          <CardDescription>{t('admin.settings.featured.addNew')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FeaturedProductsManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.contact')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactSocialForm
            state={{
              contactEmail: state.contactEmail,
              contactPhone: state.contactPhone,
              socialInstagram: state.socialInstagram,
              socialFacebook: state.socialFacebook,
              socialTiktok: state.socialTiktok,
            }}
            onChange={updateContact}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.sections.pickup')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PickupInfoForm
            state={{
              pickupStoreName: state.pickupStoreName,
              pickupStoreAddress: state.pickupStoreAddress,
              pickupStoreHours: state.pickupStoreHours,
            }}
            onChange={updatePickup}
          />
        </CardContent>
      </Card>

      {isDirty ? (
        <SaveBar
          state={state}
          disabled={hasCtaLinkError}
          onSaved={handleSaved}
          onDiscard={handleDiscard}
        />
      ) : null}
    </div>
  );
}
