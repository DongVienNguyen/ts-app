import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  AlertTriangle, 
  Sparkles,
  Camera,
  Upload,
  Loader2
} from 'lucide-react';

// Import form components
import RoomSelection from '@/components/RoomSelection';
import TransactionTypeSelection from '@/components/TransactionTypeSelection';
import AssetCodeInputs from '@/components/AssetCodeInputs';
import TransactionDetails from '@/components/TransactionDetails';
import SubmitButtons from '@/components/SubmitButtons';

// Import hooks and utilities
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { AssetEntryFormState } from '@/types/assetEntryFormState';

interface AssetEntryFormProps {
  isRestrictedTime: boolean;
  formData: AssetEntryFormState;
  setFormData: (data: AssetEntryFormState) => void;
  multipleAssets: string[];
  handleRoomChange: (room: string) => void;
  handleAssetChange: (index: number, value: string) => void;
  addAssetField: () => void;
  removeAssetField: (index: number) => void;
  isFormValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  disabledBeforeDate: Date;
  onAssetCodesDetected: (codes: string[]) => void;
  onRoomDetected: (room: string) => void;
}

const AssetEntryForm: React.FC<AssetEntryFormProps> = ({
  isRestrictedTime,
  formData,
  setFormData,
  multipleAssets,
  handleRoomChange,
  handleAssetChange,
  addAssetField,
  removeAssetField,
  isFormValid,
  isSubmitting,
  onSubmit,
  disabledBeforeDate,
  onAssetCodesDetected,
  onRoomDetected,
}) => {
  // Use the actual useImageProcessing hook
  const {
    isProcessingImage,
    isDialogOpen,
    setIsDialogOpen,
    processImages,
    openCamera,
  } = useImageProcessing({
    onAssetCodesDetected,
    onRoomDetected
  });

  const handleFileUpload = async () => {
    // Create file input for upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        await processImages(files);
      }
    };
    input.click();
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Room Selection */}
      <div className="space-y-3">
        <RoomSelection
          selectedRoom={formData.room}
          onRoomChange={handleRoomChange}
        />
      </div>

      {/* Asset Code Inputs with AI Integration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Nhập [Mã TS].[Năm TS]: Có dấu CHẤM giữa mã TS và năm TS
            </h3>
          </div>
          <Button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            disabled={isProcessingImage}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
          >
            {isProcessingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI
              </>
            )}
          </Button>
        </div>

        <AssetCodeInputs
          assets={multipleAssets}
          onAssetChange={handleAssetChange}
          onAddAsset={addAssetField}
          onRemoveAsset={removeAssetField}
          onAssetCodesDetected={onAssetCodesDetected}
          onRoomDetected={onRoomDetected}
        />
      </div>

      {/* Transaction Type Selection */}
      <div className="space-y-3">
        <TransactionTypeSelection
          selectedType={formData.transaction_type}
          onTypeChange={(type) => setFormData({ ...formData, transaction_type: type })}
        />
      </div>

      {/* Transaction Details */}
      <div className="space-y-4">
        <TransactionDetails
          formData={formData}
          setFormData={setFormData}
          disabledBeforeDate={disabledBeforeDate}
        />
      </div>

      {/* Submit Buttons */}
      <div className="pt-4">
        <SubmitButtons
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          isRestrictedTime={isRestrictedTime}
          onSubmit={onSubmit}
        />
      </div>

      {/* Image Processing Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              🤖 Chọn phương thức AI
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              AI sẽ phân tích ảnh và tự động điền mã tài sản vào form
            </p>
            <div className="space-y-3">
              <Button
                onClick={openCamera}
                disabled={isProcessingImage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                📱 Chụp ảnh bằng Camera
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={isProcessingImage}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                📁 Upload từ thiết bị
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ❌ Hủy
              </Button>
            </div>
            
            {isProcessingImage && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">
                    🤖 AI đang phân tích ảnh...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetEntryForm;