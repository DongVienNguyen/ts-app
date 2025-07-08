import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageProcessingDialog from './ImageProcessingDialog';
import { useImageProcessing } from '@/hooks/useImageProcessing';

interface AssetCodeInputsProps {
  assets: string[];
  onAssetChange: (index: number, value: string) => void;
  onAddAsset: () => void;
  onRemoveAsset: (index: number) => void;
  onAssetCodesDetected: (codes: string[]) => void;
  onRoomDetected: (room: string) => void;
}

const AssetCodeInputs: React.FC<AssetCodeInputsProps> = ({
  assets,
  onAssetChange,
  onAddAsset,
  onRemoveAsset,
  onAssetCodesDetected,
  onRoomDetected,
}) => {
  const {
    isProcessingImage,
    isDialogOpen,
    setIsDialogOpen,
    processImages,
    openCamera,
  } = useImageProcessing({
    onAssetCodesDetected,
    onRoomDetected,
  });

  const handleProcessImages = async (files: FileList) => {
    await processImages(files);
  };

  const handleCameraClick = async () => {
    console.log('📱 Camera button clicked');
    await openCamera();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Nhập [Mã TS].[Năm TS]: Có dấu CHẤM giữa mã TS và năm TS
        </Label>
        <ImageProcessingDialog
          isProcessingImage={isProcessingImage}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          onCameraClick={handleCameraClick}
          onUploadClick={handleProcessImages}
        />
      </div>
      
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={asset}
              onChange={(e) => onAssetChange(index, e.target.value)}
              placeholder="259.24"
              className="text-center font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAddAsset}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {assets.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onRemoveAsset(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
          🤖 Hướng dẫn sử dụng AI
        </h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Nhấn nút <strong>"AI"</strong> để mở dialog phân tích ảnh</li>
          <li>• Chọn <strong>"Chụp ảnh bằng Camera"</strong> để chụp trực tiếp</li>
          <li>• Hoặc chọn <strong>"Upload từ thiết bị"</strong> để chọn ảnh có sẵn</li>
          <li>• AI sẽ tự động phát hiện mã tài sản và điền vào form</li>
          <li>• Đảm bảo ảnh rõ nét và mã tài sản hiển thị đầy đủ</li>
        </ul>
        
        <div className="mt-3 p-2 bg-white/50 rounded border border-green-100">
          <p className="text-xs text-green-600">
            <strong>💡 Mẹo:</strong> Chụp ảnh trong điều kiện ánh sáng tốt và giữ camera ổn định để có kết quả tốt nhất.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetCodeInputs;