import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import FormHeader from '@/components/FormHeader';
import AssetEntryForm from '@/components/AssetEntryForm';
import { useTimeRestriction } from '@/hooks/useTimeRestriction';
import { useAssetEntry } from '@/hooks/useAssetEntry';
import { useAssetEntryForm } from '@/hooks/useAssetEntryForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Camera, Zap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const AssetEntry = () => {
  const { isRestrictedTime } = useTimeRestriction();
  const { submitAssetEntry, isSubmitting } = useAssetEntry();
  const {
    formData,
    setFormData,
    multipleAssets,
    setMultipleAssets,
    handleRoomChange,
    handleAssetChange,
    addAssetField,
    removeAssetField,
    isFormValid,
    clearForm,
    disabledBeforeDate,
  } = useAssetEntryForm();

  const handleAssetCodesDetected = (codes: string[]) => {
    console.log('🎯 Asset codes detected:', codes);
    
    // Replace current assets with detected codes, but keep at least one empty field
    const newAssets = codes.length > 0 ? codes : [''];
    setMultipleAssets(newAssets);
    
    if (codes.length > 0) {
      toast.success(
        `🎉 Đã điền ${codes.length} mã tài sản!`,
        { 
          description: `Mã tài sản: ${codes.join(', ')}`,
          duration: 4000
        }
      );
    }
  };

  const handleRoomDetected = (room: string) => {
    console.log('🏢 Room detected:', room);
    
    // Auto-fill room if not already selected
    if (!formData.room) {
      handleRoomChange(room);
      toast.success(
        `📍 Đã chọn phòng: ${room}`,
        { duration: 3000 }
      );
    } else if (formData.room !== room) {
      // Show suggestion if different room detected
      toast.info(
        `💡 AI phát hiện phòng: ${room}`,
        { 
          description: `Hiện tại đang chọn: ${formData.room}. Bạn có muốn thay đổi?`,
          duration: 5000
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const result = await submitAssetEntry(formData, multipleAssets);
      
      if (result.success) {
        toast.success(
          "✅ Gửi thông báo thành công!",
          { 
            description: `Đã xử lý ${multipleAssets.filter(a => a.trim()).length} mã tài sản`,
            duration: 4000
          }
        );
        clearForm();
      } else {
        toast.error(
          "❌ Có lỗi xảy ra",
          { description: result.error || "Vui lòng thử lại" }
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        "❌ Lỗi hệ thống",
        { description: "Vui lòng thử lại sau" }
      );
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <FormHeader />
        
        {/* Time Restriction Alert */}
        {isRestrictedTime && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Cảnh báo!</AlertTitle>
            <AlertDescription>
              Hiện tại đang trong khung giờ cấm (7:45-8:05 hoặc 12:45-13:05). Vui lòng nhắn Zalo thay vì dùng hệ thống.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center space-x-2">
              <Camera className="w-6 h-6 text-green-600" />
              <span>📋 Thông báo Mượn/Xuất Tài sản</span>
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Sử dụng AI để tự động phát hiện mã tài sản từ hình ảnh
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <AssetEntryForm
              isRestrictedTime={isRestrictedTime}
              formData={formData}
              setFormData={setFormData}
              multipleAssets={multipleAssets}
              handleRoomChange={handleRoomChange}
              handleAssetChange={handleAssetChange}
              addAssetField={addAssetField}
              removeAssetField={removeAssetField}
              isFormValid={isFormValid}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              disabledBeforeDate={disabledBeforeDate}
              onAssetCodesDetected={handleAssetCodesDetected}
              onRoomDetected={handleRoomDetected}
            />
          </CardContent>
        </Card>

        {/* Help and Features Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Features Card */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>🤖 Tính năng AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span><strong>Chụp ảnh mã tài sản</strong> để tự động điền form</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span><strong>Phát hiện phòng ban</strong> từ mã tài sản</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span><strong>Hỗ trợ nhiều mã</strong> trong một ảnh</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span><strong>Hoạt động trên</strong> cả mobile và desktop</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>📝 Hướng dẫn sử dụng</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">1.</span>
                    <span><strong>Chọn phòng</strong> và loại giao dịch</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">2.</span>
                    <span><strong>Nhập mã tài sản</strong> hoặc dùng AI</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">3.</span>
                    <span><strong>Chọn ca</strong> và ngày giao dịch</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">4.</span>
                    <span><strong>Thêm ghi chú</strong> nếu cần</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips Card */}
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Mẹo sử dụng AI hiệu quả:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
                  <ul className="space-y-1">
                    <li>• Chụp ảnh trong điều kiện ánh sáng tốt</li>
                    <li>• Đảm bảo mã tài sản hiển thị rõ ràng</li>
                    <li>• Giữ camera ổn định khi chụp</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• Chụp từ góc vuông góc với nhãn</li>
                    <li>• Tránh bóng che hoặc phản quang</li>
                    <li>• Có thể chụp nhiều mã trong một ảnh</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssetEntry;