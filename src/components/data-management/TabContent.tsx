import { DataManagementTab } from './DataManagementTab';
import { StatisticsTab } from './StatisticsTab';
import { AccountManagementTab } from './AccountManagementTab';
import { AdminEmailSettings } from './AdminEmailSettings';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { SecurityTestPanel } from '@/components/SecurityTestPanel';
import { SecurityDocumentation } from '@/components/SecurityDocumentation';
import { SecurityImplementationSummary } from '@/components/SecurityImplementationSummary';
import { SecurityWorkflowDemo } from '@/components/SecurityWorkflowDemo';
import { VAPIDKeyTester } from '@/components/VAPIDKeyTester';
import PushNotificationTester from '@/components/PushNotificationTester';
import { PWATestPanel } from '@/components/PWATestPanel';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';
import { UsageMonitoringDashboard } from '@/components/UsageMonitoringDashboard';
import { EnhancedSecurityDashboard } from '@/components/EnhancedSecurityDashboard';
import { SystemHealthWidget } from '@/components/SystemHealthWidget';

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
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onToggleStaffLock: (staff: any) => void;
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
  currentPage,
  totalPages,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onToggleStaffLock,
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
  setMessage
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStaffLock={onToggleStaffLock}
            onExportCSV={onExportCSV}
            onImportClick={onImportClick}
            restoreInputRef={restoreInputRef}
            onRestoreData={onRestoreData}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onBulkDeleteTransactions={onBulkDeleteTransactions}
          />
        );

      case 'statistics':
        return (
          <div className="mt-6 space-y-6">
            <StatisticsTab runAsAdmin={runAsAdmin} setMessage={setMessage} onLoad={() => {}} />
          </div>
        );

      case 'accounts':
        return (
          <div className="mt-6 space-y-6">
            <AccountManagementTab />
          </div>
        );

      case 'admin-settings':
        return (
          <div className="mt-6 space-y-6">
            <AdminEmailSettings />
          </div>
        );

      // Dashboard & Giám sát
      case 'security-dashboard':
        return (
          <div className="mt-6 space-y-6">
            <EnhancedSecurityDashboard />
          </div>
        );

      case 'error-monitoring':
        return (
          <div className="mt-6 space-y-6">
            <ErrorMonitoringDashboard />
          </div>
        );

      case 'usage-monitoring':
        return (
          <div className="mt-6 space-y-6">
            <UsageMonitoringDashboard />
          </div>
        );

      case 'system-health':
        return (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <SystemHealthWidget />
              <div className="space-y-4">
                <SecurityDashboard />
              </div>
            </div>
          </div>
        );

      // Bảo mật
      case 'security-test':
        return (
          <div className="mt-6 space-y-6">
            <SecurityTestPanel />
          </div>
        );

      case 'security-docs':
        return (
          <div className="mt-6 space-y-6">
            <SecurityDocumentation />
          </div>
        );

      case 'security-summary':
        return (
          <div className="mt-6 space-y-6">
            <SecurityImplementationSummary />
          </div>
        );

      case 'security-workflow':
        return (
          <div className="mt-6 space-y-6">
            <SecurityWorkflowDemo />
          </div>
        );

      // Thông báo & PWA
      case 'push-notifications':
        return (
          <div className="mt-6 space-y-6">
            <VAPIDKeyTester />
            <PushNotificationTester />
          </div>
        );

      case 'pwa-test':
        return (
          <div className="mt-6 space-y-6">
            <PWATestPanel />
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