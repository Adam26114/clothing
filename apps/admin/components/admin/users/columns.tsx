'use client';

import Link from 'next/link';
import type { Doc } from '@workspace/convex/_generated/dataModel';

import { RowActions, SortableHeader, type ColumnDef } from '@workspace/ui/components/data-table';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { formatDate } from '@workspace/lib/formatDate';
import { t } from '@workspace/lib/i18n';

import { RoleSelect } from './role-select';
import type { UserRole } from '@workspace/lib/auth';

export interface UserRow {
  _id: Doc<'users'>['_id'];
  _creationTime: number;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: number;
}

function getUserSearchableText(row: UserRow): string {
  return [row.name ?? '', row.email ?? '', row.phone ?? ''].join(' ');
}

export const userSearchableText = getUserSearchableText;

interface MakeUserColumnsOptions {
  currentUserId: string;
  currentUserRole: UserRole | undefined;
}

export function makeUserColumns({
  currentUserId,
  currentUserRole,
}: MakeUserColumnsOptions): ColumnDef<UserRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.users.columns.name')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      accessorFn: (row) => row.name ?? row.email ?? row.phone ?? '',
      cell: ({ row }) => <UserNameCell row={row.original} />,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.users.columns.email')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row }) => <UserEmailCell value={row.original.email} />,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: () => <span className="font-medium">{t('admin.users.columns.phone')}</span>,
      cell: ({ row }) => <UserPhoneCell value={row.original.phone} />,
      enableSorting: false,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: () => <span className="font-medium">{t('admin.users.columns.role')}</span>,
      cell: ({ row }) => (
        <RoleSelect
          user={row.original}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.users.columns.joined')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('admin.users.columns.actions')}</span>,
      cell: ({ row }) => <UserRowActions userId={row.original._id} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

interface UserNameCellProps {
  row: UserRow;
}

function UserNameCell({ row }: UserNameCellProps) {
  const display = row.name && row.name.length > 0 ? row.name : '—';
  const sub = row.email ?? row.phone ?? null;
  return (
    <div className="flex flex-col">
      <Link href={`/users/${row._id}`} className="cursor-pointer font-medium hover:underline">
        {display}
      </Link>
      {sub ? <span className="text-muted-foreground text-xs">{sub}</span> : null}
    </div>
  );
}

function UserEmailCell({ value }: { value: string | undefined }) {
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="font-mono text-sm tabular-nums">{value}</span>;
}

function UserPhoneCell({ value }: { value: string | undefined }) {
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="font-mono text-sm tabular-nums">{value}</span>;
}

interface UserRowActionsProps {
  userId: Doc<'users'>['_id'];
}

function UserRowActions({ userId }: UserRowActionsProps) {
  return (
    <RowActions>
      <DropdownMenuItem className="cursor-pointer" render={<Link href={`/users/${userId}`} />}>
        {t('admin.users.viewDetails')}
      </DropdownMenuItem>
    </RowActions>
  );
}
