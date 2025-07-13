import { useState } from 'react';
import { Settings, AlertCircle, Database, BarChart3, FileText, Zap, Activity, HardDrive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const handleNavigateToTable = (table: any) => {
    dm.setSelectedEntity(table);
    setActiveTab('management');
  };

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

  // Calculate data metrics for header
  const getDataMetrics = () => {
    const totalRecords = dm.totalCount || 0;
    const selectedRecords = Array.isArray(dm.selectedRows) ? dm.selectedRows.length : 0;
    const currentEntity = dm.selectedEntity;
    const isLoading = dm.isLoading;
    
    return { totalRecords, selectedRecords, currentEntity, isLoading };
  };

  const metrics = getDataMetrics();

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Dữ liệu</h1>
                <p className="text-gray-500">Quản lý tất cả dữ liệu trong hệ thống với tốc độ cao và hiệu quả</p>
              </div>
            </div>
            
            <Button
              onClick={dm.refreshData}
              disabled={dm.isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${dm.isLoading ? 'animate-spin' : ''}`} />
              {dm.isLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>

          {/* Data Metrics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Entity */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Bảng hiện tại</p>
                    <p className="text-xs text-blue-700">
                      {currentEntityConfig?.name || 'Chưa chọn'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {metrics.currentEntity}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Total Records */}
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <HardDrive className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Tổng bản ghi</p>
                    <p className="text-xs text-green-700">Trong bảng hiện tại</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {metrics.isLoading ? '...' : metrics.totalRecords.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Selected Records */}
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Đã chọn</p>
                    <p className="text-xs text-purple-700">Để thao tác hàng loạt</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      metrics.selectedRecords > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {metrics.selectedRecords}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">Trạng thái</p>
                    <p className="text-xs text-orange-700">
                      {metrics.isLoading ? 'Đang tải...' : 'Sẵn sàng'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      metrics.isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {metrics.isLoading ? 'BUSY' : 'READY'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Quản lý Dữ liệu</span>
              <span className="sm:hidden">Quản lý</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Thống kê & Phân tích</span>
              <span className="sm:hidden">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Quản lý Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Management Tab */}
          <TabsContent value="management" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Dữ liệu</h2>
                <Badge variant="outline" className="ml-2">
                  {currentEntityConfig?.name || 'Chưa chọn bảng'}
                </Badge>
                {metrics.selectedRecords > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {metrics.selectedRecords} đã chọn
                  </Badge>
                )}
              </div>
              <DataManagementTab
                activeTab={activeTab}
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
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">Thống kê & Phân tích Dữ liệu</h2>
                <Badge variant="outline" className="ml-2">Analytics</Badge>
              </div>
              <StatisticsTab runAsAdmin={dm.runAsAdmin} onLoad={() => {}} />
            </div>
          </TabsContent>

          {/* Logs Management Tab */}
          <TabsContent value="logs" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Logs & Dọn dẹp</h2>
                <Badge variant="outline" className="ml-2">System Maintenance</Badge>
              </div>
              <LogManagementTab onNavigateToTable={handleNavigateToTable} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
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

        {/* Footer */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-1">Hệ thống Quản lý Dữ liệu - Tài sản CRC</p>
              <p>
                Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')} | 
                Bảng: {currentEntityConfig?.name || 'N/A'} | 
                Tổng: {metrics.totalRecords.toLocaleString()} bản ghi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DataManagement;