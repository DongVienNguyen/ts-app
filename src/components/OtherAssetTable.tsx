import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { OtherAsset } from '@/types/asset';
import { format } from 'date-fns';

interface OtherAssetTableProps {
  filteredAssets: OtherAsset[];
  user: any; // Consider a more specific type for user if available
  onEdit: (asset: OtherAsset) => void;
  onDelete: (asset: OtherAsset) => void;
}

const OtherAssetTable: React.FC<OtherAssetTableProps> = ({ filteredAssets, user, onEdit, onDelete }) => {
  const canEditOrDelete = user?.department === 'NQ' || user?.role === 'admin';

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên tài sản</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead>Người gửi</TableHead>
            <TableHead>Người nhận gửi</TableHead>
            <TableHead>Ngày lấy</TableHead>
            <TableHead>Người giao lấy</TableHead>
            <TableHead>Người nhận lấy</TableHead>
            <TableHead>Ghi chú</TableHead>
            {canEditOrDelete && <TableHead className="text-right">Hành động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Không tìm thấy tài sản nào.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.deposit_date ? format(new Date(asset.deposit_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>{asset.depositor || 'N/A'}</TableCell>
                <TableCell>{asset.deposit_receiver || 'N/A'}</TableCell>
                <TableCell>{asset.withdrawal_date ? format(new Date(asset.withdrawal_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>{asset.withdrawal_deliverer || 'N/A'}</TableCell>
                <TableCell>{asset.withdrawal_receiver || 'N/A'}</TableCell>
                <TableCell>{asset.notes || 'N/A'}</TableCell>
                {canEditOrDelete && (
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(asset)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(asset)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OtherAssetTable;