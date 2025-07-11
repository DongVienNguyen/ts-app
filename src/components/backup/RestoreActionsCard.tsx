import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RestoreStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  success: boolean;
}

interface RestoreActionsCardProps {
  onRestore: (file: File) => Promise<void>;
}

const RestoreActionsCard: React.FC<RestoreActionsCardProps> = ({ onRestore }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    error: null,
    success: false
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setRestoreStatus(prev => ({ ...prev, error: null, success: false }));
      } else {
        toast.error('Vui lòng chọn file backup (.zip)');
      }
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file backup');
      return;
    }

    setRestoreStatus({
      isRunning: true,
      progress: 0,
      currentStep: 'Đang khởi tạo quá trình restore...',
      error: null,
      success: false
    });

    try {
      await onRestore(selectedFile);
      setRestoreStatus(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        currentStep: 'Restore hoàn tất!',
        success: true
      }));
      toast.success('Restore dữ liệu thành công!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setRestoreStatus(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage
      }));
      toast.error('Restore thất bại: ' + errorMessage);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Restore System
        </CardTitle>
        <CardDescription>
          Khôi phục hệ thống từ file backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="backup-file">Chọn file backup (.zip)</Label>
          <Input
            id="backup-file"
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            disabled={restoreStatus.isRunning}
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {restoreStatus.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{restoreStatus.currentStep}</span>
              <span>{restoreStatus.progress}%</span>
            </div>
            <Progress value={restoreStatus.progress} className="w-full" />
          </div>
        )}

        {/* Error Alert */}
        {restoreStatus.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Lỗi restore:</strong> {restoreStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {restoreStatus.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Thành công:</strong> Dữ liệu đã được restore thành công!
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cảnh báo:</strong> Quá trình restore sẽ ghi đè lên dữ liệu hiện tại. 
            Vui lòng đảm bảo bạn đã backup dữ liệu hiện tại trước khi thực hiện restore.
          </AlertDescription>
        </Alert>

        {/* Action Button */}
        <Button
          onClick={handleRestore}
          disabled={!selectedFile || restoreStatus.isRunning}
          className="w-full"
          variant={restoreStatus.success ? "outline" : "default"}
        >
          <Upload className="mr-2 h-4 w-4" />
          {restoreStatus.isRunning ? 'Đang restore...' : 'Bắt đầu Restore'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RestoreActionsCard;