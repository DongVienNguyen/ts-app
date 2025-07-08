import { useState } from 'react';
import { toast } from 'sonner';
import { analyzeImageWithGemini, GeminiAnalysisResult } from '@/services/geminiService';
import { createCameraFileInput, handleCameraError, formatFileSize } from '@/utils/cameraUtils';
import { CAMERA_CONFIG } from '@/config';

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

    // Validate file type
    if (!CAMERA_CONFIG.SUPPORTED_FORMATS.includes(imageFile.type)) {
      toast.error('Định dạng file không được hỗ trợ', {
        description: 'Vui lòng chọn file ảnh (JPG, PNG, WebP)'
      });
      setIsProcessingImage(false);
      return;
    }

    // Validate file size
    if (imageFile.size > CAMERA_CONFIG.MAX_FILE_SIZE) {
      toast.error('Kích thước tệp quá lớn', {
        description: `Tối đa: ${(CAMERA_CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB. File hiện tại: ${formatFileSize(imageFile.size)}`
      });
      setIsProcessingImage(false);
      return;
    }

    // Show processing toast with file info
    const processingToast = toast.loading("🤖 Đang phân tích hình ảnh bằng AI...", {
      description: `Đang xử lý ${imageFile.name} (${formatFileSize(imageFile.size)})`
    });

    try {
      console.log('🚀 Starting image analysis:', {
        name: imageFile.name,
        size: formatFileSize(imageFile.size),
        type: imageFile.type
      });

      const result = await analyzeImageWithGemini(imageFile);

      console.log('📊 Image processing result:', result);

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
          description: "Hãy thử chụp ảnh rõ nét hơn hoặc đảm bảo mã tài sản hiển thị đầy đủ",
          duration: 6000
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
      console.error('❌ Error processing image:', error);
      toast.dismiss(processingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý hình ảnh.';
      toast.error("❌ Lỗi xử lý hình ảnh", { 
        description: errorMessage,
        duration: 8000
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
        console.warn('📱 Camera API not supported, using file input fallback');
        openCameraFallback();
        return;
      }

      // Create camera file input (this is the most reliable method across devices)
      const input = createCameraFileInput(async (file) => {
        console.log('📷 Camera captured file:', file.name, formatFileSize(file.size));
        
        // Create FileList-like object
        const fileList = {
          0: file,
          length: 1,
          item: (index: number) => index === 0 ? file : null,
          [Symbol.iterator]: function* () {
            yield file;
          }
        } as FileList;

        const result = await processImages(fileList);
        if (result) {
          console.log('✅ Camera image processed successfully:', result);
        }
      });

      // Add to DOM temporarily and trigger
      document.body.appendChild(input);
      input.click();
      
      // Clean up after a delay
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 1000);
      
      // Close dialog when camera opens
      setIsDialogOpen(false);
      
      toast.info("📱 Đang mở camera...", {
        description: "Chụp ảnh mã tài sản rõ nét để AI phân tích",
        duration: 3000
      });
      
    } catch (error) {
      console.error('❌ Error opening camera:', error);
      handleCameraError(error as any);
      
      // Fallback to file input
      openCameraFallback();
    }
  };

  const openCameraFallback = () => {
    console.log('📁 Using file input fallback...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = CAMERA_CONFIG.SUPPORTED_FORMATS.join(',');
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        console.log('📁 File selected:', target.files[0].name);
        const result = await processImages(target.files);
        if (result) {
          console.log('✅ File processed successfully:', result);
        }
      }
    };

    document.body.appendChild(input);
    input.click();
    
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 1000);

    setIsDialogOpen(false);
    
    toast.info("📁 Chọn ảnh từ thiết bị", {
      description: "Chọn ảnh chứa mã tài sản để AI phân tích"
    });
  };

  return {
    isProcessingImage,
    isDialogOpen,
    setIsDialogOpen,
    processImages,
    openCamera,
  };
};