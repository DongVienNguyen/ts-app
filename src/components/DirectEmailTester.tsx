import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const DirectEmailTester = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const testEmailDirect = async () => {
    setIsTesting(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🧪 Testing email directly with provided API key...');
      
      const { data, error } = await supabase.functions.invoke('test-resend-api', {
        body: {}
      });

      console.log('📧 Direct email test result:', { data, error });

      if (error) {
        console.error('❌ Direct email test error:', error);
        throw new Error(`Test failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(`Test failed: ${data?.error || 'Unknown error'}`);
      }

      setMessage({
        type: 'success',
        text: `✅ Email test thành công! Email đã được gửi đến ngviendong@gmail.com với API key: ${data.apiKey}`
      });

    } catch (error: any) {
      console.error('❌ Error testing email directly:', error);
      setMessage({
        type: 'error',
        text: `❌ Lỗi test email: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Test Email Trực tiếp</h3>
          <p className="text-sm text-gray-600 mt-1">
            Test gửi email đến ngviendong@gmail.com với API key: re_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn
          </p>
        </div>
        <Button 
          onClick={testEmailDirect}
          disabled={isTesting}
          className="bg-green-600 hover:bg-green-700"
        >
          <TestTube className="w-4 h-4 mr-2" />
          {isTesting ? 'Đang test...' : 'Test Email'}
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">📧 Thông tin test:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>API Key:</strong> re_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn</li>
          <li>• <strong>Email đích:</strong> ngviendong@gmail.com</li>
          <li>• <strong>From:</strong> taisan@caremylife.me</li>
          <li>• <strong>Method:</strong> Supabase Edge Function + Resend API</li>
        </ul>
      </div>
    </div>
  );
};