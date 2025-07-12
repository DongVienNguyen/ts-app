import { DataManagementTab } from './DataManagementTab';
import { StatisticsTab } from './StatisticsTab';

interface TabContentProps {
  activeTab: string;
  // Data Management props
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  paginatedData: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onExportCSV: () => void;
  onImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  onRestoreData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBulkDeleteTransactions: () => void;
  // Statistics props
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  // setMessage: (message: { type: string; text: string }) => void; // Removed
  // Sorting props
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
  // Filter props
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  // Selection props
  selectedRows: Record<string, boolean>;
  onRowSelect: (rowId: string) => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

export const TabContent = ({
  activeTab,
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  paginatedData,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onExportCSV,
  onImportClick,
  restoreInputRef,
  onRestoreData,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onBulkDeleteTransactions,
  runAsAdmin,
  // setMessage, // Removed
  sortColumn,
  sortDirection,
  onSort,
  filters,
  onFilterChange,
  onClearFilters,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onBulkDelete
}: TabContentProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return (
          <DataManagementTab
            selectedEntity={selectedEntity}
            onEntityChange={onEntityChange}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            paginatedData={paginatedData}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onExportCSV={onExportCSV}
            onImportClick={onImportClick}
            restoreInputRef={restoreInputRef}
            onRestoreData={onRestoreData}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onBulkDeleteTransactions={onBulkDeleteTransactions}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            selectedRows={selectedRows}
            onRowSelect={onRowSelect}
            onSelectAll={onSelectAll}
            onBulkDelete={onBulkDelete}
          />
        );

      case 'statistics':
        return (
          <div className="mt-6 space-y-6">
            {/* setMessage prop is not used in StatisticsTab, so it's safe to remove */}
            <StatisticsTab runAsAdmin={runAsAdmin} onLoad={() => {}} />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Chọn một tab để bắt đầu</h3>
            <p className="text-gray-500">Sử dụng các tab ở trên để truy cập các chức năng quản lý khác nhau</p>
          </div>
        );
    }
  };

  return <>{renderTabContent()}</>;
};