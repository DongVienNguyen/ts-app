import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SubmitButtonsProps {
  isRestrictedTime: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const SubmitButtons = ({
  isRestrictedTime,
  isFormValid,
  isSubmitting,
  onSubmit
}: SubmitButtonsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4">
        {!isRestrictedTime ? (
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={!isFormValid || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
          </Button>
        ) : (
          <div className="text-orange-600 font-medium">
            Không thể lưu dữ liệu trong giờ nghỉ
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/error-report')}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Bug className="w-4 h-4 mr-2" />
          Báo lỗi và gửi hình lỗi
        </Button>
      </div>
    </div>
  );
};

export default SubmitButtons;