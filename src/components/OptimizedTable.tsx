import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown } from 'lucide-react';

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
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  selectable?: boolean;
  selectedRows?: Record<string, boolean>;
  onRowSelect?: (rowId: string) => void;
  onSelectAll?: () => void;
}

interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: OptimizedTableProps['columns'];
    onRowClick?: (row: any) => void;
    selectable?: boolean;
    selectedRows?: Record<string, boolean>;
    onRowSelect?: (rowId: string) => void;
  };
}

const TableRowComponent = memo<ListChildComponentProps>(({ index, style, data }) => {
  const { items, columns, onRowClick, selectable, selectedRows, onRowSelect } = data;
  const row = items[index];

  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [row, onRowClick]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRowSelect) {
      onRowSelect(row.id);
    }
  }, [row.id, onRowSelect]);

  return (
    <div style={style} className="flex items-center border-b cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" onClick={handleRowClick}>
      {selectable && (
        <div className="flex-shrink-0 flex items-center justify-center p-4" style={{ width: 50 }} onClick={handleCheckboxClick}>
          <Checkbox
            checked={!!selectedRows?.[row.id]}
            aria-label={`Select row ${index + 1}`}
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.key}
          className={`p-4 flex items-center justify-start ${column.key !== 'actions' ? 'truncate' : ''} ${column.width ? 'flex-none' : 'flex-grow'}`}
          style={{ width: column.width, flexBasis: column.width }}
        >
          {column.render ? column.render(row[column.key], row) : row[column.key]}
        </div>
      ))}
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
  loading = false,
  sortColumn,
  sortDirection,
  onSort,
  selectable = false,
  selectedRows = {},
  onRowSelect,
  onSelectAll
}) => {
  const itemData = useMemo(() => ({
    items: data,
    columns,
    onRowClick,
    selectable,
    selectedRows,
    onRowSelect
  }), [data, columns, onRowClick, selectable, selectedRows, onRowSelect]);

  const numSelected = Object.keys(selectedRows).length;
  const rowCount = data.length;
  const isAllSelected = rowCount > 0 && numSelected === rowCount;

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
      <div className="flex items-center font-medium border-b bg-muted/50">
        {selectable && (
          <div className="flex-shrink-0 flex items-center justify-center p-4" style={{ width: 50 }}>
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all"
            />
          </div>
        )}
        {columns.map((column) => (
          <div
            key={column.key}
            className={`p-4 flex items-center justify-start ${column.key !== 'actions' ? 'truncate' : ''} ${onSort && column.key !== 'actions' ? 'cursor-pointer hover:bg-muted' : ''} ${column.width ? 'flex-none' : 'flex-grow'}`}
            style={{ width: column.width, flexBasis: column.width }}
            onClick={() => onSort && column.key !== 'actions' && onSort(column.key)}
          >
            {column.label}
            {sortColumn === column.key && (
              <span className="ml-2 inline-block">
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </span>
            )}
          </div>
        ))}
      </div>

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