import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackupHeader from '@/components/backup/BackupHeader';
import BackupStatusCard from '@/components/backup/BackupStatusCard';
import BackupActionsCard from '@/components/backup/BackupActionsCard';
import BackupComponentsCard from '@/components/backup/BackupComponentsCard';
import BackupInfoAlert from '@/components/backup/BackupInfoAlert';
import RestoreActionsCard from '@/components/backup/RestoreActionsCard';
import RestorePreviewCard from '@/components/backup/RestorePreviewCard';
import { useBackupOperations } from '@/hooks/useBackupOperations';

const SystemBackup: React.FC = () => {
  const {
    backupStatus,
    restoreStatus,
    backupItems,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory
  } = useBackupOperations();

  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  const handlePerformBackup = () => {
    performBackup(false);
  };

  const handlePerformRestore = async (file: File) => {
    setSelectedRestoreFile(file);
    await performRestore(file);
  };

  return (
    <div className="container-mobile py-responsive space-responsive-y">
      <BackupHeader />
      
      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="backup" className="space-y-6 mt-6">
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
        </TabsContent>
        
        <TabsContent value="restore" className="space-y-6 mt-6">
          <RestorePreviewCard
            selectedFile={selectedRestoreFile}
          />
          
          <RestoreActionsCard
            onRestore={handlePerformRestore}
          />
          
          {restoreStatus.lastRestore && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Restore cuối cùng:</strong> {new Date(restoreStatus.lastRestore).toLocaleString('vi-VN')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemBackup;