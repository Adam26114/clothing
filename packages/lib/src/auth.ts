export type UserRole = 'customer' | 'admin' | 'super-admin';

export interface CurrentUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'super-admin';
}
