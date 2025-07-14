import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
        <Button type="button" variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
          <Camera className="w-5 h-5" />
          <span className="text-base font-semibold">AI</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn cách nhập hình ảnh</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Button 
            className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-3" 
            onClick={() => document.getElementById('file-upload-input')?.click()}
            disabled={isProcessingImage}
          >
            <Upload className="w-6 h-6" />
            {isProcessingImage ? 'Đang xử lý...' : 'Upload từ thiết bị'}
          </Button>
          
          <Button 
            className="w-full h-16 bg-green-500 hover:bg-green-600 text-white flex items-center gap-3" 
            onClick={onCameraClick}
            disabled={isProcessingImage}
          >
            <Camera className="w-6 h-6" />
            {isProcessingImage ? 'Đang xử lý...' : 'Chụp ảnh'}
          </Button>
          
          <input
            id="file-upload-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onUploadClick(e.target.files)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageProcessingDialog;