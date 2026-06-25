import type { Id } from '@workspace/convex/_generated/dataModel';

export interface SettingsFormState {
  heroTitle: string;
  heroSubtitle: string;
  heroImageId: Id<'_storage'> | null;
  heroCtaLabel: string;
  heroCtaLink: string;
  saleBannerEnabled: boolean;
  saleBannerText: string;
  saleBannerLink: string;
  announcementBar: string;
  contactEmail: string;
  contactPhone: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  pickupStoreName: string;
  pickupStoreAddress: string;
  pickupStoreHours: string;
  lowStockThreshold: string;
}

export const EMPTY_FORM_STATE: SettingsFormState = {
  heroTitle: '',
  heroSubtitle: '',
  heroImageId: null,
  heroCtaLabel: '',
  heroCtaLink: '',
  saleBannerEnabled: false,
  saleBannerText: '',
  saleBannerLink: '',
  announcementBar: '',
  contactEmail: '',
  contactPhone: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
  pickupStoreName: '',
  pickupStoreAddress: '',
  pickupStoreHours: '',
  lowStockThreshold: '',
};

export function settingsStateFromDoc(
  doc: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageId?: Id<'_storage'>;
    heroCtaLabel?: string;
    heroCtaLink?: string;
    saleBannerEnabled: boolean;
    saleBannerText?: string;
    saleBannerLink?: string;
    announcementBar?: string;
    contactEmail?: string;
    contactPhone?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialTiktok?: string;
    pickupStoreName?: string;
    pickupStoreAddress?: string;
    pickupStoreHours?: string;
    lowStockThreshold?: number;
  } | null
): SettingsFormState {
  if (!doc) {
    return EMPTY_FORM_STATE;
  }
  return {
    heroTitle: doc.heroTitle ?? '',
    heroSubtitle: doc.heroSubtitle ?? '',
    heroImageId: doc.heroImageId ?? null,
    heroCtaLabel: doc.heroCtaLabel ?? '',
    heroCtaLink: doc.heroCtaLink ?? '',
    saleBannerEnabled: doc.saleBannerEnabled,
    saleBannerText: doc.saleBannerText ?? '',
    saleBannerLink: doc.saleBannerLink ?? '',
    announcementBar: doc.announcementBar ?? '',
    contactEmail: doc.contactEmail ?? '',
    contactPhone: doc.contactPhone ?? '',
    socialInstagram: doc.socialInstagram ?? '',
    socialFacebook: doc.socialFacebook ?? '',
    socialTiktok: doc.socialTiktok ?? '',
    pickupStoreName: doc.pickupStoreName ?? '',
    pickupStoreAddress: doc.pickupStoreAddress ?? '',
    pickupStoreHours: doc.pickupStoreHours ?? '',
    lowStockThreshold: doc.lowStockThreshold === undefined ? '' : String(doc.lowStockThreshold),
  };
}
