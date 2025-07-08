import { useState } from 'react';
import { toast } from 'sonner';
import { analyzeImageWithGemini, GeminiAnalysisResult } from '@/services/geminiService';

interface UseImageProcessingProps {
  onAssetCodesDetected: (codes: string[]) => void;
  onRoomDetected: (room: string) => void;
}

export const useImageProcessing = ({ onAssetCodesDetected, onRoomDetected }: UseImageProcessingProps) => {
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const processImages = async (files: FileList | null): Promise<GeminiAnalysisResult | undefined> => {
    if (!files || files.length === 0) {
      toast.error("Không có tệp nào được chọn.");
      return;
    }

    setIsProcessingImage(true);
    setIsDialogOpen(false); // Close dialog immediately

    const imageFile = files[0];

    const MAX_FILE_SIZE_MB = 5; // 5 MB
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (imageFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn ${MAX_FILE_SIZE_MB}MB.`);
      setIsProcessingImage(false);
      return;
    }

    // Show processing toast
    const processingToast = toast.loading("🤖 Đang phân tích hình ảnh bằng AI...", {
      description: "Vui lòng đợi trong giây lát"
    });

    try {
      const result = await analyzeImageWithGemini(imageFile);

      console.log('Image processing result:', result);

      // Dismiss processing toast
      toast.dismiss(processingToast);

      if (result.assetCodes && result.assetCodes.length > 0) {
        onAssetCodesDetected(result.assetCodes);
        toast.success(
          `🎯 Phát hiện ${result.assetCodes.length} mã tài sản!`,
          { 
            description: `Mã tài sản: ${result.assetCodes.join(', ')}`,
            duration: 5000
          }
        );
      } else {
        toast.warning("⚠️ Không tìm thấy mã tài sản", {
          description: "Hãy thử chụp ảnh rõ nét hơn hoặc đảm bảo mã tài sản hiển thị đầy đủ"
        });
      }

      if (result.detectedRoom) {
        onRoomDetected(result.detectedRoom);
        toast.success(
          `📍 Phát hiện phòng: ${result.detectedRoom}`,
          { duration: 3000 }
        );
      }

      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      toast.dismiss(processingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý hình ảnh.';
      toast.error("❌ Lỗi xử lý hình ảnh", { 
        description: errorMessage,
        duration: 5000
      });
      return undefined;
    } finally {
      setIsProcessingImage(false);
    }
  };

  const openCamera = async () => {
    try {
      console.log('📱 Opening camera...');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("📱 Camera không được hỗ trợ trên thiết bị này");
        return;
      }

      // Create file input with camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use rear camera on mobile devices
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          console.log('📷 Camera captured image:', target.files[0]);
          const result = await processImages(target.files);
          if (result) {
            console.log('✅ Camera image processed successfully:', result);
          }
        }
      };

      // Trigger camera
      input.click();
      
      // Close dialog when camera opens
      setIsDialogOpen(false);
      
      toast.info("📱 Đang mở camera...", {
        description: "Chụp ảnh mã tài sản rõ nét để AI phân tích"
      });
      
    } catch (error) {
      console.error('Error opening camera:', error);
      toast.error("❌ Không thể mở camera", {
        description: "Vui lòng kiểm tra quyền truy cập camera hoặc thử upload ảnh từ thiết bị"
      });
    }
  };

  return {
    isProcessingImage,
    isDialogOpen,
    setIsDialogOpen,
    processImages,
    openCamera,
  };
};