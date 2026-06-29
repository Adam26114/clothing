'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';
import type { UserRole } from '@workspace/lib/auth';

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

interface UsersFiltersProps {
  role: UserRoleFilter;
  onRoleChange: (next: UserRoleFilter) => void;
}

export function UsersFilters({ role, onRoleChange }: UsersFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
}
