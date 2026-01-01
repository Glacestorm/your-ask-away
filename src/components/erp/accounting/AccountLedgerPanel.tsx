/**
 * AccountLedgerPanel - Mayor por Cuenta
 * Visualización de movimientos por cuenta contable
 */

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileSpreadsheet, 
  RefreshCw,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting, ChartOfAccount } from '@/hooks/erp/useERPAccounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LedgerEntry {
  id: string;
  date: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  journalType: string;
}

export function AccountLedgerPanel() {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts, isLoading, fetchChartOfAccounts } = useERPAccounting();
  
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Filtrar cuentas por búsqueda
  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return chartOfAccounts;
    const term = searchTerm.toLowerCase();
    return chartOfAccounts.filter(acc => 
      acc.account_code.toLowerCase().includes(term) ||
      acc.account_name.toLowerCase().includes(term)
    );
  }, [chartOfAccounts, searchTerm]);

  // Mock ledger entries for selected account
  const mockLedgerEntries: LedgerEntry[] = useMemo(() => {
    if (!selectedAccount) return [];
    
    // Simulated data
    return [
      { id: '1', date: '2024-01-15', entryNumber: 'AS-001', description: 'Apertura ejercicio', debit: 50000, credit: 0, balance: 50000, journalType: 'general' },
      { id: '2', date: '2024-01-20', entryNumber: 'VE-015', description: 'Venta cliente ABC', debit: 0, credit: 12000, balance: 38000, journalType: 'ventas' },
      { id: '3', date: '2024-02-05', entryNumber: 'CO-008', description: 'Compra material', debit: 8500, credit: 0, balance: 46500, journalType: 'compras' },
      { id: '4', date: '2024-02-15', entryNumber: 'BA-012', description: 'Movimiento bancario', debit: 0, credit: 5000, balance: 41500, journalType: 'banco' },
      { id: '5', date: '2024-03-01', entryNumber: 'VE-028', description: 'Venta cliente XYZ', debit: 0, credit: 18000, balance: 23500, journalType: 'ventas' },
    ];
  }, [selectedAccount]);

  const totals = useMemo(() => {
    return mockLedgerEntries.reduce(
      (acc, entry) => ({
        debit: acc.debit + entry.debit,
        credit: acc.credit + entry.credit
      }),
      { debit: 0, credit: 0 }
    );
  }, [mockLedgerEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedAccountData = chartOfAccounts.find(a => a.id === selectedAccount);

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver el mayor contable
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Mayor por Cuenta</h3>
            <p className="text-sm text-muted-foreground">
              Movimientos y saldos por cuenta contable
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchChartOfAccounts()}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Account Selection */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Cuenta contable</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchTerm && filteredAccounts.length > 0 && (
                <ScrollArea className="h-48 border rounded-md mt-1">
                  {filteredAccounts.slice(0, 20).map((account) => (
                    <div
                      key={account.id}
                      className={cn(
                        "p-2 cursor-pointer hover:bg-muted/50 flex items-center gap-2",
                        selectedAccount === account.id && "bg-muted"
                      )}
                      onClick={() => {
                        setSelectedAccount(account.id);
                        setSearchTerm('');
                      }}
                    >
                      <span className="font-mono text-sm">{account.account_code}</span>
                      <span className="text-sm">{account.account_name}</span>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Desde</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Hasta</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Account Info */}
      {selectedAccountData && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cuenta</p>
                  <p className="font-mono font-bold text-lg">{selectedAccountData.account_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{selectedAccountData.account_name}</p>
                </div>
                <Badge variant="outline">{selectedAccountData.account_type}</Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo actual</p>
                <p className="font-mono font-bold text-xl">
                  {formatCurrency(mockLedgerEntries[mockLedgerEntries.length - 1]?.balance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Movimientos</span>
            {selectedAccount && (
              <Badge variant="secondary">{mockLedgerEntries.length} registros</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Fecha</TableHead>
                  <TableHead className="w-24">Asiento</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="w-20">Diario</TableHead>
                  <TableHead className="text-right w-28">Debe</TableHead>
                  <TableHead className="text-right w-28">Haber</TableHead>
                  <TableHead className="text-right w-32">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedAccount ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Selecciona una cuenta para ver sus movimientos
                    </TableCell>
                  </TableRow>
                ) : mockLedgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay movimientos para esta cuenta
                    </TableCell>
                  </TableRow>
                ) : (
                  mockLedgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{entry.entryNumber}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.journalType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Totals */}
          {selectedAccount && mockLedgerEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Debe</p>
                  <p className="font-mono font-bold">{formatCurrency(totals.debit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Haber</p>
                  <p className="font-mono font-bold">{formatCurrency(totals.credit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo Final</p>
                  <p className="font-mono font-bold text-lg">
                    {formatCurrency(totals.debit - totals.credit)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountLedgerPanel;
