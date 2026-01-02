/**
 * DataTable reutilizable con virtualización, exportación y atajos de teclado
 * @version 2.0 - Mejoras: Paginación, selección múltiple, sticky header, a11y
 */

import React, { useCallback, useMemo, useState, useRef, useEffect, memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
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
  align?: 'left' | 'center' | 'right';
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
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowActions?: (row: T) => React.ReactNode;
  height?: string;
  exportFilename?: string;
  showExport?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  rowClassName?: (row: T) => string;
  stickyHeader?: boolean;
}

// Pagination component
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-2 py-2 border-t bg-muted/30">
      <span className="text-sm text-muted-foreground">
        {start}-{end} de {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2 min-w-[80px] text-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// Row component memoizado para evitar re-renders
const TableRowMemo = memo(function TableRowMemo<T extends { id: string }>({
  row,
  columns,
  onRowClick,
  onRowDoubleClick,
  selectedId,
  isSelected,
  onCheckChange,
  showCheckbox,
  rowActions,
  rowClassName,
  index
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedId?: string | null;
  isSelected?: boolean;
  onCheckChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
  rowActions?: (row: T) => React.ReactNode;
  rowClassName?: (row: T) => string;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.3) }}
      className={cn(
        "border-b transition-colors",
        onRowClick && "cursor-pointer",
        selectedId === row.id && "bg-muted",
        isSelected && "bg-primary/10",
        "hover:bg-muted/50",
        rowClassName?.(row)
      )}
      onClick={() => onRowClick?.(row)}
      onDoubleClick={() => onRowDoubleClick?.(row)}
      tabIndex={0}
      role="row"
      aria-selected={selectedId === row.id || isSelected}
    >
      {showCheckbox && (
        <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onCheckChange}
            aria-label={`Seleccionar fila ${index + 1}`}
          />
        </TableCell>
      )}
      {columns.map((col) => (
        <TableCell 
          key={col.key} 
          className={cn(
            col.className,
            col.align === 'center' && 'text-center',
            col.align === 'right' && 'text-right'
          )} 
          style={{ width: col.width }}
        >
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
  isSelected?: boolean;
  onCheckChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
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
  selectedIds = [],
  onSelectionChange,
  rowActions,
  height = '500px',
  exportFilename = 'export',
  showExport = true,
  showPagination = false,
  pageSize = 25,
  rowClassName,
  stickyHeader = true
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    const column = columns.find(c => c.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);
      
      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = typeof aVal === 'string' ? aVal : String(aVal || '');
      const bStr = typeof bVal === 'string' ? bVal : String(bVal || '');
      
      const comparison = aStr.localeCompare(bStr, 'es', { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey]);

  // Selection
  const showCheckbox = !!onSelectionChange;
  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.includes(row.id));
  const someSelected = paginatedData.some(row => selectedIds.includes(row.id));

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const newIds = [...new Set([...selectedIds, ...paginatedData.map(r => r.id)])];
      onSelectionChange(newIds);
    } else {
      const pageIds = new Set(paginatedData.map(r => r.id));
      onSelectionChange(selectedIds.filter(id => !pageIds.has(id)));
    }
  }, [onSelectionChange, selectedIds, paginatedData]);

  const handleSelectRow = useCallback((rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, rowId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== rowId));
    }
  }, [onSelectionChange, selectedIds]);

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
      
      const currentIndex = paginatedData.findIndex(row => row.id === selectedId);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown' && currentIndex < paginatedData.length - 1) {
        e.preventDefault();
        onRowClick(paginatedData[currentIndex + 1]);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        onRowClick(paginatedData[currentIndex - 1]);
      } else if (e.key === 'Enter' && onRowDoubleClick) {
        e.preventDefault();
        onRowDoubleClick(paginatedData[currentIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, paginatedData, onRowClick, onRowDoubleClick]);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Cargando datos">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" role="status">
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
      {(showExport || (showCheckbox && selectedIds.length > 0)) && (
        <div className="flex items-center justify-between">
          {showCheckbox && selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 ml-auto">
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
          )}
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <ScrollArea style={{ height }} ref={scrollRef}>
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10 shadow-sm")}>
              <TableRow>
                {showCheckbox && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) (el as unknown as HTMLInputElement).indeterminate = someSelected && !allSelected;
                      }}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead 
                    key={col.key} 
                    className={cn(
                      col.className, 
                      col.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                    tabIndex={col.sortable ? 0 : undefined}
                    onKeyDown={(e) => col.sortable && e.key === 'Enter' && handleSort(col.key)}
                    aria-sort={sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
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
                {paginatedData.map((row, index) => (
                  <TableRowMemo
                    key={row.id}
                    row={row}
                    columns={columns}
                    onRowClick={onRowClick}
                    onRowDoubleClick={onRowDoubleClick}
                    selectedId={selectedId}
                    isSelected={selectedIds.includes(row.id)}
                    onCheckChange={(checked) => handleSelectRow(row.id, checked)}
                    showCheckbox={showCheckbox}
                    rowActions={rowActions}
                    rowClassName={rowClassName}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>

        {showPagination && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedData.length}
            pageSize={pageSize}
          />
        )}
      </div>

      {!showPagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <span>{sortedData.length} registro{sortedData.length !== 1 ? 's' : ''}</span>
          <span className="text-xs">↑↓ navegar • Enter abrir</span>
        </div>
      )}
    </div>
  );
}

export default DataTable;
