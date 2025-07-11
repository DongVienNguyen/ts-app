export interface Transaction {
  id: string;
  staff_code: string;
  transaction_date: string;
  parts_day: string;
  room: string;
  transaction_type: string;
  asset_year: number;
  asset_code: number;
  note?: string | null;
  created_at?: string | null;
}

export interface OtherAsset {
  id: string;
  name: string;
  deposit_date: string | null;
  depositor: string | null;
  deposit_receiver: string | null;
  withdrawal_date: string | null;
  withdrawal_deliverer: string | null;
  withdrawal_receiver: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AssetTransactionPayload {
  staff_code: string;
  transaction_date: string;
  parts_day: string;
  room: string;
  transaction_type: string;
  asset_year: number;
  asset_code: number;
  note?: string | null;
}

export interface AssetTransactionFilters {
  startDate?: string;
  endDate?: string;
  parts_day?: 'Sáng' | 'Chiều' | 'all';
  isQlnPgdNextDay?: boolean;
}

export interface GroupedTransaction {
  room: string;
  parts_day: string;
  transaction_date: string;
  assets: {
    asset_code: number;
    asset_year: number;
    note?: string | null;
  }[];
}