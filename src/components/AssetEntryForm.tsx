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
    <div className="space-y-6">
      {/* AI Assistant Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                🤖 Hướng dẫn sử dụng AI
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Nhấn nút <strong>"AI"</strong> để mở dialog phân tích ảnh</p>
                <p>• Chọn <strong>"Chụp ảnh bằng Camera"</strong> để chụp trực tiếp</p>
                <p>• Hoặc chọn <strong>"Upload từ thiết bị"</strong> để chọn ảnh có sẵn</p>
                <p>• AI sẽ tự động phát hiện mã tài sản và điền vào form</p>
                <p>• Đảm bảo ảnh rõ nét và mã tài sản hiển thị đầy đủ</p>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs font-medium flex items-center text-yellow-800">
                  💡 <span className="ml-1">Meo: Chụp ảnh trong điều kiện ánh sáng tốt và giữ camera ổn định để có kết quả tốt nhất.</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Restriction Warning */}
      {isRestrictedTime && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>
                Đang trong khung giờ cấm (7:45-8:05 hoặc 12:45-13:05). 
                Vui lòng sử dụng Zalo để thông báo.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Room Selection */}
      <div className="space-y-3">
        <RoomSelection
          selectedRoom={formData.room}
          onRoomChange={handleRoomChange}
        />
      </div>

      <Separator />

      {/* Transaction Type Selection */}
      <div className="space-y-3">
        <TransactionTypeSelection
          selectedType={formData.transaction_type}
          onTypeChange={(type) => setFormData({ ...formData, transaction_type: type })}
        />
      </div>

      <Separator />

      {/* Asset Code Inputs with AI Integration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <span>Nhập [Mã TS].[Năm TS]: Có dấu CHẤM giữa mã TS và năm TS</span>
            </h3>
          </div>
          <Button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            disabled={isProcessingImage}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200"
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

      <Separator />

      {/* Transaction Details */}
      <div className="space-y-4">
        <TransactionDetails
          formData={formData}
          setFormData={setFormData}
          disabledBeforeDate={disabledBeforeDate}
        />
      </div>

      <Separator />

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
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              🤖 Chọn phương thức AI
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI sẽ phân tích ảnh và tự động điền mã tài sản vào form
            </p>
            <div className="space-y-3">
              <Button
                onClick={openCamera}
                disabled={isProcessingImage}
                className="w-full"
                variant="default"
              >
                <Camera className="w-4 h-4 mr-2" />
                📱 Chụp ảnh bằng Camera
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={isProcessingImage}
                className="w-full"
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                📁 Upload từ thiết bị
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="w-full"
              >
                ❌ Hủy
              </Button>
            </div>
            
            {isProcessingImage && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
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