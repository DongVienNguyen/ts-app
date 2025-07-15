import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/utils/errorTracking';

const EXTERNAL_API_URL = 'https://app.base44.com/api/apps/684d56312caf55a7b8e58907/entities/AssetTransaction';
const API_KEY = 'eeeb5fbcbdd84a068c2784590a803161';
const SYNC_INTERVAL = 5000; // 5 giây

export const useExternalAssetSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const syncData = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch(EXTERNAL_API_URL, {
        headers: {
          'api_key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
      }

      const externalData = await response.json();
      const dataToProcess = Array.isArray(externalData) ? externalData : externalData?.data;

      if (!Array.isArray(dataToProcess)) {
        console.error('Cấu trúc dữ liệu API không như mong đợi:', externalData);
        throw new Error('Dữ liệu trả về từ API không phải là một mảng.');
      }

      if (dataToProcess.length === 0) {
        setLastSyncTime(new Date());
        setIsSyncing(false);
        return;
      }

      // Lấy danh sách mã nhân viên hợp lệ từ bảng staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('username');

      if (staffError) {
        throw new Error(`Lỗi khi lấy danh sách nhân viên: ${staffError.message}`);
      }

      const validStaffCodes = new Set(staffData.map(s => s.username));

      const transformedData = dataToProcess.map((item: any) => {
        const providedStaffCode = item.staff_code;
        // Kiểm tra nếu staff_code tồn tại và hợp lệ, nếu không thì dùng 'external_sync'
        const finalStaffCode = providedStaffCode && validStaffCodes.has(providedStaffCode)
          ? providedStaffCode
          : 'external_sync';

        return {
          external_id: item.id,
          transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
          parts_day: item.parts_day || 'Cả ngày',
          room: item.room || 'Unknown',
          transaction_type: item.transaction_type || 'Unknown',
          asset_year: item.asset_year || new Date().getFullYear(),
          asset_code: item.asset_code || 0,
          staff_code: finalStaffCode, // Sử dụng mã nhân viên đã được xác thực
          note: item.note || 'Synced from external API',
          source: 'external_api'
        };
      });

      const { error: upsertError } = await supabase
        .from('asset_transactions')
        .upsert(transformedData, { onConflict: 'external_id' });

      if (upsertError) {
        throw upsertError;
      }

      setLastSyncTime(new Date());
      setSyncCount(prev => prev + 1);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Lỗi không xác định khi đồng bộ.';
      setError(errorMessage);
      console.error('Lỗi đồng bộ dữ liệu từ API ngoài:', e);

      await captureError(e instanceof Error ? e : new Error(errorMessage), {
        functionName: 'useExternalAssetSync.syncData',
        severity: 'high',
        errorType: 'API_SYNC_FAILURE',
        additionalData: { apiUrl: EXTERNAL_API_URL }
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    syncData();
    const intervalId = setInterval(syncData, SYNC_INTERVAL);
    return () => clearInterval(intervalId);
  }, [syncData]);

  return { isSyncing, lastSyncTime, error, syncCount };
};