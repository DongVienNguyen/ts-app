import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Key,
  Mail,
  Globe,
  Settings
} from 'lucide-react';

export const ResendSetupGuide = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const steps = [
    {
      title: "1. Tạo tài khoản Resend",
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-2">
          <p>Truy cập <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
            resend.com <ExternalLink className="w-3 h-3 ml-1" />
          </a> và đăng ký tài khoản miễn phí</p>
          <Badge variant="secondary">Free: 100 emails/day, 3,000 emails/month</Badge>
        </div>
      )
    },
    {
      title: "2. Verify Domain",
      icon: <Mail className="w-5 h-5 text-green-600" />,
      content: (
        <div className="space-y-3">
          <p>Thêm domain <code className="bg-gray-100 px-2 py-1 rounded">caremylife.me</code> vào Resend:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Vào <strong>Domains</strong> trong Resend Dashboard</li>
            <li>Click <strong>Add Domain</strong></li>
            <li>Nhập: <code className="bg-gray-100 px-1 rounded">caremylife.me</code></li>
            <li>Thêm DNS records vào domain provider</li>
            <li>Chờ verify (có thể mất vài phút)</li>
          </ol>
        </div>
      )
    },
    {
      title: "3. Tạo API Key",
      icon: <Key className="w-5 h-5 text-orange-600" />,
      content: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Vào <strong>API Keys</strong> trong Resend Dashboard</li>
            <li>Click <strong>Create API Key</strong></li>
            <li>Đặt tên: <code className="bg-gray-100 px-1 rounded">Asset Management System</code></li>
            <li>Chọn permission: <strong>Sending access</strong></li>
            <li>Copy API key (bắt đầu với "re_")</li>
          </ol>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quan trọng:</strong> API key chỉ hiển thị 1 lần. Hãy copy và lưu ngay!
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "4. Cấu hình Supabase",
      icon: <Settings className="w-5 h-5 text-purple-600" />,
      content: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Vào <strong>Supabase Console</strong> → Project Settings</li>
            <li>Chọn <strong>Edge Functions</strong></li>
            <li>Click <strong>Manage Secrets</strong></li>
            <li>Thêm secret mới:</li>
          </ol>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm"><strong>Name:</strong> RESEND_API_KEY</p>
                <p className="font-mono text-sm"><strong>Value:</strong> re_xxxxxxxxxxxxxxxxxx</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('RESEND_API_KEY', 'Secret name')}
              >
                <Copy className="w-3 h-3 mr-1" />
                {copiedText === 'Secret name' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "5. Test Email",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      content: (
        <div className="space-y-2">
          <p>Sử dụng các công cụ test ở trên để kiểm tra:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Resend API Key Checker</li>
            <li>✅ Email Debug Panel</li>
            <li>✅ Direct Email Test</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Hướng dẫn Setup Resend API</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {steps.map((step, index) => (
          <div key={index}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                {step.content}
              </div>
            </div>
            {index < steps.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">✅ Sau khi setup xong:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Email sẽ được gửi từ: <code className="bg-green-100 px-1 rounded">taisan@caremylife.me</code></li>
            <li>• Tất cả email hệ thống sẽ hoạt động bình thường</li>
            <li>• Có thể gửi 100 emails/day với free plan</li>
            <li>• Email có template đẹp và professional</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Lưu ý quan trọng:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Domain <strong>phải được verify</strong> trước khi gửi email</li>
            <li>• API key có thể mất vài phút để active</li>
            <li>• Free plan có giới hạn 100 emails/day</li>
            <li>• Email có thể vào spam nếu domain chưa setup đúng</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};