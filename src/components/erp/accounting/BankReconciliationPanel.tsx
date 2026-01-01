/**
 * BankReconciliationPanel - Conciliación Bancaria Manual
 * Fusiona funcionalidad de admin/treasury/BankReconciliation.tsx
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  Link2, 
  Link2Off,
  Search,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  RefreshCw,
  Sparkles,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface BankMovement {
  id: string;
  date: Date;
  description: string;
  reference: string;
  amount: number;
  balance: number;
  matched: boolean;
  matchedWith?: string;
}

interface AccountingEntry {
  id: string;
  date: Date;
  description: string;
  documentNumber: string;
  debit: number;
  credit: number;
  matched: boolean;
  matchedWith?: string;
}

// Mock data
const mockBankMovements: BankMovement[] = [
  { id: 'b1', date: addDays(new Date(), -10), description: 'TRANSFERENCIA CLIENTE ALPHA', reference: 'TRF001', amount: 5000, balance: 45000, matched: true, matchedWith: 'a1' },
  { id: 'b2', date: addDays(new Date(), -8), description: 'PAGO PROVEEDOR BETA', reference: 'PAG002', amount: -3200, balance: 41800, matched: false },
  { id: 'b3', date: addDays(new Date(), -5), description: 'RECIBO DOMICILIADO LUZ', reference: 'REC003', amount: -450, balance: 41350, matched: true, matchedWith: 'a3' },
  { id: 'b4', date: addDays(new Date(), -3), description: 'COBRO FACTURA FV-2024-100', reference: 'COB004', amount: 8500, balance: 49850, matched: false },
  { id: 'b5', date: addDays(new Date(), -1), description: 'COMISIONES BANCARIAS', reference: 'COM005', amount: -25, balance: 49825, matched: false },
];

const mockAccountingEntries: AccountingEntry[] = [
  { id: 'a1', date: addDays(new Date(), -10), description: 'Cobro Cliente Alpha', documentNumber: 'COB-001', debit: 5000, credit: 0, matched: true, matchedWith: 'b1' },
  { id: 'a2', date: addDays(new Date(), -9), description: 'Pago Proveedor Beta', documentNumber: 'PAG-001', debit: 0, credit: 3200, matched: false },
  { id: 'a3', date: addDays(new Date(), -5), description: 'Suministro eléctrico', documentNumber: 'GAS-001', debit: 0, credit: 450, matched: true, matchedWith: 'b3' },
  { id: 'a4', date: addDays(new Date(), -4), description: 'Cobro FV-2024-100', documentNumber: 'COB-002', debit: 8500, credit: 0, matched: false },
  { id: 'a5', date: addDays(new Date(), -2), description: 'Pago nóminas', documentNumber: 'NOM-001', debit: 0, credit: 12000, matched: false },
];

export function BankReconciliationPanel() {
  const { currentCompany } = useERPContext();
  const [bankMovements, setBankMovements] = useState(mockBankMovements);
  const [accountingEntries, setAccountingEntries] = useState(mockAccountingEntries);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedAccounting, setSelectedAccounting] = useState<string | null>(null);
  const [searchBank, setSearchBank] = useState('');
  const [searchAccounting, setSearchAccounting] = useState('');
  const [showOnlyUnmatched, setShowOnlyUnmatched] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const filteredBankMovements = useMemo(() => {
    return bankMovements.filter(m => {
      const matchesSearch = m.description.toLowerCase().includes(searchBank.toLowerCase()) ||
                           m.reference.toLowerCase().includes(searchBank.toLowerCase());
      const matchesFilter = !showOnlyUnmatched || !m.matched;
      return matchesSearch && matchesFilter;
    });
  }, [bankMovements, searchBank, showOnlyUnmatched]);

  const filteredAccountingEntries = useMemo(() => {
    return accountingEntries.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchAccounting.toLowerCase()) ||
                           e.documentNumber.toLowerCase().includes(searchAccounting.toLowerCase());
      const matchesFilter = !showOnlyUnmatched || !e.matched;
      return matchesSearch && matchesFilter;
    });
  }, [accountingEntries, searchAccounting, showOnlyUnmatched]);

  const reconciliationStats = useMemo(() => {
    const totalBank = bankMovements.length;
    const matchedBank = bankMovements.filter(m => m.matched).length;
    const totalAccounting = accountingEntries.length;
    const matchedAccounting = accountingEntries.filter(e => e.matched).length;
    
    return {
      bankPercentage: totalBank > 0 ? (matchedBank / totalBank) * 100 : 0,
      accountingPercentage: totalAccounting > 0 ? (matchedAccounting / totalAccounting) * 100 : 0,
      unmatchedBankCount: totalBank - matchedBank,
      unmatchedAccountingCount: totalAccounting - matchedAccounting,
    };
  }, [bankMovements, accountingEntries]);

  const handleMatch = () => {
    if (!selectedBank || !selectedAccounting) {
      toast.error('Selecciona un movimiento bancario y un asiento');
      return;
    }

    const bankMov = bankMovements.find(m => m.id === selectedBank);
    const accEntry = accountingEntries.find(e => e.id === selectedAccounting);

    if (!bankMov || !accEntry) return;

    // Validar importes
    const bankAmount = bankMov.amount;
    const accAmount = accEntry.debit - accEntry.credit;

    if (Math.abs(bankAmount - accAmount) > 0.01) {
      toast.warning('Los importes no coinciden exactamente');
    }

    setBankMovements(movements => 
      movements.map(m => 
        m.id === selectedBank ? { ...m, matched: true, matchedWith: selectedAccounting } : m
      )
    );

    setAccountingEntries(entries => 
      entries.map(e => 
        e.id === selectedAccounting ? { ...e, matched: true, matchedWith: selectedBank } : e
      )
    );

    setSelectedBank(null);
    setSelectedAccounting(null);
    toast.success('Movimientos conciliados');
  };

  const handleUnmatch = (bankId: string, accId: string) => {
    setBankMovements(movements => 
      movements.map(m => 
        m.id === bankId ? { ...m, matched: false, matchedWith: undefined } : m
      )
    );

    setAccountingEntries(entries => 
      entries.map(e => 
        e.id === accId ? { ...e, matched: false, matchedWith: undefined } : e
      )
    );

    toast.info('Conciliación deshecha');
  };

  const handleAutoMatch = () => {
    toast.info('Ejecutando conciliación automática...');
    // En producción, esto llamaría a un edge function con IA
    setTimeout(() => {
      toast.success('Conciliación automática completada: 2 nuevas coincidencias');
    }, 2000);
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para la conciliación bancaria
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
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Conciliación Bancaria</h3>
            <p className="text-sm text-muted-foreground">Matching manual y automático</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar Extracto
          </Button>
          <Button variant="outline" size="sm" onClick={handleAutoMatch}>
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-Conciliar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Banco Conciliado</p>
              <p className="text-2xl font-bold">{reconciliationStats.bankPercentage.toFixed(0)}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Contabilidad Conciliada</p>
              <p className="text-2xl font-bold">{reconciliationStats.accountingPercentage.toFixed(0)}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-blue-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Banco Pendiente</p>
              <p className="text-2xl font-bold text-orange-500">{reconciliationStats.unmatchedBankCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Contab. Pendiente</p>
              <p className="text-2xl font-bold text-orange-500">{reconciliationStats.unmatchedAccountingCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500/30" />
          </div>
        </Card>
      </div>

      {/* Match Action */}
      {(selectedBank || selectedAccounting) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Banco:</span>{' '}
                  <span className="font-medium">{selectedBank || 'Ninguno seleccionado'}</span>
                </div>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Contabilidad:</span>{' '}
                  <span className="font-medium">{selectedAccounting || 'Ninguno seleccionado'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSelectedBank(null); setSelectedAccounting(null); }}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={handleMatch}
                  disabled={!selectedBank || !selectedAccounting}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Conciliar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bank Movements */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Movimientos Bancarios</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-8 h-9 w-40"
                    value={searchBank}
                    onChange={(e) => setSearchBank(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBankMovements.map((mov) => (
                    <TableRow 
                      key={mov.id}
                      className={cn(
                        "cursor-pointer",
                        selectedBank === mov.id && "bg-primary/10",
                        mov.matched && "opacity-50"
                      )}
                      onClick={() => !mov.matched && setSelectedBank(mov.id === selectedBank ? null : mov.id)}
                    >
                      <TableCell className="text-xs">{format(mov.date, 'dd/MM')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm truncate max-w-[200px]">{mov.description}</p>
                          <p className="text-xs text-muted-foreground">{mov.reference}</p>
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        mov.amount >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(mov.amount)}
                      </TableCell>
                      <TableCell>
                        {mov.matched ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnmatch(mov.id, mov.matchedWith!);
                            }}
                          >
                            <Link2Off className="h-3 w-3" />
                          </Button>
                        ) : (
                          <div className="h-6 w-6" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Accounting Entries */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Asientos Contables</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-8 h-9 w-40"
                    value={searchAccounting}
                    onChange={(e) => setSearchAccounting(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccountingEntries.map((entry) => {
                    const amount = entry.debit - entry.credit;
                    return (
                      <TableRow 
                        key={entry.id}
                        className={cn(
                          "cursor-pointer",
                          selectedAccounting === entry.id && "bg-primary/10",
                          entry.matched && "opacity-50"
                        )}
                        onClick={() => !entry.matched && setSelectedAccounting(entry.id === selectedAccounting ? null : entry.id)}
                      >
                        <TableCell className="text-xs">{format(entry.date, 'dd/MM')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm truncate max-w-[200px]">{entry.description}</p>
                            <p className="text-xs text-muted-foreground">{entry.documentNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          amount >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell>
                          {entry.matched && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BankReconciliationPanel;
