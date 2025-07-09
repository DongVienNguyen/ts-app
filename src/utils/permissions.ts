import { Staff } from '@/types/auth';

export function isAdmin(user: Staff | null): boolean {
  return user?.role === 'admin';
}

export function isNqUser(user: Staff | null): boolean {
  return user?.department === 'NQ';
}

export function isNqOrAdmin(user: Staff | null): boolean {
  return isAdmin(user) || isNqUser(user);
}

export function canAccessAssetEntry(user: Staff | null): boolean {
  return !!user; // All authenticated users can access
}

export function canAccessDailyReport(user: Staff | null): boolean {
  return !!user; // All authenticated users can access
}

export function canAccessBorrowReport(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canAccessAssetReminders(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canAccessCRCReminders(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canAccessOtherAssets(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canAccessDataManagement(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canManageStaff(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canDeleteData(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canSendNotifications(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canViewAllTransactions(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canEditOwnTransactions(user: Staff | null, transactionOwner: string): boolean {
  return isAdmin(user) || user?.username === transactionOwner;
}

export function canDeleteTransactions(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canAccessErrorReports(user: Staff | null): boolean {
  return !!user; // All authenticated users can report errors
}

export function canViewSecurityLogs(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canResetPasswords(user: Staff | null): boolean {
  return isAdmin(user);
}

export function canManageNotifications(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canExportData(user: Staff | null): boolean {
  return isNqOrAdmin(user);
}

export function canImportData(user: Staff | null): boolean {
  return isAdmin(user);
}

export function hasPermission(user: Staff | null, permission: string): boolean {
  switch (permission) {
    case 'admin':
      return isAdmin(user);
    case 'nq':
      return isNqUser(user);
    case 'nq_or_admin':
      return isNqOrAdmin(user);
    case 'asset_entry':
      return canAccessAssetEntry(user);
    case 'daily_report':
      return canAccessDailyReport(user);
    case 'borrow_report':
      return canAccessBorrowReport(user);
    case 'asset_reminders':
      return canAccessAssetReminders(user);
    case 'crc_reminders':
      return canAccessCRCReminders(user);
    case 'other_assets':
      return canAccessOtherAssets(user);
    case 'data_management':
      return canAccessDataManagement(user);
    case 'manage_staff':
      return canManageStaff(user);
    case 'delete_data':
      return canDeleteData(user);
    case 'send_notifications':
      return canSendNotifications(user);
    case 'view_all_transactions':
      return canViewAllTransactions(user);
    case 'delete_transactions':
      return canDeleteTransactions(user);
    case 'error_reports':
      return canAccessErrorReports(user);
    case 'security_logs':
      return canViewSecurityLogs(user);
    case 'reset_passwords':
      return canResetPasswords(user);
    case 'manage_notifications':
      return canManageNotifications(user);
    case 'export_data':
      return canExportData(user);
    case 'import_data':
      return canImportData(user);
    default:
      return false;
  }
}

export function getUserPermissions(user: Staff | null): string[] {
  const permissions: string[] = [];
  
  if (!user) return permissions;
  
  // Basic permissions for all users
  permissions.push('asset_entry', 'daily_report', 'error_reports');
  
  // NQ department permissions
  if (isNqUser(user)) {
    permissions.push(
      'borrow_report',
      'asset_reminders', 
      'crc_reminders',
      'other_assets',
      'send_notifications',
      'view_all_transactions',
      'manage_notifications',
      'export_data'
    );
  }
  
  // Admin permissions
  if (isAdmin(user)) {
    permissions.push(
      'borrow_report',
      'asset_reminders',
      'crc_reminders', 
      'other_assets',
      'data_management',
      'manage_staff',
      'delete_data',
      'send_notifications',
      'view_all_transactions',
      'delete_transactions',
      'security_logs',
      'reset_passwords',
      'manage_notifications',
      'export_data',
      'import_data'
    );
  }
  
  return permissions;
}

export function checkMultiplePermissions(user: Staff | null, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

export function checkAnyPermission(user: Staff | null, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}