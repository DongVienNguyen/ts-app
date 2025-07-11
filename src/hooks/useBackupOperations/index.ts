import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSecureAuth } from '@/contexts/AuthContext';
import { backupService } from '@/services/backupService';

import { useBackupState } from './state';
import { createProgressManager } from './progress';
import { createBackupDataManager } from './dataManager';
import { createBackupOperations } from './operations';
import type { BackupOperationsReturn, BackupRecord } from './types';

export const useBackupOperations = (): BackupOperationsReturn => {
  const { user } = useSecureAuth();
  const canAccess = user?.role === 'admin';

  // State management
  const {
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    dataCache,
    updateBackupStatus,
    updateRestoreStatus,
    updateBackupItems,
    setBackupHistory,
    clearCache,
    getCachedData,
    setCachedData
  } = useBackupState();

  // Data management
  const dataManager = createBackupDataManager();

  // Progress management
  const progressManager = createProgressManager(
    (progress, step, estimatedTime) => {
      updateBackupStatus({
        progress,
        currentStep: step,
        estimatedTimeRemaining: estimatedTime || null,
        error: null
      });
    },
    (progress, step, estimatedTime) => {
      updateRestoreStatus({
        progress,
        currentStep: step,
        estimatedTimeRemaining: estimatedTime || null,
        error: null
      });
    }
  );

  // Load backup history - chỉ load khi cần
  const loadBackupHistory = useCallback(async () => {
    if (!canAccess) return;

    const cached = getCachedData('backup-history');
    if (cached) {
      setBackupHistory(cached.data.history);
      updateBackupStatus({
        lastBackup: cached.data.lastBackup,
        autoBackupEnabled: cached.data.autoEnabled
      });
      updateRestoreStatus({
        lastRestore: cached.data.lastRestore
      });
      return;
    }

    try {
      console.log('📊 Loading backup history...');
      const storageData = dataManager.loadBackupHistoryFromStorage();
      
      updateBackupStatus({
        lastBackup: storageData.lastBackup,
        autoBackupEnabled: storageData.autoEnabled,
        error: null
      });

      updateRestoreStatus({
        lastRestore: storageData.lastRestore,
        error: null
      });

      setBackupHistory(storageData.history);

      // Update backup items with last backup time
      if (storageData.lastBackup) {
        updateBackupItems(prev => prev.map(item => ({
          ...item,
          lastBackup: new Date(storageData.lastBackup!).toLocaleDateString('vi-VN'),
          status: 'success' as const
        })));
      }

      // Cache data
      setCachedData('backup-history', {
        history: storageData.history,
        lastBackup: storageData.lastBackup,
        lastRestore: storageData.lastRestore,
        autoEnabled: storageData.autoEnabled
      });

      console.log('✅ Backup history loaded:', {
        lastBackup: storageData.lastBackup,
        lastRestore: storageData.lastRestore,
        autoEnabled: storageData.autoEnabled,
        historyCount: storageData.history.length
      });
    } catch (error) {
      console.error('❌ Error loading backup history:', error);
      updateBackupStatus({ error: 'Failed to load backup history' });
    }
  }, [canAccess, getCachedData, setCachedData, updateBackupStatus, updateRestoreStatus, setBackupHistory, updateBackupItems, dataManager]);

  // Load backup stats - chỉ khi cần thiết
  const loadBackupStats = useCallback(async () => {
    if (!canAccess) return;

    const cached = getCachedData('backup-stats');
    if (cached) {
      updateBackupItems(prev => prev.map(item => {
        if (item.id === 'database') {
          return {
            ...item,
            size: cached.data.size,
            recordCount: cached.data.recordCount
          };
        }
        return item;
      }));
      return;
    }

    const stats = await dataManager.loadBackupStats();
    
    updateBackupItems(prev => prev.map(item => {
      if (item.id === 'database') {
        return {
          ...item,
          size: stats.size,
          recordCount: stats.recordCount
        };
      }
      return item;
    }));

    // Cache stats
    setCachedData('backup-stats', stats);
  }, [canAccess, getCachedData, setCachedData, updateBackupItems, dataManager]);

  // Check auto backup status
  const checkAutoBackupStatus = useCallback(() => {
    if (!canAccess) return;

    if (dataManager.checkAutoBackupStatus(backupStatus.autoBackupEnabled)) {
      dataManager.scheduleAutoBackup((isAuto) => operations.performBackup(isAuto));
    }
  }, [canAccess, backupStatus.autoBackupEnabled, dataManager]);

  // Backup operations
  const operations = createBackupOperations(
    canAccess,
    backupStatus.isRunning,
    restoreStatus.isRunning,
    progressManager.updateBackupProgressWithLog,
    progressManager.updateRestoreProgressWithLog,
    dataManager.saveBackupRecord,
    // onBackupStart
    () => {
      updateBackupStatus({
        isRunning: true,
        progress: 0,
        error: null,
        estimatedTimeRemaining: 30000
      });
      updateBackupItems(prev => prev.map(item => ({
        ...item,
        status: 'running' as const
      })));
    },
    // onBackupComplete
    (record: BackupRecord, history: BackupRecord[]) => {
      updateBackupStatus({
        lastBackup: record.timestamp,
        isRunning: false,
        estimatedTimeRemaining: null,
        currentBackupType: undefined
      });
      
      setBackupHistory(history);
      
      const sizeInMB = record.size ? (record.size / 1024 / 1024).toFixed(2) : '0';
      updateBackupItems(prev => prev.map(item => ({
        ...item,
        status: 'success' as const,
        lastBackup: new Date(record.timestamp).toLocaleDateString('vi-VN'),
        size: item.id === 'database' ? `${sizeInMB} MB` : item.size
      })));
      
      clearCache();
    },
    // onBackupError
    (error: string, record: BackupRecord, history: BackupRecord[]) => {
      updateBackupStatus({
        isRunning: false,
        progress: 0,
        currentStep: '',
        error,
        estimatedTimeRemaining: null,
        currentBackupType: undefined
      });
      
      updateBackupItems(prev => prev.map(item => ({
        ...item,
        status: 'error' as const
      })));
      
      setBackupHistory(history);
    },
    // onRestoreStart
    () => {
      updateRestoreStatus({
        isRunning: true,
        progress: 0,
        error: null,
        estimatedTimeRemaining: 60000
      });
    },
    // onRestoreComplete
    (result) => {
      const now = new Date().toISOString();
      localStorage.setItem('lastRestoreTime', now);
      
      updateRestoreStatus({
        lastRestore: now,
        isRunning: false,
        progress: 100,
        currentStep: 'Restore hoàn tất thành công!',
        estimatedTimeRemaining: null
      });

      clearCache();
    },
    // onRestoreError
    (error: string) => {
      updateRestoreStatus({
        isRunning: false,
        progress: 0,
        currentStep: '',
        error,
        estimatedTimeRemaining: null
      });
    }
  );

  // Toggle auto backup
  const toggleAutoBackup = useCallback(async (enabled: boolean) => {
    if (!canAccess) {
      toast.error('Access denied: Admin role required');
      return;
    }

    console.log('🔄 Toggling auto backup:', enabled);
    updateBackupStatus({ autoBackupEnabled: enabled });
    dataManager.toggleAutoBackupSetting(enabled);
    
    clearCache();
    
    if (enabled) {
      toast.success('Auto backup đã bật - backup hàng ngày lúc 2:00 AM');
      backupService.setupAutoBackup();
    } else {
      toast.info('Auto backup đã tắt');
    }
  }, [canAccess, updateBackupStatus, dataManager, clearCache]);

  // Initialize - chỉ load cơ bản
  useEffect(() => {
    if (canAccess) {
      console.log('🔄 Initializing backup operations...');
      loadBackupHistory();
      checkAutoBackupStatus();
    } else {
      // Clear data if user doesn't have access
      setBackupHistory([]);
      updateBackupStatus({
        lastBackup: null,
        autoBackupEnabled: false,
        error: canAccess === false ? 'Access denied: Admin role required' : null
      });
    }
  }, [canAccess, loadBackupHistory, checkAutoBackupStatus]);

  return {
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    dataCache,
    canAccess,
    performBackup: operations.performBackup,
    performRestore: operations.performRestore,
    toggleAutoBackup,
    loadBackupHistory,
    loadBackupStats
  };
};

// Export types for external use
export type * from './types';