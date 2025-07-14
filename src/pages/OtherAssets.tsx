import { useEffect } from 'react';
import { Archive, History, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecureAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AssetHistoryManager } from '@/components/AssetHistoryManager';
import { useOtherAssets } from '@/hooks/useOtherAssets';
import { OtherAssetForm } from '@/components/OtherAssetForm';
import OtherAssetSearchBar from '@/components/OtherAssetSearchBar';
import OtherAssetTable from '@/components/OtherAssetTable';

const OtherAssets = () => {
  const { user } = useSecureAuth();
  const navigate = useNavigate();
  
  const {
    filteredAssets,
    isLoading,
    searchTerm,
    setSearchTerm,
    editingAsset, // Re-added this line
    // setEditingAsset, // This is not directly used in this component's JSX
    // changeReason, // Removed as it's not directly read in this component's JSX
    // setChangeReason, // Removed as it's not directly used in this component's JSX
    newAsset,
    // setNewAsset, // Removed as it's not directly used in this component's JSX
    handleSave,
    editAsset,
    deleteAsset,
    clearForm,
    message,
    setMessage
  } = useOtherAssets(user);

  useEffect(() => {
    if (user && user.department !== 'NQ' && user.role !== 'admin') {
      setMessage({ type: 'error', text: "Chỉ nhân viên phòng NQ và admin mới có thể truy cập module này" });
      setTimeout(() => navigate('/'), 3000);
      return;
    }
  }, [user, navigate, setMessage]);

  // const handleCancelEdit = () => { // Removed as it's not used
  //   setEditingAsset(null);
  //   setChangeReason('');
  // };

  if (isLoading && filteredAssets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full">
          <Archive className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài sản, thùng khác gửi kho</h1>
          <p className="text-gray-600">Quản lý tài sản và thùng khác được gửi vào kho</p>
        </div>
      </div>

      {message && message.text && ( // Đã thêm kiểm tra 'message &&'
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assets" className="w-full">
        <TabsList>
          <TabsTrigger value="assets" className="flex items-center">
            <Archive className="w-4 h-4 mr-2" />
            Quản lý tài sản
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="history" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Lịch sử thay đổi
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <OtherAssetForm
            asset={editingAsset || newAsset} // Pass the asset being edited or added
            isOpen={!!editingAsset || !!newAsset} // Open if either is set
            onClose={clearForm} // Close handler
            onSave={handleSave} // Save handler
            isLoading={isLoading} // Loading state
          />
          <OtherAssetSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} filteredAssets={filteredAssets} />
          <OtherAssetTable filteredAssets={filteredAssets} user={user} onEdit={editAsset} onDelete={deleteAsset} />
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="history">
            <AssetHistoryManager user={user} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default OtherAssets;