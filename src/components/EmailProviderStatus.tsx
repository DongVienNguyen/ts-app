import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

interface ServiceStatus {
  configured: boolean;
  status: string;
  from?: string;
}

export const EmailProviderStatus = () => {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-notification-email', {
        body: { type: 'api_check' }
      });

      if (invokeError) throw invokeError;

      if (data.success) {
        setStatus(data.service);
      } else {
        throw new Error(data.error || 'Lỗi không xác định từ Edge Function.');
      }
    } catch (err: any) {
      console.error('Lỗi kiểm tra API:', err);
      setError(`Lỗi kiểm tra API: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <span>Trạng thái Email Service</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Kiểm tra trạng thái kết nối email để gửi thông báo từ hệ thống.
        </p>
        <Button onClick={checkStatus} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra Trạng thái Email'}
        </Button>

        {status && (
          <div className="space-y-2 pt-4">
            <h4 className="font-semibold">Kết quả:</h4>
            <div className="flex items-center space-x-2 p-3 rounded-md border" style={{ 
              backgroundColor: status.configured ? '#f0fdf4' : '#fef2f2',
              borderColor: status.configured ? '#16a34a' : '#dc2626'
            }}>
              {status.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="flex-1">
                <div className={status.configured ? 'text-green-700' : 'text-red-700'}>
                  <strong>Email Service: {status.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}</strong>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Status: {status.status}
                </div>
                {status.from && (
                  <div className="text-sm text-gray-600">
                    From: {status.from}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 pt-4">{error}</p>}
      </CardContent>
    </Card>
  );
};