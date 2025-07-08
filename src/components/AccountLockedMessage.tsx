import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountLockedMessageProps {
  onTryAnotherAccount: () => void;
}

export function AccountLockedMessage({ onTryAnotherAccount }: AccountLockedMessageProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-700">Tài khoản đã bị khóa</h3>
        <p className="text-gray-600">
          Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá nhiều lần.
        </p>
        <p className="text-sm text-gray-500">
          Vui lòng liên hệ Admin để được mở khóa tài khoản hoặc thử lại sau 24 giờ.
        </p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Gợi ý:</strong> Nếu bạn quên mật khẩu, hãy liên hệ Admin để được hỗ trợ đặt lại mật khẩu.
        </p>
      </div>

      <Button 
        onClick={onTryAnotherAccount}
        variant="outline"
        className="w-full"
      >
        Thử tài khoản khác
      </Button>
    </div>
  );
}