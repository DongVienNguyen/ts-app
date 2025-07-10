import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Layout from '@/components/Layout';
import { TabNavigation } from '@/components/data-management/TabNavigation';
import { TabContent } from '@/components/data-management/TabContent';
import { EditDialog } from '@/components/data-management/EditDialog';
import { entityConfig } from '@/config/entityConfig';
import { useDataManagement } from '@/hooks/useDataManagement';

const DataManagement = () => {
  const {
    // State
    selectedEntity,
    setSelectedEntity,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    dialogOpen,
    setDialogOpen,
    editingItem,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    message,
    setMessage,
    activeTab,
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData,
    paginatedData,
    totalPages,
    
    // Functions
    runAsAdmin,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleRestoreData,
    handleImportClick,
    bulkDeleteTransactions,
    
    // User
    user
  } = useDataManagement();

  if (!user) return <Layout><div>Đang kiểm tra quyền truy cập...</div></Layout>;
  if (user.role !== 'admin') return <Layout><div>Chỉ admin mới có thể truy cập module này.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý dữ liệu</h1>
            <p className="text-gray-500">Quản lý tất cả dữ liệu trong hệ thống với tốc độ cao</p>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <Alert 
            variant={message.type === 'error' ? 'destructive' : 'default'} 
            className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          <TabContent
            activeTab={activeTab}
            selectedEntity={selectedEntity}
            onEntityChange={setSelectedEntity}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredData={filteredData}
            paginatedData={paginatedData}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStaffLock={toggleStaffLock}
            onExportCSV={exportToCSV}
            onImportClick={handleImportClick}
            restoreInputRef={restoreInputRef}
            onRestoreData={handleRestoreData}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onBulkDeleteTransactions={bulkDeleteTransactions}
            runAsAdmin={runAsAdmin}
            setMessage={setMessage}
          />
        </div>

        {/* Edit Dialog */}
        <EditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          config={entityConfig[selectedEntity]}
          editingItem={editingItem}
          onSave={handleSave}
        />
      </div>
    </Layout>
  );
};

export default DataManagement;