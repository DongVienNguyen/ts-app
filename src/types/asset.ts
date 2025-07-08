export interface Transaction {
  id: string;
  staff_code: string;
  transaction_date: string;
  parts_day: string;
  room: string;
  transaction_type: string;
  asset_year: number;
  asset_code: number;
  note?: string;
  created_at?: string;
}

export interface AssetTransactionPayload {
  staff_code: string;
  transaction_date: string;
  parts_day: string;
  room: string;
  transaction_type: string;
  asset_year: number;
  asset_code: number;
  note?: string;
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
    note?: string;
  }[];
}