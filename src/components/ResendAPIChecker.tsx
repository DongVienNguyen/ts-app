import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ResendAPIChecker = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    exists: boolean;
    isValid: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const checkResendAPI = async () => {
    setIsChecking(true);
    setApiKeyStatus(null);

    try {
      console.log('🔑 Checking Resend API key...');

      // Call a simple edge function to check API key
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'api_check',
          to: 'test@example.com', // This won't be sent, just for validation
          subject: 'API Key Check',
          data: { check: true }
        }
      });

      console.log('🔑 API check response:', { data, error });

      if (error) {
        if (error.message.includes('RESEND_API_KEY not configured')) {
          setApiKeyStatus({
            exists: false,
            isValid: false,
            message: 'RESEND_API_KEY chưa được cấu hình trong Supabase',
            details: error
          });
        } else if (error.message.includes('API key')) {
          setApiKeyStatus({
            exists: true,
            isValid: false,
            message: 'RESEND_API_KEY không hợp lệ hoặc đã hết hạn',
            details: error
          });
        } else {
          setApiKeyStatus({
            exists: true,
            isValid: false,
            message: `Lỗi API: ${error.message}`,
            details: error
          });
        }
      } else {
        setApiKeyStatus({
          exists: true,
          isValid: true,
          message: 'RESEND_API_KEY hoạt động bình thường',
          details: data
        });
      }
    } catch (error: any) {
      console.error('❌ API check error:', error);
      setApiKeyStatus({
        exists: false,
        isValid: false,
        message: `Lỗi kiểm tra API: ${error.message}`,
        details: error
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (!apiKeyStatus) return null;
    
    if (apiKeyStatus.exists && apiKeyStatus.isValid) {
      return <Badge className="bg-green-100 text-green-800">✅ Hoạt động</Badge>;
    } else if (apiKeyStatus.exists && !apiKeyStatus.isValid) {
      return <Badge variant="destructive">❌ Không hợp lệ</Badge>;
    } else {
      return <Badge variant="secondary">⚠️ Chưa cấu hình</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span>Kiểm tra Resend API Key</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Trạng thái API Key</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kiểm tra xem RESEND_API_KEY có hoạt động không
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button 
              onClick={checkResendAPI}
              disabled={isChecking}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Key className="w-4 h-4 mr-2" />
              {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra API'}
            </Button>
          </div>
        </div>

        {apiKeyStatus && (
          <Alert variant={apiKeyStatus.isValid ? 'default' : 'destructive'} 
                 className={apiKeyStatus.isValid ? 'bg-green-100 border-green-400 text-green-800' : ''}>
            {apiKeyStatus.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              <div>
                <p className="font-medium">{apiKeyStatus.message}</p>
                {apiKeyStatus.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">Chi tiết kỹ thuật</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(apiKeyStatus.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🔧 Cách khắc phục:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. Vào <strong>Supabase Console</strong> → Project Settings → Edge Functions</li>
            <li>2. Thêm secret: <code className="bg-yellow-200 px-1 rounded">RESEND_API_KEY</code></li>
            <li>3. Lấy API key từ <strong>Resend Dashboard</strong></li>
            <li>4. Đảm bảo API key có quyền gửi email</li>
            <li>5. Domain <code className="bg-yellow-200 px-1 rounded">caremylife.me</code> đã được verify</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Thông tin cần thiết:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>From email:</strong> taisan@caremylife.me</li>
            <li>• <strong>Domain:</strong> caremylife.me (cần verify)</li>
            <li>• <strong>API Key:</strong> Bắt đầu với "re_"</li>
            <li>• <strong>Rate limit:</strong> 100 emails/day (free plan)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};