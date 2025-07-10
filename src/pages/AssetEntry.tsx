import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Plus, Minus, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const AssetEntry = () => {
  console.log('🚀 AssetEntry component rendering...');

  // Simple state management without complex hooks
  const [formData, setFormData] = useState({
    room: '',
    transaction_type: '',
    parts_day: '',
    transaction_date: '',
    note: ''
  });

  const [assets, setAssets] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestrictedTime, setIsRestrictedTime] = useState(false);

  // Force light theme
  useEffect(() => {
    const forceLightTheme = () => {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#111827';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.color = '#111827';
      document.documentElement.style.colorScheme = 'light';
      document.body.style.colorScheme = 'light';
      
      // Remove dark classes
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
      document.body.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-theme');
    };

    forceLightTheme();
    const interval = setInterval(forceLightTheme, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simple time restriction check
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour + minute / 60;
      
      // Check if current time is in restricted periods
      const isRestricted = 
        (currentTime >= 7.75 && currentTime <= 8.083) || // 7:45-8:05
        (currentTime >= 12.75 && currentTime <= 13.083); // 12:45-13:05
      
      setIsRestrictedTime(isRestricted);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleAssetChange = (index: number, value: string) => {
    const newAssets = [...assets];
    newAssets[index] = value;
    setAssets(newAssets);
  };

  const addAssetField = () => {
    setAssets([...assets, '']);
  };

  const removeAssetField = (index: number) => {
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simple validation
      const validAssets = assets.filter(asset => asset.trim() !== '');
      
      if (validAssets.length === 0) {
        toast.error('Vui lòng nhập ít nhất một mã tài sản');
        return;
      }

      if (!formData.room || !formData.transaction_type || !formData.parts_day || !formData.transaction_date) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Simulate submission
      console.log('📤 Submitting form:', { formData, assets: validAssets });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`✅ Đã gửi thông báo thành công cho ${validAssets.length} tài sản!`);
      
      // Reset form
      setFormData({
        room: '',
        transaction_type: '',
        parts_day: '',
        transaction_date: '',
        note: ''
      });
      setAssets(['']);
      
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error('❌ Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const hasValidAssets = assets.some(asset => asset.trim() !== '');
    const hasRequiredFields = formData.room && formData.transaction_type && 
                             formData.parts_day && formData.transaction_date;
    return hasValidAssets && hasRequiredFields;
  };

  return (
    <div 
      className="min-h-screen bg-white p-4"
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#111827',
        minHeight: '100vh',
        padding: '1rem'
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Time Restriction Alert */}
        {isRestrictedTime && (
          <Alert 
            variant="destructive"
            style={{ 
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
              color: '#991b1b'
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>
                  Đang trong khung giờ cấm (7:45-8:05 hoặc 12:45-13:05). 
                  Vui lòng sử dụng Zalo để thông báo.
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card 
          className="shadow-lg"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#111827',
            border: '1px solid #e5e7eb'
          }}
        >
          <CardHeader 
            style={{ 
              background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)',
              color: '#111827',
              borderBottom: '1px solid #dcfce7'
            }}
          >
            <CardTitle 
              className="text-2xl font-bold text-center flex items-center justify-center space-x-3"
              style={{ color: '#1f2937' }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: '#10b981',
                  color: '#ffffff'
                }}
              >
                <Package className="w-6 h-6" />
              </div>
              <span>Thông báo Mượn/Xuất Tài sản</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent 
            className="p-6 space-y-6"
            style={{ 
              backgroundColor: '#ffffff',
              color: '#111827'
            }}
          >
            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room" style={{ color: '#111827' }}>
                Phòng <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.room} onValueChange={(value) => setFormData({...formData, room: value})}>
                <SelectTrigger style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}>
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                  <SelectItem value="101">Phòng 101</SelectItem>
                  <SelectItem value="102">Phòng 102</SelectItem>
                  <SelectItem value="103">Phòng 103</SelectItem>
                  <SelectItem value="201">Phòng 201</SelectItem>
                  <SelectItem value="202">Phòng 202</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="transaction_type" style={{ color: '#111827' }}>
                Loại giao dịch <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.transaction_type} onValueChange={(value) => setFormData({...formData, transaction_type: value})}>
                <SelectTrigger style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}>
                  <SelectValue placeholder="Chọn loại giao dịch" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                  <SelectItem value="muon">Mượn</SelectItem>
                  <SelectItem value="xuat">Xuất</SelectItem>
                  <SelectItem value="tra">Trả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parts Day */}
            <div className="space-y-2">
              <Label htmlFor="parts_day" style={{ color: '#111827' }}>
                Buổi <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.parts_day} onValueChange={(value) => setFormData({...formData, parts_day: value})}>
                <SelectTrigger style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}>
                  <SelectValue placeholder="Chọn buổi" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                  <SelectItem value="sang">Sáng</SelectItem>
                  <SelectItem value="chieu">Chiều</SelectItem>
                  <SelectItem value="toi">Tối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date" style={{ color: '#111827' }}>
                Ngày giao dịch <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}
              />
            </div>

            {/* Asset Codes */}
            <div className="space-y-4">
              <Label style={{ color: '#111827' }}>
                Mã tài sản <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {assets.map((asset, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Nhập mã tài sản (VD: 123.2024)"
                      value={asset}
                      onChange={(e) => handleAssetChange(index, e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}
                    />
                    {assets.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAssetField(index)}
                        style={{ backgroundColor: '#ffffff', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAssetField}
                  className="w-full"
                  style={{ backgroundColor: '#ffffff', color: '#10b981', borderColor: '#10b981' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mã tài sản
                </Button>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note" style={{ color: '#111827' }}>
                Ghi chú
              </Label>
              <Textarea
                placeholder="Nhập ghi chú (tùy chọn)"
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting || isRestrictedTime}
                className="w-full"
                style={{ 
                  backgroundColor: isFormValid() && !isSubmitting && !isRestrictedTime ? '#10b981' : '#9ca3af',
                  color: '#ffffff'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  '📤 Gửi thông báo'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card 
          style={{ 
            backgroundColor: '#f0f9ff',
            borderColor: '#bfdbfe',
            color: '#111827'
          }}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2" style={{ color: '#1e40af' }}>
              🔍 Debug Information
            </h3>
            <div className="text-sm space-y-1" style={{ color: '#1e40af' }}>
              <p>• Component: AssetEntry (Standalone)</p>
              <p>• Render time: {new Date().toLocaleTimeString()}</p>
              <p>• Form valid: {isFormValid() ? '✅' : '❌'}</p>
              <p>• Restricted time: {isRestrictedTime ? '🚫' : '✅'}</p>
              <p>• Assets count: {assets.filter(a => a.trim()).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetEntry;