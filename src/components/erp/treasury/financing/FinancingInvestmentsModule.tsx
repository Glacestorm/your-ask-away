import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Landmark, 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Euro,
  PiggyBank,
  CreditCard,
  Percent,
  Calendar
} from 'lucide-react';
import { FinancingOperationsPanel } from './FinancingOperationsPanel';
import { InvestmentsPanel } from './InvestmentsPanel';
import { InterestRatesPanel } from './InterestRatesPanel';
import { StockWatchlistPanel } from './StockWatchlistPanel';
import { AutoAccountingSettings } from './AutoAccountingSettings';
import { useERPFinancingOperations } from '@/hooks/erp/useERPFinancingOperations';
import { useERPInvestments } from '@/hooks/erp/useERPInvestments';

export function FinancingInvestmentsModule() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { stats: financingStats } = useERPFinancingOperations();
  const { stats: investmentStats } = useERPInvestments();

  const totalFinancing = financingStats.totalOutstanding;
  const totalInvestments = investmentStats.totalValue;
  const netPosition = totalInvestments - totalFinancing;

  return (
    <div className="space-y-6">
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Landmark className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Financiación Activa</span>
            </div>
            <p className="text-2xl font-bold">
              {totalFinancing.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {financingStats.activeOperations} operaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Wallet className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Cartera Inversiones</span>
            </div>
            <p className="text-2xl font-bold">
              {totalInvestments.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {investmentStats.activeInvestments} inversiones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${netPosition >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <TrendingUp className={`h-4 w-4 ${netPosition >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <span className="text-sm text-muted-foreground">Posición Neta</span>
            </div>
            <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netPosition.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Inversiones - Financiación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Próx. Vencimientos</span>
            </div>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground mt-1">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Financiación e Inversiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="financing" className="flex items-center gap-1 text-xs">
                <Landmark className="h-3 w-3" />
                <span className="hidden sm:inline">Financiación</span>
              </TabsTrigger>
              <TabsTrigger value="investments" className="flex items-center gap-1 text-xs">
                <Wallet className="h-3 w-3" />
                <span className="hidden sm:inline">Inversiones</span>
              </TabsTrigger>
              <TabsTrigger value="rates" className="flex items-center gap-1 text-xs">
                <Percent className="h-3 w-3" />
                <span className="hidden sm:inline">Tipos</span>
              </TabsTrigger>
              <TabsTrigger value="stocks" className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Acciones</span>
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-1 text-xs">
                <CreditCard className="h-3 w-3" />
                <span className="hidden sm:inline">Contable</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financing Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Operaciones de Financiación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(financingStats.byType).slice(0, 5).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                      {Object.keys(financingStats.byType).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay operaciones registradas
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab('financing')}
                    >
                      Ver todas las operaciones
                    </Button>
                  </CardContent>
                </Card>

                {/* Investments Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Cartera de Inversiones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(investmentStats.byType).slice(0, 5).map(([type, value]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                          <span className="font-medium">
                            {value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                      ))}
                      {Object.keys(investmentStats.byType).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay inversiones registradas
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab('investments')}
                    >
                      Ver toda la cartera
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financing" className="mt-4">
              <FinancingOperationsPanel />
            </TabsContent>

            <TabsContent value="investments" className="mt-4">
              <InvestmentsPanel />
            </TabsContent>

            <TabsContent value="rates" className="mt-4">
              <InterestRatesPanel />
            </TabsContent>

            <TabsContent value="stocks" className="mt-4">
              <StockWatchlistPanel />
            </TabsContent>

            <TabsContent value="accounting" className="mt-4">
              <AutoAccountingSettings />
            </TabsContent>

            <TabsContent value="config" className="mt-4">
              <AutoAccountingSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancingInvestmentsModule;
