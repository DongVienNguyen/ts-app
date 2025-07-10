export interface FormData {
  room: string;
  transaction_type: string;
  parts_day: string;
  transaction_date: string;
  note: string;
}

export interface AssetSubmissionData {
  formData: FormData;
  assets: string[];
  username: string;
  timestamp: string;
}

export interface SubmissionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface AssetValidationResult {
  isValid: boolean;
  errors: string[];
}

// Remove the problematic default export with type references