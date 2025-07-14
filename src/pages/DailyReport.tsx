import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, ListTree, Plus, Edit, Trash2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/Layout';
import DailyReportFilters from '@/components/DailyReportFilters';
import GroupedReportView from '@/components/GroupedReportView';
import DetailedReportView from '@/components/DetailedReportView';
import { useDailyReportLogic } from '@/hooks/useDailyReportLogic';
import { usePagination } from '@/hooks/usePagination';
import { Transaction } from '@/types/asset';
import { ProcessedNote, ProcessedNoteInsert, ProcessedNoteUpdate } from '@/types/report';
import { useStaffData } from '@/hooks/useStaffData';
import ComboBox from '@/components/ComboBox';

const NoteDialog = ({ open, onOpenChange, note, onSubmit, allStaffNames }: { open: boolean, onOpenChange: (open: boolean) => void, note: ProcessedNote | null, onSubmit: (data: any) => void, allStaffNames: { value: string, label: string }[] }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (note) {
      setFormData({ room: note.room, operation_type: note.operation_type, content: note.content, mail_to_nv: note.mail_to_nv || '' });
    } else {
      setFormData({ room: '', operation_type: '', content: '', mail_to_nv: '' });
    }
  }, [note, open]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{note ? 'Chỉnh sửa' : 'Thêm'} ghi chú đã duyệt</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Phòng</Label>
            <Select value={formData.room} onValueChange={(value) => setFormData({...formData, room: value})}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
              <SelectContent>
                {['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'NQ'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Loại tác nghiệp</Label>
            <Select value={formData.operation_type} onValueChange={(value) => setFormData({...formData, operation_type: value})}>
              <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
              <SelectContent>
                {['Hoàn trả', 'Xuất kho', 'Nhập kho', 'Xuất mượn', 'Thiếu CT', 'Khác'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Nhập nội dung..." />
          </div>
          <div className="space-y-2">
            <Label>Mail đến NV (Tùy chọn)</Label>
            <ComboBox value={formData.mail_to_nv} onChange={(value) => setFormData({...formData, mail_to_nv: value})} options={allStaffNames} placeholder="Nhập tên nhân viên..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditTransactionDialog = ({ open, onOpenChange, transaction, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, transaction: Transaction | null, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (transaction) {
      setFormData({
        transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd'),
        parts_day: transaction.parts_day,
        room: transaction.room,
        transaction_type: transaction.transaction_type,
        asset_year: transaction.asset_year,
        asset_code: transaction.asset_code,
        note: transaction.note || ''
      });
    }
  }, [transaction, open]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Chỉnh sửa giao dịch</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>Ngày</Label><Input type="date" value={formData.transaction_date || ''} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} /></div>
          <div className="space-y-2"><Label>Buổi</Label><Select value={formData.parts_day} onValueChange={(v) => setFormData({...formData, parts_day: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sáng">Sáng</SelectItem><SelectItem value="Chiều">Chiều</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Phòng</Label><Select value={formData.room} onValueChange={(v) => setFormData({...formData, room: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'DVKH'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Loại</Label><Select value={formData.transaction_type} onValueChange={(v) => setFormData({...formData, transaction_type: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['Xuất kho', 'Mượn TS', 'Thay bìa'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Năm TS</Label><Input type="number" value={formData.asset_year || ''} onChange={(e) => setFormData({...formData, asset_year: e.target.value})} /></div>
          <div className="space-y-2"><Label>Mã TS</Label><Input type="number" value={formData.asset_code || ''} onChange={(e) => setFormData({...formData, asset_code: e.target.value})} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Ghi chú</Label><Textarea value={formData.note || ''} onChange={(e) => setFormData({...formData, note: e.target.value})} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit}>Cập nhật</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DailyReport = () => {
  const logic = useDailyReportLogic();
  const { staffList } = useStaffData();
  const allStaffNames = useMemo(() => staffList.map(s => ({ value: s.id, label: s.ten_nv })), [staffList]); // Map to { value: id, label: ten_nv }

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProcessedNote | null>(null);
  const [isEditTxDialogOpen, setIsEditTxDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { paginatedData, currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination<Transaction>({data: logic.filteredTransactions, itemsPerPage: 30});

  useEffect(() => {
    goToPage(1);
  }, [logic.filterType, logic.customFilters, goToPage]);

  const handleOpenNoteDialog = (note: ProcessedNote | null = null) => {
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };

  const handleNoteSubmit = (data: any) => {
    if (editingNote) {
      logic.updateNote({ id: editingNote.id, updates: data });
    } else {
      logic.addNote({ ...data, staff_code: logic.currentUser?.username || 'unknown' });
    }
  };

  const handleOpenEditTxDialog = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEditTxDialogOpen(true);
  };

  const handleEditTxSubmit = (data: any) => {
    if (editingTransaction) {
      logic.updateTransaction({ id: editingTransaction.id, updates: data });
    }
  };

  if (logic.isLoading && logic.filteredTransactions.length === 0) {
    return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <style>{`@media print { body * { visibility: hidden; } #print-section, #print-section * { visibility: visible; } #print-section { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none; } }`}</style>
        
        <NoteDialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen} note={editingNote} onSubmit={handleNoteSubmit} allStaffNames={allStaffNames} />
        <EditTransactionDialog open={isEditTxDialogOpen} onOpenChange={setIsEditTxDialogOpen} transaction={editingTransaction} onSubmit={handleEditTxSubmit} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Danh sách TS cần lấy</h1>
              {logic.lastUpdated && <p className="text-slate-600 text-sm">Cập nhật: {format(logic.lastUpdated, 'HH:mm:ss dd/MM/yyyy')}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={logic.exportToPDF} disabled={logic.isExporting} className="bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />{logic.isExporting ? "Đang xuất..." : "Xuất PDF"}</Button>
            <Button variant="outline" onClick={() => logic.setShowGrouped(!logic.showGrouped)} className="text-purple-600 border-purple-600 hover:bg-purple-50"><ListTree className="w-4 h-4 mr-2" />{logic.showGrouped ? "Hiện chi tiết" : "Hiện DS tổng"}</Button>
          </div>
        </div>

        <div className="no-print">
          <DailyReportFilters filterType={logic.filterType} setFilterType={logic.setFilterType} customFilters={logic.customFilters} setCustomFilters={logic.setCustomFilters} />
        </div>

        <div id="print-section" className="space-y-6">
          {logic.showGrouped ? (
            <GroupedReportView 
              groupedRows={logic.groupedRows} 
              filterType={logic.filterType} 
              customFilters={logic.customFilters}
              onAddNote={() => handleOpenNoteDialog()}
              onEditNote={handleOpenNoteDialog}
              onDeleteNote={(id) => logic.deleteNote(id)}
              onMarkNoteDone={(id) => logic.updateNote({ id, updates: { is_done: true, done_at: new Date().toISOString() }})}
            />
          ) : (
            <DetailedReportView
              transactions={paginatedData}
              isLoading={logic.isLoading}
              takenTransactionIds={logic.takenTransactionIds}
              onToggleTaken={logic.toggleTakenStatus}
              onEdit={handleOpenEditTxDialog}
              onDelete={(id) => logic.deleteTransaction(id)}
              filterType={logic.filterType}
              customFilters={logic.customFilters}
            />
          )}
        </div>

        {!logic.showGrouped && logic.filteredTransactions.length > 30 && (
          <div className="flex justify-center items-center gap-4 mt-6 no-print">
            <Button onClick={prevPage} disabled={currentPage === 1} variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> Trước</Button>
            <span>Trang {currentPage} trên {totalPages}</span>
            <Button onClick={nextPage} disabled={currentPage === totalPages} variant="outline">Tiếp <ChevronRight className="w-4 h-4 ml-2" /></Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DailyReport;