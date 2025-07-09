import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAssetHistory } from '@/hooks/useAssetHistory';
import { setCurrentUserContext, createNotesWithTimestamp } from '@/utils/otherAssetUtils';
import { Tables } from '@/integrations/supabase/types';

type OtherAsset = Tables<'other_assets'>;

export const useOtherAssetOperations = (user: any) => {
  const { saveHistory } = useAssetHistory(user);

  const loadAssets = useCallback(async () => {
    if (!user) return [];
    
    try {
      console.log('Loading other assets data...');
      
      await setCurrentUserContext(user);
      
      const { data: assetsData, error: assetsError } = await supabase
        .from('other_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (assetsError) {
        console.error('Error loading assets:', assetsError);
        throw assetsError;
      }
      
      console.log('Assets loaded:', assetsData);
      return assetsData || [];

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Không thể tải dữ liệu", {
        description: (error as Error).message,
      });
      return [];
    }
  }, [user]);

  const saveAsset = useCallback(async (
    newAsset: any,
    editingAsset: OtherAsset | null,
    changeReason: string
  ) => {
    console.log('=== STARTING SAVE OPERATION ===');
    
    if (!newAsset.name.trim()) {
      toast.error("Lỗi", { description: "Vui lòng nhập tên tài sản" });
      return false;
    }

    if (!newAsset.deposit_date) {
      toast.error("Lỗi", { description: "Vui lòng chọn ngày gửi kho" });
      return false;
    }

    if (editingAsset && !changeReason.trim()) {
      toast.error("Lỗi", { description: "Vui lòng nhập lý do thay đổi" });
      return false;
    }

    try {
      await setCurrentUserContext(user);
      
      const notesWithTimestamp = createNotesWithTimestamp(newAsset.notes, !!editingAsset);

      const assetData = {
        name: newAsset.name.trim(),
        deposit_date: newAsset.deposit_date.trim() === '' ? null : newAsset.deposit_date,
        depositor: newAsset.depositor?.trim() || null,
        deposit_receiver: newAsset.deposit_receiver?.trim() || null,
        withdrawal_date: newAsset.withdrawal_date.trim() === '' ? null : newAsset.withdrawal_date,
        withdrawal_deliverer: newAsset.withdrawal_deliverer?.trim() || null,
        withdrawal_receiver: newAsset.withdrawal_receiver?.trim() || null,
        notes: notesWithTimestamp
      };

      if (editingAsset) {
        const { data: updatedAsset, error: updateError } = await supabase
          .from('other_assets')
          .update(assetData)
          .eq('id', editingAsset.id)
          .select();

        if (updateError) throw updateError;

        if (user?.username && updatedAsset?.[0]) {
          await saveHistory({
            asset_id: editingAsset.id,
            asset_name: editingAsset.name,
            change_type: 'update',
            changed_by: user.username,
            change_reason: changeReason,
            old_data: editingAsset,
            new_data: updatedAsset[0]
          });
        }
        
        toast.success("Thành công", { description: "Cập nhật tài sản thành công" });
      } else {
        const { data: newAssetData, error: insertError } = await supabase
          .from('other_assets')
          .insert([assetData] as any) // Cast to any to resolve type mismatch
          .select();

        if (insertError) throw insertError;

        if (user?.username && newAssetData?.[0]) {
          await saveHistory({
            asset_id: newAssetData[0].id,
            asset_name: newAssetData[0].name,
            change_type: 'create',
            changed_by: user.username,
            change_reason: 'Tạo mới tài sản',
            new_data: newAssetData[0]
          });
        }
        
        toast.success("Thành công", { description: "Thêm tài sản thành công" });
      }

      return true;
    } catch (error) {
      console.error('=== SAVE OPERATION ERROR ===');
      console.error('Error:', error);
      toast.error("Lỗi", { description: "Không thể lưu tài sản: " + (error as Error).message });
      return false;
    }
  }, [user, saveHistory]);

  const deleteAsset = useCallback(async (asset: OtherAsset) => {
    if (!user || user.role !== 'admin') {
      toast.error("Không có quyền", { description: "Chỉ admin mới có thể xóa" });
      return false;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài sản "${asset.name}"?`)) {
      return false;
    }
    
    try {
      console.log('=== DELETING ASSET WITH ENHANCED HISTORY ===');
      
      await setCurrentUserContext(user);
      
      if (user?.username) {
        await saveHistory({
          asset_id: asset.id,
          asset_name: asset.name,
          change_type: 'delete',
          changed_by: user.username,
          change_reason: 'Xóa tài sản',
          old_data: asset
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const { data: historyCheck } = await supabase
            .from('asset_history_archive')
            .select('id')
            .eq('original_asset_id', asset.id)
            .eq('change_type', 'delete')
            .eq('changed_by', user.username);
          
          if (!historyCheck || historyCheck.length === 0) {
            await saveHistory({
              asset_id: asset.id,
              asset_name: asset.name,
              change_type: 'delete',
              changed_by: user.username,
              change_reason: 'Xóa tài sản (retry)',
              old_data: asset
            });
          }
        } catch (verifyError) {
          console.error('History verification error:', verifyError);
        }
      }

      const { error: deleteError } = await supabase
        .from('other_assets')
        .delete()
        .eq('id', asset.id);

      if (deleteError) throw deleteError;

      toast.success("Thành công", { description: "Xóa tài sản thành công và đã lưu lịch sử" });
      
      return true;
    } catch (error) {
      console.error('=== DELETE ERROR ===');
      console.error('Error:', error);
      toast.error("Lỗi", { description: "Không thể xóa tài sản: " + (error as Error).message });
      return false;
    }
  }, [user, saveHistory]);

  return {
    loadAssets,
    saveAsset,
    deleteAsset
  };
};