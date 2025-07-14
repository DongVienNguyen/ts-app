import { TableName, EntityConfig } from '@/config/entityConfig';
import React from 'react';
import { AuthenticatedStaff } from '@/contexts/AuthContext'; // Import AuthenticatedStaff

export type FilterOperator = 'ilike' | 'eq' | 'gte' | 'lte' | 'gt' | 'lt' | 'is' | 'in'; // Add more as needed

export interface FilterState {
  value: any;
  operator: FilterOperator;
}

export interface CacheEntry {
  data: any[];
  count: number;
  timestamp: number;
}

export interface LoadDataParams {
  selectedEntity: TableName;
  page?: number;
  search?: string;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, FilterState>; // Updated type
}

export interface SaveDataParams {
  selectedEntity: TableName;
  formData: any;
  editingItem: any | null;
  user: AuthenticatedStaff;
}

export interface DeleteDataParams {
  selectedEntity: TableName;
  item: any;
  user: AuthenticatedStaff;
}

export interface BulkDeleteDataParams {
  selectedEntity: TableName;
  ids: string[];
  user: AuthenticatedStaff;
}

export interface DataManagementReturn {
  user: AuthenticatedStaff | null | undefined;
  selectedEntity: TableName;
  setSelectedEntity: (entity: TableName) => void;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  data: any[];
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  handleAdd: () => void;
  handleEdit: (item: any) => void;
  handleDelete: (item: any) => Promise<void>;
  handleSave: (formData: any) => Promise<void>;
  refreshData: () => void;
  exportToCSV: () => void;
  exportSelectedToCSV: () => void;
  handleExportTemplate: () => void;
  handleImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelectForImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startImportProcess: (file: File) => void;
  importCsvInputRef: React.RefObject<HTMLInputElement>;
  handleImportCsvClick: () => void;
  handleFileSelectForCsvImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  bulkDeleteTransactions: () => Promise<void>;
  toggleStaffLock: (staff: any) => Promise<void>;
  runAsAdmin: (action: () => Promise<void>) => Promise<void>;
  handleSort: (columnKey: string) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, FilterState>;
  onFilterChange: (key: string, value: any, operator?: FilterOperator) => void;
  clearFilters: () => void;
  config: EntityConfig;
  restoreFile: File | null;
  selectedRows: Record<string, boolean>;
  totalPages: number;
  handleRowSelect: (rowId: string) => void;
  handleSelectAll: () => void;
  handleBulkDelete: () => Promise<void>;
}