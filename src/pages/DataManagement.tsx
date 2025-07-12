import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { TabNavigation } from '@/components/data-management/TabNavigation';
import { TabContent } from '@/components/data-management/TabContent';
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
      case 'password': // Handle password type
        editDialogType = 'password';
        schema = field.required ? z.string().min(1, `${field.label} không được để trống`) : z.string().nullable();
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

        <TabNavigation activeTab={dm.activeTab} onTabChange={dm.setActiveTab} />

        <div className="mt-6">
          <TabContent activeTab={dm.activeTab} dm={dm} />
        </div>

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