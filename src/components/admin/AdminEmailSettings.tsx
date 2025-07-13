import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, TestTube, Settings, CheckCircle, AlertCircle, User, Eye, EyeOff, RefreshCw, Server, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from '@/integrations/supabase/client';
import { performEmailTest } from '@/services/emailTestService';
import { useSecureAuth } from '@/contexts/AuthContext';
import { EmailProviderStatus } from '@/components/EmailProviderStatus';
import { ResendSetupGuide } from '@/components/ResendSetupGuide';
import { CreateAdminButton } from '@/components/CreateAdminButton';
import { ForceCreateAdminButton } from '@/components/ForceCreateAdminButton';
import { ProviderTester } from '@/components/admin/ProviderTester';

export const AdminEmailSettings = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [showCurrentEmail, setShowCurrentEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminExists, setAdminExists] = useState(false);
  const [emailProvider, setEmailProvider] = useState('resend');
  const [selectedProvider, setSelectedProvider] = useState('resend');
  const [isProviderLoading, setIsProviderLoading] = useState(true);
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const { user } = useSecureAuth();

  useEffect(() => {
    loadAdminEmail();
    loadEmailProvider();
  }, []);

  const loadEmailProvider = async () => {
    setIsProviderLoading(true);
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'email_provider')
      .single();
    
    if (data && typeof data.value === 'string') {
      setEmailProvider(data.value);
      setSelectedProvider(data.value);
    } else if (error) {
      console.error("Error loading email provider:", error);
      // Default to outlook (Vietcombank email) instead of resend
      setEmailProvider('outlook');
      setSelectedProvider('outlook');
    }
    setIsProviderLoading(false);
  };

  const saveEmailProvider = async () => {
    setIsSavingProvider(true);
    const { error } = await supabase
      .from('system_config')
      .update({ value: selectedProvider })
      .eq('key', 'email_provider');
    
    if (error) {
      setMessage({ type: 'error', text: `Lỗi cập nhật nhà cung cấp: ${error.message}` });
      setSelectedProvider(emailProvider); // Revert on error
    } else {
      setEmailProvider(selectedProvider);
      setMessage({ type: 'success', text: `Đã lưu nhà cung cấp email là ${selectedProvider}.` });
    }
    setIsSavingProvider(false);
  };

  const loadAdminEmail = async () => {
    setIsLoadingEmail(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log('🔍 Loading admin email - Starting fresh query...');
      
      // Add small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Query admin with detailed logging
      const { data, error, count } = await supabase
        .from('staff')
        .select('id, username, email, staff_name, role, account_status', { count: 'exact' })
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Admin query details:', { 
        data, 
        error: error?.message, 
        count,
        dataLength: data?.length 
      });

      if (error) {
        console.error('❌ Database error:', error);
        setMessage({ type: 'error', text: `Lỗi database: ${error.message}` });
        setAdminExists(false);
        return;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No admin found in database');
        setAdminExists(false);
        setCurrentAdminEmail('');
        setAdminEmail('ngviendong@gmail.com'); // Set default to your email
        setMessage({ 
          type: 'warning', 
          text: '⚠️ Không tìm thấy admin. Nhập email và nhấn "Tạo Admin" để tạo admin mới.' 
        });
        return;
      }

      const adminUser = data[0];
      console.log('✅ Admin found:', {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.account_status
      });
      
      setAdminExists(true);
      setCurrentAdminEmail(adminUser.email || '');
      setAdminEmail(adminUser.email || 'ngviendong@gmail.com');
      
      if (!adminUser.email) {
        setMessage({ 
          type: 'warning', 
          text: '⚠️ Admin tồn tại nhưng chưa có email. Vui lòng cập nhật email.' 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: `✅ Tìm thấy admin: ${adminUser.username} (${adminUser.email})` 
        });
      }
      
    } catch (error: any) {
      console.error('❌ Exception in loadAdminEmail:', error);
      setMessage({ type: 'error', text: `Lỗi hệ thống: ${error.message}` });
      setAdminExists(false);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const saveAdminEmail = async () => {
    if (!adminEmail.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email admin' });
      return;
    }

    if (!adminEmail.includes('@') || !adminEmail.includes('.')) {
      setMessage({ type: 'error', text: 'Email không hợp lệ' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('💾 Saving admin email:', adminEmail);
      console.log('🔍 Admin exists:', adminExists);
      
      if (!adminExists) {
        console.log('🆕 Creating new admin user via Edge Function...');
        
        // Use Edge Function to create admin (bypasses RLS)
        const { data: createResult, error: createError } = await supabase.functions.invoke('create-admin-user', {
          body: {
            username: 'admin',
            password: 'admin123',
            staff_name: 'System Administrator',
            email: adminEmail.trim(),
            department: 'IT'
          }
        });

        if (createError) {
          console.error('❌ Create admin via Edge Function error:', createError);
          throw new Error(`Không thể tạo admin: ${createError.message}`);
        }

        if (!createResult?.success) {
          throw new Error(`Không thể tạo admin: ${createResult?.error || 'Unknown error'}`);
        }

        console.log('✅ Created new admin via Edge Function:', createResult);
        setAdminExists(true);
        setCurrentAdminEmail(adminEmail.trim());
        setMessage({ 
          type: 'success', 
          text: `✅ Đã tạo admin mới thành công! Username: admin, Password: admin123, Email: ${adminEmail.trim()}` 
        });
        
        // Wait longer before reloading to ensure database consistency
        setTimeout(() => {
          loadAdminEmail();
        }, 2000);
        
      } else {
        console.log('📝 Updating existing admin email...');
        
        // Update existing admin - handles multiple admin accounts
        const { data: updatedAdmins, error: updateError } = await supabase
          .from('staff')
          .update({ email: adminEmail.trim() })
          .eq('role', 'admin')
          .select('id, username, email'); // Removed .single() to allow multiple updates

        if (updateError) {
          console.error('❌ Update admin error:', updateError);
          throw new Error(`Không thể cập nhật email: ${updateError.message}`);
        }

        console.log('✅ Updated admin email(s):', updatedAdmins);
        setCurrentAdminEmail(adminEmail.trim());
        setMessage({ 
          type: 'success', 
          text: `✅ Đã cập nhật email cho ${updatedAdmins?.length || 0} tài khoản admin thành công: ${adminEmail.trim()}` 
        });
        
        // Shorter delay for updates
        setTimeout(() => {
          loadAdminEmail();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('❌ Save admin email error:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Lỗi lưu email: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailFunction = async () => {
    if (!user?.username) {
      setMessage({ type: 'error', text: 'Không tìm thấy thông tin người dùng' });
      return;
    }

    if (!currentAdminEmail) {
      setMessage({ type: 'error', text: 'Vui lòng lưu email admin trước khi test' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🧪 Starting email test for user:', user.username);
      console.log('📧 Admin email:', currentAdminEmail);
      
      const result = await performEmailTest(user.username);
      
      console.log('📧 Email test result:', result);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Test email thành công! Email đã được gửi đến: ${currentAdminEmail}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ Test email thất bại: ${result.error || 'Lỗi không xác định'}` 
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Lỗi test email: ${error.message || 'Lỗi không xác định'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Status Card */}
      <Card className={adminExists ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${adminExists ? 'text-green-800' : 'text-yellow-800'}`}>
            <User className="w-5 h-5" />
            <span>Trạng thái Admin</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAdminEmail}
              disabled={isLoadingEmail}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingEmail ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEmail ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Đang kiểm tra admin...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span className="font-mono text-sm">
                    {currentAdminEmail ? (
                      showCurrentEmail ? currentAdminEmail : '••••••••@••••••.com'
                    ) : (
                      <span className="text-gray-500 italic">Chưa có email admin</span>
                    )}
                  </span>
                </div>
                {currentAdminEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCurrentEmail(!showCurrentEmail)}
                  >
                    {showCurrentEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Server className="w-4 h-4" />
                <span>
                  Nhà cung cấp: <span className="font-semibold capitalize">{emailProvider}</span>
                </span>
              </div>
              
              <div className={`text-xs ${adminExists ? 'text-green-600' : 'text-yellow-600'}`}>
                {adminExists ? (
                  currentAdminEmail ? 
                    '✅ Admin đã được cấu hình và sẵn sàng nhận thông báo' :
                    '⚠️ Admin tồn tại nhưng chưa có email'
                ) : (
                  '❌ Chưa có admin trong hệ thống'
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Nhà cung cấp Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProviderLoading ? (
            <p>Đang tải cài đặt...</p>
          ) : (
            <>
              <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="outlook" id="outlook" />
                  <Label htmlFor="outlook" className="font-normal">
                    <div className="flex items-center space-x-2">
                      <span>Sử dụng Email Vietcombank (Outlook SMTP)</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">MẶC ĐỊNH</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Gửi email trực tiếp từ dongnv.hvu@vietcombank.com.vn qua Outlook SMTP với App Password.</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="resend" id="resend" />
                  <Label htmlFor="resend" className="font-normal">
                    <div className="flex items-center space-x-2">
                      <span>Sử dụng Resend API</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">DỰ PHÒNG</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Gửi email thông qua dịch vụ Resend API (chỉ khi Outlook không khả dụng).</p>
                  </Label>
                </div>
              </RadioGroup>
              <Button 
                onClick={saveEmailProvider} 
                disabled={isSavingProvider || selectedProvider === emailProvider}
              >
                {isSavingProvider ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Cài đặt Email Admin</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="adminEmail">Email Admin nhận thông báo hệ thống</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="ngviendong@gmail.com"
                className="flex-1"
              />
              <Button 
                onClick={saveAdminEmail}
                disabled={isLoading || (adminEmail === currentAdminEmail && adminExists)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? 'Đang lưu...' : (adminExists ? 'Cập nhật' : 'Tạo Admin')}
              </Button>
            </div>
            {adminEmail !== currentAdminEmail && adminEmail && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Email đã thay đổi. Nhấn "{adminExists ? 'Cập nhật' : 'Tạo Admin'}" để lưu.
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📧 Thông tin</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Email này sẽ nhận tất cả thông báo từ hệ thống</li>
              <li>• Bao gồm: báo cáo lỗi, thông báo tài sản, nhắc nhở CRC</li>
              <li>• Đảm bảo email luôn hoạt động để không bỏ lỡ thông báo quan trọng</li>
              <li>• Email sẽ được gửi qua dịch vụ Resend API</li>
              <li>• <strong>API Key:</strong> re_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn</li>
              {!adminExists && <li>• <strong>Sẽ tạo admin mới với username: admin, password: admin123</strong></li>}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Direct Email Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-green-600" />
            <span>Test Email Trực tiếp</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderTester />
        </CardContent>
      </Card>

      {/* Email Test Function (Legacy) - This can be kept or removed based on preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-green-600" />
            <span>Kiểm tra chức năng Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Test gửi email toàn hệ thống</h3>
              <p className="text-sm text-gray-600 mt-1">
                Kiểm tra chức năng gửi email ở tất cả các trang và module
              </p>
              {currentAdminEmail && (
                <p className="text-xs text-green-600 mt-1">
                  📧 Email test sẽ được gửi đến: {showCurrentEmail ? currentAdminEmail : '••••••••@••••••.com'}
                </p>
              )}
            </div>
            <Button 
              onClick={testEmailFunction}
              disabled={isTesting || !currentAdminEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTesting ? 'Đang test...' : 'Test Email'}
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🧪 Test bao gồm</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Gửi email theo nhà cung cấp mặc định đã lưu.</li>
              <li>• Sử dụng template email 'test' của hệ thống.</li>
              <li>• Gửi đến email của admin đã được cấu hình.</li>
            </ul>
          </div>

          {!currentAdminEmail && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vui lòng lưu email admin trước khi thực hiện test email.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Quản lý Admin User</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CreateAdminButton />
          <div className="border-t pt-4">
            <ForceCreateAdminButton />
          </div>
        </CardContent>
      </Card>

      {/* Email Provider Status */}
      <EmailProviderStatus />

      {/* Resend Setup Guide */}
      <ResendSetupGuide />

      {/* Message Display */}
      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                         message.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};