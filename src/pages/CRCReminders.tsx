import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileCheck, Send, Trash2, Plus, Edit, Trash } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import AutoCompleteInput from "@/components/reminders/AutoCompleteInput";
import DateInput from "@/components/reminders/DateInput";

import { useSecureAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { CRCReminder } from "@/api/entities/CRCReminder";
import { SentCRCReminder } from "@/api/entities/SentCRCReminder";
import { LDPCRC } from "@/api/entities/LDPCRC";
import { CBCRC } from "@/api/entities/CBCRC";
import { QUYCRC } from "@/api/entities/QUYCRC";
import { emailService } from "@/services/emailService";
import { sendPushNotification } from "@/services/notificationService";

type Reminder = Tables<'crc_reminders'>;
type SentReminder = Tables<'sent_crc_reminders'>;
type Staff = Tables<'ldpcrc'> | Tables<'cbcrc'> | Tables<'quycrc'>;

const getUniqueStaffOptions = (staffList: Staff[]) => {
  if (!staffList) return [];
  const unique = new Map<string, { value: string; label: string }>();
  staffList.forEach(s => {
    if (s.ten_nv && !unique.has(s.ten_nv)) {
      unique.set(s.ten_nv, { value: s.ten_nv, label: s.ten_nv });
    }
  });
  return Array.from(unique.values());
};

export default function CRCReminders() {
  const { user } = useSecureAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [sentReminders, setSentReminders] = useState<SentReminder[]>([]);
  const [ldpcrcStaff, setLdpcrcStaff] = useState<Tables<'ldpcrc'>[]>([]);
  const [cbcrcStaff, setCbcrcStaff] = useState<Tables<'cbcrc'>[]>([]);
  const [quycrcStaff, setQuycrcStaff] = useState<Tables<'quycrc'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  const [newReminder, setNewReminder] = useState<Partial<TablesInsert<'crc_reminders'>>>({
    loai_bt_crc: "",
    ngay_thuc_hien: format(new Date(), 'dd-MM'),
    ldpcrc: "",
    cbcrc: "", 
    quycrc: ""
  });

  const loaiCRCRef = useRef<HTMLInputElement>(null);
  const ngayThucHienRef = useRef<HTMLInputElement>(null);
  const ldpcrcRef = useRef<HTMLInputElement>(null);
  const cbcrcRef = useRef<HTMLInputElement>(null);
  const quycrcRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [reminderData, sentData, ldpcrcData, cbcrcData, quycrcData] = await Promise.all([
        CRCReminder.list('-created_at'),
        SentCRCReminder.list('-sent_date'),
        LDPCRC.list(),
        CBCRC.list(),
        QUYCRC.list(),
      ]);
      setReminders(reminderData.filter(r => !r.is_sent));
      setSentReminders(sentData);
      setLdpcrcStaff(ldpcrcData);
      setCbcrcStaff(cbcrcData);
      setQuycrcStaff(quycrcData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải danh sách nhắc nhở.");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const handleSave = useCallback(async () => {
    if (!newReminder.loai_bt_crc || !newReminder.ngay_thuc_hien) {
      toast.error("Vui lòng nhập loại BT CRC và ngày thực hiện!");
      return;
    }

    const promise = new Promise<string>(async (resolve, reject) => {
      try {
        if (editingReminder) {
          await CRCReminder.update(editingReminder.id, newReminder);
        } else {
          await CRCReminder.create(newReminder);
        }
        resolve(editingReminder ? "Cập nhật thành công!" : "Thêm thành công!");
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Đang lưu...',
      success: (message) => {
        setNewReminder({ loai_bt_crc: "", ngay_thuc_hien: format(new Date(), 'dd-MM'), ldpcrc: "", cbcrc: "", quycrc: "" });
        setEditingReminder(null);
        loadData();
        setTimeout(() => loaiCRCRef.current?.focus(), 100);
        return message;
      },
      error: 'Có lỗi xảy ra khi lưu!',
    });
  }, [editingReminder, newReminder, loadData]);

  const editReminder = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      loai_bt_crc: reminder.loai_bt_crc,
      ngay_thuc_hien: reminder.ngay_thuc_hien,
      ldpcrc: reminder.ldpcrc || "",
      cbcrc: reminder.cbcrc || "",
      quycrc: reminder.quycrc || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => loaiCRCRef.current?.focus(), 100);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingReminder(null);
    setNewReminder({ loai_bt_crc: "", ngay_thuc_hien: format(new Date(), 'dd-MM'), ldpcrc: "", cbcrc: "", quycrc: "" });
  }, []);

  const sendSingleReminder = useCallback(async (reminder: Reminder) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const staffMap = new Map<string, Staff>();
        [...ldpcrcStaff, ...cbcrcStaff, ...quycrcStaff].forEach(s => staffMap.set(s.ten_nv, s));

        const recipients = [reminder.ldpcrc, reminder.cbcrc, reminder.quycrc].filter((name): name is string => !!name);
        const recipientEmails = recipients.map(name => staffMap.get(name)?.email).filter((email): email is string => !!email);

        if (recipientEmails.length > 0) {
          const emailSubject = `🔥 Nhắc duyệt CRC: ${reminder.loai_bt_crc} ngày ${reminder.ngay_thuc_hien}`;
          const emailContent = `Xin chào các bạn,\n\nCó chứng từ CRC: ${reminder.loai_bt_crc} được thực hiện vào ngày ${reminder.ngay_thuc_hien} chưa được duyệt đúng trên chương trình CRC, Anh chị em vui lòng duyệt chứng từ CRC đúng theo quy định.\n\nTrân trọng cám ơn.`;
          await emailService.sendAssetNotificationEmail(recipientEmails, emailSubject, emailContent);
        }

        for (const name of recipients) {
          const staff = staffMap.get(name);
          if (staff?.email) {
            const username = staff.email.split('@')[0];
            const notifMessage = `Yêu cầu duyệt CRC loại "${reminder.loai_bt_crc}" cần thực hiện vào ngày ${reminder.ngay_thuc_hien}.`;
            await supabase.from('notifications').insert({ recipient_username: username, title: 'Nhắc nhở duyệt CRC', message: notifMessage, notification_type: 'crc_reminder' });
            await sendPushNotification(username, { title: 'Nhắc nhở duyệt CRC', body: notifMessage, url: '/crc-reminders' });
          }
        }

        await SentCRCReminder.create({ ...reminder, sent_date: new Date().toISOString() });
        await CRCReminder.delete(reminder.id);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Đang gửi nhắc nhở...',
      success: 'Đã gửi email và thông báo!',
      error: 'Gửi thất bại!',
      finally: () => loadData(),
    });
  }, [ldpcrcStaff, cbcrcStaff, quycrcStaff, loadData]);

  const sendAllReminders = useCallback(() => {
    if (reminders.length === 0) {
      toast.info("Không có nhắc nhở nào trong danh sách chờ.");
      return;
    }
    reminders.forEach(sendSingleReminder);
  }, [reminders, sendSingleReminder]);

  const deleteReminder = useCallback(async (id: string, isSent = false) => {
    if (user?.role !== 'admin') {
      toast.error("Chỉ quản trị viên mới có quyền xóa!");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;

    const promise = isSent ? SentCRCReminder.delete(id) : CRCReminder.delete(id);
    toast.promise(promise, {
      loading: 'Đang xóa...',
      success: 'Xóa thành công!',
      error: 'Xóa thất bại!',
      finally: () => loadData(),
    });
  }, [user, loadData]);

  const deleteAllSent = useCallback(async () => {
    if (user?.role !== 'admin') {
      toast.error("Chỉ quản trị viên mới có quyền xóa!");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử đã gửi?")) return;

    const promise = (async () => {
      const { error } = await supabase.from('sent_crc_reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    })();
    toast.promise(promise, {
      loading: 'Đang xóa tất cả...',
      success: 'Đã xóa toàn bộ lịch sử!',
      error: 'Xóa toàn bộ thất bại!',
      finally: () => loadData(),
    });
  }, [user, loadData]);

  const moveToNextField = useCallback((currentField: 'loaiCRC' | 'ngayThucHien' | 'ldpcrc' | 'cbcrc') => {
    setTimeout(() => {
      switch (currentField) {
        case 'loaiCRC': ngayThucHienRef.current?.focus(); break;
        case 'ngayThucHien': ldpcrcRef.current?.focus(); break;
        case 'ldpcrc': cbcrcRef.current?.focus(); break;
        case 'cbcrc': quycrcRef.current?.focus(); break;
      }
    }, 100);
  }, []);

  const ldpcrcOptions = useMemo(() => getUniqueStaffOptions(ldpcrcStaff), [ldpcrcStaff]);
  const cbcrcOptions = useMemo(() => getUniqueStaffOptions(cbcrcStaff), [cbcrcStaff]);
  const quycrcOptions = useMemo(() => getUniqueStaffOptions(quycrcStaff), [quycrcStaff]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhắc duyệt CRC</h1>
          <p className="text-gray-600">Quản lý và gửi nhắc nhở duyệt chứng từ CRC</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingReminder ? 'Chỉnh sửa' : 'Thêm'} nhắc nhở CRC</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label htmlFor="loaiCRC">Loại BT CRC</Label><Input id="loaiCRC" ref={loaiCRCRef} value={newReminder.loai_bt_crc || ''} onChange={(e) => setNewReminder({ ...newReminder, loai_bt_crc: e.target.value })} placeholder="Nhập/xuất/mượn - Số - Tên TS" className="mt-1" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && moveToNextField('loaiCRC')} /></div>
              <div><Label htmlFor="ngayThucHien">Ngày thực hiện</Label><DateInput id="ngayThucHien" ref={ngayThucHienRef} value={newReminder.ngay_thuc_hien || ''} onChange={(value) => setNewReminder({ ...newReminder, ngay_thuc_hien: value })} className="mt-1" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && moveToNextField('ngayThucHien')} /></div>
              <div><Label htmlFor="ldpcrc">LĐPCRC</Label><AutoCompleteInput ref={ldpcrcRef} value={newReminder.ldpcrc || ''} onChange={(value) => setNewReminder({ ...newReminder, ldpcrc: value })} suggestions={ldpcrcOptions} placeholder="Nhập tên LĐP duyệt CRC" className="mt-1" onTabSelect={() => moveToNextField('ldpcrc')} /></div>
              <div><Label htmlFor="cbcrc">CBCRC</Label><AutoCompleteInput ref={cbcrcRef} value={newReminder.cbcrc || ''} onChange={(value) => setNewReminder({ ...newReminder, cbcrc: value })} suggestions={cbcrcOptions} placeholder="Nhập tên CB làm CRC" className="mt-1" onTabSelect={() => moveToNextField('cbcrc')} /></div>
              <div><Label htmlFor="quycrc">QUYCRC</Label><AutoCompleteInput ref={quycrcRef} value={newReminder.quycrc || ''} onChange={(value) => setNewReminder({ ...newReminder, quycrc: value })} suggestions={quycrcOptions} placeholder="Nhập tên Thủ quỹ duyệt CRC" className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              {editingReminder && <Button type="button" onClick={cancelEdit} variant="outline">Hủy</Button>}
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{editingReminder ? 'Cập nhật' : 'Thêm nhắc nhở'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách chờ gửi ({reminders.length})</CardTitle>
          <Button onClick={sendAllReminders} className="bg-green-600 hover:bg-green-700"><Send className="w-4 h-4 mr-2" />Gửi tất cả</Button>
        </CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Loại BT CRC</TableHead><TableHead>Ngày thực hiện</TableHead><TableHead>LĐPCRC</TableHead><TableHead>CBCRC</TableHead><TableHead>QUYCRC</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>
          {isLoading ? <TableRow><TableCell colSpan={6} className="text-center h-24">Đang tải...</TableCell></TableRow> : reminders.map((r) => (
            <TableRow key={r.id}><TableCell className="font-medium">{r.loai_bt_crc}</TableCell><TableCell>{r.ngay_thuc_hien}</TableCell><TableCell>{r.ldpcrc || '-'}</TableCell><TableCell>{r.cbcrc || '-'}</TableCell><TableCell>{r.quycrc || '-'}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => sendSingleReminder(r)} title="Gửi"><Send className="w-4 h-4 text-green-600" /></Button><Button variant="ghost" size="icon" onClick={() => editReminder(r)} title="Sửa"><Edit className="w-4 h-4 text-blue-600" /></Button>{user?.role === 'admin' && <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} title="Xóa"><Trash2 className="w-4 h-4 text-red-600" /></Button>}</div></TableCell></TableRow>
          ))}
        </TableBody></Table></div></CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách đã gửi ({sentReminders.length})</CardTitle>
          {user?.role === 'admin' && <Button onClick={deleteAllSent} variant="destructive"><Trash className="w-4 h-4 mr-2" />Xóa tất cả</Button>}
        </CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Loại BT CRC</TableHead><TableHead>Ngày thực hiện</TableHead><TableHead>LĐPCRC</TableHead><TableHead>CBCRC</TableHead><TableHead>QUYCRC</TableHead><TableHead>Ngày gửi</TableHead>{user?.role === 'admin' && <TableHead>Thao tác</TableHead>}</TableRow></TableHeader><TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="text-center h-24">Đang tải...</TableCell></TableRow> : sentReminders.map((r) => (
            <TableRow key={r.id}><TableCell className="font-medium">{r.loai_bt_crc}</TableCell><TableCell>{r.ngay_thuc_hien}</TableCell><TableCell>{r.ldpcrc || '-'}</TableCell><TableCell>{r.cbcrc || '-'}</TableCell><TableCell>{r.quycrc || '-'}</TableCell><TableCell>{r.sent_date ? format(new Date(r.sent_date), 'dd/MM/yyyy') : '-'}</TableCell>{user?.role === 'admin' && <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id, true)} title="Xóa"><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell>}</TableRow>
          ))}
        </TableBody></Table></div></CardContent>
      </Card>
    </div>
  );
}