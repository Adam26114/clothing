'use client';

import Link from 'next/link';
import { ArrowLeftIcon, MailIcon, PhoneIcon, CalendarIcon } from 'lucide-react';
import type { Doc } from '@workspace/convex/_generated/dataModel';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { t } from '@workspace/lib/i18n';
import { formatMMK } from '@workspace/lib/formatMMK';
import type { UserRole } from '@workspace/lib/auth';

interface UserDetailHeaderProps {
  user: Doc<'users'>;
  stats: {
    totalOrders: number;
    totalSpent: number;
    ltvMonths: number;
  } | null;
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function roleLabelKey(role: UserRole): string {
  return `admin.users.role.${role === 'super-admin' ? 'superAdmin' : role}`;
}

function roleVariant(role: UserRole): 'default' | 'secondary' | 'destructive' {
  if (role === 'super-admin') return 'destructive';
  if (role === 'admin') return 'default';
  return 'secondary';
}

export function UserDetailHeader({ user, stats }: UserDetailHeaderProps) {
  const name = user.name && user.name.length > 0 ? user.name : (user.email ?? '—');
  const totalOrders = stats?.totalOrders ?? 0;
  const totalSpent = stats?.totalSpent ?? 0;
  const ltvMonths = stats?.ltvMonths ?? 0;
  const showLtv = totalOrders > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          render={<Link href="/users" />}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ms-2 cursor-pointer"
        >
          <ArrowLeftIcon className="me-1.5 size-4 rtl:rotate-180" aria-hidden />
          {t('admin.users.detail.backToUsers')}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('admin.users.detail.title', 'en', { name })}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.users.detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={roleVariant(user.role)} className="cursor-default">
                  {t(roleLabelKey(user.role))}
                </Badge>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {t('admin.users.detail.joinedOn', 'en', { date: formatDate(user.createdAt) })}
                </span>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                {user.email ? (
                  <div className="flex items-center gap-2">
                    <MailIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <dd className="font-mono text-sm tabular-nums">{user.email}</dd>
                  </div>
                ) : null}
                {user.phone ? (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <dd className="font-mono text-sm tabular-nums">{user.phone}</dd>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <dd className="text-muted-foreground text-sm tabular-nums">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.users.detail.stats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground text-xs">
                  {t('admin.users.detail.totalOrders')}
                </dt>
                <dd className="font-medium tabular-nums">{totalOrders.toLocaleString('en-US')}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground text-xs">
                  {t('admin.users.detail.totalSpent')}
                </dt>
                <dd className="font-medium tabular-nums">{formatMMK(totalSpent)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground text-xs">LTV</dt>
                <dd className="text-muted-foreground text-sm tabular-nums">
                  {showLtv
                    ? ltvMonths === 1
                      ? t('admin.users.detail.ltvOne')
                      : t('admin.users.detail.ltv', 'en', { months: ltvMonths })
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
