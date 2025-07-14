import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { restoreService, RestorePreview } from '@/services/restoreService'; // Import RestorePreview
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RestorePreviewCardProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

export const RestorePreviewCard: React.FC<RestorePreviewCardProps> = ({ onFileSelected, selectedFile }) => {
  const [previewData, setPreviewData] = useState<RestorePreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    const generatePreview = async () => {
      if (selectedFile) {
        setIsLoadingPreview(true);
        try {
          const data = await restoreService.getRestorePreview(selectedFile); // Corrected call
          setPreviewData(data);
        } catch (error: any) {
          toast.error(`Lỗi tạo bản xem trước: ${error.message}`);
          setPreviewData([]);
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setPreviewData([]);
      }
    };
    generatePreview();
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xem trước khôi phục</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="restore-file">Chọn tệp khôi phục (.zip)</Label>
          <Input id="restore-file" type="file" accept=".zip" onChange={handleFileChange} />
        </div>

        {isLoadingPreview && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Đang tạo bản xem trước...</span>
          </div>
        )}

        {!isLoadingPreview && previewData.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bảng</TableHead>
                  <TableHead>Tên hiển thị</TableHead>
                  <TableHead className="text-right">Số bản ghi</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.tableName}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.recordCount}</TableCell>
                    <TableCell className="text-center">
                      {item.status === 'found' && <span title="Tìm thấy"><CheckCircle className="h-5 w-5 text-green-500 inline-block" /></span>}
                      {item.status === 'not_found' && <span title="Không tìm thấy cấu hình"><AlertCircle className="h-5 w-5 text-yellow-500 inline-block" /></span>}
                      {item.status === 'error' && <span title="Lỗi"><XCircle className="h-5 w-5 text-red-500 inline-block" /></span>}
                      {item.errorMessage && <span className="ml-2 text-sm text-gray-500">{item.errorMessage}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoadingPreview && selectedFile && previewData.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p>Không có dữ liệu CSV hợp lệ nào được tìm thấy trong tệp ZIP này.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};