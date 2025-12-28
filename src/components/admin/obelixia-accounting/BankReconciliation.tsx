/**
 * Bank Reconciliation
 * Conciliación bancaria con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Upload,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Link2,
  Unlink,
  RefreshCw,
  FileUp,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useObelixiaBanking, BankAccount, BankTransaction } from '@/hooks/admin/obelixia-accounting';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function BankReconciliation() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  
  const { 
    bankAccounts, 
    transactions,
    isLoading, 
    fetchBankAccounts,
    fetchTransactions,
    autoReconcile
  } = useObelixiaBanking();

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId]);

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchTerm || 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx as any).reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = (tx as any).reconciliation_status || 'pending';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleTransactionSelection = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleAutoReconcile = async () => {
    if (selectedAccountId) {
      await autoReconcile(selectedAccountId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conciliado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'unmatched':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Sin coincidencia
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Estadísticas
  const stats = {
    total: transactions.length,
    reconciled: transactions.filter(t => (t as any).reconciliation_status === 'reconciled').length,
    pending: transactions.filter(t => (t as any).reconciliation_status === 'pending' || !(t as any).reconciliation_status).length,
    unmatched: transactions.filter(t => (t as any).reconciliation_status === 'unmatched').length
  };

  const reconciliationProgress = stats.total > 0 
    ? (stats.reconciled / stats.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Conciliación Bancaria
          </h2>
          <p className="text-sm text-muted-foreground">
            Concilia movimientos bancarios con asientos contables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileUp className="h-4 w-4 mr-2" />
            Importar OFX/CSV
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Bank Account Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {bankAccounts.map((account) => (
          <Card 
            key={account.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedAccountId === account.id 
                ? "ring-2 ring-primary" 
                : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedAccountId(account.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{account.bank_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ****{account.account_number?.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-lg font-bold">
                  {formatCurrency(account.current_balance || 0, account.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Última sync: {(account as any).last_sync_at 
                    ? format(new Date((account as any).last_sync_at), 'dd/MM HH:mm')
                    : 'Nunca'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {bankAccounts.length === 0 && (
          <Card className="col-span-4 border-dashed">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay cuentas bancarias configuradas</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Cuenta Bancaria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedAccountId && (
        <>
          {/* Reconciliation Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Progreso de Conciliación</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.reconciled} de {stats.total} movimientos conciliados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAutoReconcile}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Auto-conciliar con IA
                  </Button>
                  <Button variant="outline" size="sm" disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                    Sincronizar
                  </Button>
                </div>
              </div>
              <Progress value={reconciliationProgress} className="h-2" />
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Conciliados: {stats.reconciled}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Pendientes: {stats.pending}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Sin coincidencia: {stats.unmatched}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Movimientos Bancarios</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="reconciled">Conciliados</SelectItem>
                      <SelectItem value="unmatched">Sin coincidencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
                            } else {
                              setSelectedTransactions(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className={cn(
                        selectedTransactions.has(tx.id) && "bg-muted/50"
                      )}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTransactions.has(tx.id)}
                            onCheckedChange={() => toggleTransactionSelection(tx.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(tx.transaction_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.amount >= 0 ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm truncate max-w-[200px]">
                              {tx.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {tx.reference || '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge((tx as any).reconciliation_status || 'pending')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {((tx as any).reconciliation_status || 'pending') === 'pending' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                            {(tx as any).reconciliation_status === 'reconciled' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Unlink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay movimientos que coincidan con los filtros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default BankReconciliation;
