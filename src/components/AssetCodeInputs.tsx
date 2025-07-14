import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageProcessingDialog from './ImageProcessingDialog';

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
  const { isProcessingImage, isDialogOpen, setIsDialogOpen, processImages, openCamera } = useImageProcessing({
    onAssetCodesDetected,
    onRoomDetected,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">Nhập [Mã TS] . [Năm TS]: Có dấu CHẤM giữa mã TS và năm TS</Label>
        <ImageProcessingDialog
          isProcessingImage={isProcessingImage}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          onCameraClick={openCamera}
          onUploadClick={(files) => processImages(files)}
        />
      </div>
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Ví dụ: 259.24"
              value={asset}
              onChange={(e) => onAssetChange(index, e.target.value)}
              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-center text-lg flex-1"
            />
            <Button type="button" onClick={onAddAsset} variant="outline" size="icon" className="h-5 w-5 shrink-0 rounded-full border-2 border-green-600 text-green-800 hover:bg-green-100">
              <Plus className="w-3 h-3" />
            </Button>
            {assets.length > 1 && (
              <Button type="button" onClick={() => onRemoveAsset(index)} variant="outline" size="icon" className="h-6 w-6 shrink-0 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-100">
                <Minus className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetCodeInputs;