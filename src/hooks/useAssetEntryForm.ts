import { useState, useMemo } from 'react';
import { AssetEntryFormState } from '@/types/assetEntryFormState';
import { getGMTPlus7Date, getDateBasedOnTime } from '@/utils/dateUtils';

export const useAssetEntryForm = () => {
  const [formData, setFormData] = useState<AssetEntryFormState>({
    room: '',
    transaction_type: '',
    parts_day: '',
    transaction_date: '',
    note: ''
  });

  const [multipleAssets, setMultipleAssets] = useState<string[]>(['']);

  const handleRoomChange = (value: string) => {
    setFormData(prev => ({ ...prev, room: value }));
  };

  const handleAssetChange = (index: number, value: string) => {
    const newAssets = [...multipleAssets];
    newAssets[index] = value;
    setMultipleAssets(newAssets);
  };

  const addAssetField = () => {
    setMultipleAssets([...multipleAssets, '']);
  };

  const removeAssetField = (index: number) => {
    if (multipleAssets.length > 1) {
      const newAssets = multipleAssets.filter((_, i) => i !== index);
      setMultipleAssets(newAssets);
    }
  };

  const isFormValid = useMemo(() => {
    const hasValidAssets = multipleAssets.some(asset => asset.trim() !== '');
    const hasRequiredFields = formData.room && formData.transaction_type && 
                             formData.parts_day && formData.transaction_date;
    return hasValidAssets && hasRequiredFields;
  }, [formData, multipleAssets]);

  const clearForm = () => {
    setFormData({
      room: '',
      transaction_type: '',
      parts_day: '',
      transaction_date: '',
      note: ''
    });
    setMultipleAssets(['']);
  };

  const disabledBeforeDate = useMemo(() => {
    const gmtPlus7Date = getGMTPlus7Date();
    const morningTargetDate = getDateBasedOnTime('00:00'); // Fixed: Pass '00:00' as argument
    return morningTargetDate < gmtPlus7Date ? morningTargetDate : gmtPlus7Date;
  }, []);

  return {
    formData,
    setFormData,
    multipleAssets,
    setMultipleAssets,
    handleRoomChange,
    handleAssetChange,
    addAssetField,
    removeAssetField,
    isFormValid: Boolean(isFormValid), // Ensure it's always boolean
    clearForm,
    disabledBeforeDate,
  };
};