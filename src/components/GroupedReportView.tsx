import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { getNextWorkingDay, getMorningTargetDate, formatToDDMMYYYY } from '@/utils/dateUtils';
import { ProcessedNote } from '@/types/report';

interface GroupedReportViewProps {
  groupedRows: any[];
  filterType: string;
  customFilters: { start: string; end: string; };
  onAddNote: () => void;
  onEditNote: (note: ProcessedNote) => void;
  onDeleteNote: (id: string) => void;
  onMarkNoteDone: (id: string) => void;
}

const GroupedReportView: React.FC<GroupedReportViewProps> = ({ groupedRows, filterType, customFilters, onAddNote, onEditNote, onDeleteNote, onMarkNoteDone }) => {
  const headerDateDisplay = useMemo(() => {
    switch(filterType) {
      case 'morning': return `Sáng ngày (${formatToDDMMYYYY(getMorningTargetDate())})`;
      case 'afternoon': return `Chiều ngày (${formatToDDMMYYYY(getNextWorkingDay(new Date()))})`;
      case 'qln_pgd_next_day': return `QLN Sáng & PGD trong ngày (${formatToDDMMYYYY(getMorningTargetDate())})`;
      case 'today': return `Trong ngày hôm nay (${formatToDDMMYYYY(new Date())})`;
      case 'next_day': return `Trong ngày kế tiếp (${formatToDDMMYYYY(getNextWorkingDay(new Date()))})`;
      case 'custom': return `Từ ${formatToDDMMYYYY(new Date(customFilters.start))} đến ${formatToDDMMYYYY(new Date(customFilters.end))}`;
      default: return "";
    }
  }, [filterType, customFilters]);

  return (
    <Card className="border-0 shadow-xl shadow-slate-100/50">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800 flex justify-between items-center">
          <span>{headerDateDisplay}</span>
          <Button onClick={onAddNote} variant="outline" size="icon" className="h-9 w-9 bg-blue-50 hover:bg-blue-100 border-blue-600 text-blue-600"><Plus className="w-5 h-5" /></Button>
        </CardTitle>
        <CardDescription>Dấu (*) TS đã được nhắn hơn một lần trong tuần</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-1">Phòng</TableHead>
              <TableHead className="w-14 px-2">Năm</TableHead>
              <TableHead className="px-2">Danh sách Mã TS</TableHead>
              <TableHead className="w-32 px-1 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRows.length > 0 ? groupedRows.map(row => (
              <TableRow key={row.id}>
                {row.isNote ? (
                  <TableCell colSpan={3} className="font-bold text-lg px-2 whitespace-pre-wrap">{row.room}</TableCell>
                ) : (
                  <>
                    <TableCell className="font-bold text-lg px-1">{row.room}</TableCell>
                    <TableCell className="font-bold text-lg px-1">{row.year}</TableCell>
                    <TableCell className="font-bold text-lg px-2">{row.codes}</TableCell>
                  </>
                )}
                <TableCell className="px-1 text-right">
                  {row.isNote && (
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onEditNote(row.noteData)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteNote(row.noteData.id)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => onMarkNoteDone(row.noteData.id)} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 w-4" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="text-center h-24">Không có dữ liệu.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GroupedReportView;