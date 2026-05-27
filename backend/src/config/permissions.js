import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ROLE_PERMISSIONS = JSON.parse(readFileSync(join(__dirname, 'permissions.json'), 'utf8'));

export const USER_ROLES = Object.freeze(Object.keys(ROLE_PERMISSIONS));
export const STAFF_ROLES = Object.freeze([
  'customer_support',
  'content_moderator',
  'finance_manager',
  'operations_manager',
]);

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

export const hasPermission = (role, permission) => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes('*') || permissions.includes(permission);
};
