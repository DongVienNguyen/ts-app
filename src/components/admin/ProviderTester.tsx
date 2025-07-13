import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailService, getAdminEmail } from '@/services/emailService';
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';

export const ProviderTester = () => {
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState<'resend' | 'outlook' | false>(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useSecureAuth();

  const handlePrefillAdminEmail = async () => {
    const adminEmail = await getAdminEmail();
    if (adminEmail) {
      setTo(adminEmail);
    }
  };

  const handleSend = async (provider: 'resend' | 'outlook') => {
    if (!to) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email người nhận.' });
      return;
    }
    setIsLoading(provider);
    setMessage({ type: '', text: '' });
    try {
      await emailService.sendEmail({
        to,
        subject: `Test Email Trực tiếp qua ${provider}`,
        type: 'test',
        provider: provider,
        data: {
          username: user?.username || 'N/A',
        }
      });
      setMessage({ type: 'success', text: `Email đã được gửi thành công đến ${to} qua ${provider}.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Lỗi gửi email qua ${provider}: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="to-email-test">Gửi đến</Label>
        <div className="flex space-x-2">
          <Input id="to-email-test" type="email" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outline" onClick={handlePrefillAdminEmail}>Dùng email Admin</Button>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button onClick={() => handleSend('resend')} disabled={!!isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {isLoading === 'resend' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Test với Resend
        </Button>
        <Button onClick={() => handleSend('outlook')} disabled={!!isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
          {isLoading === 'outlook' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Test với Outlook
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={`mt-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};