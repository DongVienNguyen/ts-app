import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface AssetCodeInputsProps {
  assets: string[];
  onAssetChange: (index: number, value: string) => void;
  onAddAsset: () => void;
  onRemoveAsset: (index: number) => void;
  onAssetCodesDetected?: (codes: string[]) => void;
  onRoomDetected?: (room: string) => void;
}

const AssetCodeInputs: React.FC<AssetCodeInputsProps> = ({
  assets,
  onAssetChange,
  onAddAsset,
  onRemoveAsset,
}) => {
  return (
    <div className="space-y-3">
      {assets.map((asset, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            placeholder="259.24"
            value={asset}
            onChange={(e) => onAssetChange(index, e.target.value)}
            className="flex-1"
          />
          {assets.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemoveAsset(index)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Minus className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={onAddAsset}
        className="w-full text-green-600 border-green-300 hover:bg-green-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Thêm mã tài sản
      </Button>
    </div>
  );
};

export default AssetCodeInputs;