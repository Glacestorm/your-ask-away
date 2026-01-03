/**
 * AccountingEntriesPreview - Preview y edición de partidas contables afectadas
 * Para operaciones de comercio exterior (descuento, factoring)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Save,
  X
} from 'lucide-react';
import { useERPAutoAccounting, JournalEntryLine, GeneratedJournalEntry } from '@/hooks/erp/useERPAutoAccounting';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface AccountingEntry {
  id?: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
  isNew?: boolean;
  isEdited?: boolean;
}

interface AccountingEntriesPreviewProps {
  operationType: 'discount' | 'factoring' | 'confirming';
  operationData?: {
    amount?: number;
    interestAmount?: number;
    commissionAmount?: number;
    expenses?: number;
    netAmount?: number;
    currency?: string;
  };
  entries?: AccountingEntry[];
  onEntriesChange?: (entries: AccountingEntry[]) => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  className?: string;
  readOnly?: boolean;
}

export function AccountingEntriesPreview({
  operationType,
  operationData,
  entries: externalEntries,
  onEntriesChange,
  isExpanded: controlledExpanded,
  onExpandChange,
  className,
  readOnly = false
}: AccountingEntriesPreviewProps) {
  const { currentCompany } = useERPContext();
  const { generateEntry, getTemplate, templates, isLoading: isLoadingAccounting } = useERPAutoAccounting();
  const { chartOfAccounts, fetchChartOfAccounts, isLoading: isLoadingAccounts } = useERPAccounting();

  const [internalExpanded, setInternalExpanded] = useState(false);
  const [entries, setEntries] = useState<AccountingEntry[]>(externalEntries || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    debit: 0,
    credit: 0,
    description: ''
  });

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = onExpandChange || setInternalExpanded;

  const countryCode = currentCompany?.country?.substring(0, 2).toUpperCase() || 'ES';
  const currency = operationData?.currency || 'EUR';

  // Cargar plan de cuentas
  useEffect(() => {
    if (currentCompany?.id && isExpanded) {
      fetchChartOfAccounts();
    }
  }, [currentCompany?.id, isExpanded, fetchChartOfAccounts]);

  // Sync external entries
  useEffect(() => {
    if (externalEntries) {
      setEntries(externalEntries);
    }
  }, [externalEntries]);

  // Notify parent of changes
  useEffect(() => {
    if (onEntriesChange && entries !== externalEntries) {
      onEntriesChange(entries);
    }
  }, [entries, onEntriesChange, externalEntries]);

  // Cuentas filtradas para búsqueda
  const filteredAccounts = useMemo(() => {
    if (!accountSearchTerm) return chartOfAccounts.filter(a => a.accepts_entries !== false).slice(0, 15);
    const term = accountSearchTerm.toLowerCase();
    return chartOfAccounts
      .filter(a => a.accepts_entries !== false && (
        a.account_code?.toLowerCase().includes(term) ||
        a.account_name?.toLowerCase().includes(term)
      ))
      .slice(0, 15);
  }, [chartOfAccounts, accountSearchTerm]);

  // Totales
  const totals = useMemo(() => {
    const debit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const credit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const diff = Math.abs(debit - credit);
    const isBalanced = diff < 0.01;
    return { debit, credit, diff, isBalanced };
  }, [entries]);

  // Mapeo de tipos de operación
  const getOperationConfig = () => {
    switch (operationType) {
      case 'discount':
        return {
          title: 'Descuento Comercial',
          category: 'trade_finance',
          type: 'commercial_discount',
          transactionType: 'discount'
        };
      case 'factoring':
        return {
          title: 'Factoring',
          category: 'trade_finance',
          type: 'factoring',
          transactionType: 'advance'
        };
      case 'confirming':
        return {
          title: 'Confirming',
          category: 'trade_finance',
          type: 'confirming',
          transactionType: 'payment'
        };
      default:
        return {
          title: 'Operación',
          category: 'trade_finance',
          type: 'other',
          transactionType: 'other'
        };
    }
  };

  const operationConfig = getOperationConfig();

  // Generar asientos automáticamente
  const handleGenerateEntries = useCallback(async () => {
    if (!operationData?.amount) {
      toast.error('No hay datos de operación para generar asientos');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateEntry(
        operationConfig.category,
        operationConfig.type,
        operationConfig.transactionType,
        {
          amount: operationData.amount,
          interest_amount: operationData.interestAmount || 0,
          commission_amount: operationData.commissionAmount || 0,
          expenses: operationData.expenses || 0,
          net_amount: operationData.netAmount || 0,
          currency: operationData.currency || 'EUR'
        }
      );

      if (result?.entry?.lines) {
        const newEntries: AccountingEntry[] = result.entry.lines.map((line: JournalEntryLine) => ({
          account_code: line.account_code,
          account_name: line.account_name,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
          isNew: false,
          isEdited: false
        }));
        setEntries(newEntries);
        toast.success('Asientos generados correctamente');
      } else {
        // Si no hay template, generar asientos por defecto
        const defaultEntries = generateDefaultEntries();
        setEntries(defaultEntries);
        toast.info('Asientos generados con plantilla predeterminada');
      }
    } catch (error) {
      console.error('Error generating entries:', error);
      const defaultEntries = generateDefaultEntries();
      setEntries(defaultEntries);
      toast.info('Usando plantilla de asientos predeterminada');
    } finally {
      setIsGenerating(false);
    }
  }, [operationData, generateEntry, operationConfig]);

  // Generar asientos por defecto según tipo de operación
  const generateDefaultEntries = useCallback((): AccountingEntry[] => {
    const amount = operationData?.amount || 0;
    const interest = operationData?.interestAmount || 0;
    const commission = operationData?.commissionAmount || 0;
    const expenses = operationData?.expenses || 0;
    const netAmount = operationData?.netAmount || (amount - interest - commission - expenses);

    switch (operationType) {
      case 'discount':
        return [
          { account_code: '5208', account_name: 'Deudas por efectos descontados', debit: 0, credit: amount, description: 'Efectos descontados' },
          { account_code: '572', account_name: 'Bancos c/c', debit: netAmount, credit: 0, description: 'Ingreso neto' },
          { account_code: '6651', account_name: 'Intereses de descuento', debit: interest, credit: 0, description: 'Intereses' },
          { account_code: '6269', account_name: 'Comisiones bancarias', debit: commission + expenses, credit: 0, description: 'Gastos y comisiones' },
        ].filter(e => e.debit > 0 || e.credit > 0);
      
      case 'factoring':
        return [
          { account_code: '4310', account_name: 'Efectos a cobrar - Factoring', debit: 0, credit: amount, description: 'Cesión facturas' },
          { account_code: '572', account_name: 'Bancos c/c', debit: netAmount, credit: 0, description: 'Anticipo recibido' },
          { account_code: '6655', account_name: 'Intereses de factoring', debit: interest, credit: 0, description: 'Coste financiero' },
          { account_code: '6269', account_name: 'Comisiones factoring', debit: commission + expenses, credit: 0, description: 'Comisiones' },
        ].filter(e => e.debit > 0 || e.credit > 0);

      case 'confirming':
        return [
          { account_code: '4000', account_name: 'Proveedores', debit: amount, credit: 0, description: 'Pago a proveedor' },
          { account_code: '5201', account_name: 'Deudas por confirming', debit: 0, credit: amount, description: 'Deuda confirming' },
        ];

      default:
        return [];
    }
  }, [operationData, operationType]);

  // Añadir nueva partida
  const handleAddEntry = () => {
    setEditingEntry(null);
    setEditingIndex(null);
    setFormData({
      account_code: '',
      account_name: '',
      debit: 0,
      credit: 0,
      description: ''
    });
    setShowAddDialog(true);
  };

  // Editar partida existente
  const handleEditEntry = (entry: AccountingEntry, index: number) => {
    setEditingEntry(entry);
    setEditingIndex(index);
    setFormData({
      account_code: entry.account_code,
      account_name: entry.account_name,
      debit: entry.debit,
      credit: entry.credit,
      description: entry.description || ''
    });
    setShowAddDialog(true);
  };

  // Eliminar partida
  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
    toast.success('Partida eliminada');
  };

  // Seleccionar cuenta
  const handleSelectAccount = (account: any) => {
    setFormData(prev => ({
      ...prev,
      account_code: account.account_code,
      account_name: account.account_name
    }));
    setShowAccountSelector(false);
    setAccountSearchTerm('');
  };

  // Guardar partida (nueva o editada)
  const handleSaveEntry = () => {
    if (!formData.account_code) {
      toast.error('Debe seleccionar una cuenta');
      return;
    }

    if (formData.debit === 0 && formData.credit === 0) {
      toast.error('Debe indicar un importe en Debe o Haber');
      return;
    }

    const newEntry: AccountingEntry = {
      ...formData,
      isNew: editingIndex === null,
      isEdited: editingIndex !== null
    };

    if (editingIndex !== null) {
      // Actualizar existente
      setEntries(prev => prev.map((e, i) => i === editingIndex ? newEntry : e));
      toast.success('Partida actualizada');
    } else {
      // Añadir nueva
      setEntries(prev => [...prev, newEntry]);
      toast.success('Partida añadida');
    }

    setShowAddDialog(false);
    setEditingEntry(null);
    setEditingIndex(null);
  };

  // Formatear número
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  return (
    <>
      <Card className={cn('border-dashed', className)}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <BookOpen className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    Partidas Contables Afectadas
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {entries.length} líneas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totals.isBalanced ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cuadrado
                    </Badge>
                  ) : entries.length > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Descuadre: {formatNumber(totals.diff)} {getCurrencySymbol()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Acciones */}
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateEntries}
                    disabled={isGenerating || !operationData?.amount}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Generar Automático
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddEntry}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Partida
                  </Button>
                </div>
              )}

              {/* Tabla de partidas */}
              {entries.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Cuenta</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Debe</TableHead>
                        <TableHead className="w-28 text-right">Haber</TableHead>
                        {!readOnly && <TableHead className="w-20"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry, index) => (
                        <TableRow 
                          key={index}
                          className={cn(
                            entry.isNew && 'bg-green-50/50',
                            entry.isEdited && 'bg-yellow-50/50'
                          )}
                        >
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-1">
                              {entry.account_code}
                              {entry.isNew && (
                                <Badge variant="outline" className="text-xs text-green-600">Nuevo</Badge>
                              )}
                              {entry.isEdited && (
                                <Badge variant="outline" className="text-xs text-yellow-600">Editado</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.account_name}
                            {entry.description && (
                              <p className="text-xs text-muted-foreground">{entry.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.debit > 0 && (
                              <span className="text-blue-600">{formatNumber(entry.debit)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.credit > 0 && (
                              <span className="text-green-600">{formatNumber(entry.credit)}</span>
                            )}
                          </TableCell>
                          {!readOnly && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditEntry(entry, index)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteEntry(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}

                      {/* Fila de totales */}
                      <TableRow className="bg-muted/50 font-semibold border-t-2">
                        <TableCell colSpan={2} className="text-right">
                          TOTALES
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(totals.debit)} {getCurrencySymbol()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(totals.credit)} {getCurrencySymbol()}
                        </TableCell>
                        {!readOnly && (
                          <TableCell>
                            {totals.isBalanced ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay partidas contables definidas</p>
                  {!readOnly && (
                    <p className="text-xs mt-1">
                      Use "Generar Automático" para crear las partidas según la configuración
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Dialog para añadir/editar partida */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Editar Partida Contable' : 'Nueva Partida Contable'}
            </DialogTitle>
            <DialogDescription>
              {editingIndex !== null 
                ? 'Modifique los datos de la partida contable'
                : 'Añada una nueva línea al asiento contable'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selector de cuenta */}
            <div className="space-y-2">
              <Label>Cuenta Contable *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-mono"
                    onClick={() => setShowAccountSelector(!showAccountSelector)}
                  >
                    {formData.account_code ? (
                      <span>{formData.account_code} - {formData.account_name}</span>
                    ) : (
                      <span className="text-muted-foreground">Seleccionar cuenta...</span>
                    )}
                  </Button>
                </div>
              </div>

              {showAccountSelector && (
                <Card className="mt-2">
                  <CardContent className="p-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={accountSearchTerm}
                        onChange={(e) => setAccountSearchTerm(e.target.value)}
                        placeholder="Buscar por código o nombre..."
                        className="pl-8"
                      />
                    </div>
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-1">
                        {filteredAccounts.map((account) => (
                          <Button
                            key={account.id}
                            variant="ghost"
                            className="w-full justify-start text-sm h-auto py-2"
                            onClick={() => handleSelectAccount(account)}
                          >
                            <span className="font-mono text-primary mr-2">{account.account_code}</span>
                            <span className="truncate">{account.account_name}</span>
                          </Button>
                        ))}
                        {filteredAccounts.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No se encontraron cuentas
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Importes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debit">Debe ({getCurrencySymbol()})</Label>
                <Input
                  id="debit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.debit || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      debit: value,
                      credit: value > 0 ? 0 : prev.credit
                    }));
                  }}
                  className="font-mono"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit">Haber ({getCurrencySymbol()})</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credit || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      credit: value,
                      debit: value > 0 ? 0 : prev.debit
                    }));
                  }}
                  className="font-mono"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Concepto (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la línea..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEntry}>
              <Save className="h-4 w-4 mr-1" />
              {editingIndex !== null ? 'Actualizar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AccountingEntriesPreview;
