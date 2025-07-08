import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { VAPID_PUBLIC_KEY } from '@/config';

export function VAPIDKeyTester() {
  const [testKey, setTestKey] = useState(VAPID_PUBLIC_KEY);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  const testVAPIDKey = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      if (!testKey) {
        setTestResult({ valid: false, message: 'VAPID key không được để trống' });
        return;
      }

      // Test key format
      const decoded = urlBase64ToUint8Array(testKey);
      
      if (decoded.length !== 65) {
        setTestResult({ 
          valid: false, 
          message: `VAPID key không hợp lệ - độ dài ${decoded.length} bytes, cần 65 bytes` 
        });
        return;
      }

      // Test with push manager
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;

          // Try to subscribe with the key
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decoded
          });

          // If we get here, the key works
          await subscription.unsubscribe();
          
          setTestResult({ 
            valid: true, 
            message: 'VAPID key hợp lệ và có thể sử dụng với push service!' 
          });
        } catch (pushError: any) {
          if (pushError.name === 'AbortError') {
            setTestResult({ 
              valid: false, 
              message: 'VAPID key không được push service chấp nhận - có thể đã hết hạn hoặc không hợp lệ' 
            });
          } else {
            setTestResult({ 
              valid: false, 
              message: `Lỗi test push service: ${pushError.message}` 
            });
          }
        }
      } else {
        setTestResult({ 
          valid: true, 
          message: 'VAPID key có format hợp lệ (không thể test push service)' 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        valid: false, 
        message: `Lỗi test VAPID key: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewKey = () => {
    // This is a working VAPID public key for testing
    const newKey = 'BPjyXf2rFH9n3YSr3afmw4fsiNXJfBcQfpufyxiDiXCXpZqG5IHOcdXPUeLCrrJTsbPSOIuXNzN9Mwoa7WxTAw8';
    setTestKey(newKey);
    setTestResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-6 h-6" />
          <span>VAPID Key Tester</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="vapid-key">VAPID Public Key</Label>
          <Textarea
            id="vapid-key"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            placeholder="Nhập VAPID public key để test..."
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="flex space-x-3">
          <Button onClick={testVAPIDKey} disabled={isLoading}>
            <TestTube className="w-4 h-4 mr-2" />
            {isLoading ? 'Đang test...' : 'Test Key'}
          </Button>
          
          <Button onClick={generateNewKey} variant="outline">
            <Key className="w-4 h-4 mr-2" />
            Sử dụng key mẫu
          </Button>
        </div>

        {testResult && (
          <Alert variant={testResult.valid ? 'default' : 'destructive'} 
                className={testResult.valid ? 'bg-green-50 border-green-200 text-green-800' : ''}>
            <div className="flex items-center space-x-2">
              {testResult.valid ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Thông tin VAPID Key:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Key hiện tại từ config: {VAPID_PUBLIC_KEY ? 'Có' : 'Không có'}</div>
            <div>Độ dài key: {testKey ? testKey.length : 0} ký tự</div>
            <div>Format: Base64URL encoded</div>
            <div>Độ dài khi decode: {testKey ? (() => {
              try {
                return urlBase64ToUint8Array(testKey).length + ' bytes';
              } catch {
                return 'Không hợp lệ';
              }
            })() : 'N/A'}</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Hướng dẫn:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. VAPID key phải có độ dài 65 bytes khi decode</li>
            <li>2. Key phải được encode theo format Base64URL</li>
            <li>3. Key phải được push service (FCM/Mozilla) chấp nhận</li>
            <li>4. Nếu key không hợp lệ, hãy tạo key mới từ web-push library</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}