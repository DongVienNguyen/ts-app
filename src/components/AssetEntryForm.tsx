import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import RoomSelection from './RoomSelection';
import TransactionTypeSelection from './TransactionTypeSelection';
import AssetCodeInputs from './AssetCodeInputs';
import TransactionDetails from './TransactionDetails';
import SubmitButtons from './SubmitButtons';
import TestDataButton from './TestDataButton';
import { AssetEntryFormState } from '@/types/assetEntryFormState';

interface AssetEntryFormProps {
  isRestrictedTime: boolean;
  formData: AssetEntryFormState;
  setFormData: React.Dispatch<React.SetStateAction<AssetEntryFormState>>;
  multipleAssets: string[];
  handleRoomChange: (value: string) => void;
  handleAssetChange: (index: number, value: string) => void;
  addAssetField: () => void;
  removeAssetField: (index: number) => void;
  isFormValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  disabledBeforeDate: Date;
  onAssetCodesDetected: (codes: string[]) => void;
  onRoomDetected: (room: string) => void;
}

const AssetEntryForm: React.FC<AssetEntryFormProps> = ({
  isRestrictedTime,
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
}) => {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Room Selection */}
        <RoomSelection
          selectedRoom={formData.room}
          onRoomChange={handleRoomChange}
        />

        {/* Transaction Type Selection */}
        <TransactionTypeSelection
          selectedType={formData.transaction_type}
          onTypeChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}
        />

        {/* Asset Code Inputs with AI */}
        <AssetCodeInputs
          assets={multipleAssets}
          onAssetChange={handleAssetChange}
          onAddAsset={addAssetField}
          onRemoveAsset={removeAssetField}
          onAssetCodesDetected={onAssetCodesDetected}
          onRoomDetected={onRoomDetected}
        />

        {/* Transaction Details */}
        <TransactionDetails
          formData={formData}
          setFormData={setFormData}
          disabledBeforeDate={disabledBeforeDate}
        />

        {/* Submit Buttons */}
        <SubmitButtons
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          isRestrictedTime={isRestrictedTime}
          onSubmit={onSubmit}
        />

        {/* Test Data Button (Development only) */}
        {import.meta.env.DEV && (
          <TestDataButton />
        )}
      </CardContent>
    </Card>
  );
};

export default AssetEntryForm;