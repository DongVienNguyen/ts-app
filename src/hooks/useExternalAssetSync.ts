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

      if (!Array.isArray(externalData.data)) {
        throw new Error('Dữ liệu trả về từ API không phải là một mảng.');
      }

      if (externalData.data.length === 0) {
        console.log('Không có dữ liệu mới để đồng bộ.');
        setLastSyncTime(new Date());
        setIsSyncing(false);
        return;
      }

      const transformedData = externalData.data.map((item: any) => ({
        external_id: item.id, // Giả định API trả về trường 'id'
        transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
        parts_day: item.parts_day || 'Cả ngày',
        room: item.room || 'Unknown',
        transaction_type: item.transaction_type || 'Unknown',
        asset_year: item.asset_year || new Date().getFullYear(),
        asset_code: item.asset_code || 0,
        staff_code: item.staff_code || 'external_sync',
        note: item.note || 'Synced from external API',
        source: 'external_api'
      }));

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

      // Gửi thông báo lỗi đến admin
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
    // Chạy lần đầu ngay lập tức
    syncData();

    const intervalId = setInterval(syncData, SYNC_INTERVAL);

    return () => clearInterval(intervalId);
  }, [syncData]);

  return { isSyncing, lastSyncTime, error, syncCount };
};