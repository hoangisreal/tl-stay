import type { AuthUser } from '../services/authService.ts';

export const hasPermission = (user: AuthUser | null | undefined, permission: string) => {
  const permissions = user?.permissions || [];
  return permissions.includes('*') || permissions.includes(permission);
};
