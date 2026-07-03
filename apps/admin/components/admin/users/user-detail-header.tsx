'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, MailIcon, PhoneIcon, CalendarIcon } from 'lucide-react';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';
import { formatMMK } from '@workspace/lib/formatMMK';
import { formatDate } from '@workspace/lib/formatDate';
import type { UserRole } from '@workspace/lib/auth';

interface UserDetailHeaderProps {
  user: Doc<'users'>;
  stats: {
    totalOrders: number;
    totalSpent: number;
    ltvMonths: number;
  } | null;
  currentUser: { _id: Id<'users'>; role: 'customer' | 'admin' | 'super-admin' } | null;
  onSuspend?: () => void | Promise<void>;
  onReactivate?: () => void | Promise<void>;
}

function roleLabelKey(role: UserRole): string {
  return `admin.users.role.${role === 'super-admin' ? 'superAdmin' : role}`;
}

function roleVariant(role: UserRole): 'default' | 'secondary' | 'destructive' {
  if (role === 'super-admin') return 'destructive';
  if (role === 'admin') return 'default';
  return 'secondary';
}

export function UserDetailHeader({
  user,
  stats,
  currentUser,
  onSuspend,
  onReactivate,
}: UserDetailHeaderProps) {
  const name = user.name && user.name.length > 0 ? user.name : (user.email ?? '—');
  const displayName = user.name && user.name.length > 0 ? user.name : (user.email ?? '');
  const totalOrders = stats?.totalOrders ?? 0;
  const totalSpent = stats?.totalSpent ?? 0;
  const ltvMonths = stats?.ltvMonths ?? 0;
  const showLtv = totalOrders > 0;

  const isSelf = currentUser !== null && currentUser._id === user._id;
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const canToggle = isSuperAdmin && !isSelf;

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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {t('admin.users.suspend.label')}
                </span>
                <Badge
                  variant={user.isActive ? 'default' : 'destructive'}
                  className="cursor-default"
                >
                  {user.isActive
                    ? t('admin.users.suspend.active')
                    : t('admin.users.suspend.inactive')}
                </Badge>
              </div>
              {canToggle ? (
                <AccountStatusControl
                  userId={user._id}
                  isActive={user.isActive}
                  displayName={displayName}
                  onSuspend={onSuspend}
                  onReactivate={onReactivate}
                />
              ) : null}
              {isSelf ? (
                <p className="text-muted-foreground text-xs">
                  {t('admin.users.suspend.selfSuspendTitle')}
                </p>
              ) : null}
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
                  {showLtv ? t('admin.users.detail.ltv', 'en', { months: ltvMonths }) : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AccountStatusControlProps {
  userId: Id<'users'>;
  isActive: boolean;
  displayName: string;
  onSuspend?: () => void | Promise<void>;
  onReactivate?: () => void | Promise<void>;
}

function AccountStatusControl({
  isActive,
  displayName,
  onSuspend,
  onReactivate,
}: AccountStatusControlProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleConfirm = React.useCallback(async () => {
    setPending(true);
    try {
      if (isActive) {
        await onSuspend?.();
      } else {
        await onReactivate?.();
      }
      setOpen(false);
    } catch (err) {
      void err;
    } finally {
      setPending(false);
    }
  }, [isActive, onReactivate, onSuspend]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-3">
        <Switch
          size="sm"
          checked={isActive}
          onCheckedChange={() => {
            if (!pending) {
              setOpen(true);
            }
          }}
          disabled={pending}
          aria-label={
            isActive ? t('admin.users.suspend.suspend') : t('admin.users.suspend.reactivate')
          }
          className="cursor-pointer"
        />
        <span className="text-muted-foreground text-xs">
          {isActive ? t('admin.users.suspend.suspend') : t('admin.users.suspend.reactivate')}
        </span>
      </div>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive
              ? t('admin.users.suspend.confirmSuspendTitle', 'en', { name: displayName })
              : t('admin.users.suspend.confirmReactivateTitle', 'en', { name: displayName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? t('admin.users.suspend.confirmSuspendDescription')
              : t('admin.users.suspend.confirmReactivateDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            {t('admin.users.suspend.confirmCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isActive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="cursor-pointer"
          >
            {t('admin.users.suspend.confirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
