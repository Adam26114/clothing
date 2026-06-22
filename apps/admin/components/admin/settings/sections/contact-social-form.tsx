'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { t } from '@workspace/lib/i18n';

export interface ContactSocialFormState {
  contactEmail: string;
  contactPhone: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
}

interface ContactSocialFormProps {
  state: ContactSocialFormState;
  onChange: (next: ContactSocialFormState) => void;
}

export function ContactSocialForm({ state, onChange }: ContactSocialFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-contact-email">{t('admin.settings.contact.email')}</Label>
        <Input
          id="settings-contact-email"
          type="email"
          value={state.contactEmail}
          onChange={(event) => onChange({ ...state, contactEmail: event.target.value })}
          placeholder={t('admin.settings.contact.emailPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-contact-phone">{t('admin.settings.contact.phone')}</Label>
        <Input
          id="settings-contact-phone"
          type="tel"
          value={state.contactPhone}
          onChange={(event) => onChange({ ...state, contactPhone: event.target.value })}
          placeholder={t('admin.settings.contact.phonePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-social-instagram">
          {t('admin.settings.contact.socialInstagram')}
        </Label>
        <Input
          id="settings-social-instagram"
          type="url"
          value={state.socialInstagram}
          onChange={(event) => onChange({ ...state, socialInstagram: event.target.value })}
          placeholder={t('admin.settings.contact.socialInstagramPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-social-facebook">
          {t('admin.settings.contact.socialFacebook')}
        </Label>
        <Input
          id="settings-social-facebook"
          type="url"
          value={state.socialFacebook}
          onChange={(event) => onChange({ ...state, socialFacebook: event.target.value })}
          placeholder={t('admin.settings.contact.socialFacebookPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="settings-social-tiktok">{t('admin.settings.contact.socialTiktok')}</Label>
        <Input
          id="settings-social-tiktok"
          type="url"
          value={state.socialTiktok}
          onChange={(event) => onChange({ ...state, socialTiktok: event.target.value })}
          placeholder={t('admin.settings.contact.socialTiktokPlaceholder')}
        />
      </div>
    </div>
  );
}
