import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/utils/errorTracking';

const EXTERNAL_API_URL = 'https://app.base44.com/api/apps/684d56312caf55a7b8e58907/entities/AssetTransaction';
const API_KEY = 'eeeb5fbcbdd84a068c2784590a803161';
const SYNC_INTERVAL = 60000; // 60 giây

const getStoredValue = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const useExternalAssetSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [notifyByEmail, setNotifyByEmail] = useState(() => getStoredValue('sync:notifyByEmail', true));
  const [notifyByPush, setNotifyByPush] = useState(() => getStoredValue('sync:notifyByPush', true));
  const isSyncingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePause = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const toggleEmailNotification = useCallback(() => {
    setNotifyByEmail(current => {
      const newValue = !current;
      localStorage.setItem('sync:notifyByEmail', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const togglePushNotification = useCallback(() => {
    setNotifyByPush(current => {
      const newValue = !current;
      localStorage.setItem('sync:notifyByPush', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const syncData = useCallback(async (isManual = false) => {
    if (isSyncingRef.current) {
      if (isManual) console.log("Sync already in progress.");
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch(EXTERNAL_API_URL, {
        headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 429) {
          const msg = 'Quá nhiều yêu cầu. Tự động tạm dừng trong 5 phút.';
          setError(msg);
          console.warn(msg);
          setIsPaused(true);
          setTimeout(() => setIsPaused(false), 5 * 60 * 1000);
          return;
        }
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
      }

      const externalData = await response.json();
      const dataToProcess = Array.isArray(externalData) ? externalData : externalData?.data;

      if (!Array.isArray(dataToProcess)) {
        throw new Error('Dữ liệu trả về từ API không phải là một mảng.');
      }

      if (dataToProcess.length === 0) {
        setLastSyncTime(new Date());
        return;
      }

      const { data: staffData, error: staffError } = await supabase.from('staff').select('username');
      if (staffError) throw new Error(`Lỗi khi lấy danh sách nhân viên: ${staffError.message}`);
      
      const validStaffCodes = new Set(staffData.map(s => s.username));
      const transformedData = dataToProcess.map((item: any) => ({
        external_id: item.id,
        transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
        parts_day: item.parts_day || 'Cả ngày',
        room: item.room || 'Unknown',
        transaction_type: item.transaction_type || 'Unknown',
        asset_year: item.asset_year || new Date().getFullYear(),
        asset_code: item.asset_code || 0,
        staff_code: item.staff_code && validStaffCodes.has(item.staff_code) ? item.staff_code : 'external_sync',
        note: item.note || 'Synced from external API',
        source: 'external_api'
      }));

      const { error: upsertError } = await supabase.from('asset_transactions').upsert(transformedData, { onConflict: 'external_id' });
      if (upsertError) throw upsertError;

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
        additionalData: { apiUrl: EXTERNAL_API_URL },
        disableEmail: !notifyByEmail,
        disablePush: !notifyByPush,
      });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [notifyByEmail, notifyByPush]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isPaused) {
      syncData();
      intervalRef.current = setInterval(() => syncData(), SYNC_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, syncData]);

  return { 
    isSyncing, 
    lastSyncTime, 
    error, 
    syncCount,
    isPaused,
    notifyByEmail,
    notifyByPush,
    togglePause,
    toggleEmailNotification,
    togglePushNotification,
    syncData: () => syncData(true)
  };
};