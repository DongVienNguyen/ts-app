export interface DataManagementState {
  selectedEntity: string;
  data: any[];
  totalCount: number;
  isLoading: boolean;
  searchTerm: string;
  currentPage: number;
  dialogOpen: boolean;
  editingItem: any;
  startDate: string;
  endDate: string;
  // message: { type: string; text: string }; // Removed
  restoreFile: File | null;
  activeTab: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, any>;
  selectedRows: Record<string, boolean>;
}

export interface CacheEntry {
  data: any[];
  count: number;
  timestamp: number;
}

export interface DataManagementActions {
  handleAdd: () => void;
  handleEdit: (item: any) => void;
  handleSave: (formData: any) => Promise<void>;
  handleDelete: (item: any) => Promise<void>;
  toggleStaffLock: (staff: any) => Promise<void>;
  exportToCSV: () => void;
  handleRestoreData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportClick: () => void;
  bulkDeleteTransactions: () => Promise<void>;
  refreshData: () => void;
  handleSort: (columnKey: string) => void;
  handleFilterChange: (key: string, value: any) => void;
  handleClearFilters: () => void;
  handleRowSelect: (rowId: string) => void;
  handleSelectAll: () => void;
  handleBulkDelete: () => Promise<void>;
}

export interface DataManagementReturn extends DataManagementState, DataManagementActions {
  setSelectedEntity: (entity: string) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setDialogOpen: (open: boolean) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  // setMessage: (message: { type: string; text: string }) => void; // Removed
  setActiveTab: (tab: string) => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  filteredData: any[];
  paginatedData: any[];
  totalPages: number;
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  user: any;
}

export interface LoadDataParams {
  selectedEntity: string;
  user: any;
  page?: number;
  search?: string;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface SaveDataParams {
  selectedEntity: string;
  formData: any;
  editingItem: any;
  user: any;
}

export interface DeleteDataParams {
  selectedEntity: string;
  item: any;
  user: any;
}

export interface BulkDeleteDataParams {
  selectedEntity: string;
  ids: string[];
  user: any;
}