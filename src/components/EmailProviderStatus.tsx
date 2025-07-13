import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Server } from 'lucide-react';

interface ProviderStatus {
  configured: boolean;
}

interface ApiStatus {
  resend: ProviderStatus;
  outlook: ProviderStatus;
}

export const EmailProviderStatus = () => {
  const [status, setStatus] = useState<ApiStatus | null>(null);
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
        setStatus(data.providers);
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
          <Server className="w-5 h-5 text-indigo-600" />
          <span>Trạng thái Nhà cung cấp Email</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Kiểm tra xem các API key và thông tin xác thực cho nhà cung cấp email đã được cấu hình đúng trong Supabase Secrets hay chưa.
        </p>
        <Button onClick={checkStatus} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra Trạng thái Cấu hình'}
        </Button>

        {status && (
          <div className="space-y-2 pt-4">
            <h4 className="font-semibold">Kết quả:</h4>
            <div className="flex items-center space-x-2 p-2 rounded-md" style={{ backgroundColor: status.resend.configured ? '#f0fdf4' : '#fef2f2' }}>
              {status.resend.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={status.resend.configured ? 'text-green-700' : 'text-red-700'}>
                Resend API: <strong>{status.resend.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md" style={{ backgroundColor: status.outlook.configured ? '#f0fdf4' : '#fef2f2' }}>
              {status.outlook.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={status.outlook.configured ? 'text-green-700' : 'text-red-700'}>
                Outlook SMTP: <strong>{status.outlook.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}</strong>
              </span>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 pt-4">{error}</p>}
      </CardContent>
    </Card>
  );
};