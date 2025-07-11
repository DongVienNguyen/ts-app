import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOtherAssetOperations } from './useOtherAssetOperations';
import { OtherAsset } from '@/types/asset';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

export const useOtherAssets = (user: any) => {
  const [assets, setAssets] = useState<OtherAsset[]>([]);
  // const [filteredAssets, setFilteredAssets] = useState<OtherAsset[]>([]); // Removed as it's now derived
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAsset, setEditingAsset] = useState<OtherAsset | null>(null);
  const [changeReason, setChangeReason] = useState('');
  // Thay đổi kiểu dữ liệu của message để chấp nhận null
  const [message, setMessage] = useState<(null | { type: 'success' | 'error'; text: string })>(null);
  // Thay đổi kiểu dữ liệu của newAsset thành TablesInsert<'other_assets'>
  const [newAsset, setNewAsset] = useState<TablesInsert<'other_assets'> | null>(null);

  const { loadAssets, saveAsset, deleteAsset: deleteAssetOperation } = useOtherAssetOperations(user);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    const fetchedAssets = await loadAssets(); // Use the loadAssets from operations hook
    setAssets(fetchedAssets);
    setIsLoading(false);
  }, [user, loadAssets]); // Depend on user and loadOtherAssets

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Derive filteredAssets using useMemo
  const filteredAssets = useMemo(() => {
    if (!searchTerm) {
      return assets;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return assets.filter(asset =>
      asset.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      asset.depositor?.toLowerCase().includes(lowerCaseSearchTerm) ||
      asset.deposit_receiver?.toLowerCase().includes(lowerCaseSearchTerm) ||
      asset.withdrawal_deliverer?.toLowerCase().includes(lowerCaseSearchTerm) ||
      asset.withdrawal_receiver?.toLowerCase().includes(lowerCaseSearchTerm) ||
      asset.notes?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [assets, searchTerm]);

  const clearForm = () => {
    setNewAsset({
      name: '',
      deposit_date: null, // Sử dụng null cho các trường ngày có thể rỗng
      depositor: null,
      deposit_receiver: null,
      withdrawal_date: null,
      withdrawal_deliverer: null,
      withdrawal_receiver: null,
      notes: null,
      // id, created_at, updated_at là tùy chọn trong TablesInsert, không cần khai báo
    });
    setEditingAsset(null);
    setChangeReason('');
  };

  const handleSave = async () => {
    setMessage(null); // Xóa thông báo bằng cách đặt thành null
    if (!newAsset?.name?.trim()) { // Kiểm tra newAsset và name trước khi trim
      setMessage({ type: 'error', text: 'Tên tài sản là bắt buộc' });
      return;
    }

    setIsLoading(true);
    // newAsset đã là TablesInsert<'other_assets'>, editingAsset là OtherAsset | null
    const success = await saveAsset(newAsset, editingAsset, changeReason); 
    if (success) {
      setMessage({ type: 'success', text: editingAsset ? 'Cập nhật tài sản thành công' : 'Thêm tài sản mới thành công' });
      clearForm();
      const fetchedAssets = await loadAssets(); // Reload assets after save
      setAssets(fetchedAssets);
    } else {
      // Error message is handled by useOtherAssetOperations
    }
    setIsLoading(false);
  };

  const editAsset = (asset: OtherAsset) => { // Đảm bảo asset có kiểu OtherAsset
    setEditingAsset({ ...asset });
    setNewAsset({
      id: asset.id, // Bao gồm id khi chỉnh sửa
      name: asset.name || '',
      deposit_date: asset.deposit_date || null,
      depositor: asset.depositor || null,
      deposit_receiver: asset.deposit_receiver || null,
      withdrawal_date: asset.withdrawal_date || null,
      withdrawal_deliverer: asset.withdrawal_deliverer || null,
      withdrawal_receiver: asset.withdrawal_receiver || null,
      notes: asset.notes || null,
      created_at: asset.created_at || null,
      updated_at: asset.updated_at || null,
    });
  };

  const deleteAsset = async (asset: OtherAsset) => { // Đảm bảo asset có kiểu OtherAsset
    setMessage(null); // Xóa thông báo bằng cách đặt thành null
    setIsLoading(true);
    const success = await deleteAssetOperation(asset); // Use deleteAsset from operations hook
    if (success) {
      setMessage({ type: 'success', text: 'Xóa tài sản thành công' });
      const fetchedAssets = await loadAssets(); // Reload assets after delete
      setAssets(fetchedAssets);
    } else {
      // Error message is handled by useOtherAssetOperations
    }
    setIsLoading(false);
  };

  return {
    assets,
    filteredAssets, // Now derived
    isLoading,
    searchTerm,
    setSearchTerm,
    editingAsset,
    setEditingAsset,
    changeReason,
    setChangeReason,
    newAsset,
    setNewAsset,
    handleSave,
    editAsset,
    deleteAsset,
    clearForm,
    message,
    setMessage
  };
};