import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssetEntryForm from '@/components/AssetEntryForm';
import { useTimeRestriction } from '@/hooks/useTimeRestriction';
import { useAssetEntry } from '@/hooks/useAssetEntry';
import { useAssetEntryForm } from '@/hooks/useAssetEntryForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Package } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Time Restriction Alert */}
      {isRestrictedTime && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="text-red-800">Cảnh báo!</AlertTitle>
          <AlertDescription className="text-red-700">
            Hiện tại đang trong khung giờ cấm (7:45-8:05 hoặc 12:45-13:05). Vui lòng nhắn Zalo thay vì dùng hệ thống.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form Card */}
      <Card className="shadow-lg border-green-100">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span>Thông báo Mượn/Xuất Tài sản</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
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
  );
};

export default AssetEntry;