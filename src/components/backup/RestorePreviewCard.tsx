import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Database, Settings, Calendar, FileText } from 'lucide-react';
import { restoreService } from '@/services/restoreService';
import { toast } from 'sonner';

interface RestorePreviewCardProps {
  selectedFile: File | null;
}

interface PreviewData {
  metadata: any;
  tables: Array<{ name: string; recordCount: number }>;
  hasConfiguration: boolean;
  totalRecords: number;
}

const RestorePreviewCard: React.FC<RestorePreviewCardProps> = ({ selectedFile }) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file backup trước');
      return;
    }

    setIsLoading(true);
    try {
      const previewData = await restoreService.getRestorePreview(selectedFile);
      setPreview(previewData);
    } catch (error) {
      toast.error('Không thể xem trước backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Xem trước Backup
        </CardTitle>
        <CardDescription>
          Xem thông tin chi tiết về file backup trước khi restore
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handlePreview}
          disabled={!selectedFile || isLoading}
          variant="outline"
          className="w-full"
        >
          <Eye className="mr-2 h-4 w-4" />
          {isLoading ? 'Đang tải...' : 'Xem trước Backup'}
        </Button>

        {preview && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            {/* Metadata */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Thông tin Backup
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ngày tạo:</span>
                  <p className="font-medium">{formatDate(preview.metadata.timestamp)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Loại:</span>
                  <p className="font-medium capitalize">{preview.metadata.type || 'manual'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phiên bản:</span>
                  <p className="font-medium">{preview.metadata.version || '1.0.0'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tổng bản ghi:</span>
                  <p className="font-medium">{preview.totalRecords.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tables */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Bảng dữ liệu ({preview.tables.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {preview.tables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{table.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {table.recordCount} records
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Configuration */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Cấu hình
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant={preview.hasConfiguration ? "default" : "secondary"}>
                  {preview.hasConfiguration ? 'Có cấu hình' : 'Không có cấu hình'}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {preview.metadata.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Mô tả</h4>
                  <p className="text-sm text-gray-600">{preview.metadata.description}</p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestorePreviewCard;