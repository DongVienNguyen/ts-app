import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell, Send } from 'lucide-react';
import { sendPushNotification } from '@/services/notificationService';
import { useSecureAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function PushNotificationTester() {
  const { user } = useSecureAuth();
  const [testData, setTestData] = useState({
    username: '',
    title: 'Test Notification',
    body: 'This is a test push notification',
    url: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTest = async () => {
    if (!testData.username || !testData.title || !testData.body) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPushNotification(testData.username, {
        title: testData.title,
        body: testData.body,
        url: testData.url || undefined
      });

      if (result.success) {
        toast.success('Gửi thông báo test thành công!');
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Đã xảy ra lỗi khi gửi thông báo test');
    }
    setIsLoading(false);
  };

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Test Push Notification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-username">Username</Label>
          <Input
            id="test-username"
            value={testData.username}
            onChange={(e) => setTestData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Nhập username để test"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-title">Tiêu đề</Label>
          <Input
            id="test-title"
            value={testData.title}
            onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Tiêu đề thông báo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-body">Nội dung</Label>
          <Input
            id="test-body"
            value={testData.body}
            onChange={(e) => setTestData(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Nội dung thông báo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-url">URL (tùy chọn)</Label>
          <Input
            id="test-url"
            value={testData.url}
            onChange={(e) => setTestData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="URL để mở khi click thông báo"
          />
        </div>

        <Button 
          onClick={handleSendTest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Đang gửi...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Gửi Test</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}