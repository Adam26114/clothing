'use client';

import { AlertCircleIcon, Loader2Icon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';

export interface WidgetSentryStats {
  configured: boolean;
  issuesLast24h: number | null;
  errorRate: number | null;
  unresolvedIssues: number | null;
  fetchedAt: number;
}

interface WidgetSentryErrorsProps {
  stats: WidgetSentryStats | undefined;
  loadError?: boolean;
}

function formatTimestamp(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

function formatCount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('en-US');
}

export function WidgetSentryErrors({ stats, loadError = false }: WidgetSentryErrorsProps) {
  if (stats === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>{t('admin.dashboard.sentryErrors')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            <span>…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>{t('admin.dashboard.sentryErrors')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-start gap-2 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{t('admin.dashboard.sentryLoadError')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats.configured) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>{t('admin.dashboard.sentryErrors')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-start gap-2 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <span>{t('admin.dashboard.sentryNotConfigured')}</span>
              <span className="text-xs">{t('admin.dashboard.sentryNotConfiguredHint')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showEvents = stats.errorRate !== null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>{t('admin.dashboard.sentryErrors')}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {formatCount(stats.issuesLast24h)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('admin.dashboard.sentryUnresolved')}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {formatCount(stats.unresolvedIssues)}
            </span>
          </div>
          {showEvents ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('admin.dashboard.sentryEventCount')}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCount(stats.errorRate)}
              </span>
            </div>
          ) : null}
        </div>
        <span className="text-muted-foreground text-xs">
          Last updated: {formatTimestamp(stats.fetchedAt)}
        </span>
      </CardContent>
    </Card>
  );
}
