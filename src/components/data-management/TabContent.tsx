import DataManagementTab from './DataManagementTab';
import { StatisticsTab } from './StatisticsTab';
import { useDataManagement } from '@/hooks/useDataManagement';
import { entityConfig } from '@/config/entityConfig';

interface TabContentProps {
  activeTab: string;
}

export const TabContent = ({ activeTab }: TabContentProps) => {
  const {
    selectedEntity,
    setSelectedEntity,
    isLoading,
    searchTerm,
    setSearchTerm,
    data,
    totalCount,
    currentPage,
    setCurrentPage,
    handleAdd,
    handleEdit,
    handleDelete,
    exportToCSV,
    handleImportClick,
    restoreInputRef,
    handleFileSelectForImport,
    startImportProcess,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    bulkDeleteTransactions,
    runAsAdmin,
    sortColumn,
    sortDirection,
    handleSort,
    filters,
    handleFilterChange,
    toggleStaffLock,
    dialogOpen,
    setDialogOpen,
    editingItem,
    handleSave,
    config,
  } = useDataManagement();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return (
          <DataManagementTab
            activeTab={activeTab}
            selectedEntity={selectedEntity}
            onEntityChange={setSelectedEntity}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            data={data}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExportCSV={exportToCSV}
            onImportClick={handleImportClick}
            restoreInputRef={restoreInputRef}
            onFileSelectForImport={handleFileSelectForImport}
            startImportProcess={startImportProcess}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onBulkDeleteTransactions={bulkDeleteTransactions}
            onToggleStaffLock={toggleStaffLock}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            filters={filters}
            onFilterChange={handleFilterChange}
            config={config}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editingItem={editingItem}
            handleSave={handleSave}
          />
        );

      case 'statistics':
        return (
          <div className="mt-6 space-y-6">
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