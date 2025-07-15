import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSecureAuth } from '@/contexts/AuthContext';
import { sendErrorReport } from '@/services/emailService';
import { toast } from 'sonner';

const ErrorReport = () => {
  const navigate = useNavigate();
  const { user } = useSecureAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    actualResult: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Bạn cần đăng nhập để gửi báo cáo lỗi');
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error('Vui lòng điền tiêu đề và mô tả lỗi');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendErrorReport(
        user.staff_name || user.username,
        `${user.username}@company.com`,
        {
          title: formData.title,
          description: formData.description,
          stepsToReproduce: formData.steps,
          expectedResult: formData.expectedResult,
          actualResult: formData.actualResult,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      );

      if (result.success) {
        toast.success('Báo cáo lỗi đã được gửi thành công!');
        setFormData({
          title: '',
          description: '',
          steps: '',
          expectedResult: '',
          actualResult: ''
        });
      } else {
        toast.error('Không thể gửi báo cáo lỗi. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Đã xảy ra lỗi khi gửi báo cáo');
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        
        <div className="flex items-center space-x-3 mb-2">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold">Báo cáo lỗi</h1>
        </div>
        <p className="text-gray-600">
          Gửi báo cáo về lỗi hoặc vấn đề bạn gặp phải khi sử dụng hệ thống
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lỗi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề lỗi *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Mô tả ngắn gọn về lỗi"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về lỗi bạn gặp phải"
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Các bước tái hiện lỗi</Label>
              <Textarea
                id="steps"
                value={formData.steps}
                onChange={(e) => setFormData(prev => ({ ...prev, steps: e.target.value }))}
                placeholder="1. Làm gì đó&#10;2. Sau đó làm gì&#10;3. Lỗi xảy ra"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedResult">Kết quả mong đợi</Label>
              <Textarea
                id="expectedResult"
                value={formData.expectedResult}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedResult: e.target.value }))}
                placeholder="Bạn mong đợi điều gì sẽ xảy ra?"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualResult">Kết quả thực tế</Label>
              <Textarea
                id="actualResult"
                value={formData.actualResult}
                onChange={(e) => setFormData(prev => ({ ...prev, actualResult: e.target.value }))}
                placeholder="Điều gì thực sự đã xảy ra?"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Thông tin hệ thống</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Người báo cáo:</strong> {user?.staff_name || user?.username}</p>
                <p><strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}</p>
                <p><strong>Trình duyệt:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang gửi...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorReport;