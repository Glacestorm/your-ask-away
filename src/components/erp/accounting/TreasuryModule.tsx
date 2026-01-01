/**
 * TreasuryModule - Módulo Completo de Tesorería
 * Fusiona funcionalidad de admin/treasury/*
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  RefreshCw,
  Plus,
  Download,
  Eye
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BankAccount {
  id: string;
  name: string;
  iban: string;
  balance: number;
  availableBalance: number;
  currency: string;
  bank: string;
  lastSync: Date;
}

interface CashFlowProjection {
  date: string;
  inflows: number;
  outflows: number;
  balance: number;
}

// Mock data
const mockBankAccounts: BankAccount[] = [
  { id: '1', name: 'Cuenta Principal', iban: 'ES91 2100 0418 4502 0005 1332', balance: 125000, availableBalance: 120000, currency: 'EUR', bank: 'CaixaBank', lastSync: new Date() },
  { id: '2', name: 'Cuenta Nóminas', iban: 'ES23 0182 2370 4200 1566 4444', balance: 45000, availableBalance: 45000, currency: 'EUR', bank: 'BBVA', lastSync: addDays(new Date(), -1) },
  { id: '3', name: 'Cuenta Ahorro', iban: 'ES45 0049 1234 5612 3456 7890', balance: 250000, availableBalance: 250000, currency: 'EUR', bank: 'Santander', lastSync: addDays(new Date(), -2) },
];

const generateCashFlowProjection = (): CashFlowProjection[] => {
  const start = startOfMonth(new Date());
  const end = endOfMonth(addDays(new Date(), 60));
  const days = eachDayOfInterval({ start, end });
  
  let balance = 420000;
  
  return days.map(day => {
    const inflows = Math.random() * 15000 + 5000;
    const outflows = Math.random() * 12000 + 3000;
    balance = balance + inflows - outflows;
    
    return {
      date: format(day, 'dd/MM'),
      inflows,
      outflows,
      balance
    };
  });
};

export function TreasuryModule() {
  const { selectedCompany } = useERPContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [cashFlowData] = useState(generateCashFlowProjection);

  const totalBalance = useMemo(() => {
    return mockBankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, []);

  const totalAvailable = useMemo(() => {
    return mockBankAccounts.reduce((sum, acc) => sum + acc.availableBalance, 0);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Calcular métricas del flujo de caja
  const cashFlowMetrics = useMemo(() => {
    const next30Days = cashFlowData.slice(0, 30);
    const totalInflows = next30Days.reduce((sum, d) => sum + d.inflows, 0);
    const totalOutflows = next30Days.reduce((sum, d) => sum + d.outflows, 0);
    const minBalance = Math.min(...next30Days.map(d => d.balance));
    const maxBalance = Math.max(...next30Days.map(d => d.balance));
    
    return { totalInflows, totalOutflows, minBalance, maxBalance };
  }, [cashFlowData]);

  if (!selectedCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver tesorería
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
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Tesorería</h3>
            <p className="text-sm text-muted-foreground">Gestión de liquidez y flujos de caja</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <PiggyBank className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAvailable)}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cobros 30d</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlowMetrics.totalInflows)}</p>
            </div>
            <ArrowDownRight className="h-8 w-8 text-blue-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pagos 30d</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlowMetrics.totalOutflows)}</p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-red-500/30" />
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="forecast">Previsión</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Gráfico de flujo de caja */}
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Flujo de Caja - Próximos 60 días</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData.slice(0, 60)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)' 
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                        name="Saldo"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Alertas de liquidez */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alertas de Liquidez</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Saldo mínimo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo proyectado de {formatCurrency(cashFlowMetrics.minBalance)} el día 15
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Vencimientos próximos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    5 pagos por {formatCurrency(45000)} en los próximos 7 días
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Cobros esperados</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    12 cobros por {formatCurrency(78000)} esta semana
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ingresos vs Gastos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingresos vs Gastos - Próximos 30 días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)' 
                      }}
                    />
                    <Bar dataKey="inflows" fill="hsl(142 76% 36%)" name="Cobros" />
                    <Bar dataKey="outflows" fill="hsl(0 84% 60%)" name="Pagos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cuentas Bancarias */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {mockBankAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{account.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{account.bank}</Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">{account.iban}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo contable</p>
                      <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Disponible</span>
                      <span className="font-medium text-green-600">{formatCurrency(account.availableBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Última sincronización</span>
                      <span>{format(account.lastSync, "dd/MM HH:mm", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Extracto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Previsión */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previsión de Tesorería</CardTitle>
              <CardDescription>Proyección de saldos basada en vencimientos pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Cobros</TableHead>
                      <TableHead className="text-right">Pagos</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.slice(0, 30).map((day, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          +{formatCurrency(day.inflows)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          -{formatCurrency(day.outflows)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-semibold",
                          day.balance < 100000 && "text-orange-500",
                          day.balance < 50000 && "text-destructive"
                        )}>
                          {formatCurrency(day.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movimientos */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Últimos Movimientos</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(15)].map((_, idx) => {
                      const isIncome = Math.random() > 0.5;
                      const amount = Math.random() * 10000 + 500;
                      return (
                        <TableRow key={idx}>
                          <TableCell>{format(addDays(new Date(), -idx), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>Cuenta Principal</TableCell>
                          <TableCell>{isIncome ? 'Cobro cliente' : 'Pago proveedor'}</TableCell>
                          <TableCell className={cn(
                            "text-right font-mono",
                            isIncome ? "text-green-600" : "text-red-600"
                          )}>
                            {isIncome ? '+' : '-'}{formatCurrency(amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(totalBalance - (idx * 5000))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TreasuryModule;
