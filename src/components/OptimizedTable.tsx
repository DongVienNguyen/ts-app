import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OptimizedTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  height?: number;
  itemHeight?: number;
  onRowClick?: (row: any) => void;
  loading?: boolean;
}

interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: OptimizedTableProps['columns'];
    onRowClick?: (row: any) => void;
  };
}

const TableRowComponent = memo<ListChildComponentProps>(({ index, style, data }) => {
  const { items, columns, onRowClick } = data;
  const row = items[index];

  const handleClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [row, onRowClick]);

  return (
    <div style={style}>
      <TableRow 
        className="cursor-pointer hover:bg-gray-50" 
        onClick={handleClick}
      >
        {columns.map((column) => (
          <TableCell key={column.key} style={{ width: column.width }}>
            {column.render ? column.render(row[column.key], row) : row[column.key]}
          </TableCell>
        ))}
      </TableRow>
    </div>
  );
});

TableRowComponent.displayName = 'TableRowComponent';

const OptimizedTable: React.FC<OptimizedTableProps> = memo(({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  onRowClick,
  loading = false
}) => {
  const itemData = useMemo(() => ({
    items: data,
    columns,
    onRowClick
  }), [data, columns, onRowClick]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} style={{ width: column.width }}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
      
      <List
        height={height}
        width="100%"
        itemCount={data.length}
        itemSize={itemHeight}
        itemData={itemData}
      >
        {TableRowComponent}
      </List>
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

export default OptimizedTable;