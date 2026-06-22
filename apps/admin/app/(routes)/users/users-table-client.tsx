'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Doc } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { useDebouncedValue } from '@workspace/lib/hooks/use-debounced-value';
import { useAuth } from '@workspace/lib/auth/use-auth';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { Button } from '@workspace/ui/components/button';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  makeUserColumns,
  userSearchableText,
  type UserRow,
} from '@/components/admin/users/columns';
import {
  UsersTableToolbar,
  type UserRoleFilter,
} from '@/components/admin/users/users-table-toolbar';
import { EmptyUsers } from '@/components/admin/users/empty-users';

const DEFAULT_PAGE_SIZE = 20;

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
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState<UserRoleFilter>('all');

  const debouncedSearch = useDebouncedValue(search, 300);
  const trimmedSearch = debouncedSearch.trim();

  const roleArg = role === 'all' ? undefined : role;
  const searchArg = trimmedSearch.length > 0 ? trimmedSearch : undefined;

  const result = useQuery(api.users.list, {
    role: roleArg,
    search: searchArg,
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

  const total = result?.total ?? 0;
  const shown = rows.length;

  const hasActiveFilter = search.length > 0 || role !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t('admin.users.title')} />
      <UsersTableToolbar
        search={search}
        onSearchChange={setSearch}
        role={role}
        onRoleChange={setRole}
        onClear={() => {
          setSearch('');
          setRole('all');
        }}
        shown={shown}
        total={total}
      />
      {result === undefined || authLoading ? (
        <DataTable<UserRow>
          tableId="admin-users"
          columns={columns}
          data={[]}
          isLoading
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.users.searchPlaceholder')}
          getSearchableText={userSearchableText}
          getRowId={(row) => row._id}
        />
      ) : rows.length === 0 ? (
        <div className="flex flex-col gap-4">
          {hasActiveFilter ? (
            <DataTable<UserRow>
              tableId="admin-users"
              columns={columns}
              data={rows}
              defaultPageSize={DEFAULT_PAGE_SIZE}
              globalSearchPlaceholder={t('admin.users.searchPlaceholder')}
              getSearchableText={userSearchableText}
              getRowId={(row) => row._id}
              emptyTitle={t('admin.users.noResults')}
              emptyDescription={t('admin.users.noResultsDescription')}
            />
          ) : (
            <EmptyUsers />
          )}
        </div>
      ) : (
        <DataTable<UserRow>
          tableId="admin-users"
          columns={columns}
          data={rows}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.users.searchPlaceholder')}
          getSearchableText={userSearchableText}
          getRowId={(row) => row._id}
          emptyTitle={t('admin.users.noResults')}
          emptyDescription={t('admin.users.noResultsDescription')}
          emptyAction={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setRole('all');
              }}
              className="cursor-pointer"
            >
              {t('admin.users.clearFilters')}
            </Button>
          }
        />
      )}
    </div>
  );
}
