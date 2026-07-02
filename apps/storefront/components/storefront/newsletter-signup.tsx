'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

interface NewsletterSignupProps {
  className?: string;
}

export function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      // Phase 1 stub — writes to console, no backend persistence
      console.info('[newsletter] signup', email);
      toast.success(t('homepage.newsletterSuccess'));
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={cn('bg-secondary text-secondary-foreground rounded-xl p-8 md:p-12', className)}
    >
      <div className="flex flex-col items-start gap-3 md:max-w-xl">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('homepage.newsletterHeading')}
        </h2>
        <p className="text-sm md:text-base">{t('homepage.newsletterDescription')}</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          {t('homepage.newsletterHeading')}
        </label>
        <Input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder={t('homepage.newsletterPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="bg-background text-foreground cursor-pointer"
          disabled={submitting}
        />
        <Button type="submit" disabled={submitting} className="cursor-pointer">
          {t('homepage.newsletterCta')}
        </Button>
      </form>
    </section>
  );
}
