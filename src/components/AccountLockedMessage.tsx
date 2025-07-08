import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccountLockedMessageProps {
  onTryAnotherAccount: () => void;
}

export function AccountLockedMessage({ onTryAnotherAccount }: AccountLockedMessageProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Tài khoản của bạn đã bị khóa do nhiều lần đăng nhập thất bại. 
          Vui lòng liên hệ với quản trị viên để được hỗ trợ mở khóa tài khoản.
        </AlertDescription>
      </Alert>
      
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          Bạn có thể thử đăng nhập bằng tài khoản khác hoặc liên hệ với quản trị viên.
        </p>
        
        <Button 
          onClick={onTryAnotherAccount}
          variant="outline"
          className="w-full"
        >
          Thử tài khoản khác
        </Button>
      </div>
    </div>
  );
}