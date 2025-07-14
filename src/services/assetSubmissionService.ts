import { saveAssetTransactions } from '@/services/assetService';
import { sendAssetTransactionConfirmation } from '@/services/emailService';
import { FormData } from '@/types/assetSubmission';
import { AssetTransactionPayload } from '@/types/asset';

export const submitAssetTransactions = async (
  formData: FormData,
  multipleAssets: string[],
  username: string
) => {
  console.log('=== ASSET SUBMISSION PROCESS START ===');
  console.log('Current user:', username);
  console.log('Form data:', formData);
  
  const transactions: AssetTransactionPayload[] = multipleAssets.map(asset => {
    const [code, year] = asset.split('.');
    return {
      staff_code: username,
      transaction_date: formData.transaction_date,
      parts_day: formData.parts_day,
      room: formData.room,
      transaction_type: formData.transaction_type,
      asset_year: parseInt(year, 10),
      asset_code: parseInt(code, 10),
      note: formData.note || null
    };
  });
  
  console.log('Submitting transactions to service:', transactions);
  
  // Step 1: Save to database. This is the critical step.
  const savedTransactions = await saveAssetTransactions(transactions);
  console.log('Database save successful:', savedTransactions);
  
  // Step 2: Send email notification. This is a secondary step.
  try {
    console.log('Sending email notification...');
    const emailResult = await sendAssetTransactionConfirmation(
      username,
      savedTransactions,
      true // Assuming this flag means it's a new entry
    );
    console.log('Email notification result:', emailResult);
    console.log('=== ASSET SUBMISSION PROCESS END ===');
    return { savedTransactions, emailResult };
  } catch (emailError) {
    console.error('⚠️ Email sending failed, but database transaction was successful.', emailError);
    // Do not re-throw the error. The primary action (DB save) succeeded.
    // The user should be notified of success, maybe with a warning about the email.
    return { savedTransactions, emailResult: { error: emailError } };
  }
};