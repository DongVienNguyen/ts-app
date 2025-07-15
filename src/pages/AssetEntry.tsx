import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssetEntryForm from '@/components/AssetEntryForm';
import { useTimeRestriction } from '@/hooks/useTimeRestriction';
import { useAssetEntry } from '@/hooks/useAssetEntry';
import { useAssetEntryForm } from '@/hooks/useAssetEntryForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Package, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const AssetEntry = () => {
  const { isRestrictedTime } = useTimeRestriction();
  const { submitAssetEntry, isSubmitting } = useAssetEntry();
  const { user: currentUser } = useCurrentUser();
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
    requiresNoteDropdown,
  } = useAssetEntryForm();

  const handleAssetCodesDetected = (codes: string[]) => {
    const newAssets = codes.length > 0 ? codes : [''];
    setMultipleAssets(newAssets);
    
    if (codes.length > 0) {
      toast.success(`Đã điền ${codes.length} mã tài sản!`, { 
        description: `Mã: ${codes.join(', ')}`,
        duration: 4000
      });
    }
  };

  const handleRoomDetected = (room: string) => {
    handleRoomChange(room);
    toast.success(`Đã tự động chọn phòng: ${room}`, { duration: 3000 });
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error("Vui lòng điền đầy đủ và đúng định dạng các thông tin bắt buộc.");
      return;
    }

    try {
      const result = await submitAssetEntry(formData, multipleAssets);
      
      if (result.success) {
        toast.success("Gửi thông báo thành công!", { 
          description: `Đã xử lý ${multipleAssets.filter(a => a.trim()).length} mã tài sản.`,
          duration: 4000
        });
        clearForm();
      } else {
        toast.error("Có lỗi xảy ra", { description: result.error || "Vui lòng thử lại" });
      }
    } catch (error) {
      toast.error("Lỗi hệ thống", { description: "Không thể gửi thông báo, vui lòng thử lại sau." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Thông báo Mượn/Xuất</h1>
            <p className="text-slate-600">
              {currentUser?.role === 'admin' 
                ? "Không giới hạn thời gian cho Admin" 
                : "Khung giờ 7:45-8:05 và 12:45-13:05 hãy nhắn Zalo vì đã chốt DS"
              }
            </p>
          </div>
        </div>

        {isRestrictedTime && currentUser?.role !== 'admin' && (
          <Alert className="border-red-200 bg-red-50">
            <Clock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Hiện tại đang trong khung giờ cấm. Vui lòng sử dụng Zalo để thông báo.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-green-50 border-b border-slate-200">
            <CardTitle className="text-base font-normal text-slate-700 leading-relaxed text-green-700">
              Từ Phải sang Trái: 2 ký tự thứ 9 và 10 là Năm TS: 24; 4 ký tự cuối là Mã TS: 259 - vd: 0424102470200259
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
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
              requiresNoteDropdown={requiresNoteDropdown}
              clearForm={clearForm}
            />
            <div className="text-center mt-4 border-t pt-4">
              <Link to="/error-report" className="text-sm text-red-600 hover:underline flex items-center justify-center gap-1.5">
                <Bug className="w-4 h-4" />
                Gặp lỗi? Chụp hình & Click here.
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetEntry;