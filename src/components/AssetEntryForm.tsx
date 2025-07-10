import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertTriangle, 
  Sparkles,
  Camera,
  Upload,
  Loader2
} from 'lucide-react';

// Import form components - fix named imports to default imports
import RoomSelection from '@/components/RoomSelection';
import TransactionTypeSelection from '@/components/TransactionTypeSelection';
import AssetCodeInputs from '@/components/AssetCodeInputs';
import TransactionDetails from '@/components/TransactionDetails';
import SubmitButtons from '@/components/SubmitButtons';
import ImageProcessingDialog from '@/components/ImageProcessingDialog';

// Import hooks and utilities - fix type import
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
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  // Fix hook property names
  const {
    isProcessingImage,
    processImages,
    openCamera
  } = useImageProcessing({
    onAssetCodesDetected,
    onRoomDetected
  });

  // Force light theme on component mount and updates
  useEffect(() => {
    const forceLightTheme = () => {
      // Remove dark theme classes from all form elements
      const formElements = document.querySelectorAll('form, .form, input, select, textarea, button, .card, [class*="card"]');
      formElements.forEach((element) => {
        const el = element as HTMLElement;
        el.classList.remove('dark');
        el.removeAttribute('data-theme');
        
        // Force white background for dark elements
        if (el.classList.contains('bg-slate-900') || 
            el.classList.contains('bg-gray-900') ||
            el.classList.contains('bg-zinc-900') ||
            el.classList.contains('bg-neutral-900') ||
            el.classList.contains('bg-stone-900') ||
            el.classList.contains('bg-black')) {
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111827';
        }
      });
    };

    forceLightTheme();
    
    // Set up interval to continuously force light theme
    const interval = setInterval(forceLightTheme, 500);
    
    return () => clearInterval(interval);
  }, []);

  const handleImageProcessing = async (type: 'camera' | 'upload') => {
    try {
      if (type === 'camera') {
        await openCamera();
      } else {
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
      }
    } catch (error) {
      console.error('Image processing error:', error);
    } finally {
      setShowImageDialog(false);
    }
  };

  return (
    <div 
      className="space-y-6 bg-white text-gray-900"
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#111827',
        colorScheme: 'light'
      }}
    >
      {/* AI Assistant Card */}
      <Card 
        className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
        style={{ 
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          color: '#111827'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ 
                background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)'
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 
                className="font-semibold text-blue-900 mb-2"
                style={{ color: '#1e3a8a' }}
              >
                🤖 Hướng dẫn sử dụng AI
              </h3>
              <div 
                className="text-sm text-blue-800 space-y-1"
                style={{ color: '#1e40af' }}
              >
                <p>• Nhấn nút <strong>"AI"</strong> để mở dialog phân tích ảnh</p>
                <p>• Chọn <strong>"Chụp ảnh bằng Camera"</strong> để chụp trực tiếp</p>
                <p>• Hoặc chọn <strong>"Upload từ thiết bị"</strong> để chọn ảnh có sẵn</p>
                <p>• AI sẽ tự động phát hiện mã tài sản và điền vào form</p>
                <p>• Đảm bảo ảnh rõ nét và mã tài sản hiển thị đầy đủ</p>
              </div>
              <div 
                className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md"
                style={{ 
                  backgroundColor: '#fffbeb',
                  borderColor: '#fde68a',
                  color: '#92400e'
                }}
              >
                <p className="text-xs font-medium flex items-center">
                  💡 <span className="ml-1">Meo: Chụp ảnh trong điều kiện ánh sáng tốt và giữ camera ổn định để có kết quả tốt nhất.</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Restriction Warning */}
      {isRestrictedTime && (
        <Alert 
          variant="destructive"
          className="border-red-200 bg-red-50"
          style={{ 
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            color: '#991b1b'
          }}
        >
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
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
      <div 
        className="space-y-3 bg-white"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <RoomSelection
          selectedRoom={formData.room}
          onRoomChange={handleRoomChange}
        />
      </div>

      <Separator className="bg-gray-200" />

      {/* Transaction Type Selection */}
      <div 
        className="space-y-3 bg-white"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <TransactionTypeSelection
          selectedType={formData.transaction_type}
          onTypeChange={(type) => setFormData({ ...formData, transaction_type: type })}
        />
      </div>

      <Separator className="bg-gray-200" />

      {/* Asset Code Inputs with AI Integration */}
      <div 
        className="space-y-4 bg-white"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 
              className="text-lg font-semibold text-gray-900 flex items-center space-x-2"
              style={{ color: '#111827' }}
            >
              <span>Nhập [Mã TS].[Năm TS]: Có dấu CHẤM giữa mã TS và năm TS</span>
            </h3>
          </div>
          <Button
            type="button"
            onClick={() => setShowImageDialog(true)}
            disabled={isProcessingImage}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200"
            style={{ 
              background: 'linear-gradient(to right, #a855f7, #ec4899)',
              color: '#ffffff'
            }}
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

      <Separator className="bg-gray-200" />

      {/* Transaction Details */}
      <div 
        className="space-y-4 bg-white"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <TransactionDetails
          formData={formData}
          setFormData={setFormData}
          disabledBeforeDate={disabledBeforeDate}
        />
      </div>

      <Separator className="bg-gray-200" />

      {/* Submit Buttons */}
      <div 
        className="pt-4 bg-white"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <SubmitButtons
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          isRestrictedTime={isRestrictedTime}
          onSubmit={onSubmit}
        />
      </div>

      {/* Image Processing Dialog */}
      <ImageProcessingDialog
        isProcessingImage={isProcessingImage}
        isDialogOpen={showImageDialog}
        setIsDialogOpen={setShowImageDialog}
        onCameraClick={() => handleImageProcessing('camera')}
        onUploadClick={async (files) => {
          await processImages(files);
          setShowImageDialog(false);
        }}
      />
    </div>
  );
};

export default AssetEntryForm;