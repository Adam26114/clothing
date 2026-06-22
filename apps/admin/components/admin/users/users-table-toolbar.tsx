'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import type { UserRole } from '@workspace/lib/auth';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';

export type UserRoleFilter = UserRole | 'all';

const ROLE_OPTIONS: ReadonlyArray<{ value: UserRoleFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.users.filterRoleAll' },
  { value: 'customer', labelKey: 'admin.users.role.customer' },
  { value: 'admin', labelKey: 'admin.users.role.admin' },
  { value: 'super-admin', labelKey: 'admin.users.role.superAdmin' },
];

export const USER_ROLE_FILTER_VALUES = ROLE_OPTIONS.map((option) => option.value);

function isUserRoleFilter(value: string): value is UserRoleFilter {
  return USER_ROLE_FILTER_VALUES.includes(value as UserRoleFilter);
}

interface UsersTableToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  role: UserRoleFilter;
  onRoleChange: (next: UserRoleFilter) => void;
  onClear: () => void;
  shown: number;
  total: number;
}

export function UsersTableToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  onClear,
  shown,
  total,
}: UsersTableToolbarProps) {
  const hasSearch = search.length > 0;
  const hasRole = role !== 'all';
  const hasActive = hasSearch || hasRole;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            className="h-8 w-full ps-8 pe-8"
            aria-label={t('admin.users.searchPlaceholder')}
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <Select
          value={role}
          onValueChange={(value) => {
            if (value !== null && isUserRoleFilter(value)) {
              onRoleChange(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="min-w-40 cursor-pointer">
            <SelectValue placeholder={t('admin.users.filterRole')} />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="cursor-pointer"
          >
            <XIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.users.clearFilters')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasRole ? (
          <Badge variant="secondary" className="gap-1.5">
            <span className="text-xs">
              {t('admin.users.filterRole')}:{' '}
              {t(`admin.users.role.${role === 'super-admin' ? 'superAdmin' : role}`)}
            </span>
            <button
              type="button"
              onClick={() => onRoleChange('all')}
              className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label={`Clear filter: ${t('admin.users.filterRole')}`}
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          </Badge>
        ) : null}
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.users.showingOf', 'en', { shown, total })}
        </span>
      </div>
    </div>
  );
}
