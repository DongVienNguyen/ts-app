import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const BackupInfoAlert: React.FC = () => {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Backup Information:</strong>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• Full system backup includes database, configuration, and metadata</li>
          <li>• Auto backup runs daily at 2:00 AM when enabled</li>
          <li>• Backup files are downloaded as ZIP archives</li>
          <li>• Keep backup files in a safe location for disaster recovery</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default BackupInfoAlert;