/**
 * DataTable reutilizable con virtualización, exportación y atajos de teclado
 */

import React, { useCallback, useMemo, useState, useRef, useEffect, memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedId?: string | null;
  rowActions?: (row: T) => React.ReactNode;
  height?: string;
  exportFilename?: string;
  showExport?: boolean;
  virtualize?: boolean;
  rowClassName?: (row: T) => string;
}

// Row component memoizado para evitar re-renders
const TableRowMemo = memo(function TableRowMemo<T extends { id: string }>({
  row,
  columns,
  onRowClick,
  onRowDoubleClick,
  selectedId,
  rowActions,
  rowClassName,
  index
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedId?: string | null;
  rowActions?: (row: T) => React.ReactNode;
  rowClassName?: (row: T) => string;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={cn(
        "border-b transition-colors cursor-pointer",
        selectedId === row.id && "bg-muted",
        "hover:bg-muted/50",
        rowClassName?.(row)
      )}
      onClick={() => onRowClick?.(row)}
      onDoubleClick={() => onRowDoubleClick?.(row)}
    >
      {columns.map((col) => (
        <TableCell key={col.key} className={col.className} style={{ width: col.width }}>
          {col.accessor(row)}
        </TableCell>
      ))}
      {rowActions && (
        <TableCell className="text-right w-[60px]">
          {rowActions(row)}
        </TableCell>
      )}
    </motion.tr>
  );
}) as <T extends { id: string }>(props: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedId?: string | null;
  rowActions?: (row: T) => React.ReactNode;
  rowClassName?: (row: T) => string;
  index: number;
}) => React.ReactElement;

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyIcon,
  emptyMessage = 'No hay datos',
  emptyDescription,
  onRowClick,
  onRowDoubleClick,
  selectedId,
  rowActions,
  height = '500px',
  exportFilename = 'export',
  showExport = true,
  rowClassName
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    const column = columns.find(c => c.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);
      
      const aStr = typeof aVal === 'string' ? aVal : String(aVal || '');
      const bStr = typeof bVal === 'string' ? bVal : String(bVal || '');
      
      const comparison = aStr.localeCompare(bStr, 'es', { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey]);

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const val = col.accessor(row);
        const str = typeof val === 'string' ? val : String(val || '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, columns, exportFilename]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || !onRowClick) return;
      
      const currentIndex = sortedData.findIndex(row => row.id === selectedId);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown' && currentIndex < sortedData.length - 1) {
        e.preventDefault();
        onRowClick(sortedData[currentIndex + 1]);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        onRowClick(sortedData[currentIndex - 1]);
      } else if (e.key === 'Enter' && onRowDoubleClick) {
        e.preventDefault();
        onRowDoubleClick(sortedData[currentIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, sortedData, onRowClick, onRowDoubleClick]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyIcon && (
          <div className="mx-auto mb-4 opacity-50">
            {emptyIcon}
          </div>
        )}
        <p className="text-lg font-medium">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-sm mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showExport && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ScrollArea style={{ height }} ref={scrollRef}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={cn(col.className, col.sortable && 'cursor-pointer select-none')}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right w-[60px]">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {sortedData.map((row, index) => (
                <TableRowMemo
                  key={row.id}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  selectedId={selectedId}
                  rowActions={rowActions}
                  rowClassName={rowClassName}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <span>{sortedData.length} registros</span>
        <span className="text-xs">↑↓ navegar • Enter abrir</span>
      </div>
    </div>
  );
}

export default DataTable;
