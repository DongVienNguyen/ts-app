import React from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface ImageProcessingDialogProps {
  isProcessingImage: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onCameraClick: () => void;
  onUploadClick: (files: FileList) => void;
}

const ImageProcessingDialog = ({
  isProcessingImage,
  isDialogOpen,
  setIsDialogOpen,
  onCameraClick,
  onUploadClick
}: ImageProcessingDialogProps) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
          <Camera className="w-4 h-4 mr-1" />
          AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-green-600" />
            <span>Trích xuất mã tài sản từ hình ảnh</span>
          </DialogTitle>
          <DialogDescription>
            Chọn cách bạn muốn tải ảnh lên để AI phân tích và trích xuất mã tài sản tự động.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            onClick={onCameraClick}
            disabled={isProcessingImage}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isProcessingImage ? 'Đang xử lý...' : 'Chụp ảnh bằng Camera'}
          </Button>
          
          <Button 
            variant="outline"
            className="w-full border-green-200 hover:bg-green-50" 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isProcessingImage}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isProcessingImage ? 'Đang xử lý...' : 'Upload từ thiết bị'}
          </Button>
          
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && onUploadClick(e.target.files)}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            💡 Hướng dẫn sử dụng
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Chụp ảnh:</strong> Sử dụng camera của thiết bị để chụp trực tiếp</li>
            <li>• <strong>Upload:</strong> Chọn ảnh có sẵn từ thiết bị</li>
            <li>• AI sẽ tự động phát hiện mã tài sản và phòng ban</li>
            <li>• Đảm bảo ảnh rõ nét và có đủ ánh sáng</li>
            <li>• Mã tài sản cần hiển thị đầy đủ trong ảnh</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-green-700">
            <strong>🎯 Mẹo:</strong> Chụp ảnh từ góc vuông góc với mã tài sản để AI phân tích chính xác nhất.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageProcessingDialog;