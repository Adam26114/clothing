'use client';

import Link from 'next/link';
import { MailCheckIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

interface CheckEmailCardProps {
  email: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function CheckEmailCard({
  email,
  backHref = '/auth/login',
  backLabel,
  className,
}: CheckEmailCardProps) {
  return (
    <main
      className={
        className ??
        'bg-background text-foreground flex min-h-svh items-center justify-center px-4 py-12 sm:py-16'
      }
    >
      <div className="w-full max-w-sm text-center">
        <div
          className="bg-primary/10 text-primary mx-auto mb-6 flex size-12 items-center justify-center rounded-full"
          aria-hidden
        >
          <MailCheckIcon className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.checkEmailTitle')}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {t('auth.checkEmailDescription', 'en', { email })}
        </p>
        <Button
          render={<Link href={backHref} />}
          variant="outline"
          size="default"
          className="mt-8 cursor-pointer"
        >
          {backLabel ?? t('auth.backToSignIn')}
        </Button>
      </div>
    </main>
  );
}
