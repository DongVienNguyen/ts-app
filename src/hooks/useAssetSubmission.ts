import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAssetTransactions } from '@/services/assetSubmissionService';
import { FormData } from '@/types/assetSubmission';

export const useAssetSubmission = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ formData, multipleAssets, username }: { formData: FormData, multipleAssets: string[], username: string }) => 
      submitAssetTransactions(formData, multipleAssets, username),
    onSuccess: () => {
      // Invalidate and refetch relevant queries after a successful submission
      queryClient.invalidateQueries({ queryKey: ['asset_transactions'] });
      console.log('✅ Asset transactions submitted and cache invalidated.');
    },
    onError: (error) => {
      console.error('❌ Error submitting asset transactions via mutation:', error);
    }
  });

  return {
    submitAssets: mutateAsync,
    isLoading: isPending,
  };
};