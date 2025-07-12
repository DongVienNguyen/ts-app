import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { dataService } from './dataService';
import { exportService } from './exportService';
import { restoreService } from '@/services/restoreService';
import { importService } from './importService';
import { TableName, EntityConfig } from '@/config/entityConfig';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { FilterState } from './types';

interface UseDataImportExportProps {
  selectedEntity: TableName;
  user: AuthenticatedStaff | null | undefined;
  currentPage: number;
  searchTerm: string;
  filters: Record<string, FilterState>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  config: EntityConfig;
  setRestoreFile: (file: File | null) => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  clearCache: () => void;
  loadData: (page: number, search: string, currentFilters: Record<string, FilterState>) => Promise<void>;
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
}

export const useDataImportExport = ({
  selectedEntity,
  user,
  currentPage,
  searchTerm,
  filters,
  sortColumn,
  sortDirection,
  config,
  setRestoreFile,
  restoreInputRef,
  clearCache,
  loadData,
  runAsAdmin,
}: UseDataImportExportProps) => {

  const exportToCSV = useCallback(() => {
    runAsAdmin(async () => {
      try {
        const { data: allData } = await dataService.loadData({
          selectedEntity,
          page: 1, // Export all data, so load from page 1
          searchTerm,
          sortColumn,
          sortDirection,
          filters
        });
        exportService.exportToCSV(allData, selectedEntity, currentPage); // currentPage here is just for filename
        toast.success('Dữ liệu đã được xuất ra CSV.');
      } catch (error: any) {
        toast.error(`Lỗi xuất CSV: ${error.message}`);
      }
    });
  }, [selectedEntity, user, searchTerm, sortColumn, sortDirection, filters, runAsAdmin, currentPage]);

  const handleExportTemplate = useCallback(() => {
    runAsAdmin(async () => {
      try {
        exportService.exportTemplateCSV(config);
        toast.success('Mẫu CSV đã được tải xuống.');
      } catch (error: any) {
        toast.error(`Lỗi tải mẫu: ${error.message}`);
      }
    });
  }, [config, runAsAdmin]);

  const handleFileSelectForImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      toast.info('Tệp đã được chọn. Nhấn "Khôi phục từ ZIP" để bắt đầu.');
    } else {
      setRestoreFile(null);
    }
  }, [setRestoreFile]);

  const startImportProcess = useCallback(async (file: File) => {
    await runAsAdmin(async () => {
      try {
        const result = await restoreService.restoreDataFromZip(file, user);
        if (result.success) {
          toast.success(result.message);
          clearCache();
          loadData(currentPage, searchTerm, filters);
        } else {
          toast.error(result.message);
        }
      } catch (error: any) {
        toast.error(`Lỗi trong quá trình khôi phục: ${error.message}`);
      } finally {
        setRestoreFile(null);
        if (restoreInputRef.current) {
          restoreInputRef.current.value = '';
        }
      }
    });
  }, [user, runAsAdmin, clearCache, loadData, currentPage, searchTerm, filters, setRestoreFile, restoreInputRef]);

  const handleImportClick = useCallback(() => {
    if (restoreInputRef.current) {
      restoreInputRef.current.click();
    }
  }, [restoreInputRef]);

  const importCsvInputRef = useRef<HTMLInputElement>(null);

  const handleImportCsvClick = useCallback(() => {
    if (importCsvInputRef.current) {
      importCsvInputRef.current.click();
    }
  }, []);

  const handleFileSelectForCsvImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await runAsAdmin(async () => {
      const result = await importService.importFromCSV(file, selectedEntity, config, user);
      if (result.success) {
        toast.success(result.message);
        clearCache();
        loadData(1, '', {}); // Reload data from page 1 after import
      } else {
        toast.error(result.message);
      }
    });

    if (event.target) {
      event.target.value = '';
    }
  }, [runAsAdmin, selectedEntity, config, user, clearCache, loadData]);

  return {
    exportToCSV,
    handleExportTemplate,
    handleFileSelectForImport,
    startImportProcess,
    handleImportClick,
    importCsvInputRef,
    handleImportCsvClick,
    handleFileSelectForCsvImport,
  };
};