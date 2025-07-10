import { useState } from 'react';
import { FormData } from '@/types/assetSubmission';
import { toast } from 'sonner';

export const useAssetSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    formData: FormData,
    assets: string[],
    isRestrictedTime: boolean,
    onSuccess: () => void,
    username: string
  ) => {
    if (isRestrictedTime) {
      toast.error('Không thể gửi trong khung giờ cấm');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📤 Submitting asset data:', {
        formData,
        assets,
        username,
        timestamp: new Date().toISOString()
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      console.log('✅ Asset submission successful');
      
      // Call success callback
      onSuccess();
      
    } catch (error) {
      console.error('❌ Asset submission failed:', error);
      toast.error('Có lỗi xảy ra khi gửi thông báo');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading
  };
};