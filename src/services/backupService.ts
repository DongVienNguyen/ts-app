import { BackupOrchestrator } from './backup/backupOrchestrator';
import { TableBackup } from './backup/tableBackup';
import { DatabaseBackup } from './backup/databaseBackup';
import { ConfigBackup } from './backup/configBackup';
import { SecurityBackup } from './backup/securityBackup';
import { FunctionsBackup } from './backup/functionsBackup';
import { ZipManager } from './backup/zipManager';
import { BackupOptions, BackupResult, BackupStats } from './backup/types';

export class BackupService {
  private static instance: BackupService;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Create selective backup based on type
   */
  async createSelectiveBackup(backupType: string, options: BackupOptions = {}): Promise<BackupResult> {
    return BackupOrchestrator.createSelectiveBackup(backupType, options);
  }

  /**
   * Create complete system backup
   */
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    return BackupOrchestrator.createFullBackup(options);
  }

  /**
   * Create database backup
   */
  async createDatabaseBackup(options: BackupOptions = {}): Promise<any> {
    return DatabaseBackup.createDatabaseBackup(options);
  }

  /**
   * Create configuration backup
   */
  async createConfigBackup(): Promise<any> {
    return ConfigBackup.createConfigBackup();
  }

  /**
   * Create functions backup
   */
  async createFunctionsBackup(): Promise<any> {
    return FunctionsBackup.createFunctionsBackup();
  }

  /**
   * Create security backup
   */
  async createSecurityBackup(): Promise<any> {
    return SecurityBackup.createSecurityBackup();
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<BackupStats> {
    return TableBackup.getAllTableStats();
  }

  /**
   * Validate backup file
   */
  async validateBackupFile(file: File, expectedType?: string): Promise<{
    valid: boolean;
    type?: string;
    errors: string[];
  }> {
    return BackupOrchestrator.validateBackupFile(file, expectedType);
  }

  /**
   * Extract backup file contents
   */
  async extractBackupFile(file: File): Promise<{ [path: string]: string }> {
    return ZipManager.extractZipFile(file);
  }

  /**
   * Get ZIP file information
   */
  async getBackupFileInfo(file: File): Promise<{
    totalFiles: number;
    totalSize: number;
    files: { path: string; size: number }[];
  }> {
    return ZipManager.getZipInfo(file);
  }

  /**
   * Schedule automatic backup
   */
  setupAutoBackup(): void {
    console.log('⏰ Setting up auto backup scheduler...');
    
    const checkAndBackup = async () => {
      const autoEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      if (!autoEnabled) return;

      const lastAutoBackup = localStorage.getItem('lastAutoBackup');
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastAutoBackup || new Date(lastAutoBackup) < yesterday) {
        // Check if it's around 2 AM (within 1 hour window)
        const hour = now.getHours();
        if (hour >= 2 && hour <= 3) {
          console.log('🔄 Starting automatic backup...');
          const result = await this.createFullBackup();
          
          if (result.success) {
            localStorage.setItem('lastAutoBackup', now.toISOString());
            console.log('✅ Automatic backup completed');
          } else {
            console.error('❌ Automatic backup failed:', result.error);
          }
        }
      }
    };

    // Check every hour
    setInterval(checkAndBackup, 60 * 60 * 1000);
    
    // Initial check after 5 minutes
    setTimeout(checkAndBackup, 5 * 60 * 1000);
    
    console.log('✅ Auto backup scheduler initialized');
  }
}

// Export singleton instance and types
export const backupService = BackupService.getInstance();
export type { BackupOptions, BackupResult, BackupStats };