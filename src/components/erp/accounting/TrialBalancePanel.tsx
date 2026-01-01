/**
 * TrialBalancePanel - Balance de Sumas y Saldos
 * Visualización del balance de comprobación
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Scale, 
  Download, 
  FileSpreadsheet, 
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting, ChartOfAccount } from '@/hooks/erp/useERPAccounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitSum: number;
  creditSum: number;
  debitBalance: number;
  creditBalance: number;
}

export function TrialBalancePanel() {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts, isLoading, fetchChartOfAccounts } = useERPAccounting();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Generate trial balance from chart of accounts
  const trialBalanceData: TrialBalanceRow[] = useMemo(() => {
    return chartOfAccounts
      .filter(acc => acc.accepts_entries !== false)
      .map(acc => {
        // Mock sums - in real implementation this would come from journal entries
        const debitSum = Math.random() * 50000;
        const creditSum = Math.random() * 50000;
        const balance = debitSum - creditSum;
        
        return {
          accountCode: acc.account_code,
          accountName: acc.account_name,
          accountType: acc.account_type,
          debitSum: debitSum,
          creditSum: creditSum,
          debitBalance: balance > 0 ? balance : 0,
          creditBalance: balance < 0 ? Math.abs(balance) : 0,
        };
      });
  }, [chartOfAccounts]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = trialBalanceData;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(row => 
        row.accountCode.toLowerCase().includes(term) ||
        row.accountName.toLowerCase().includes(term)
      );
    }
    
    if (selectedLevel !== 'all') {
      const level = parseInt(selectedLevel);
      data = data.filter(row => row.accountCode.length === level);
    }
    
    return data;
  }, [trialBalanceData, searchTerm, selectedLevel]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => ({
        debitSum: acc.debitSum + row.debitSum,
        creditSum: acc.creditSum + row.creditSum,
        debitBalance: acc.debitBalance + row.debitBalance,
        creditBalance: acc.creditBalance + row.creditBalance,
      }),
      { debitSum: 0, creditSum: 0, debitBalance: 0, creditBalance: 0 }
    );
  }, [filteredData]);

  const isBalanced = Math.abs(totals.debitSum - totals.creditSum) < 0.01 &&
                     Math.abs(totals.debitBalance - totals.creditBalance) < 0.01;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver el balance de sumas y saldos
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
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Balance de Sumas y Saldos</h3>
            <p className="text-sm text-muted-foreground">
              Balance de comprobación
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

      {/* Balance Status */}
      <Card className={cn(
        "border-l-4",
        isBalanced ? "border-l-green-500" : "border-l-destructive"
      )}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">Cuadrado</Badge>
                  <span className="text-sm text-muted-foreground">
                    Sumas y saldos equilibrados
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <Badge variant="destructive">Descuadre</Badge>
                  <span className="text-sm text-destructive">
                    Diferencia detectada en el balance
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Buscar cuenta</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Código o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nivel</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Grupo (1 dígito)</SelectItem>
                  <SelectItem value="2">Subgrupo (2 dígitos)</SelectItem>
                  <SelectItem value="3">Cuenta (3 dígitos)</SelectItem>
                  <SelectItem value="4">Subcuenta (4 dígitos)</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Trial Balance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Balance de Comprobación</span>
            <Badge variant="secondary">{filteredData.length} cuentas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-center" colSpan={2}>SUMAS</TableHead>
                  <TableHead className="text-center" colSpan={2}>SALDOS</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right">Deudor</TableHead>
                  <TableHead className="text-right">Acreedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay cuentas con movimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => (
                    <TableRow key={row.accountCode} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">
                        {row.accountCode}
                      </TableCell>
                      <TableCell>{row.accountName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.debitSum > 0 ? formatCurrency(row.debitSum) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.creditSum > 0 ? formatCurrency(row.creditSum) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t bg-muted/30 rounded-lg p-4">
            <Table>
              <TableBody>
                <TableRow className="font-bold border-0">
                  <TableCell className="w-24"></TableCell>
                  <TableCell>TOTALES</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.debitSum)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.creditSum)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.debitBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.creditBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TrialBalancePanel;
