'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';

interface AuthFormProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthForm({ title, description, children, footer, className }: AuthFormProps) {
  return (
    <main
      className={cn(
        'bg-background text-foreground flex min-h-svh items-center justify-center px-4 py-12 sm:py-16',
        className
      )}
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="focus-visible:ring-ring/50 mb-8 inline-block text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('brandName')}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground text-sm leading-6">{description}</p>
          ) : null}
        </div>
        <div className="mt-8 flex flex-col gap-6">{children}</div>
        {footer ? <p className="text-muted-foreground mt-6 text-center text-sm">{footer}</p> : null}
      </div>
    </main>
  );
}
