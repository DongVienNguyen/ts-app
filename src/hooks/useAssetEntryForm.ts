import { useState, useMemo, useEffect } from 'react';
import { AssetEntryFormState } from '@/types/assetEntryFormState';
import { calculateDefaultValues, getDefaultPartsDay } from '@/utils/defaultValues';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export const useAssetEntryForm = () => {
  const { user: currentUser } = useCurrentUser();
  const [formData, setFormData] = useState<AssetEntryFormState>({
    room: '',
    transaction_type: '',
    parts_day: '',
    transaction_date: '',
    note: 'Ship PGD'
  });

  const [multipleAssets, setMultipleAssets] = useState<string[]>(['']);

  useEffect(() => {
    if (currentUser) {
      setFormData(calculateDefaultValues(currentUser));
    }
  }, [currentUser]);

  const handleRoomChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      room: value,
      note: value === 'QLN' ? '' : 'Ship PGD',
      parts_day: getDefaultPartsDay(value)
    }));
  };

  const handleAssetChange = (index: number, value: string) => {
    const newAssets = [...multipleAssets];
    newAssets[index] = value.replace(/[^0-9.]/g, '').replace(/(\.\d{2})\d*$/, '$1').replace(/^(\d{4})\d*/, '$1');
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

  const requiresNoteDropdown = useMemo(() =>
    ["CMT8", "NS", "ĐS", "LĐH"].includes(formData.room),
    [formData.room]
  );

  const validateAssetFormat = (value: string) => /^\d{1,4}\.\d{2}$/.test(value.trim());

  const isFormValid = useMemo(() => {
    const filledAssets = multipleAssets.filter(asset => asset.trim());
    if (filledAssets.length === 0) return false;

    const allAssetsValid = filledAssets.every(validateAssetFormat);
    const hasRequiredFields = formData.room && formData.transaction_type && 
                             formData.parts_day && formData.transaction_date;
    const isNoteValid = formData.room === 'QLN' || !requiresNoteDropdown || (requiresNoteDropdown && formData.note);
    
    return allAssetsValid && hasRequiredFields && isNoteValid;
  }, [formData, multipleAssets, requiresNoteDropdown]);

  const clearForm = () => {
    if (currentUser) {
      setFormData(calculateDefaultValues(currentUser));
    } else {
      setFormData({
        room: '',
        transaction_type: '',
        parts_day: '',
        transaction_date: '',
        note: 'Ship PGD'
      });
    }
    setMultipleAssets(['']);
  };

  const disabledBeforeDate = useMemo(() => {
    if (currentUser) {
      const defaultValues = calculateDefaultValues(currentUser);
      // The time part is not important, just the date
      return new Date(defaultValues.transaction_date.replace(/-/g, '/'));
    }
    return new Date();
  }, [currentUser]);

  return {
    formData,
    setFormData,
    multipleAssets,
    setMultipleAssets,
    handleRoomChange,
    handleAssetChange,
    addAssetField,
    removeAssetField,
    isFormValid: Boolean(isFormValid),
    clearForm,
    disabledBeforeDate,
    requiresNoteDropdown,
  };
};