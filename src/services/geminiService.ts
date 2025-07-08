import { supabase } from '@/integrations/supabase/client';

export interface GeminiAnalysisResult {
  foundCount: number;
  assetCodes: string[];
  detectedRoom?: string;
  confidence: number;
}

export const analyzeImageWithGemini = async (imageFile: File): Promise<GeminiAnalysisResult> => {
  try {
    console.log('🚀 Starting image analysis with Gemini for file:', imageFile.name);
    console.log('📊 File size:', (imageFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📷 File type:', imageFile.type);
    
    // Convert image to base64
    const base64Image = await convertFileToBase64(imageFile);
    console.log('✅ Image converted to base64, size:', base64Image.length);
    
    console.log('📡 Calling Supabase edge function...');
    const response = await supabase.functions.invoke('analyze-asset-image', {
      body: {
        image: base64Image,
        mimeType: imageFile.type
      }
    });

    console.log('📨 Supabase function response:', response);

    if (response.error) {
      console.error('❌ Gemini API error:', response.error);
      throw new Error('Lỗi khi phân tích hình ảnh: ' + response.error.message);
    }

    if (!response.data) {
      throw new Error('Không nhận được dữ liệu từ API');
    }

    console.log('🎉 Analysis result:', response.data);
    
    // Validate result structure
    const result = response.data as GeminiAnalysisResult;
    if (!result.assetCodes) {
      result.assetCodes = [];
    }
    if (typeof result.foundCount !== 'number') {
      result.foundCount = result.assetCodes.length;
    }
    if (typeof result.confidence !== 'number') {
      result.confidence = result.assetCodes.length > 0 ? 0.9 : 0;
    }
    
    return result;
  } catch (error) {
    console.error('💥 Error analyzing image:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Quá thời gian xử lý. Vui lòng thử lại với ảnh nhỏ hơn.');
      } else if (error.message.includes('API key')) {
        throw new Error('Lỗi cấu hình API. Vui lòng liên hệ quản trị viên.');
      }
    }
    
    throw new Error('Không thể phân tích hình ảnh. Vui lòng thử lại hoặc chọn ảnh khác.');
  }
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Converting file to base64...');
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      console.log('✅ File converted to base64 successfully');
      resolve(base64);
    };
    
    reader.onerror = error => {
      console.error('❌ Error converting file to base64:', error);
      reject(new Error('Không thể đọc file ảnh. Vui lòng thử lại.'));
    };
  });
};