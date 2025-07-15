import { Download, FileUp } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import BorrowReportHeader from '@/components/BorrowReportHeader';
import BorrowReportFilters from '@/components/BorrowReportFilters';
import BorrowReportTable from '@/components/BorrowReportTable';
import { useBorrowReportData } from '@/hooks/useBorrowReportData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BorrowReport = () => {
  const {
    isLoading,
    dateRange,
    setDateRange,
    selectedRoom,
    setSelectedRoom,
    currentPage,
    setCurrentPage,
    filteredTransactions,
    paginatedTransactions,
    totalPages,
    rooms,
    exportToCSV,
    ITEMS_PER_PAGE,
  } = useBorrowReportData();

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex justify-between items-start no-print">
          <BorrowReportHeader />
          <div className="flex justify-end gap-2">
            <Button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              variant="outline"
              className="bg-white hover:bg-green-50 border-green-600 text-green-600 shadow-lg shadow-green-500/10"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button
              onClick={handlePrint}
              disabled={filteredTransactions.length === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất PDF
            </Button>
          </div>
        </div>

        <div className="space-y-6 no-print">
          <BorrowReportFilters
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            rooms={rooms}
          />
        </div>

        <div id="print-section">
          <Card className="border-0 shadow-xl shadow-slate-100/50">
            <CardHeader>
              <CardTitle>Danh sách tài sản đã mượn ({filteredTransactions.length} bản ghi)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BorrowReportTable
                transactions={paginatedTransactions}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                totalRecords={filteredTransactions.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default BorrowReport;