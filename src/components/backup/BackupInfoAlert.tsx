import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const BackupInfoAlert: React.FC = () => {
  return (
    <Alert className="mt-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>Important:</strong> Backups include all database data, configuration settings, and system metadata. 
        For complete restoration, you'll also need to backup your source code repository and environment variables separately.
        Auto backups run daily at 2:00 AM when enabled.
      </AlertDescription>
    </Alert>
  );
};

export default BackupInfoAlert;