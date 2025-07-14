import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Plus, Search, Edit, Trash2, Download, History, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useSecureAuth } from "@/contexts/AuthContext";
import { OtherAsset } from "@/api/entities/OtherAsset";
import { OtherAssetHistory } from "@/api/entities/OtherAssetHistory";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { CalendarDateInput } from "@/components/CalendarDateInput";
import { useDebounce } from "@/hooks/useDebounce";

type Asset = Tables<'other_assets'>;
type AssetHistory = Tables<'asset_history_archive'>;

const initialFormState = {
  name: "",
  deposit_date: new Date(),
  depositor: "",
  deposit_receiver: "",
  withdrawal_date: null,
  withdrawal_deliverer: "",
  withdrawal_receiver: "",
  notes: ""
};

export default function OtherAssets() {
  const { user } = useSecureAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetHistory, setAssetHistory] = useState<AssetHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedAssetHistory, setSelectedAssetHistory] = useState<AssetHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [changeReason, setChangeReason] = useState("");
  
  const [newAsset, setNewAsset] = useState<any>(initialFormState);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredAssets = useMemo(() => 
    assets.filter(asset => {
      const term = debouncedSearchTerm.toLowerCase();
      return (
        asset.name?.toLowerCase().includes(term) ||
        asset.depositor?.toLowerCase().includes(term) ||
        asset.deposit_receiver?.toLowerCase().includes(term) ||
        asset.withdrawal_receiver?.toLowerCase().includes(term)
      );
    }), [assets, debouncedSearchTerm]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetData, historyData] = await Promise.all([
        OtherAsset.list('-created_at'),
        user?.role === 'admin' ? OtherAssetHistory.list('-created_at') : Promise.resolve([])
      ]);
      setAssets(assetData);
      setAssetHistory(historyData as AssetHistory[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu!");
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      if (user.department !== 'NQ' && user.role !== 'admin') {
        toast.error("Bạn không có quyền truy cập trang này.");
        // Consider redirecting here
      } else {
        loadData();
      }
    }
  }, [user, loadData]);

  const handleSave = useCallback(async () => {
    if (!newAsset.name || !newAsset.deposit_date) {
      toast.error("Vui lòng nhập tên tài sản và ngày gửi kho!");
      return;
    }

    if (editingAsset && !changeReason.trim()) {
      toast.error("Vui lòng nhập lý do thay đổi!");
      return;
    }

    const promise = new Promise<string>(async (resolve, reject) => {
      try {
        const assetData: Partial<TablesInsert<'other_assets'>> = {
          ...newAsset,
          deposit_date: newAsset.deposit_date ? format(newAsset.deposit_date, 'yyyy-MM-dd') : null,
          withdrawal_date: newAsset.withdrawal_date ? format(newAsset.withdrawal_date, 'yyyy-MM-dd') : null,
        };

        if (editingAsset) {
          await OtherAssetHistory.create({
            original_asset_id: editingAsset.id,
            asset_name: editingAsset.name,
            old_data: JSON.stringify(editingAsset),
            new_data: JSON.stringify(assetData),
            changed_by: user!.username,
            change_type: "update",
            change_reason: changeReason.trim()
          });
          await OtherAsset.update(editingAsset.id, assetData as TablesUpdate<'other_assets'>);
          resolve("Cập nhật tài sản thành công!");
        } else {
          await OtherAsset.create(assetData as TablesInsert<'other_assets'>);
          resolve("Thêm tài sản thành công!");
        }
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Đang lưu...',
      success: (message) => {
        setNewAsset(initialFormState);
        setEditingAsset(null);
        setChangeReason("");
        loadData();
        return message;
      },
      error: 'Có lỗi xảy ra khi lưu tài sản!',
    });
  }, [newAsset, editingAsset, changeReason, user, loadData]);

  const editAsset = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setNewAsset({
      ...asset,
      deposit_date: asset.deposit_date ? parseISO(asset.deposit_date) : null,
      withdrawal_date: asset.withdrawal_date ? parseISO(asset.withdrawal_date) : null,
    });
    setChangeReason("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteAsset = useCallback(async (asset: Asset) => {
    if (user?.role !== 'admin') {
      toast.error("Chỉ admin mới có quyền xóa!");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài sản "${asset.name}"?`)) return;

    const promise = new Promise<string>(async (resolve, reject) => {
      try {
        await OtherAssetHistory.create({
          original_asset_id: asset.id,
          asset_name: asset.name,
          old_data: JSON.stringify(asset),
          new_data: JSON.stringify({}),
          changed_by: user.username,
          change_type: "delete",
          change_reason: "Xóa tài sản"
        });
        await OtherAsset.delete(asset.id);
        resolve("Xóa tài sản thành công!");
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: 'Đang xóa...',
      success: (message) => {
        loadData();
        return message as React.ReactNode;
      },
      error: 'Có lỗi xảy ra khi xóa!',
    });
  }, [user, loadData]);

  const cancelEdit = useCallback(() => {
    setEditingAsset(null);
    setChangeReason("");
    setNewAsset(initialFormState);
  }, []);

  const showAssetHistory = useCallback((asset: Asset) => {
    const history = assetHistory.filter(h => h.original_asset_id === asset.id);
    setSelectedAssetHistory(history);
    setShowHistoryDialog(true);
  }, [assetHistory]);

  const exportToCSV = useCallback(() => {
    if (filteredAssets.length === 0) return;
    const headers = ["Tên tài sản", "Ngày gửi", "Người gửi", "Người nhận (gửi)", "Ngày xuất", "Người giao (xuất)", "Người nhận (xuất)", "Ghi chú"];
    const csvRows = [headers.join(',')];
    filteredAssets.forEach(asset => {
      const row = [
        asset.name || '',
        asset.deposit_date ? format(parseISO(asset.deposit_date), 'dd/MM/yyyy') : '',
        asset.depositor || '',
        asset.deposit_receiver || '',
        asset.withdrawal_date ? format(parseISO(asset.withdrawal_date), 'dd/MM/yyyy') : '',
        asset.withdrawal_deliverer || '',
        asset.withdrawal_receiver || '',
        (asset.notes || '').replace(/"/g, '""')
      ].map(field => `"${field}"`);
      csvRows.push(row.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TaiSanKhac_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAssets]);

  const assetHistoryCount = useMemo(() => {
    const countMap: { [key: string]: number } = {};
    assetHistory.forEach(history => {
      if (history.original_asset_id) {
        countMap[history.original_asset_id] = (countMap[history.original_asset_id] || 0) + 1;
      }
    });
    return countMap;
  }, [assetHistory]);

  if (!user) {
    return <Layout><div className="p-8 text-center">Đang tải...</div></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Tài sản, thùng khác gửi kho</h1>
            <p className="text-slate-600">Quản lý tài sản và thùng khác được gửi vào kho</p>
          </div>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assets" className="flex items-center gap-2"><Archive className="w-4 h-4" />Quản lý tài sản</TabsTrigger>
            {user.role === 'admin' && <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" />Lịch sử thay đổi</TabsTrigger>}
          </TabsList>

          <TabsContent value="assets" className="space-y-6 pt-4">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>{editingAsset ? 'Chỉnh sửa' : 'Thêm mới'} tài sản</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><Label>Tên tài sản / thùng</Label><Input value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} placeholder="Nhập tên tài sản hoặc thùng" /></div>
                  <div><Label>Ngày gửi kho</Label><CalendarDateInput value={newAsset.deposit_date} onChange={(date) => setNewAsset({...newAsset, deposit_date: date})} /></div>
                  <div><Label>Người gửi kho</Label><Input value={newAsset.depositor} onChange={(e) => setNewAsset({...newAsset, depositor: e.target.value})} placeholder="Tên người gửi" /></div>
                  <div><Label>Người nhận (khi gửi)</Label><Input value={newAsset.deposit_receiver} onChange={(e) => setNewAsset({...newAsset, deposit_receiver: e.target.value})} placeholder="Tên người nhận khi gửi" /></div>
                  <div><Label>Ngày xuất kho (nếu có)</Label><CalendarDateInput value={newAsset.withdrawal_date} onChange={(date) => setNewAsset({...newAsset, withdrawal_date: date})} placeholder="mm/dd/yyyy" /></div>
                  <div><Label>Người giao (khi xuất)</Label><Input value={newAsset.withdrawal_deliverer} onChange={(e) => setNewAsset({...newAsset, withdrawal_deliverer: e.target.value})} placeholder="Tên người giao khi xuất" /></div>
                  <div><Label>Người nhận (khi xuất)</Label><Input value={newAsset.withdrawal_receiver} onChange={(e) => setNewAsset({...newAsset, withdrawal_receiver: e.target.value})} placeholder="Tên người nhận khi xuất" /></div>
                  <div className="md:col-span-2"><Label>Ghi chú</Label><Input value={newAsset.notes} onChange={(e) => setNewAsset({...newAsset, notes: e.target.value})} placeholder="Ghi chú thêm" /></div>
                  {editingAsset && <div className="md:col-span-2"><Label>Lý do thay đổi <span className="text-red-500">*</span></Label><Textarea value={changeReason} onChange={(e) => setChangeReason(e.target.value)} placeholder="Nhập lý do thay đổi (bắt buộc)" /></div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  {editingAsset && <Button onClick={cancelEdit} variant="outline">Hủy</Button>}
                  <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />{editingAsset ? 'Cập nhật' : 'Thêm'}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative flex-1 w-full md:w-auto"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
                  <Button onClick={exportToCSV} variant="outline" disabled={filteredAssets.length === 0}><Download className="w-4 h-4 mr-2" />Xuất CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle>Danh sách tài sản ({filteredAssets.length})</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Tên tài sản</TableHead><TableHead>Ngày gửi</TableHead><TableHead>Người gửi</TableHead><TableHead>Người nhận (gửi)</TableHead><TableHead>Ngày xuất</TableHead><TableHead>Ghi chú</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>
                {isLoading ? <TableRow><TableCell colSpan={7} className="text-center h-24">Đang tải...</TableCell></TableRow> : filteredAssets.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center h-24">Không có dữ liệu.</TableCell></TableRow> : filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}{user.role === 'admin' && assetHistoryCount[asset.id] > 0 && <Badge variant="secondary" className="ml-2">{assetHistoryCount[asset.id]} LS</Badge>}</TableCell>
                    <TableCell>{asset.deposit_date ? format(parseISO(asset.deposit_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{asset.depositor || '-'}</TableCell>
                    <TableCell>{asset.deposit_receiver || '-'}</TableCell>
                    <TableCell>{asset.withdrawal_date ? format(parseISO(asset.withdrawal_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{asset.notes || '-'}</TableCell>
                    <TableCell><div className="flex gap-1">
                      {user.role === 'admin' && assetHistoryCount[asset.id] > 0 && <Button variant="ghost" size="icon" onClick={() => showAssetHistory(asset)}><History className="w-4 h-4 text-purple-600" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => editAsset(asset)}><Edit className="w-4 h-4 text-blue-600" /></Button>
                      {user.role === 'admin' && <Button variant="ghost" size="icon" onClick={() => deleteAsset(asset)}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></div></CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && <TabsContent value="history" className="space-y-6 pt-4">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Lịch sử thay đổi ({assetHistory.length})</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Tên tài sản</TableHead><TableHead>Loại</TableHead><TableHead>Người thay đổi</TableHead><TableHead>Lý do</TableHead><TableHead>Thời gian</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>
                {assetHistory.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center h-24">Chưa có lịch sử.</TableCell></TableRow> : assetHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.asset_name}</TableCell>
                    <TableCell><Badge variant={h.change_type === 'delete' ? 'destructive' : 'secondary'}>{h.change_type}</Badge></TableCell>
                    <TableCell>{h.changed_by}</TableCell>
                    <TableCell>{h.change_reason || '-'}</TableCell>
                    <TableCell>{format(parseISO(h.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell><Dialog><DialogTrigger asChild><Button variant="ghost" size="icon"><Info className="w-4 h-4" /></Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Chi tiết thay đổi</DialogTitle></DialogHeader><div className="grid gap-4"><div className="space-y-2"><h4>Dữ liệu cũ</h4><pre className="bg-slate-100 p-2 rounded-md text-xs">{JSON.stringify(h.old_data, null, 2)}</pre></div>{h.change_type === 'update' && <div className="space-y-2"><h4>Dữ liệu mới</h4><pre className="bg-slate-100 p-2 rounded-md text-xs">{JSON.stringify(h.new_data, null, 2)}</pre></div>}</div></DialogContent></Dialog></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></div></CardContent>
            </Card>
          </TabsContent>}
        </Tabs>

        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Lịch sử thay đổi tài sản</DialogTitle></DialogHeader>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Loại</TableHead><TableHead>Người thay đổi</TableHead><TableHead>Lý do</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader><TableBody>
              {selectedAssetHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell><Badge variant={h.change_type === 'delete' ? 'destructive' : 'secondary'}>{h.change_type}</Badge></TableCell>
                  <TableCell>{h.changed_by}</TableCell>
                  <TableCell>{h.change_reason || '-'}</TableCell>
                  <TableCell>{format(parseISO(h.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}