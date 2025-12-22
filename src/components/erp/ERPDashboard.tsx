import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  FileText, 
  Users, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Building,
  Calendar,
  Download,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Wallet,
  CreditCard
} from 'lucide-react';

// Types
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  account: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Invoice {
  id: string;
  number: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  items: { description: string; quantity: number; price: number }[];
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive';
}

export interface ERPMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  totalEmployees: number;
  payrollTotal: number;
  accountsReceivable: number;
  accountsPayable: number;
}

interface ERPDashboardProps {
  metrics: ERPMetrics;
  transactions: Transaction[];
  invoices: Invoice[];
  employees: Employee[];
}

export const ERPDashboard: React.FC<ERPDashboardProps> = ({
  metrics,
  transactions,
  invoices,
  employees
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      completed: 'default',
      active: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'outline',
      inactive: 'outline',
      draft: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ERP Integrado</h2>
          <p className="text-muted-foreground">
            Contabilidad, facturación y nóminas en un solo lugar
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.5% vs mes anterior
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <ArrowDownRight className="h-3 w-3" />
                  +3.2% vs mes anterior
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Beneficio Neto</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.netProfit)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.7% margen
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <PiggyBank className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nóminas</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.payrollTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.totalEmployees} empleados
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Calculator className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="accounting" className="gap-2">
            <Wallet className="h-4 w-4" />
            Contabilidad
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2">
            <Receipt className="h-4 w-4" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Users className="h-4 w-4" />
            Nóminas
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accounts Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Resumen de Cuentas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                    <span>Cuentas por Cobrar</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(metrics.accountsReceivable)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-3">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                    <span>Cuentas por Pagar</span>
                  </div>
                  <span className="font-bold text-red-600">{formatCurrency(metrics.accountsPayable)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-yellow-500" />
                    <span>Facturas Pendientes</span>
                  </div>
                  <span className="font-bold text-yellow-600">{metrics.pendingInvoices}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Últimas Transacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {tx.type === 'income' 
                            ? <ArrowUpRight className="h-4 w-4 text-green-500" />
                            : <ArrowDownRight className="h-4 w-4 text-red-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.category}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Libro Mayor</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar transacción..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Descripción</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Categoría</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Cuenta</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Importe</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm font-medium">{tx.description}</td>
                        <td className="px-4 py-3 text-sm">{tx.category}</td>
                        <td className="px-4 py-3 text-sm">{tx.account}</td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoicing Tab */}
        <TabsContent value="invoicing" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Facturas</CardTitle>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nº Factura</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Vencimiento</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Importe</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono">{inv.number}</td>
                        <td className="px-4 py-3 text-sm font-medium">{inv.client}</td>
                        <td className="px-4 py-3 text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(inv.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestión de Nóminas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Generar Nóminas
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Empleado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Empleado</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Puesto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Departamento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha Alta</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Salario Bruto</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {emp.name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{emp.position}</td>
                        <td className="px-4 py-3 text-sm">{emp.department}</td>
                        <td className="px-4 py-3 text-sm">{new Date(emp.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(emp.salary)}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(emp.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
