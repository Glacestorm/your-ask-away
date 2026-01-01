/**
 * JournalEntryEditor - Editor de asientos contables
 * Migrado de obelixia-accounting con soporte multi-país
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Save,
  X,
  Plus,
  Trash2,
  CalendarIcon,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { useERPJournalEntries, JournalEntry, JournalEntryLine } from '@/hooks/erp/useERPJournalEntries';
import { HelpTooltip } from './HelpTooltip';
import { cn } from '@/lib/utils';
import { getCountryCurrency } from '@/lib/erp/accounting-dictionaries';

interface JournalEntryEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry?: JournalEntry | null;
  onSave?: (entry: any) => void;
}

interface LineData {
  id?: string;
  tempId: string;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

export function JournalEntryEditor({
  open,
  onOpenChange,
  editingEntry,
  onSave
}: JournalEntryEditorProps) {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts, journals, periods, fetchJournals, fetchPeriods } = useERPAccounting();
  const { createEntry, updateEntry, isLoading } = useERPJournalEntries();

  const countryCode = currentCompany?.country_code || 'ES';
  const currency = getCountryCurrency(countryCode);

  // Form state
  const [journalId, setJournalId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<LineData[]>([]);
  const [showAccountSearch, setShowAccountSearch] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (currentCompany?.id && open) {
      fetchJournals();
      fetchPeriods();
    }
  }, [currentCompany?.id, open, fetchJournals, fetchPeriods]);

  // Inicializar con entrada existente o nueva
  useEffect(() => {
    if (editingEntry) {
      setJournalId(editingEntry.journal_id);
      setPeriodId(editingEntry.period_id);
      setEntryDate(new Date(editingEntry.entry_date));
      setReference(editingEntry.reference || '');
      setDescription(editingEntry.description || '');
      setLines(
        (editingEntry.lines || []).map((line, idx) => ({
          id: line.id,
          tempId: `line-${idx}`,
          account_id: line.account_id,
          account_code: line.account_code || '',
          account_name: line.account_name || '',
          description: line.description || '',
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0
        }))
      );
    } else {
      // Nueva entrada - resetear
      setJournalId(journals[0]?.id || '');
      setPeriodId(periods.find(p => !p.is_closed)?.id || '');
      setEntryDate(new Date());
      setReference('');
      setDescription('');
      setLines([
        { tempId: 'line-1', account_id: '', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
        { tempId: 'line-2', account_id: '', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }
      ]);
    }
  }, [editingEntry, journals, periods, open]);

  // Totales
  const totals = useMemo(() => {
    const debit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
    const credit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
    const diff = Math.abs(debit - credit);
    const isBalanced = diff < 0.01;
    return { debit, credit, diff, isBalanced };
  }, [lines]);

  // Período seleccionado
  const selectedPeriod = periods.find(p => p.id === periodId);
  const isPeriodClosed = selectedPeriod?.is_closed || false;

  // Filtrar cuentas para búsqueda
  const filteredAccounts = useMemo(() => {
    if (!accountSearchTerm) return chartOfAccounts.filter(a => !a.is_header).slice(0, 20);
    const term = accountSearchTerm.toLowerCase();
    return chartOfAccounts
      .filter(a => !a.is_header && (
        a.code?.toLowerCase().includes(term) ||
        a.name?.toLowerCase().includes(term)
      ))
      .slice(0, 20);
  }, [chartOfAccounts, accountSearchTerm]);

  // Añadir línea
  const addLine = () => {
    setLines(prev => [
      ...prev,
      {
        tempId: `line-${Date.now()}`,
        account_id: '',
        account_code: '',
        account_name: '',
        description: '',
        debit_amount: 0,
        credit_amount: 0
      }
    ]);
  };

  // Eliminar línea
  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      return; // Mínimo 2 líneas
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  // Actualizar línea
  const updateLine = (index: number, field: keyof LineData, value: any) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      
      // Si cambia debe, poner haber a 0 y viceversa
      if (field === 'debit_amount' && value > 0) {
        return { ...line, debit_amount: value, credit_amount: 0 };
      }
      if (field === 'credit_amount' && value > 0) {
        return { ...line, credit_amount: value, debit_amount: 0 };
      }
      
      return { ...line, [field]: value };
    }));
  };

  // Seleccionar cuenta
  const selectAccount = (account: any) => {
    if (activeLineIndex === null) return;
    
    setLines(prev => prev.map((line, i) => {
      if (i !== activeLineIndex) return line;
      return {
        ...line,
        account_id: account.id,
        account_code: account.code,
        account_name: account.name
      };
    }));
    
    setShowAccountSearch(false);
    setActiveLineIndex(null);
    setAccountSearchTerm('');
  };

  // Abrir búsqueda de cuenta
  const openAccountSearch = (index: number) => {
    setActiveLineIndex(index);
    setAccountSearchTerm('');
    setShowAccountSearch(true);
  };

  // Guardar
  const handleSave = async () => {
    if (!currentCompany?.id || !journalId || !periodId) {
      return;
    }

    if (!totals.isBalanced) {
      return;
    }

    // Validar que todas las líneas tienen cuenta
    const invalidLines = lines.filter(l => !l.account_id);
    if (invalidLines.length > 0) {
      return;
    }

    const entryData = {
      company_id: currentCompany.id,
      journal_id: journalId,
      period_id: periodId,
      entry_date: format(entryDate, 'yyyy-MM-dd'),
      reference,
      description,
      total_debit: totals.debit,
      total_credit: totals.credit,
      is_balanced: true,
      is_posted: false
    };

    const lineData = lines.map((line, index) => ({
      line_number: index + 1,
      account_id: line.account_id,
      description: line.description,
      debit_amount: line.debit_amount || 0,
      credit_amount: line.credit_amount || 0
    }));

    let result;
    if (editingEntry?.id) {
      result = await updateEntry(editingEntry.id, entryData, lineData);
    } else {
      result = await createEntry(entryData, lineData);
    }

    if (result) {
      onSave?.(result);
      onOpenChange(false);
    }
  };

  // Formatear número
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {editingEntry ? 'Editar Asiento' : 'Nuevo Asiento Contable'}
            <HelpTooltip 
              content="Registro contable de partida doble. Debe y Haber deben cuadrar."
              regulation={countryCode === 'ES' ? 'pgc' : undefined}
            />
          </DialogTitle>
          <DialogDescription>
            {editingEntry 
              ? `Editando asiento ${editingEntry.entry_number || ''}`
              : 'Complete los datos del asiento contable'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabecera */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Diario */}
            <div className="space-y-2">
              <Label>Diario</Label>
              <Select value={journalId} onValueChange={setJournalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {journals.map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Período
                {isPeriodClosed && (
                  <Badge variant="destructive" className="text-xs">
                    Cerrado
                  </Badge>
                )}
              </Label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.id} value={p.id} disabled={p.is_closed}>
                      {p.name} {p.is_closed && '(Cerrado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(entryDate, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={(date) => date && setEntryDate(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Nº factura, etc."
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Concepto</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del asiento..."
              rows={2}
            />
          </div>

          {/* Líneas */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Líneas del Asiento</CardTitle>
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Línea
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Cuenta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-32 text-right">Debe</TableHead>
                    <TableHead className="w-32 text-right">Haber</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={line.tempId}>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start font-mono text-xs"
                          onClick={() => openAccountSearch(index)}
                        >
                          {line.account_code || 'Seleccionar...'}
                        </Button>
                        {line.account_name && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {line.account_name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Concepto línea..."
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit_amount || ''}
                          onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right font-mono"
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit_amount || ''}
                          onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right font-mono"
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Fila de totales */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2} className="text-right">
                      TOTALES
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.debit)} {currency.symbol}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.credit)} {currency.symbol}
                    </TableCell>
                    <TableCell>
                      {totals.isBalanced ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Indicador de cuadre */}
          {!totals.isBalanced && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>
                Descuadre de {formatNumber(totals.diff)} {currency.symbol}
              </span>
            </div>
          )}

          {/* Período cerrado warning */}
          {isPeriodClosed && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>
                El período seleccionado está cerrado. No se pueden crear ni modificar asientos.
              </span>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !totals.isBalanced || isPeriodClosed || !journalId || !periodId}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingEntry ? 'Guardar Cambios' : 'Crear Asiento'}
            </Button>
          </div>
        </div>

        {/* Dialog búsqueda de cuenta */}
        <Dialog open={showAccountSearch} onOpenChange={setShowAccountSearch}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar Cuenta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Buscar por código o nombre..."
                value={accountSearchTerm}
                onChange={(e) => setAccountSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredAccounts.map(account => (
                  <Button
                    key={account.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => selectAccount(account)}
                  >
                    <span className="font-mono text-sm mr-2">{account.code}</span>
                    <span className="truncate">{account.name}</span>
                  </Button>
                ))}
                {filteredAccounts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No se encontraron cuentas
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

export default JournalEntryEditor;
