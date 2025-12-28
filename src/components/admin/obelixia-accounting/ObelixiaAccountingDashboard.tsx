/**
 * ObelixIA Accounting Dashboard
 * Panel principal de contabilidad interna
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  PiggyBank,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users
} from 'lucide-react';
import { useObelixiaAccounting } from '@/hooks/admin/obelixia-accounting';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DashboardKPI {
  label: string;
  value: number;
  previousValue?: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function ObelixiaAccountingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    isLoading, 
    dashboard,
    accounts,
    fetchAccounts,
    fetchDashboard,
    lastRefresh 
  } = useObelixiaAccounting();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    fetchDashboard();
  };

  const dashboardData = dashboard;
  const fiscalConfig = { jurisdiction: 'ES', currency: 'EUR', fiscalYear: new Date().getFullYear() };

  const formatCurrency = (amount: number) => {
    const currency = fiscalConfig?.currency || 'EUR';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const kpis: DashboardKPI[] = [
    {
      label: 'Ingresos del Período',
      value: dashboardData?.totalIncome || 0,
      previousValue: dashboardData?.previousIncome,
      format: 'currency',
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      trend: 'up'
    },
    {
      label: 'Gastos del Período',
      value: dashboardData?.totalExpenses || 0,
      previousValue: dashboardData?.previousExpenses,
      format: 'currency',
      icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      trend: 'down'
    },
    {
      label: 'Resultado Neto',
      value: dashboardData?.netResult || 0,
      format: 'currency',
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      trend: (dashboardData?.netResult || 0) >= 0 ? 'up' : 'down'
    },
    {
      label: 'IVA Pendiente',
      value: dashboardData?.pendingVat || 0,
      format: 'currency',
      icon: <Receipt className="h-5 w-5 text-amber-500" />
    },
    {
      label: 'Tesorería',
      value: dashboardData?.cashBalance || 0,
      format: 'currency',
      icon: <Wallet className="h-5 w-5 text-blue-500" />
    },
    {
      label: 'Pendiente Cobro',
      value: dashboardData?.pendingReceivables || 0,
      format: 'currency',
      icon: <Clock className="h-5 w-5 text-orange-500" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            ObelixIA Accounting
          </h1>
          <p className="text-sm text-muted-foreground">
            Contabilidad interna • {fiscalConfig?.jurisdiction === 'ES' ? 'España' : 'Andorra'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fiscalConfig?.fiscalYear || new Date().getFullYear()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                {kpi.icon}
                {kpi.trend && (
                  <Badge 
                    variant={kpi.trend === 'up' ? 'default' : 'destructive'} 
                    className="text-xs"
                  >
                    {kpi.trend === 'up' ? '+' : '-'}
                    {kpi.previousValue ? 
                      Math.abs(((kpi.value - kpi.previousValue) / kpi.previousValue) * 100).toFixed(1) 
                      : '0'}%
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">
                {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <PiggyBank className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Asientos
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Socios
          </TabsTrigger>
          <TabsTrigger value="banking" className="flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            Bancos
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            Fiscal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Balance de Situación Resumido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Balance de Situación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Activo Total</span>
                    <span className="font-medium">{formatCurrency(dashboardData?.totalAssets || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pasivo Total</span>
                    <span className="font-medium">{formatCurrency(dashboardData?.totalLiabilities || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Patrimonio Neto</span>
                    <span className="font-bold text-primary">
                      {formatCurrency((dashboardData?.totalAssets || 0) - (dashboardData?.totalLiabilities || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cuenta de Resultados Resumida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cuenta de Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ingresos de Explotación</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(dashboardData?.operatingIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gastos de Explotación</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(dashboardData?.operatingExpenses || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Resultado del Ejercicio</span>
                    <span className={cn(
                      "font-bold",
                      (dashboardData?.netResult || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(dashboardData?.netResult || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas y Tareas Pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas y Tareas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.alerts?.length ? (
                  dashboardData.alerts.map((alert: any, index: number) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20' : 
                        alert.type === 'error' ? 'bg-red-50 dark:bg-red-950/20' : 
                        'bg-blue-50 dark:bg-blue-950/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : alert.type === 'error' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm">{alert.message}</span>
                      </div>
                      {alert.dueDate && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(alert.dueDate).toLocaleDateString('es-ES')}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    No hay alertas pendientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Libro Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Módulo de asientos contables en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Socios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Panel de socios y cuenta corriente en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Conciliación Bancaria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Módulo de bancos y conciliación en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Declaraciones Fiscales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Módulo de declaraciones fiscales en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ObelixiaAccountingDashboard;
