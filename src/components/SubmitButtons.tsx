import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, AlertTriangle } from 'lucide-react';

interface SubmitButtonsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  isRestrictedTime: boolean;
  onSubmit: () => Promise<void>;
}

const SubmitButtons: React.FC<SubmitButtonsProps> = ({
  isFormValid,
  isSubmitting,
  isRestrictedTime,
  onSubmit,
}) => {
  const handleClear = () => {
    // Clear form logic would be handled by parent component
    window.location.reload();
  };

  return (
    <div className="flex justify-between items-center pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleClear}
        disabled={isSubmitting}
        className="px-6"
      >
        Clear
      </Button>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
          disabled={isSubmitting}
        >
          📧 Test Email
        </Button>

        <Button
          type="button"
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
          disabled={isSubmitting}
        >
          ⚠️ Báo lỗi và gửi hình lỗi
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting || isRestrictedTime}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi...
            </>
          ) : isRestrictedTime ? (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Khung giờ cấm
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Gửi thông báo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubmitButtons;