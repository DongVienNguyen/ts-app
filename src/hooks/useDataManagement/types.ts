import { TableName, EntityConfig, FieldConfig } from '@/config/entityConfig';
import { User } from '@supabase/supabase-js';
import React from 'react';
import { AuthenticatedStaff } from '@/contexts/AuthContext'; // Import AuthenticatedStaff

export interface CacheEntry {
  data: any[];
  count: number;
  timestamp: number;
}

export interface LoadDataParams {
  selectedEntity: TableName;
  user: AuthenticatedStaff;
  page?: number;
  search?: string;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
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
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  handleImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelectForImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startImportProcess: (file: File) => void;
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
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  clearFilters: () => void;
  config: EntityConfig;
  restoreFile: File | null; // Added restoreFile
}

export interface DataLoaderReturn {
  isLoading: boolean;
  data: any[];
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshData: () => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (columnKey: string) => void;
  filters: Record<string, any>;
  handleFilterChange: (key: string, value: any) => void;
  clearFilters: () => void;
}

export interface DataActionsReturn {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  handleAdd: () => void;
  handleEdit: (item: any) => void;
  handleDelete: (item: any) => Promise<void>;
  handleSave: (formData: any) => Promise<void>;
  exportToCSV: () => void;
  handleImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelectForImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startImportProcess: (file: File) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  bulkDeleteTransactions: () => Promise<void>;
  toggleStaffLock: (staff: any) => Promise<void>;
  runAsAdmin: (action: () => Promise<void>) => Promise<void>;
}