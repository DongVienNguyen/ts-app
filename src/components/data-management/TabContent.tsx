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
  filteredData: any[];
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
  setMessage: (message: { type: string; text: string }) => void;
  // Sorting props
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}

export const TabContent = ({
  activeTab,
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  filteredData,
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
  setMessage,
  sortColumn,
  sortDirection,
  onSort
}: TabContentProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      // Quản lý chính
      case 'management':
        return (
          <DataManagementTab
            selectedEntity={selectedEntity}
            onEntityChange={onEntityChange}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            filteredData={filteredData}
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
          />
        );

      case 'statistics':
        return (
          <div className="mt-6 space-y-6">
            <StatisticsTab runAsAdmin={runAsAdmin} setMessage={setMessage} onLoad={() => {}} />
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