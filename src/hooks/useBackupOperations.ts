import { useState, useEffect } from 'react';
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
}

interface BackupItem {
  id: string;
  name: string;
  description: string;
  size: string;
  lastBackup: string;
  status: 'success' | 'error' | 'pending';
}

interface RestoreStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastRestore: string | null;
}

export const useBackupOperations = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastBackup: null,
    autoBackupEnabled: false
  });

  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastRestore: null
  });

  const [backupItems, setBackupItems] = useState<BackupItem[]>([
    {
      id: 'database',
      name: 'Database Tables',
      description: 'All database tables and data',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
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
      id: 'source',
      name: 'Source Code',
      description: 'Frontend application structure',
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
    }
  ]);

  useEffect(() => {
    console.log('🔄 Initializing backup operations...');
    loadBackupHistory();
    checkAutoBackupStatus();
  }, []);

  const loadBackupHistory = async () => {
    try {
      console.log('📊 Loading backup history...');
      const lastBackup = localStorage.getItem('lastBackupTime');
      const lastRestore = localStorage.getItem('lastRestoreTime');
      const autoEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      
      setBackupStatus(prev => ({
        ...prev,
        lastBackup,
        autoBackupEnabled: autoEnabled
      }));

      setRestoreStatus(prev => ({
        ...prev,
        lastRestore
      }));

      // Update backup items with last backup time
      if (lastBackup) {
        setBackupItems(prev => prev.map(item => ({
          ...item,
          lastBackup: new Date(lastBackup).toLocaleDateString('vi-VN'),
          status: 'success' as const
        })));
      }

      console.log('✅ Backup history loaded:', { lastBackup, lastRestore, autoEnabled });
    } catch (error) {
      console.error('❌ Error loading backup history:', error);
    }
  };

  const checkAutoBackupStatus = () => {
    const lastAutoBackup = localStorage.getItem('lastAutoBackup');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (!lastAutoBackup || new Date(lastAutoBackup) < yesterday) {
      if (backupStatus.autoBackupEnabled) {
        console.log('⏰ Auto backup is due, scheduling...');
        setTimeout(() => performBackup(true), 5000);
      }
    }
  };

  const updateProgress = (progress: number, step: string) => {
    console.log(`📈 Backup progress: ${progress}% - ${step}`);
    setBackupStatus(prev => ({
      ...prev,
      progress,
      currentStep: step
    }));
  };

  const updateRestoreProgress = (progress: number, step: string) => {
    console.log(`📈 Restore progress: ${progress}% - ${step}`);
    setRestoreStatus(prev => ({
      ...prev,
      progress,
      currentStep: step
    }));
  };

  const performBackup = async (isAuto: boolean = false) => {
    if (backupStatus.isRunning) {
      console.log('⚠️ Backup already running, skipping...');
      toast.warning('Backup đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting backup process...', { isAuto });
    setBackupStatus(prev => ({ ...prev, isRunning: true, progress: 0 }));
    
    try {
      updateProgress(5, 'Khởi tạo backup...');
      
      // Use the backup service
      const result = await backupService.createFullBackup({
        compress: true,
        includeSystemData: true
      });

      if (result.success) {
        updateProgress(100, 'Backup hoàn tất thành công!');
        
        // Update backup history
        const now = new Date().toISOString();
        localStorage.setItem('lastBackupTime', now);
        if (isAuto) {
          localStorage.setItem('lastAutoBackup', now);
        }
        
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: now,
          isRunning: false
        }));
        
        // Update backup items status
        const sizeInMB = result.size ? (result.size / 1024 / 1024).toFixed(2) : '0';
        setBackupItems(prev => prev.map(item => ({
          ...item,
          status: 'success' as const,
          lastBackup: new Date(now).toLocaleDateString('vi-VN'),
          size: `${sizeInMB} MB`
        })));
        
        toast.success(isAuto ? 'Auto backup hoàn tất!' : 'Manual backup hoàn tất!');
        console.log('✅ Backup completed successfully:', result);
      } else {
        throw new Error(result.error || 'Backup thất bại');
      }
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      setBackupStatus(prev => ({ 
        ...prev, 
        isRunning: false,
        progress: 0,
        currentStep: ''
      }));
      
      // Update backup items to show error
      setBackupItems(prev => prev.map(item => ({
        ...item,
        status: 'error' as const
      })));
      
      toast.error('Backup thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    }
  };

  const performRestore = async (file: File): Promise<void> => {
    if (restoreStatus.isRunning) {
      console.log('⚠️ Restore already running, skipping...');
      toast.warning('Restore đang chạy, vui lòng đợi...');
      return;
    }

    console.log('🚀 Starting restore process...', { fileName: file.name, fileSize: file.size });
    setRestoreStatus(prev => ({ ...prev, isRunning: true, progress: 0 }));

    try {
      const result: RestoreResult = await restoreService.restoreFromFile(
        file,
        {
          createBackupBeforeRestore: true,
          validateData: true
        },
        updateRestoreProgress
      );

      if (result.success) {
        const now = new Date().toISOString();
        localStorage.setItem('lastRestoreTime', now);
        
        setRestoreStatus(prev => ({
          ...prev,
          lastRestore: now,
          isRunning: false
        }));

        toast.success(`Restore thành công! Đã khôi phục ${result.restoredTables.length} bảng dữ liệu.`);
        console.log('✅ Restore completed successfully:', result);
        
        // Refresh the page after successful restore
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(`Restore thất bại: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      setRestoreStatus(prev => ({ 
        ...prev, 
        isRunning: false,
        progress: 0,
        currentStep: ''
      }));
      throw error;
    }
  };

  const toggleAutoBackup = async (enabled: boolean) => {
    console.log('🔄 Toggling auto backup:', enabled);
    setBackupStatus(prev => ({ ...prev, autoBackupEnabled: enabled }));
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    
    if (enabled) {
      toast.success('Auto backup đã bật - backup hàng ngày lúc 2:00 AM');
    } else {
      toast.info('Auto backup đã tắt');
    }
  };

  // Debug logging
  console.log('🔍 useBackupOperations state:', {
    backupRunning: backupStatus.isRunning,
    restoreRunning: restoreStatus.isRunning,
    backupItemsCount: backupItems.length,
    autoBackupEnabled: backupStatus.autoBackupEnabled,
    lastBackup: backupStatus.lastBackup,
    lastRestore: restoreStatus.lastRestore
  });

  return {
    backupStatus,
    restoreStatus,
    backupItems,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory
  };
};