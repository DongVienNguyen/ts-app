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
import Layout from '@/components/Layout';

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
    console.log('🔄 SystemBackup: Starting backup process...');
    performBackup(false);
  };

  const handlePerformRestore = async (file: File) => {
    console.log('🔄 SystemBackup: Starting restore process with file:', file.name);
    setSelectedRestoreFile(file);
    await performRestore(file);
  };

  const handleRefreshStatus = () => {
    console.log('🔄 SystemBackup: Refreshing backup status...');
    loadBackupHistory();
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    console.log('🔄 SystemBackup: Toggling auto backup:', enabled);
    toggleAutoBackup(enabled);
  };

  console.log('🔍 SystemBackup DEBUG:', {
    backupStatus,
    restoreStatus,
    backupItemsCount: backupItems?.length || 0,
    selectedRestoreFile: selectedRestoreFile?.name || null
  });

  return (
    <Layout>
      <div className="space-y-6">
        <BackupHeader />
        
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-6 mt-6">
            <BackupStatusCard
              backupStatus={backupStatus}
              onToggleAutoBackup={handleToggleAutoBackup}
            />
            
            <BackupActionsCard
              isRunning={backupStatus.isRunning}
              progress={backupStatus.progress}
              currentStep={backupStatus.currentStep}
              onPerformBackup={handlePerformBackup}
              onRefreshStatus={handleRefreshStatus}
            />
            
            <BackupComponentsCard
              backupItems={backupItems || []}
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
                  <strong>Last Restore:</strong> {new Date(restoreStatus.lastRestore).toLocaleString('vi-VN')}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SystemBackup;