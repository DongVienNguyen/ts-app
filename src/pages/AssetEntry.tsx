import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import AssetEntryForm from '@/components/AssetEntryForm';
import { useTimeRestriction } from '@/hooks/useTimeRestriction';
import { useAssetEntry } from '@/hooks/useAssetEntry';
import { useAssetEntryForm } from '@/hooks/useAssetEntryForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
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
      console.log('📤 Starting submission...', { formData, multipleAssets });
      
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
      console.error('❌ Submit error:', error);
      toast.error(
        "❌ Lỗi hệ thống",
        { description: "Vui lòng thử lại sau" }
      );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thông báo Mượn/Xuất
            </h1>
            <p className="text-gray-600">
              Khung giờ <span className="font-semibold text-red-600">7:45-8:05</span> và{' '}
              <span className="font-semibold text-red-600">12:45-13:05</span> hãy nhắn Zalo vì đã chốt DS
            </p>
          </div>

          {/* Time Restriction Alert */}
          {isRestrictedTime && (
            <Alert className="border-red-200 bg-red-50">
              <Clock className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Hiện tại đang trong khung giờ cấm. Vui lòng sử dụng Zalo để thông báo.
              </AlertDescription>
            </Alert>
          )}

          {/* Info Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-800">
              <span className="font-medium">Từ Phải</span> sang <span className="font-medium">Trái</span>: 2 ký tự từ thứ{' '}
              <span className="font-semibold">9</span> và <span className="font-semibold">10</span> là{' '}
              <span className="font-semibold">Năm TS</span>: 24, 4 ký tự cuối là{' '}
              <span className="font-semibold">Mã TS</span>: 259 - vd: 0424102470200259 → 259.24
            </div>
          </div>

          {/* Main Form Card */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
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
        </div>
      </div>
    </Layout>
  );
};

export default AssetEntry;