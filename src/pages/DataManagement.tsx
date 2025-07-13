import { useState } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataManagementTab from '@/components/data-management/DataManagementTab';
import { StatisticsTab } from '@/components/data-management/StatisticsTab';
import { LogManagementTab } from '@/components/data-management/LogManagementTab';
import { EditDialog } from '@/components/data-management/EditDialog';
import { entityConfig, EntityConfig } from '@/config/entityConfig';
import { useDataManagement } from '@/hooks/useDataManagement';
import { z } from 'zod';

type EditDialogField = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'password' | 'select' | 'textarea' | 'boolean';
  options?: string[];
  defaultValue?: any;
  schema: z.ZodTypeAny;
};

const mapEntityConfigToEditDialogFields = (config: EntityConfig): EditDialogField[] => {
  return config.fields.map(field => {
    let editDialogType: EditDialogField['type'];
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'select':
        editDialogType = 'select';
        schema = field.required ? z.string().min(1, `${field.label} không được để trống`) : z.string().nullable();
        break;
      case 'textarea':
        editDialogType = 'textarea';
        schema = field.required ? z.string().min(1, `${field.label} không được để trống`) : z.string().nullable();
        break;
      case 'boolean':
        editDialogType = 'boolean';
        schema = z.boolean().default(field.defaultValue || false);
        break;
      case 'number':
        editDialogType = 'number';
        schema = field.required ? z.number({ invalid_type_error: `${field.label} phải là số` }) : z.number().nullable();
        break;
      case 'date':
        editDialogType = 'date';
        schema = field.required ? z.date({ invalid_type_error: `${field.label} phải là ngày hợp lệ` }) : z.date().nullable();
        break;
      case 'password':
        editDialogType = 'password';
        schema = field.required ? z.string().min(1, `${field.label} không được để trống`) : z.string().nullable();
        break;
      case 'email':
        editDialogType = 'email';
        schema = field.required ? z.string().email(`${field.label} phải là định dạng email hợp lệ`).min(1, `${field.label} không được để trống`) : z.string().email(`${field.label} phải là định dạng email hợp lệ`).nullable();
        break;
      case 'text':
      default:
        editDialogType = 'text';
        schema = field.required ? z.string().min(1, `${field.label} không được để trống`) : z.string().nullable();
        break;
    }

    return {
      name: field.key,
      label: field.label,
      type: editDialogType,
      options: field.options,
      defaultValue: field.defaultValue,
      schema: schema,
    };
  });
};

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState('management');
  const dm = useDataManagement();

  if (dm.user === undefined) {
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

  if (!dm.user || dm.user.role !== 'admin') {
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

  const currentEntityConfig = entityConfig[dm.selectedEntity];
  const editDialogFields = mapEntityConfigToEditDialogFields(currentEntityConfig);

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
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
          
          <Button
            onClick={dm.refreshData}
            disabled={dm.isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${dm.isLoading ? 'animate-spin' : ''}`} />
            {dm.isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="management">Quản lý</TabsTrigger>
            <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            <TabsTrigger value="logs">Quản lý logs</TabsTrigger>
          </TabsList>
          <TabsContent value="management" className="mt-6">
            <DataManagementTab
              activeTab={activeTab} // Pass activeTab explicitly
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
              onImportCsvClick={dm.handleImportCsvClick}
              importCsvInputRef={dm.importCsvInputRef}
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
          </TabsContent>
          <TabsContent value="statistics" className="mt-6">
            <StatisticsTab runAsAdmin={dm.runAsAdmin} onLoad={() => {}} />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <LogManagementTab />
          </TabsContent>
        </Tabs>

        <EditDialog
          open={dm.dialogOpen}
          onOpenChange={dm.setDialogOpen}
          title={dm.editingItem ? `Chỉnh sửa ${currentEntityConfig.name}` : `Thêm mới ${currentEntityConfig.name}`}
          description={`Cung cấp thông tin chi tiết cho ${currentEntityConfig.name}.`}
          fields={editDialogFields}
          initialData={dm.editingItem}
          onSave={dm.handleSave}
          isLoading={dm.isLoading}
        />
      </div>
    </Layout>
  );
};

export default DataManagement;