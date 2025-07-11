export interface BackupStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastBackup: string | null;
  autoBackupEnabled: boolean;
  error: string | null;
  estimatedTimeRemaining: number | null;
  currentBackupType?: string;
}

export interface BackupItem {
  id: string;
  name: string;
  description: string;
  size: string;
  lastBackup: string;
  status: 'success' | 'error' | 'pending' | 'running';
  recordCount?: number;
}

export interface RestoreStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastRestore: string | null;
  error: string | null;
  estimatedTimeRemaining: number | null;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  backupType?: string;
  filename?: string;
  size?: number;
  duration: number;
  success: boolean;
  error?: string;
}

export interface BackupCache {
  data: any;
  timestamp: number;
}

export type BackupProgressCallback = (progress: number, step: string, estimatedTime?: number) => void;

export interface BackupOperationsState {
  backupStatus: BackupStatus;
  restoreStatus: RestoreStatus;
  backupItems: BackupItem[];
  backupHistory: BackupRecord[];
  dataCache: Map<string, BackupCache>;
}

export interface BackupOperationsActions {
  performBackup: (isAuto?: boolean, backupType?: string) => Promise<void>;
  performRestore: (file: File) => Promise<void>;
  toggleAutoBackup: (enabled: boolean) => Promise<void>;
  loadBackupHistory: () => Promise<void>;
  loadBackupStats: () => Promise<void>;
}

export interface BackupOperationsReturn extends BackupOperationsState, BackupOperationsActions {
  canAccess: boolean;
}