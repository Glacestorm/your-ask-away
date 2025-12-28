/**
 * Partner Manager
 * Gestión de socios y cuenta corriente
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react';
import { useObelixiaPartners, Partner, PartnerTransaction } from '@/hooks/admin/obelixia-accounting';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function PartnerManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  const { 
    partners, 
    transactions,
    isLoading, 
    fetchPartners,
    fetchTransactions
  } = useObelixiaPartners();

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchTransactions(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'capital_contribution': 'Aportación de capital',
      'loan_to_company': 'Préstamo a la sociedad',
      'loan_repayment': 'Devolución préstamo',
      'dividend': 'Dividendo',
      'withdrawal': 'Retirada',
      'salary': 'Retribución',
      'expense_reimbursement': 'Reembolso gastos'
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (type: string, direction: 'in' | 'out') => {
    if (direction === 'in') {
      return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  // Calcular totales
  const totalCapital = partners.reduce((sum, p) => sum + ((p as any).capital_amount || 0), 0);
  const totalBalance = partners.reduce((sum, p) => sum + (p.current_account_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestión de Socios
          </h2>
          <p className="text-sm text-muted-foreground">
            Administra participaciones, cuentas corrientes y distribución de beneficios
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Socio
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Socios</span>
            </div>
            <p className="text-2xl font-bold">{partners.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Capital Social</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCapital)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cuenta Corriente</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Participación Media</span>
            </div>
            <p className="text-2xl font-bold">
              {partners.length ? (100 / partners.length).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Socios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-2">
                {partners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      selectedPartnerId === partner.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {partner.partner_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{partner.partner_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {partner.ownership_percentage}% participación
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency((partner as any).capital_amount || 0)}</p>
                      <Badge 
                        variant={(partner as any).is_active !== false ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {(partner as any).is_active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedPartnerId 
                ? `Detalle: ${partners.find(p => p.id === selectedPartnerId)?.partner_name}`
                : 'Selecciona un socio'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPartnerId ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="transactions">Movimientos</TabsTrigger>
                  <TabsTrigger value="distribution">Distribución</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {(() => {
                    const partner = partners.find(p => p.id === selectedPartnerId);
                    if (!partner) return null;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Capital Aportado</p>
                            <p className="text-xl font-bold">{formatCurrency((partner as any).capital_amount || 0)}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Cuenta Corriente</p>
                            <p className={cn(
                              "text-xl font-bold",
                              (partner.current_account_balance || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {formatCurrency(partner.current_account_balance || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Participación</span>
                              <span className="font-medium">{partner.ownership_percentage}%</span>
                            </div>
                            <Progress value={partner.ownership_percentage} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">NIF/NIE:</span>
                              <span className="ml-2 font-medium">{(partner as any).tax_id || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <span className="ml-2 font-medium">{partner.email || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Alta:</span>
                              <span className="ml-2 font-medium">
                                {(partner as any).join_date 
                                  ? format(new Date((partner as any).join_date), 'dd/MM/yyyy')
                                  : '-'
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <Badge variant={(partner as any).is_active !== false ? "default" : "secondary"} className="ml-2">
                                {(partner as any).is_active !== false ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Importe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm">
                              {format(new Date(tx.transaction_date), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(tx.transaction_type, tx.amount >= 0 ? 'in' : 'out')}
                                <span className="text-sm">{getTransactionTypeLabel(tx.transaction_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-mono",
                              tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              No hay movimientos registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Nuevo Movimiento
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="distribution" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Módulo de distribución de beneficios</p>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona un socio para ver su detalle</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PartnerManager;
