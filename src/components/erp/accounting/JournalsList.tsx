/**
 * JournalsList - Listado de asientos contables
 * Nuevo componente para gestión de asientos
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
  Download,
  BookOpen,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { useERPJournalEntries, JournalEntry } from '@/hooks/erp/useERPJournalEntries';
import { JournalEntryEditor } from './JournalEntryEditor';
import { HelpTooltip } from './HelpTooltip';
import { cn } from '@/lib/utils';
import {
  getEntryStatusLabel,
  getCountryCurrency,
  ENTRY_STATUS_COLORS
} from '@/lib/erp/accounting-dictionaries';

interface JournalsListProps {
  className?: string;
}

export function JournalsList({ className }: JournalsListProps) {
  const { currentCompany } = useERPContext();
  const { journals, periods, fetchJournals, fetchPeriods } = useERPAccounting();
  const {
    entries,
    isLoading,
    totalCount,
    fetchEntries,
    fetchEntry,
    postEntry,
    postMultiple,
    deleteEntry,
    reverseEntry
  } = useERPJournalEntries();

  const countryCode = currentCompany?.country_code || 'ES';
  const currency = getCountryCurrency(countryCode);

  // Filtros
  const [filterJournal, setFilterJournal] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Editor
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (currentCompany?.id) {
      fetchJournals();
      fetchPeriods();
    }
  }, [currentCompany?.id, fetchJournals, fetchPeriods]);

  // Cargar asientos
  const loadEntries = useCallback(() => {
    const filters: any = {};
    if (filterJournal) filters.journalId = filterJournal;
    if (filterPeriod) filters.periodId = filterPeriod;
    if (filterStatus === 'draft') filters.isPosted = false;
    if (filterStatus === 'posted') filters.isPosted = true;
    if (filterStatus === 'cancelled') filters.isCancelled = true;
    if (searchTerm) filters.search = searchTerm;
    
    fetchEntries(filters);
  }, [fetchEntries, filterJournal, filterPeriod, filterStatus, searchTerm]);

  useEffect(() => {
    if (currentCompany?.id) {
      loadEntries();
    }
  }, [currentCompany?.id, loadEntries]);

  // Toggle selección
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Seleccionar todo
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      const draftIds = entries.filter(e => !e.is_posted && !e.is_cancelled).map(e => e.id!);
      setSelectedIds(new Set(draftIds));
    }
    setSelectAll(!selectAll);
  };

  // Acciones
  const handleView = async (entry: JournalEntry) => {
    const full = await fetchEntry(entry.id!);
    if (full) {
      setEditingEntry(full);
      setShowEditor(true);
    }
  };

  const handleEdit = async (entry: JournalEntry) => {
    if (entry.is_posted) return;
    const full = await fetchEntry(entry.id!);
    if (full) {
      setEditingEntry(full);
      setShowEditor(true);
    }
  };

  const handlePost = async (entry: JournalEntry) => {
    if (entry.is_posted) return;
    const success = await postEntry(entry.id!);
    if (success) loadEntries();
  };

  const handleReverse = async (entry: JournalEntry) => {
    if (!entry.is_posted || entry.is_cancelled) return;
    const reason = prompt('Motivo de la anulación:');
    if (reason) {
      await reverseEntry(entry.id!, reason);
      loadEntries();
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (entry.is_posted) return;
    if (confirm('¿Eliminar este asiento borrador?')) {
      const success = await deleteEntry(entry.id!);
      if (success) loadEntries();
    }
  };

  const handlePostSelected = async () => {
    if (selectedIds.size === 0) return;
    const success = await postMultiple(Array.from(selectedIds));
    if (success) {
      setSelectedIds(new Set());
      setSelectAll(false);
      loadEntries();
    }
  };

  // Nuevo asiento
  const handleNew = () => {
    setEditingEntry(null);
    setShowEditor(true);
  };

  // Cerrar editor
  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingEntry(null);
    loadEntries();
  };

  // Obtener estado visual
  const getStatusBadge = (entry: JournalEntry) => {
    let status = 'draft';
    if (entry.is_cancelled) status = 'cancelled';
    else if (entry.is_posted) status = 'posted';

    const colorClass = ENTRY_STATUS_COLORS[status];
    const label = getEntryStatusLabel(status, countryCode);

    return (
      <Badge variant="outline" className={cn('text-xs', colorClass)}>
        {label}
      </Badge>
    );
  };

  // Formatear número
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Asientos Contables</CardTitle>
            <HelpTooltip 
              content="Registro de asientos de diario según el principio de partida doble."
              regulation={countryCode === 'ES' ? 'pgc' : undefined}
            />
            <Badge variant="secondary" className="ml-2">
              {totalCount} registros
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEntries}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button variant="default" size="sm" onClick={handleNew}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Asiento
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterJournal} onValueChange={setFilterJournal}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Diario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {journals.map(j => (
                <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="draft">{getEntryStatusLabel('draft', countryCode)}</SelectItem>
              <SelectItem value="posted">{getEntryStatusLabel('posted', countryCode)}</SelectItem>
              <SelectItem value="cancelled">{getEntryStatusLabel('cancelled', countryCode)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Acciones en lote */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionados
            </span>
            <Button size="sm" onClick={handlePostSelected}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Contabilizar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectAll(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-28">Número</TableHead>
                <TableHead className="w-24">Fecha</TableHead>
                <TableHead className="w-28">Diario</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-28 text-right">Importe</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron asientos
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      entry.is_cancelled && 'opacity-50 line-through'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(entry.id!)}
                        onCheckedChange={() => toggleSelect(entry.id!)}
                        disabled={entry.is_posted || entry.is_cancelled}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.entry_number || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.journal_name}
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[300px]">
                        {entry.description || entry.reference || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(entry.total_debit)} {currency.symbol}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(entry)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(entry)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          {!entry.is_posted && !entry.is_cancelled && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePost(entry)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Contabilizar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(entry)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                          {entry.is_posted && !entry.is_cancelled && (
                            <DropdownMenuItem onClick={() => handleReverse(entry)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Anular
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      {/* Editor modal */}
      <JournalEntryEditor
        open={showEditor}
        onOpenChange={handleEditorClose}
        editingEntry={editingEntry}
        onSave={() => loadEntries()}
      />
    </Card>
  );
}

export default JournalsList;
