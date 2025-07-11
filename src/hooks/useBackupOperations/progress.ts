import type { BackupProgressCallback } from './types';

export const createProgressManager = (
  updateBackupProgress: BackupProgressCallback,
  updateRestoreProgress: BackupProgressCallback
) => {
  const updateBackupProgressWithLog = (progress: number, step: string, estimatedTime?: number) => {
    console.log(`📈 Backup progress: ${progress}% - ${step}`);
    updateBackupProgress(progress, step, estimatedTime);
  };

  const updateRestoreProgressWithLog = (progress: number, step: string, estimatedTime?: number) => {
    console.log(`📈 Restore progress: ${progress}% - ${step}`);
    updateRestoreProgress(progress, step, estimatedTime);
  };

  const createBackupProgressSteps = (backupType: string) => {
    const steps = {
      full: [
        { progress: 5, step: `Khởi tạo ${backupType} backup...`, time: 25000 },
        { progress: 15, step: 'Đang backup database...', time: 20000 },
        { progress: 40, step: 'Đang backup configuration...', time: 15000 },
        { progress: 60, step: 'Đang backup functions metadata...', time: 10000 },
        { progress: 80, step: 'Đang tạo file ZIP...', time: 5000 },
        { progress: 100, step: `${backupType} backup hoàn tất thành công!`, time: 0 }
      ],
      selective: [
        { progress: 25, step: `Đang backup ${backupType}...`, time: 15000 },
        { progress: 60, step: 'Đang xử lý dữ liệu...', time: 10000 },
        { progress: 80, step: 'Đang tạo file ZIP...', time: 5000 },
        { progress: 100, step: `${backupType} backup hoàn tất thành công!`, time: 0 }
      ]
    };

    return backupType === 'full' ? steps.full : steps.selective;
  };

  const executeProgressSteps = async (
    steps: Array<{ progress: number; step: string; time: number }>,
    progressCallback: BackupProgressCallback,
    operation: () => Promise<any>
  ) => {
    // Execute initial steps
    for (let i = 0; i < steps.length - 1; i++) {
      const step = steps[i];
      progressCallback(step.progress, step.step, step.time);
      
      if (i === 0) {
        // Start the actual operation after the first progress update
        await operation();
      }
      
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final step
    const finalStep = steps[steps.length - 1];
    progressCallback(finalStep.progress, finalStep.step, finalStep.time);
  };

  return {
    updateBackupProgressWithLog,
    updateRestoreProgressWithLog,
    createBackupProgressSteps,
    executeProgressSteps
  };
};