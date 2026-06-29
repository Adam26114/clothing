'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Doc } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { useStoredRowOrder } from '@workspace/lib/hooks/use-stored-row-order';

import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  makeUserColumns,
  userSearchableText,
  type UserRow,
} from '@/components/admin/users/columns';
import { UsersFilters, type UserRoleFilter } from '@/components/admin/users/users-filters';
import { EmptyUsers } from '@/components/admin/users/empty-users';

const DEFAULT_PAGE_SIZE = 20;
const TABLE_ID = 'admin-users';

function toUserRow(user: Doc<'users'>): UserRow {
  return {
    _id: user._id,
    _creationTime: user._creationTime,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export function UsersTableClient() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [role, setRole] = React.useState<UserRoleFilter>('all');

  const roleArg = role === 'all' ? undefined : role;

  const result = useQuery(api.users.list, {
    role: roleArg,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = React.useMemo<ColumnDef<UserRow, unknown>[]>(
    () =>
      makeUserColumns({
        currentUserId: currentUser?._id ?? '',
        currentUserRole: currentUser?.role,
      }),
    [currentUser?._id, currentUser?.role]
  );

  const rows = React.useMemo<UserRow[]>(
    () => (result?.items ?? []).map((user) => toUserRow(user)),
    [result]
  );

  const { ordered, reorder } = useStoredRowOrder<UserRow>(TABLE_ID, rows, (row) => row._id);

  const total = result?.total ?? 0;

  return (
    <DataTable<UserRow>
      tableId={TABLE_ID}
      columns={columns}
      data={ordered}
      isLoading={result === undefined || authLoading}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      globalSearchPlaceholder={t('admin.users.searchPlaceholder')}
      getSearchableText={userSearchableText}
      getRowId={(row) => row._id}
      toolbarTitle={t('admin.users.title')}
      toolbarFilters={<UsersFilters role={role} onRoleChange={setRole} />}
      toolbarSummary={
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.users.showingOf', 'en', { shown: ordered.length, total })}
        </span>
      }
      emptyState={<EmptyUsers />}
      enableRowReorder
      onReorder={reorder}
    />
  );
}
