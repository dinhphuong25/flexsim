export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export const PERMISSIONS = {
  // Quản trị người dùng & bảo mật
  MANAGE_USERS: ['ADMIN'],
  VIEW_AUDIT_LOGS: ['ADMIN'],
  MANAGE_INTEGRATION_CLIENTS: ['ADMIN'],
  MANAGE_SYSTEM_SETTINGS: ['ADMIN'],

  // Quản trị kế hoạch & phương án
  MANAGE_PRODUCTION_PLAN: ['ADMIN', 'MANAGER'],
  MANAGE_SCENARIOS: ['ADMIN', 'MANAGER'],
  IMPORT_BACKUP_DATA: ['ADMIN', 'MANAGER'],
  EXPORT_REPORTS: ['ADMIN', 'MANAGER', 'VIEWER'],
  TRIGGER_INVENTORY_AUDIT: ['ADMIN', 'MANAGER'],

  // Xem dữ liệu
  VIEW_DASHBOARD: ['ADMIN', 'MANAGER', 'VIEWER'],
  VIEW_STAGES: ['ADMIN', 'MANAGER', 'VIEWER'],
  VIEW_LINE_DIAGRAM: ['ADMIN', 'MANAGER', 'VIEWER'],
  VIEW_WORKERS: ['ADMIN', 'MANAGER', 'VIEWER'],
  VIEW_INTEGRATION_STATUS: ['ADMIN', 'MANAGER', 'VIEWER'],
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

export function hasPermission(userRole: UserRole, action: PermissionAction): boolean {
  const allowedRoles = PERMISSIONS[action] as readonly string[];
  return allowedRoles.includes(userRole);
}

export function canMutateData(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'MANAGER';
}
