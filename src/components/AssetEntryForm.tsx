import React from 'react';
import { AssetEntryFormState } from '@/types/assetEntryFormState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssetCodeInputs from './AssetCodeInputs';
import TransactionTypeSelection from './TransactionTypeSelection';
import TransactionDetails from './TransactionDetails';
import SubmitButtons from './SubmitButtons';
import RoomSelection from './RoomSelection';

interface AssetEntryFormProps {
  formData: AssetEntryFormState;
  setFormData: (data: AssetEntryFormState) => void;
  multipleAssets: string[];
  handleRoomChange: (value: string) => void;
  handleAssetChange: (index: number, value: string) => void;
  addAssetField: () => void;
  removeAssetField: (index: number) => void;
  isFormValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  disabledBeforeDate: Date;
  onAssetCodesDetected: (codes: string[]) => void;
  onRoomDetected: (room: string) => void;
  requiresNoteDropdown: boolean;
  clearForm: () => void;
  isRestrictedTime: boolean;
}

const AssetEntryForm: React.FC<AssetEntryFormProps> = ({
  formData,
  setFormData,
  multipleAssets,
  handleRoomChange,
  handleAssetChange,
  addAssetField,
  removeAssetField,
  isFormValid,
  isSubmitting,
  onSubmit,
  disabledBeforeDate,
  onAssetCodesDetected,
  onRoomDetected,
  requiresNoteDropdown,
  clearForm,
  isRestrictedTime,
}) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <RoomSelection
          selectedRoom={formData.room}
          onRoomChange={handleRoomChange}
        />
        
        {formData.room === 'QLN' ? (
          <Input
            placeholder="Ghi chú tùy ý"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 mt-7"
          />
        ) : requiresNoteDropdown ? (
          <Select value={formData.note} onValueChange={(value) => setFormData({ ...formData, note: value })}>
            <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 mt-7">
              <SelectValue placeholder="Chọn ghi chú" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ship PGD">Ship PGD</SelectItem>
              <SelectItem value="Lấy ở CN">Lấy ở CN</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <AssetCodeInputs
        assets={multipleAssets}
        onAssetChange={handleAssetChange}
        onAddAsset={addAssetField}
        onRemoveAsset={removeAssetField}
        onAssetCodesDetected={onAssetCodesDetected}
        onRoomDetected={onRoomDetected}
      />

      <TransactionTypeSelection
        selectedType={formData.transaction_type}
        onTypeChange={(value) => setFormData({ ...formData, transaction_type: value })}
      />

      <TransactionDetails
        formData={formData}
        setFormData={setFormData}
        disabledBeforeDate={disabledBeforeDate}
      />

      <SubmitButtons
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        isRestrictedTime={isRestrictedTime}
        onSubmit={onSubmit}
        onClear={clearForm}
      />
    </form>
  );
};

export default AssetEntryForm;