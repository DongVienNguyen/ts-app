import { useState } from 'react';
import { useAssetSubmission } from './useAssetSubmission';
import { AssetEntryFormState } from '@/types/assetEntryFormState';
import { FormData } from '@/types/assetSubmission';
import { useSecureAuth } from '@/contexts/AuthContext';

export const useAssetEntry = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, isLoading } = useAssetSubmission();
  const { user } = useSecureAuth();

  const submitAssetEntry = async (
    formData: AssetEntryFormState,
    multipleAssets: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSubmitting || isLoading) {
      return { success: false, error: 'Đang xử lý, vui lòng đợi...' };
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting asset entry:', { formData, multipleAssets });
      
      // Filter out empty assets
      const validAssets = multipleAssets.filter(asset => asset.trim() !== '');
      
      if (validAssets.length === 0) {
        return { success: false, error: 'Vui lòng nhập ít nhất một mã tài sản' };
      }

      // Validate required fields
      if (!formData.room || !formData.transaction_type || !formData.parts_day || !formData.transaction_date) {
        return { success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
      }

      if (!user?.username) {
        return { success: false, error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' };
      }

      // Convert AssetEntryFormState to FormData format expected by handleSubmit
      const submissionFormData: FormData = {
        room: formData.room,
        transaction_type: formData.transaction_type,
        parts_day: formData.parts_day,
        transaction_date: formData.transaction_date,
        note: formData.note || ''
      };

      return new Promise((resolve, reject) => {
        try {
          handleSubmit(
            submissionFormData,
            validAssets,
            false, // isRestrictedTime - we handle this in the parent component
            () => {
              console.log('✅ Asset entry submitted successfully');
              resolve({ success: true });
            },
            user.username
          );
        } catch (error) {
          console.error('❌ Error in handleSubmit:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Error in submitAssetEntry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi thông báo';
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting: isSubmitting || isLoading,
    submitAssetEntry,
  };
};