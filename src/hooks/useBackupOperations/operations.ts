import { toast } from 'sonner';
import { backupService } from '@/services/backupService';
import { restoreService, RestoreResult } from '@/services/restoreService';
import type { BackupRecord, BackupProgressCallback } from './types';

export const createBackupOperations = (
  canAccess: boolean,
  isBackupRunning: boolean,
  isRestoreRunning: boolean,
  updateBackupProgress: BackupProgressCallback,
  updateRestoreProgress: BackupProgressCallback,
  saveBackupRecord: (record: BackupRecord, isAuto?: boolean) => BackupRecord[],
  onBackupStart: () => void,
  onBackupComplete: (record: BackupRecord, history: BackupRecord[]) => void,
  onBackupError: (error: string, record: BackupRecord, history: BackupRecord[]) => void,
  onRestoreStart: () => void,
  onRestoreComplete: (result: RestoreResult) => void,
  onRestoreError: (error: string) => void
) => {
  const performBackup = async (isAuto: boolean = false, backupType: string = 'full') => {
    if (!canAccess) {
      toast.error('Access denied: Admin role required');
      return;
    }

    if (isBackupRunning) {
      console.log('⚠️ Backup already running, skipping...');
      toast.warning('Backup đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting backup process...', { isAuto, backupType });
    const startTime = Date.now();
    
    onBackupStart();
    
    try {
      updateBackupProgress(5, `Khởi tạo ${backupType} backup...`, 25000);
      
      let result;
      if (backupType === 'full') {
        updateBackupProgress(15, 'Đang backup database...', 20000);
        updateBackupProgress(40, 'Đang backup configuration...', 15000);
        updateBackupProgress(60, 'Đang backup functions metadata...', 10000);
        updateBackupProgress(80, 'Đang tạo file ZIP...', 5000);
        
        result = await backupService.createFullBackup({
          compress: true,
          includeSystemData: true
        });
      } else {
        updateBackupProgress(25, `Đang backup ${backupType}...`, 15000);
        updateBackupProgress(60, 'Đang xử lý dữ liệu...', 10000);
        updateBackupProgress(80, 'Đang tạo file ZIP...', 5000);
        
        result = await backupService.createSelectiveBackup(backupType, {
          compress: true,
          exportFormat: backupType === 'database' ? 'csv' : 'json'
        });
      }

      if (result.success) {
        updateBackupProgress(100, `${backupType} backup hoàn tất thành công!`, 0);
        
        const now = new Date().toISOString();
        const duration = Date.now() - startTime;
        
        const backupRecord: BackupRecord = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: isAuto ? 'automatic' : 'manual',
          backupType: backupType,
          filename: result.filename,
          size: result.size,
          duration,
          success: true
        };
        
        const newHistory = saveBackupRecord(backupRecord, isAuto);
        onBackupComplete(backupRecord, newHistory);
        
        toast.success(
          `${backupType} backup hoàn tất! (${(duration / 1000).toFixed(1)}s)`
        );
        console.log('✅ Backup completed successfully:', result);
      } else {
        throw new Error(result.error || 'Backup thất bại');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      
      console.error('❌ Backup failed:', error);
      
      const failedRecord: BackupRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: isAuto ? 'automatic' : 'manual',
        backupType: backupType,
        duration,
        success: false,
        error: errorMessage
      };
      
      const newHistory = saveBackupRecord(failedRecord, isAuto);
      onBackupError(errorMessage, failedRecord, newHistory);
      
      toast.error(`${backupType} backup thất bại: ${errorMessage} (${(duration / 1000).toFixed(1)}s)`);
    }
  };

  const performRestore = async (file: File): Promise<void> => {
    if (!canAccess) {
      toast.error('Access denied: Admin role required');
      return;
    }

    if (isRestoreRunning) {
      console.log('⚠️ Restore already running, skipping...');
      toast.warning('Restore đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting restore process...', { fileName: file.name, fileSize: file.size });
    const startTime = Date.now();
    
    onRestoreStart();

    try {
      const result: RestoreResult = await restoreService.restoreFromFile(
        file,
        {
          createBackupBeforeRestore: true,
          validateData: true
        },
        (progress, step) => updateRestoreProgress(progress, step, Math.max(0, 60000 - (Date.now() - startTime)))
      );

      if (result.success) {
        const duration = Date.now() - startTime;
        
        onRestoreComplete(result);

        toast.success(`Restore thành công! Đã khôi phục ${result.restoredTables.length} bảng dữ liệu. (${(duration / 1000).toFixed(1)}s)`);
        console.log('✅ Restore completed successfully:', result);
        
        // Refresh the page after successful restore
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(`Restore thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      
      console.error('❌ Restore failed:', error);
      onRestoreError(errorMessage);
      
      toast.error(`Restore thất bại: ${errorMessage} (${(duration / 1000).toFixed(1)}s)`);
      throw error;
    }
  };

  return {
    performBackup,
    performRestore
  };
};