import DataManagementTab from './DataManagementTab';
import { StatisticsTab } from './StatisticsTab';
import { DataManagementReturn } from '@/hooks/useDataManagement/types';

interface TabContentProps {
  activeTab: string;
  dm: DataManagementReturn;
}

export const TabContent = ({ activeTab, dm }: TabContentProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return (
          <DataManagementTab
            activeTab={dm.activeTab}
            selectedEntity={dm.selectedEntity}
            onEntityChange={dm.setSelectedEntity}
            isLoading={dm.isLoading}
            searchTerm={dm.searchTerm}
            onSearchChange={dm.setSearchTerm}
            data={dm.data}
            totalCount={dm.totalCount}
            currentPage={dm.currentPage}
            onPageChange={dm.setCurrentPage}
            onAdd={dm.handleAdd}
            onEdit={dm.handleEdit}
            onDelete={dm.handleDelete}
            onExportCSV={dm.exportToCSV}
            onExportTemplate={dm.handleExportTemplate}
            onImportClick={dm.handleImportClick}
            restoreInputRef={dm.restoreInputRef}
            onFileSelectForImport={dm.handleFileSelectForImport}
            startImportProcess={dm.startImportProcess}
            importCsvInputRef={dm.importCsvInputRef}
            onImportCsvClick={dm.handleImportCsvClick}
            onFileSelectForCsvImport={dm.handleFileSelectForCsvImport}
            startDate={dm.startDate}
            endDate={dm.endDate}
            onStartDateChange={dm.setStartDate}
            onEndDateChange={dm.setEndDate}
            onBulkDeleteTransactions={dm.bulkDeleteTransactions}
            onToggleStaffLock={dm.toggleStaffLock}
            onSort={dm.handleSort}
            sortColumn={dm.sortColumn}
            sortDirection={dm.sortDirection}
            filters={dm.filters}
            onFilterChange={dm.onFilterChange}
            clearFilters={dm.clearFilters}
            config={dm.config}
            selectedRows={dm.selectedRows}
            onRowSelect={dm.handleRowSelect}
            onSelectAll={dm.handleSelectAll}
            onBulkDelete={dm.handleBulkDelete}
            onExportSelectedCSV={dm.exportSelectedToCSV}
          />
        );

      case 'statistics':
        return (
          <div className="mt-6 space-y-6">
            <StatisticsTab runAsAdmin={dm.runAsAdmin} onLoad={() => {}} />
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