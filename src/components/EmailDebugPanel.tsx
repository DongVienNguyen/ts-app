import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  Server, 
  Database,
  Key,
  Send,
  Eye,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DebugStep {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export const EmailDebugPanel = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [finalResult, setFinalResult] = useState<{ type: string; message: string } | null>(null);

  const updateStep = (stepName: string, status: 'success' | 'error', message: string, details?: any) => {
    setDebugSteps(prev => prev.map(step => 
      step.name === stepName 
        ? { ...step, status, message, details }
        : step
    ));
  };

  const initializeSteps = () => {
    setDebugSteps([
      { name: 'Database Connection', status: 'pending', message: 'Đang kiểm tra kết nối database...' },
      { name: 'Admin Email Query', status: 'pending', message: 'Đang truy vấn email admin...' },
      { name: 'Edge Function Call', status: 'pending', message: 'Đang gọi Edge Function...' },
      { name: 'Resend API', status: 'pending', message: 'Đang gửi email qua Resend...' },
      { name: 'Email Delivery', status: 'pending', message: 'Đang kiểm tra gửi email...' }
    ]);
  };

  const runFullEmailDebug = async () => {
    setIsDebugging(true);
    setFinalResult(null);
    initializeSteps();

    try {
      // Step 1: Database Connection
      console.log('🔍 Step 1: Testing database connection...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('staff')
          .select('count')
          .limit(1);
        
        if (testError) throw testError;
        updateStep('Database Connection', 'success', '✅ Kết nối database thành công');
      } catch (error: any) {
        updateStep('Database Connection', 'error', `❌ Lỗi kết nối database: ${error.message}`);
        throw error;
      }

      // Step 2: Admin Email Query
      console.log('🔍 Step 2: Querying admin email...');
      let adminEmail = '';
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('staff')
          .select('email, staff_name, username')
          .eq('role', 'admin')
          .limit(1);

        console.log('📧 Admin query result:', { adminData, adminError });

        if (adminError) throw adminError;
        if (!adminData || adminData.length === 0) {
          throw new Error('Không tìm thấy tài khoản admin');
        }
        if (!adminData[0].email) {
          throw new Error('Email admin chưa được cấu hình');
        }

        adminEmail = adminData[0].email;
        updateStep('Admin Email Query', 'success', `✅ Tìm thấy email admin: ${adminEmail}`, adminData[0]);
      } catch (error: any) {
        updateStep('Admin Email Query', 'error', `❌ Lỗi truy vấn admin: ${error.message}`);
        throw error;
      }

      // Step 3: Edge Function Call
      console.log('🔍 Step 3: Calling Edge Function...');
      let edgeResponse: any;
      try {
        const { data, error } = await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'test',
            to: adminEmail,
            subject: '🔧 Debug Email Test - Hệ thống Quản lý Tài sản',
            data: {
              username: 'debug-user',
              testType: 'full-debug',
              timestamp: new Date().toISOString(),
              debugId: Math.random().toString(36).substr(2, 9)
            }
          }
        });

        console.log('📧 Edge function response:', { data, error });

        if (error) throw error;
        edgeResponse = data;
        updateStep('Edge Function Call', 'success', '✅ Edge Function gọi thành công', data);
      } catch (error: any) {
        updateStep('Edge Function Call', 'error', `❌ Lỗi Edge Function: ${error.message}`, error);
        throw error;
      }

      // Step 4: Resend API Check
      console.log('🔍 Step 4: Checking Resend API response...');
      try {
        if (edgeResponse?.success) {
          updateStep('Resend API', 'success', '✅ Resend API phản hồi thành công', edgeResponse.data);
        } else {
          throw new Error('Edge Function không trả về success=true');
        }
      } catch (error: any) {
        updateStep('Resend API', 'error', `❌ Lỗi Resend API: ${error.message}`);
        throw error;
      }

      // Step 5: Email Delivery Status
      console.log('🔍 Step 5: Checking email delivery...');
      try {
        if (edgeResponse?.data?.id) {
          updateStep('Email Delivery', 'success', `✅ Email đã được gửi với ID: ${edgeResponse.data.id}`);
          setFinalResult({
            type: 'success',
            message: `🎉 Email debug hoàn tất! Email đã được gửi thành công đến ${adminEmail}`
          });
        } else {
          updateStep('Email Delivery', 'error', '❌ Không nhận được ID email từ Resend');
          setFinalResult({
            type: 'warning',
            message: '⚠️ Email có thể đã được gửi nhưng không có ID xác nhận'
          });
        }
      } catch (error: any) {
        updateStep('Email Delivery', 'error', `❌ Lỗi kiểm tra delivery: ${error.message}`);
        throw error;
      }

    } catch (error: any) {
      console.error('❌ Email debug failed:', error);
      setFinalResult({
        type: 'error',
        message: `❌ Debug thất bại: ${error.message}`
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Thành công</Badge>;
      case 'error': return <Badge variant="destructive">Lỗi</Badge>;
      default: return <Badge variant="secondary">Đang xử lý...</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="w-5 h-5 text-orange-600" />
          <span>Email Debug Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Kiểm tra toàn bộ hệ thống email</h3>
            <p className="text-sm text-gray-600 mt-1">
              Debug từng bước để tìm ra vấn đề chính xác
            </p>
          </div>
          <Button 
            onClick={runFullEmailDebug}
            disabled={isDebugging}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Bug className="w-4 h-4 mr-2" />
            {isDebugging ? 'Đang debug...' : 'Bắt đầu Debug'}
          </Button>
        </div>

        {debugSteps.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-semibold text-sm">Các bước debug:</h4>
            
            {debugSteps.map((step, index) => (
              <div key={step.name} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">{index + 1}. {step.name}</h5>
                    {getStepBadge(step.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                  {step.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer">Chi tiết</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {finalResult && (
          <Alert variant={finalResult.type === 'error' ? 'destructive' : 'default'} 
                 className={finalResult.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                           finalResult.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''}>
            {finalResult.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{finalResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 Debug sẽ kiểm tra:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <Database className="w-3 h-3 inline mr-1" /> Kết nối Supabase Database</li>
            <li>• <Mail className="w-3 h-3 inline mr-1" /> Truy vấn email admin</li>
            <li>• <Server className="w-3 h-3 inline mr-1" /> Gọi Edge Function</li>
            <li>• <Key className="w-3 h-3 inline mr-1" /> Kết nối Resend API</li>
            <li>• <Send className="w-3 h-3 inline mr-1" /> Trạng thái gửi email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};