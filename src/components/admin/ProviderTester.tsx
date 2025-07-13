import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import emailService, { getAdminEmail } from '@/services/emailService';
import { Loader2, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';

export const ProviderTester = () => {
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', details: '' });
  const { user } = useSecureAuth();

  const handlePrefillAdminEmail = async () => {
    const adminEmail = await getAdminEmail();
    if (adminEmail) {
      setTo(adminEmail);
      setMessage({ type: 'info', text: `Đã điền email admin: ${adminEmail}`, details: '' });
    } else {
      setMessage({ type: 'error', text: 'Không tìm thấy email admin. Vui lòng cấu hình email admin trước.', details: '' });
    }
  };

  const handleSend = async () => {
    if (!to) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email người nhận.', details: '' });
      return;
    }

    if (!to.includes('@') || !to.includes('.')) {
      setMessage({ type: 'error', text: 'Email không hợp lệ.', details: '' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: 'Đang gửi email...', details: '' });

    try {
      console.log('🧪 Testing email service...');
      
      const result = await emailService.sendTestEmail(to, user?.username || 'N/A');

      console.log('📧 Test result:', result);

      if (result.success) {
        const fromEmail = result.from || 'Tài sản - CRC <taisan@caremylife.me>';
        
        let successMessage = `✅ Email đã được gửi thành công đến ${to}`;
        let details = `From: ${fromEmail}`;

        if (result.message) {
          details += `\nThông báo: ${result.message}`;
        }

        setMessage({ 
          type: 'success', 
          text: successMessage,
          details: details
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: '❌ Gửi email thất bại',
          details: result.error || 'Lỗi không xác định'
        });
      }
    } catch (error: any) {
      console.error('❌ Test error:', error);
      setMessage({ 
        type: 'error', 
        text: '❌ Lỗi khi test email',
        details: error.message || 'Lỗi không xác định'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="to-email-test">Gửi đến</Label>
        <div className="flex space-x-2">
          <Input 
            id="to-email-test" 
            type="email" 
            placeholder="recipient@example.com" 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            variant="outline" 
            onClick={handlePrefillAdminEmail}
            disabled={isLoading}
          >
            Dùng email Admin
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !to} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Test Email Service
        </Button>
      </div>

      {message.text && (
        <Alert 
          variant={message.type === 'error' ? 'destructive' : 'default'} 
          className={`mt-4 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : message.type === 'info' ? (
            <Info className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div>{message.text}</div>
            {message.details && (
              <div className="mt-2 text-xs opacity-80 font-mono whitespace-pre-line">
                {message.details}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">📧 Thông tin Test</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>From:</strong> Tài sản - CRC &lt;taisan@caremylife.me&gt;</li>
          <li>• Email test sẽ có template HTML đầy đủ với thông tin chi tiết</li>
          <li>• Kiểm tra cả inbox và spam folder nếu không thấy email</li>
          <li>• Thời gian gửi: vài giây đến vài phút</li>
        </ul>
      </div>
    </div>
  );
};