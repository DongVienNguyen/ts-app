import { saveAssetTransactions } from '@/services/assetService';
import { sendAssetTransactionConfirmation } from '@/services/emailService';
import { FormData } from '@/types/assetSubmission';
import { Transaction, AssetTransactionPayload } from '@/types/asset'; // Import both Transaction and AssetTransactionPayload

export const submitAssetTransactions = async (
  formData: FormData,
  multipleAssets: string[],
  username: string
) => {
  console.log('=== ASSET ENTRY SUBMIT START ===');
  console.log('Current user:', username);
  
  const transactions: AssetTransactionPayload[] = multipleAssets.map(asset => { // Changed type to AssetTransactionPayload[]
    const [code, year] = asset.split('.');
    return {
      staff_code: username,
      transaction_date: formData.transaction_date,
      parts_day: formData.parts_day,
      room: formData.room,
      transaction_type: formData.transaction_type,
      asset_year: parseInt(year),
      asset_code: parseInt(code),
      note: formData.note || null
    };
  });
  
  console.log('Submitting transactions:', transactions);
  
  // Save to database first
  const savedTransactions = await saveAssetTransactions(transactions); // saveAssetTransactions should return Transaction[]
  console.log('Successfully saved to database:', savedTransactions);
  
  // Send email notification after successful save
  console.log('=== SENDING EMAIL NOTIFICATION ===');
  const emailResult = await sendAssetTransactionConfirmation(
    username,
    savedTransactions, // Pass the entire array of saved transactions
    true // isSuccess = true since we successfully saved to database
  );
  console.log('Email notification result:', emailResult);
  
  console.log('=== ASSET ENTRY SUBMIT END ===');
  
  return { savedTransactions, emailResult };
};