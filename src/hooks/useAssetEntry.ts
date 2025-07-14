import { useAssetSubmission } from './useAssetSubmission';
import { AssetEntryFormState } from '@/types/assetEntryFormState';
import { FormData } from '@/types/assetSubmission';
import { useAuth } from '@/contexts/AuthContext';

export const useAssetEntry = () => {
  const { submitAssets, isLoading } = useAssetSubmission();
  const { user } = useAuth();

  const submitAssetEntry = async (
    formData: AssetEntryFormState,
    multipleAssets: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (isLoading) {
      return { success: false, error: 'Đang xử lý, vui lòng đợi...' };
    }

    try {
      console.log('🚀 Submitting asset entry:', { formData, multipleAssets });
      
      const validAssets = multipleAssets.filter(asset => asset.trim() !== '');
      
      if (validAssets.length === 0) {
        return { success: false, error: 'Vui lòng nhập ít nhất một mã tài sản' };
      }

      if (!formData.room || !formData.transaction_type || !formData.parts_day || !formData.transaction_date) {
        return { success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
      }

      if (!user?.username) {
        return { success: false, error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' };
      }

      const submissionFormData: FormData = {
        room: formData.room,
        transaction_type: formData.transaction_type,
        parts_day: formData.parts_day,
        transaction_date: formData.transaction_date,
        note: formData.note || ''
      };

      await submitAssets({
        formData: submissionFormData,
        multipleAssets: validAssets,
        username: user.username
      });

      console.log('✅ Asset entry submitted successfully via hook.');
      return { success: true };

    } catch (error) {
      console.error('❌ Error in submitAssetEntry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi thông báo';
      return { success: false, error: errorMessage };
    }
  };

  return {
    isSubmitting: isLoading,
    submitAssetEntry,
  };
};