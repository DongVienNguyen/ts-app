import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssetEntryForm from '@/components/AssetEntryForm';
import { useTimeRestriction } from '@/hooks/useTimeRestriction';
import { useAssetEntry } from '@/hooks/useAssetEntry';
import { useAssetEntryForm } from '@/hooks/useAssetEntryForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

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

  // Optimized light theme forcing - only once on mount
  useEffect(() => {
    const forceLightTheme = () => {
      // Force light theme on document - one time only
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('dark');
      document.body.removeAttribute('data-theme');
      
      // Set light color scheme
      document.documentElement.style.colorScheme = 'light';
      document.body.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#111827';
      
      console.log('🌞 [AssetEntry] Light theme forced (one time)');
    };

    forceLightTheme();
  }, []);

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
    <div 
      className="min-h-screen bg-white"
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#111827',
        colorScheme: 'light',
        minHeight: '100vh'
      }}
    >
      <div 
        className="space-y-6 bg-white text-gray-900 p-4" 
        style={{ 
          backgroundColor: '#ffffff', 
          color: '#111827',
          colorScheme: 'light'
        }}
      >
        {/* Time Restriction Alert */}
        {isRestrictedTime && (
          <Alert 
            variant="destructive" 
            className="border-red-200 bg-red-50 text-red-800"
            style={{ 
              backgroundColor: '#fef2f2', 
              borderColor: '#fecaca',
              color: '#991b1b'
            }}
          >
            <Terminal className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Cảnh báo!</AlertTitle>
            <AlertDescription className="text-red-700">
              Hiện tại đang trong khung giờ cấm (7:45-8:05 hoặc 12:45-13:05). Vui lòng nhắn Zalo thay vì dùng hệ thống.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card 
          className="shadow-lg border-green-100 bg-white max-w-4xl mx-auto"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: '#dcfce7',
            color: '#111827'
          }}
        >
          <CardHeader 
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100"
            style={{ 
              background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)',
              borderBottomColor: '#dcfce7',
              color: '#111827'
            }}
          >
            <CardTitle 
              className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center space-x-3"
              style={{ color: '#1f2937' }}
            >
              <div 
                className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(to bottom right, #10b981, #059669)'
                }}
              >
                <Package className="w-6 h-6 text-white" />
              </div>
              <span>Thông báo Mượn/Xuất Tài sản</span>
            </CardTitle>
          </CardHeader>
          <CardContent 
            className="p-6 bg-white text-gray-900"
            style={{ 
              backgroundColor: '#ffffff',
              color: '#111827'
            }}
          >
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

        {/* Debug Info */}
        <Card 
          className="max-w-4xl mx-auto"
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
              <p>• Component: AssetEntry (Full Featured)</p>
              <p>• Render time: {new Date().toLocaleTimeString()}</p>
              <p>• Form valid: {isFormValid ? '✅' : '❌'}</p>
              <p>• Restricted time: {isRestrictedTime ? '🚫' : '✅'}</p>
              <p>• Assets count: {multipleAssets.filter(a => a.trim()).length}</p>
              <p>• Submitting: {isSubmitting ? '⏳' : '✅'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetEntry;