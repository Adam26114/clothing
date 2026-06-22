'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import type { UserRole } from '@workspace/lib/auth';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';

import type { UserRow } from './columns';

const ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; labelKey: string }> = [
  { value: 'customer', labelKey: 'admin.users.role.customer' },
  { value: 'admin', labelKey: 'admin.users.role.admin' },
  { value: 'super-admin', labelKey: 'admin.users.role.superAdmin' },
];

const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  admin: 1,
  'super-admin': 2,
};

function isUserRole(value: string): value is UserRole {
  return value === 'customer' || value === 'admin' || value === 'super-admin';
}

function roleLabelKey(role: UserRole): string {
  return `admin.users.role.${role === 'super-admin' ? 'superAdmin' : role}`;
}

function roleVariant(role: UserRole): 'default' | 'secondary' | 'destructive' {
  if (role === 'super-admin') return 'destructive';
  if (role === 'admin') return 'default';
  return 'secondary';
}

interface RoleSelectProps {
  user: UserRow;
  currentUserId: string;
  currentUserRole: UserRole | undefined;
}

export function RoleSelect({ user, currentUserId, currentUserRole }: RoleSelectProps) {
  const isSelf = currentUserId === user._id;
  const canEdit = currentUserRole === 'super-admin' && !(isSelf && user.role === 'super-admin');

  if (!canEdit) {
    return (
      <Badge variant={roleVariant(user.role)} className="cursor-default">
        {t(roleLabelKey(user.role))}
      </Badge>
    );
  }

  return <EditableRoleSelect user={user} isSelf={isSelf} />;
}

interface EditableRoleSelectProps {
  user: UserRow;
  isSelf: boolean;
}

function EditableRoleSelect({ user, isSelf }: EditableRoleSelectProps) {
  const setRole = useMutation(api.users.setRole);
  const [pending, setPending] = React.useState(false);
  const [pendingRole, setPendingRole] = React.useState<UserRole | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetRole, setTargetRole] = React.useState<UserRole | null>(null);

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isUserRole(next) || next === user.role) {
        return;
      }
      setTargetRole(next);
      setConfirmOpen(true);
    },
    [user.role]
  );

  const handleConfirm = React.useCallback(async () => {
    if (!targetRole) {
      return;
    }
    setPending(true);
    setPendingRole(targetRole);
    try {
      await setRole({ userId: user._id as Id<'users'>, role: targetRole });
      toast.success(t('admin.users.success.setRole'));
      setConfirmOpen(false);
      setTargetRole(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.users.error.setRole');
      toast.error(message);
    } finally {
      setPending(false);
      setPendingRole(null);
    }
  }, [setRole, targetRole, user._id]);

  const isPromote = targetRole !== null && ROLE_RANK[targetRole] > ROLE_RANK[user.role];

  const userName = user.name && user.name.length > 0 ? user.name : (user.email ?? '');

  return (
    <>
      <Select
        value={user.role}
        onValueChange={(value) => {
          if (value !== null) {
            handleChange(value);
          }
        }}
        disabled={pending}
      >
        <SelectTrigger
          size="sm"
          className="min-w-32 cursor-pointer"
          aria-label={t('admin.users.columns.role')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => {
            const disabled = isSelf && option.value === 'super-admin' && user.role === 'customer';
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={disabled}
                className="cursor-pointer"
              >
                {t(option.labelKey)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setConfirmOpen(open);
            if (!open) {
              setTargetRole(null);
            }
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPromote
                ? t('admin.users.confirm.promoteTitle', 'en', {
                    name: userName,
                    role: targetRole ? t(roleLabelKey(targetRole)) : '',
                  })
                : t('admin.users.confirm.demoteTitle', 'en', {
                    name: userName,
                    role: targetRole ? t(roleLabelKey(targetRole)) : '',
                  })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPromote
                ? t('admin.users.confirm.promoteDescription')
                : t('admin.users.confirm.demoteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              {t('admin.users.confirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
              className="cursor-pointer"
            >
              {pending && pendingRole === targetRole
                ? isPromote
                  ? t('admin.users.confirm.promote')
                  : t('admin.users.confirm.demote')
                : isPromote
                  ? t('admin.users.confirm.promote')
                  : t('admin.users.confirm.demote')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
