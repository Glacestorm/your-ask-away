/**
 * Journal Entry Editor
 * Editor de asientos contables con validación de cuadre
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  TableFooter,
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  Save,
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowRightLeft
} from 'lucide-react';
import { useObelixiaAccounting, JournalEntryLine, ChartAccount } from '@/hooks/admin/obelixia-accounting';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export function JournalEntryEditor() {
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([
    { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
    { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
  ]);

  const { 
    accounts: chartOfAccounts, 
    isLoading, 
    fetchAccounts,
    createEntry
  } = useObelixiaAccounting();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const createJournalEntry = createEntry;

  // Calcular totales
  const totals = useMemo(() => {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;
    return { totalDebit, totalCredit, difference, isBalanced };
  }, [lines]);

  const addLine = () => {
    setLines([
      ...lines,
      { 
        id: Date.now().toString(), 
        accountId: '', 
        accountCode: '', 
        accountName: '', 
        debit: 0, 
        credit: 0, 
        description: '' 
      }
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof EntryLine, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        
        // Si se selecciona una cuenta, actualizar código y nombre
        if (field === 'accountId' && value) {
          const account = chartOfAccounts.find(acc => acc.id === value);
          if (account) {
            updated.accountCode = account.account_code;
            updated.accountName = account.account_name;
          }
        }
        
        // Si se ingresa debe, limpiar haber y viceversa
        if (field === 'debit' && Number(value) > 0) {
          updated.credit = 0;
        } else if (field === 'credit' && Number(value) > 0) {
          updated.debit = 0;
        }
        
        return updated;
      }
      return line;
    }));
  };

  const handleSave = async () => {
    if (!totals.isBalanced) {
      toast.error('El asiento no está cuadrado');
      return;
    }

    if (!description.trim()) {
      toast.error('Ingresa una descripción para el asiento');
      return;
    }

    const validLines = lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));
    if (validLines.length < 2) {
      toast.error('El asiento debe tener al menos 2 líneas');
      return;
    }

    const entryLines: JournalEntryLine[] = validLines.map((line) => ({
      account_code: line.accountCode,
      debit_amount: line.debit,
      credit_amount: line.credit,
      description: line.description || description
    }));

    const result = await createJournalEntry(
      format(entryDate, 'yyyy-MM-dd'),
      description,
      entryLines,
      { sourceDocument: reference || undefined }
    );
    if (result) {
      toast.success('Asiento guardado correctamente');
      // Reset form
      setDescription('');
      setReference('');
      setLines([
        { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
        { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      ]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Nuevo Asiento Contable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header del asiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !entryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {entryDate ? format(entryDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={entryDate}
                  onSelect={(date) => date && setEntryDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Referencia</Label>
            <Input
              placeholder="Ej: FAC-2024-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex items-center gap-2 h-10">
              {totals.isBalanced ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Cuadrado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Descuadre: {formatCurrency(totals.difference)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Concepto / Descripción</Label>
          <Textarea
            placeholder="Describe el motivo del asiento..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Líneas del asiento */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Cuenta</TableHead>
                <TableHead>Descripción línea</TableHead>
                <TableHead className="w-[140px] text-right">Debe</TableHead>
                <TableHead className="w-[140px] text-right">Haber</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Select
                      value={line.accountId}
                      onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar cuenta">
                          {line.accountCode && (
                            <span className="font-mono">{line.accountCode}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {chartOfAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <span className="font-mono mr-2">{account.account_code}</span>
                            <span className="text-muted-foreground">{account.account_name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Descripción..."
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                      className="h-9 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                      className="h-9 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="text-right font-medium">
                  Totales
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(totals.totalDebit)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(totals.totalCredit)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <Button variant="outline" onClick={addLine} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Añadir línea
        </Button>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRightLeft className="h-4 w-4" />
          Diferencia: {formatCurrency(totals.difference)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={!totals.isBalanced || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Asiento
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default JournalEntryEditor;
