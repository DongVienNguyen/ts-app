import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
    refreshData, // Use this instead of loadData for button clicks
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

  // Show loading state
  if (user === undefined) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show access denied for non-admin users
  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chỉ admin mới có thể truy cập module Quản lý dữ liệu.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý dữ liệu</h1>
              <p className="text-gray-500">Quản lý tất cả dữ liệu trong hệ thống với tốc độ cao</p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
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