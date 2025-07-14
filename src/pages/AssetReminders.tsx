import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Send, Trash2, Plus, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import Layout from '@/components/Layout';
import AutoCompleteInput from '@/components/reminders/AutoCompleteInput';
import DateInput from '@/components/reminders/DateInput';

import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { AssetReminder } from '@/api/entities/AssetReminder';
import { SentAssetReminder } from '@/api/entities/SentAssetReminder';
import { CBQLN } from '@/api/entities/CBQLN';
import { CBKH } from '@/api/entities/CBKH';
import { SendEmail } from '@/api/integrations/SendEmail';
import { sendPushNotification } from '@/services/notificationService';

type Reminder = Tables<'asset_reminders'>;
type SentReminder = Tables<'sent_asset_reminders'>;
type Cbqln = Tables<'cbqln'>;
type Cbkh = Tables<'cbkh'>;

const getCurrentDateFormatted = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

export default function AssetReminders() {
  const { user } = useSecureAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [sentReminders, setSentReminders] = useState<SentReminder[]>([]);
  const [qlnStaff, setQlnStaff] = useState<Cbqln[]>([]);
  const [khStaff, setKhStaff] = useState<Cbkh[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  const [newReminder, setNewReminder] = useState<Partial<TablesInsert<'asset_reminders'>>>({
    ten_ts: '',
    ngay_den_han: getCurrentDateFormatted(),
    cbqln: '',
    cbkh: '',
  });

  const tenTSRef = useRef<HTMLInputElement>(null);
  const ngayDenHanRef = useRef<HTMLInputElement>(null);
  const cbqlnRef = useRef<HTMLButtonElement>(null);
  const cbkhRef = useRef<HTMLButtonElement>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reminderData, sentData, qlnData, khData] = await Promise.all([
        AssetReminder.list(),
        SentAssetReminder.list(),
        CBQLN.list(),
        CBKH.list(),
      ]);
      
      setReminders(reminderData.filter(r => !r.is_sent));
      const sortedSent = [...sentData].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setSentReminders(sortedSent);
      setQlnStaff(qlnData);
      setKhStaff(khData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi khi tải dữ liệu.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const isDueOrOverdue = useCallback((dateStr: string) => {
    if (!/^\d{2}-\d{2}$/.test(dateStr)) return false;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const [dueDay, dueMonth] = dateStr.split('-').map(Number);
    if (dueMonth < currentMonth) return true;
    if (dueMonth === currentMonth && dueDay <= currentDay) return true;
    return false;
  }, []);

  const handleSave = useCallback(async () => {
    if (!newReminder.ten_ts || !newReminder.ngay_den_han) {
      toast.error('Vui lòng nhập tên tài sản và ngày đến hạn!');
      return;
    }

    try {
      if (editingReminder) {
        await AssetReminder.update(editingReminder.id, newReminder);
        toast.success('Cập nhật nhắc nhở thành công!');
      } else {
        await AssetReminder.create(newReminder);
        toast.success('Thêm nhắc nhở thành công!');
      }
      
      setNewReminder({ ten_ts: '', ngay_den_han: getCurrentDateFormatted(), cbqln: '', cbkh: '' });
      setEditingReminder(null);
      await loadInitialData();
      
      setTimeout(() => tenTSRef.current?.focus(), 100);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu nhắc nhở!');
    }
  }, [newReminder, editingReminder, loadInitialData]);

  const editReminder = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      ten_ts: reminder.ten_ts,
      ngay_den_han: reminder.ngay_den_han,
      cbqln: reminder.cbqln || '',
      cbkh: reminder.cbkh || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => tenTSRef.current?.focus(), 100);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingReminder(null);
    setNewReminder({ ten_ts: '', ngay_den_han: getCurrentDateFormatted(), cbqln: '', cbkh: '' });
  }, []);

  const sendDueReminders = useCallback(async () => {
    const dueReminders = reminders.filter(r => isDueOrOverdue(r.ngay_den_han));
    if (dueReminders.length === 0) {
      toast.info('Không có tài sản nào đến hạn!');
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        const allStaff = [...qlnStaff, ...khStaff];
        const staffMap = new Map(allStaff.map(s => [s.ten_nv, s]));

        for (const reminder of dueReminders) {
          const emailContent = `Xin chào bạn ${reminder.cbqln || ''}${reminder.cbkh ? ` và bạn ${reminder.cbkh}` : ''},\n\nCó TS ${reminder.ten_ts} đến hạn vào ngày ${reminder.ngay_den_han}, các bạn hãy trả TS về P. QLN trước 14 giờ 00 ngày ${reminder.ngay_den_han}.\n\nTrân trọng cám ơn.`;
          const emailSubject = `🔥 [PRIORITY] Nhắc nhở: Tài sản ${reminder.ten_ts} đến hạn ngày ${reminder.ngay_den_han}`;
          
          const recipients = [reminder.cbqln, reminder.cbkh].filter((name): name is string => !!name);
          const recipientEmails = recipients.map(name => staffMap.get(name)?.email).filter((email): email is string => !!email);

          if (recipientEmails.length > 0) {
            await SendEmail({
              to: recipientEmails,
              subject: emailSubject,
              body: emailContent,
              from_name: '🔥 Hệ thống QLTS - Nhắc TS đến hạn',
            });
          }

          for (const name of recipients) {
            const staff = staffMap.get(name);
            if (staff?.email) {
              const username = staff.email.split('@')[0];
              await supabase.from('notifications').insert({
                recipient_username: username,
                title: `Tài sản đến hạn: ${reminder.ten_ts}`,
                message: `Tài sản ${reminder.ten_ts} đến hạn vào ngày ${reminder.ngay_den_han}.`,
                notification_type: 'asset_reminder',
              });
              await sendPushNotification(username, {
                title: 'Nhắc nhở tài sản đến hạn',
                body: `Tài sản "${reminder.ten_ts}" đã đến hạn.`,
                url: '/asset-reminders'
              });
            }
          }
          
          await SentAssetReminder.create({ ...reminder, sent_date: format(new Date(), 'yyyy-MM-dd'), is_sent: true });
          await AssetReminder.delete(reminder.id);
        }
        resolve(dueReminders.length);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Đang gửi nhắc nhở...',
      success: (count) => `Đã gửi ${count} email và thông báo nhắc nhở!`,
      error: 'Có lỗi xảy ra khi gửi email hoặc thông báo!',
      finally: () => loadInitialData(),
    });
  }, [reminders, qlnStaff, khStaff, isDueOrOverdue, loadInitialData]);

  const deleteReminder = useCallback(async (id: string, isSent = false) => {
    if (user?.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền xóa!');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này?')) return;

    try {
      if (isSent) {
        await SentAssetReminder.delete(id);
      } else {
        await AssetReminder.delete(id);
      }
      toast.success('Xóa thành công!');
      await loadInitialData();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa!');
    }
  }, [user, loadInitialData]);

  const deleteAllSent = useCallback(async () => {
    if (user?.role !== 'admin' || !window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử đã gửi?')) return;

    const promise = new Promise(async (resolve, reject) => {
        try {
            const sentIds = sentReminders.map(sent => sent.id);
            await Promise.all(sentIds.map(id => SentAssetReminder.delete(id)));
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });

    toast.promise(promise, {
        loading: 'Đang xóa lịch sử...',
        success: 'Đã xóa tất cả lịch sử!',
        error: 'Có lỗi xảy ra khi xóa!',
        finally: () => loadInitialData(),
    });
  }, [user, sentReminders, loadInitialData]);

  const sortedReminders = useMemo(() => {
    if (!Array.isArray(reminders)) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    return [...reminders].sort((a, b) => {
      const [dayA, monthA] = a.ngay_den_han.split('-').map(Number);
      const [dayB, monthB] = b.ngay_den_han.split('-').map(Number);
      let dateA = new Date(currentYear, monthA - 1, dayA);
      let dateB = new Date(currentYear, monthB - 1, dayB);
      if (dateA < now) dateA.setFullYear(currentYear + 1);
      if (dateB < now) dateB.setFullYear(currentYear + 1);
      return dateA.getTime() - dateB.getTime();
    });
  }, [reminders]);

  const moveToNextField = useCallback((currentField: 'tenTS' | 'ngayDenHan' | 'cbqln') => {
    setTimeout(() => {
      switch (currentField) {
        case 'tenTS': ngayDenHanRef.current?.focus(); break;
        case 'ngayDenHan': cbqlnRef.current?.focus(); break;
        case 'cbqln': cbkhRef.current?.focus(); break;
      }
    }, 100);
  }, []);

  const qlnOptions = useMemo(() => qlnStaff.map(s => ({ value: s.ten_nv, label: s.ten_nv })), [qlnStaff]);
  const khOptions = useMemo(() => khStaff.map(s => ({ value: s.ten_nv, label: s.ten_nv })), [khStaff]);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhắc tài sản đến hạn</h1>
            <p className="text-gray-600">Quản lý và gửi nhắc nhở về tài sản đến hạn trả</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ten_ts">Tên tài sản</Label>
                  <Input id="ten_ts" ref={tenTSRef} value={newReminder.ten_ts || ''} onChange={(e) => setNewReminder({ ...newReminder, ten_ts: e.target.value })} placeholder="Nhập tên TS" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && moveToNextField('tenTS')} />
                </div>
                <div>
                  <Label htmlFor="ngay_den_han">Ngày đến hạn</Label>
                  <DateInput id="ngay_den_han" ref={ngayDenHanRef} value={newReminder.ngay_den_han || ''} onChange={(value) => setNewReminder({ ...newReminder, ngay_den_han: value })} className="mt-1" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && moveToNextField('ngayDenHan')} />
                </div>
                <div>
                  <Label htmlFor="cbqln">CBQLN</Label>
                  <AutoCompleteInput ref={cbqlnRef} value={newReminder.cbqln || ''} onChange={(value) => setNewReminder({ ...newReminder, cbqln: value })} suggestions={qlnOptions} placeholder="Chọn nhân viên QLN" className="mt-1" onTabSelect={() => moveToNextField('cbqln')} />
                </div>
                <div>
                  <Label htmlFor="cbkh">CBKH</Label>
                  <AutoCompleteInput ref={cbkhRef} value={newReminder.cbkh || ''} onChange={(value) => setNewReminder({ ...newReminder, cbkh: value })} suggestions={khOptions} placeholder="Chọn nhân viên KH" className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                {editingReminder && <Button type="button" onClick={cancelEdit} variant="outline">Hủy</Button>}
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingReminder ? 'Cập nhật' : 'Thêm nhắc nhở'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Danh sách nhắc nhở ({sortedReminders.length})</CardTitle>
            <Button onClick={sendDueReminders} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" /> Gửi email
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Tên TS</TableHead><TableHead>Ngày đến hạn</TableHead><TableHead>CBQLN</TableHead><TableHead>CBKH</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={5} className="text-center h-24">Đang tải...</TableCell></TableRow> : sortedReminders.map((r) => (
                    <TableRow key={r.id} className={isDueOrOverdue(r.ngay_den_han) ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{r.ten_ts}</TableCell>
                      <TableCell className={`font-medium ${isDueOrOverdue(r.ngay_den_han) ? 'text-red-600' : ''}`}>{r.ngay_den_han}</TableCell>
                      <TableCell>{r.cbqln || '-'}</TableCell>
                      <TableCell>{r.cbkh || '-'}</TableCell>
                      <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editReminder(r)}><Edit className="w-4 h-4 text-blue-600" /></Button>{user?.role === 'admin' && <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>}</div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Danh sách đã gửi ({sentReminders.length})</CardTitle>
            {user?.role === 'admin' && <Button onClick={deleteAllSent} variant="destructive"><Trash className="w-4 h-4 mr-2" />Xóa tất cả</Button>}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Tên TS</TableHead><TableHead>Ngày đến hạn</TableHead><TableHead>CBQLN</TableHead><TableHead>CBKH</TableHead><TableHead>Ngày gửi</TableHead>{user?.role === 'admin' && <TableHead>Thao tác</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={6} className="text-center h-24">Đang tải...</TableCell></TableRow> : sentReminders.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.ten_ts}</TableCell>
                      <TableCell>{r.ngay_den_han}</TableCell>
                      <TableCell>{r.cbqln || '-'}</TableCell>
                      <TableCell>{r.cbkh || '-'}</TableCell>
                      <TableCell>{format(new Date(r.sent_date), 'dd/MM/yyyy')}</TableCell>
                      {user?.role === 'admin' && <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id, true)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}