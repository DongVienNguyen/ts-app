import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { restoreService, RestoreResult } from '@/services/restoreService';
import { backupService } from '@/services/backupService';

interface BackupStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastBackup: string | null;
  autoBackupEnabled: boolean;
  error: string | null;
  estimatedTimeRemaining: number | null;
}

interface BackupItem {
  id: string;
  name: string;
  description: string;
  size: string;
  lastBackup: string;
  status: 'success' | 'error' | 'pending' | 'running';
  recordCount?: number;
}

interface RestoreStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastRestore: string | null;
  error: string | null;
  estimatedTimeRemaining: number | null;
}

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  filename?: string;
  size?: number;
  duration: number;
  success: boolean;
  error?: string;
}

export const useBackupOperations = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastBackup: null,
    autoBackupEnabled: false,
    error: null,
    estimatedTimeRemaining: null
  });

  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastRestore: null,
    error: null,
    estimatedTimeRemaining: null
  });

  const [backupItems, setBackupItems] = useState<BackupItem[]>([
    {
      id: 'database',
      name: 'Database Tables',
      description: 'All database tables and data',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending',
      recordCount: 0
    },
    {
      id: 'functions',
      name: 'Edge Functions',
      description: 'Supabase Edge Functions metadata',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    },
    {
      id: 'config',
      name: 'Configuration',
      description: 'App configuration and settings',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    },
    {
      id: 'security',
      name: 'Security Data',
      description: 'Security events and monitoring data',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    }
  ]);

  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);

  useEffect(() => {
    console.log('🔄 Initializing backup operations...');
    loadBackupHistory();
    checkAutoBackupStatus();
    loadBackupStats();
  }, []);

  const loadBackupHistory = useCallback(async () => {
    try {
      console.log('📊 Loading backup history...');
      const lastBackup = localStorage.getItem('lastBackupTime');
      const lastRestore = localStorage.getItem('lastRestoreTime');
      const autoEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      
      // Load backup history from localStorage
      const historyData = localStorage.getItem('backupHistory');
      const history = historyData ? JSON.parse(historyData) : [];
      
      setBackupStatus(prev => ({
        ...prev,
        lastBackup,
        autoBackupEnabled: autoEnabled,
        error: null
      }));

      setRestoreStatus(prev => ({
        ...prev,
        lastRestore,
        error: null
      }));

      setBackupHistory(history);

      // Update backup items with last backup time
      if (lastBackup) {
        setBackupItems(prev => prev.map(item => ({
          ...item,
          lastBackup: new Date(lastBackup).toLocaleDateString('vi-VN'),
          status: 'success' as const
        })));
      }

      console.log('✅ Backup history loaded:', { lastBackup, lastRestore, autoEnabled, historyCount: history.length });
    } catch (error) {
      console.error('❌ Error loading backup history:', error);
      setBackupStatus(prev => ({ ...prev, error: 'Failed to load backup history' }));
    }
  }, []);

  const loadBackupStats = useCallback(async () => {
    try {
      console.log('📊 Loading backup statistics...');
      const stats = await backupService.getBackupStats();
      
      setBackupItems(prev => prev.map(item => {
        switch (item.id) {
          case 'database':
            return {
              ...item,
              size: `${(stats.estimatedSize / 1024 / 1024).toFixed(2)} MB`,
              recordCount: stats.totalRecords
            };
          default:
            return item;
        }
      }));

      console.log('✅ Backup stats loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading backup stats:', error);
    }
  }, []);

  const checkAutoBackupStatus = useCallback(() => {
    const lastAutoBackup = localStorage.getItem('lastAutoBackup');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (!lastAutoBackup || new Date(lastAutoBackup) < yesterday) {
      if (backupStatus.autoBackupEnabled) {
        console.log('⏰ Auto backup is due, scheduling...');
        // Schedule auto backup for next 2 AM
        const nextBackup = new Date();
        nextBackup.setDate(nextBackup.getDate() + 1);
        nextBackup.setHours(2, 0, 0, 0);
        
        const timeUntilBackup = nextBackup.getTime() - now.getTime();
        setTimeout(() => performBackup(true), Math.min(timeUntilBackup, 5000));
      }
    }
  }, [backupStatus.autoBackupEnabled]);

  const updateProgress = useCallback((progress: number, step: string, estimatedTime?: number) => {
    console.log(`📈 Backup progress: ${progress}% - ${step}`);
    setBackupStatus(prev => ({
      ...prev,
      progress,
      currentStep: step,
      estimatedTimeRemaining: estimatedTime || null,
      error: null
    }));
  }, []);

  const updateRestoreProgress = useCallback((progress: number, step: string, estimatedTime?: number) => {
    console.log(`📈 Restore progress: ${progress}% - ${step}`);
    setRestoreStatus(prev => ({
      ...prev,
      progress,
      currentStep: step,
      estimatedTimeRemaining: estimatedTime || null,
      error: null
    }));
  }, []);

  const performBackup = useCallback(async (isAuto: boolean = false) => {
    if (backupStatus.isRunning) {
      console.log('⚠️ Backup already running, skipping...');
      toast.warning('Backup đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting backup process...', { isAuto });
    const startTime = Date.now();
    
    setBackupStatus(prev => ({ 
      ...prev, 
      isRunning: true, 
      progress: 0, 
      error: null,
      estimatedTimeRemaining: 30000 // 30 seconds estimate
    }));
    
    // Update backup items to show running status
    setBackupItems(prev => prev.map(item => ({
      ...item,
      status: 'running' as const
    })));
    
    try {
      updateProgress(5, 'Khởi tạo backup...', 25000);
      
      updateProgress(15, 'Đang backup database...', 20000);
      
      updateProgress(40, 'Đang backup configuration...', 15000);
      
      updateProgress(60, 'Đang backup functions metadata...', 10000);
      
      updateProgress(80, 'Đang tạo file ZIP...', 5000);
      
      // Use the backup service
      const result = await backupService.createFullBackup({
        compress: true,
        includeSystemData: true
      });

      if (result.success) {
        updateProgress(100, 'Backup hoàn tất thành công!', 0);
        
        // Update backup history
        const now = new Date().toISOString();
        const duration = Date.now() - startTime;
        
        const backupRecord: BackupRecord = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: isAuto ? 'automatic' : 'manual',
          filename: result.filename,
          size: result.size,
          duration,
          success: true
        };
        
        // Save to localStorage
        localStorage.setItem('lastBackupTime', now);
        if (isAuto) {
          localStorage.setItem('lastAutoBackup', now);
        }
        
        const existingHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        const newHistory = [backupRecord, ...existingHistory].slice(0, 10); // Keep last 10
        localStorage.setItem('backupHistory', JSON.stringify(newHistory));
        
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: now,
          isRunning: false,
          estimatedTimeRemaining: null
        }));
        
        setBackupHistory(newHistory);
        
        // Update backup items status
        const sizeInMB = result.size ? (result.size / 1024 / 1024).toFixed(2) : '0';
        setBackupItems(prev => prev.map(item => ({
          ...item,
          status: 'success' as const,
          lastBackup: new Date(now).toLocaleDateString('vi-VN'),
          size: item.id === 'database' ? `${sizeInMB} MB` : item.size
        })));
        
        toast.success(
          isAuto 
            ? `Auto backup hoàn tất! (${(duration / 1000).toFixed(1)}s)` 
            : `Manual backup hoàn tất! (${(duration / 1000).toFixed(1)}s)`
        );
        console.log('✅ Backup completed successfully:', result);
      } else {
        throw new Error(result.error || 'Backup thất bại');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      
      console.error('❌ Backup failed:', error);
      setBackupStatus(prev => ({ 
        ...prev, 
        isRunning: false,
        progress: 0,
        currentStep: '',
        error: errorMessage,
        estimatedTimeRemaining: null
      }));
      
      // Update backup items to show error
      setBackupItems(prev => prev.map(item => ({
        ...item,
        status: 'error' as const
      })));
      
      // Save failed backup record
      const failedRecord: BackupRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: isAuto ? 'automatic' : 'manual',
        duration,
        success: false,
        error: errorMessage
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      const newHistory = [failedRecord, ...existingHistory].slice(0, 10);
      localStorage.setItem('backupHistory', JSON.stringify(newHistory));
      setBackupHistory(newHistory);
      
      toast.error(`Backup thất bại: ${errorMessage} (${(duration / 1000).toFixed(1)}s)`);
    }
  }, [backupStatus.isRunning, updateProgress]);

  const performRestore = useCallback(async (file: File): Promise<void> => {
    if (restoreStatus.isRunning) {
      console.log('⚠️ Restore already running, skipping...');
      toast.warning('Restore đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting restore process...', { fileName: file.name, fileSize: file.size });
    const startTime = Date.now();
    
    setRestoreStatus(prev => ({ 
      ...prev, 
      isRunning: true, 
      progress: 0, 
      error: null,
      estimatedTimeRemaining: 60000 // 60 seconds estimate
    }));

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
        const now = new Date().toISOString();
        const duration = Date.now() - startTime;
        
        localStorage.setItem('lastRestoreTime', now);
        
        setRestoreStatus(prev => ({
          ...prev,
          lastRestore: now,
          isRunning: false,
          progress: 100,
          currentStep: 'Restore hoàn tất thành công!',
          estimatedTimeRemaining: null
        }));

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
      setRestoreStatus(prev => ({ 
        ...prev, 
        isRunning: false,
        progress: 0,
        currentStep: '',
        error: errorMessage,
        estimatedTimeRemaining: null
      }));
      
      toast.error(`Restore thất bại: ${errorMessage} (${(duration / 1000).toFixed(1)}s)`);
      throw error;
    }
  }, [restoreStatus.isRunning, updateRestoreProgress]);

  const toggleAutoBackup = useCallback(async (enabled: boolean) => {
    console.log('🔄 Toggling auto backup:', enabled);
    setBackupStatus(prev => ({ ...prev, autoBackupEnabled: enabled }));
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    
    if (enabled) {
      toast.success('Auto backup đã bật - backup hàng ngày lúc 2:00 AM');
      // Setup auto backup scheduler
      backupService.setupAutoBackup();
    } else {
      toast.info('Auto backup đã tắt');
    }
  }, []);

  // Debug logging with more details
  console.log('🔍 useBackupOperations state:', {
    backupRunning: backupStatus.isRunning,
    backupProgress: backupStatus.progress,
    restoreRunning: restoreStatus.isRunning,
    restoreProgress: restoreStatus.progress,
    backupItemsCount: backupItems.length,
    autoBackupEnabled: backupStatus.autoBackupEnabled,
    lastBackup: backupStatus.lastBackup,
    lastRestore: restoreStatus.lastRestore,
    historyCount: backupHistory.length,
    errors: {
      backup: backupStatus.error,
      restore: restoreStatus.error
    }
  });

  return {
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory,
    loadBackupStats
  };
};