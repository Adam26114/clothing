'use client';

import { MailCheckIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';

export function VerifyEmailForm() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full"
        aria-hidden
      >
        <MailCheckIcon className="size-6" />
      </div>
      <p className="text-foreground text-sm font-medium">{t('auth.checkEmailInterstitial')}</p>
      <p className="text-muted-foreground text-sm leading-6">
        {t('auth.checkEmailInterstitialHint')}
      </p>
    </div>
  );
}
