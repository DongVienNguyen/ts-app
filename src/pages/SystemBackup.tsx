import React from 'react';
import BackupHeader from '@/components/backup/BackupHeader';
import BackupStatusCard from '@/components/backup/BackupStatusCard';
import BackupActionsCard from '@/components/backup/BackupActionsCard';
import BackupComponentsCard from '@/components/backup/BackupComponentsCard';
import BackupInfoAlert from '@/components/backup/BackupInfoAlert';
import { useBackupOperations } from '@/hooks/useBackupOperations';

const SystemBackup: React.FC = () => {
  const {
    backupStatus,
    backupItems,
    performBackup,
    toggleAutoBackup,
    loadBackupHistory
  } = useBackupOperations();

  const handlePerformBackup = () => {
    performBackup(false);
  };

  return (
    <div className="container-mobile py-responsive space-responsive-y">
      <BackupHeader />
      
      <BackupStatusCard
        backupStatus={backupStatus}
        onToggleAutoBackup={toggleAutoBackup}
      />
      
      <BackupActionsCard
        isRunning={backupStatus.isRunning}
        onPerformBackup={handlePerformBackup}
        onRefreshStatus={loadBackupHistory}
      />
      
      <BackupComponentsCard
        backupItems={backupItems}
      />
      
      <BackupInfoAlert />
    </div>
  );
};

export default SystemBackup;