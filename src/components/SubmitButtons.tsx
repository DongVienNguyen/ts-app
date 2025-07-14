import React from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface SubmitButtonsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  isRestrictedTime: boolean;
  onSubmit: () => Promise<void>;
  onClear: () => void;
}

const SubmitButtons: React.FC<SubmitButtonsProps> = ({
  isFormValid,
  isSubmitting,
  isRestrictedTime,
  onSubmit,
  onClear,
}) => {
  const { user: currentUser } = useCurrentUser();

  if (isRestrictedTime && currentUser?.role !== 'admin') {
    return (
      <div className="text-center pt-4">
        <div className="text-orange-600 font-medium mb-2">Không thể lưu dữ liệu trong giờ nghỉ</div>
        <div className="text-sm text-orange-500">Vui lòng liên hệ qua Zalo</div>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-4 gap-2">
      <Button type="button" onClick={onClear} variant="outline" disabled={isSubmitting}>
        Clear
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={!isFormValid || isSubmitting}
        className="px-8 py-3 h-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-green-500/25"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi thông báo"}
      </Button>
    </div>
  );
};

export default SubmitButtons;