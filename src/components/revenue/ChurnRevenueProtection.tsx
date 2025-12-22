import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  DollarSign,
  TrendingDown,
  Users,
  BarChart3,
  PieChart,
  Bell,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useRevenueRiskAlerts } from '@/hooks/useRevenueRiskAlerts';
import { cn } from '@/lib/utils';

const ChurnRevenueProtection = () => {
  const { alerts, simulations, isLoading } = useRevenueRiskAlerts();
  const [activeTab, setActiveTab] = useState('risk');

  // Mock data for demonstration
  const mockRiskBySegment = [
    { segment: 'Enterprise', atRisk: 125000, accounts: 3, percentage: 15 },
    { segment: 'Mid-Market', atRisk: 85000, accounts: 8, percentage: 22 },
    { segment: 'SMB', atRisk: 45000, accounts: 15, percentage: 35 },
    { segment: 'Startup', atRisk: 12000, accounts: 6, percentage: 18 }
  ];

  const mockConcentrationAlerts = [
    { 
      type: 'high_concentration',
      message: 'Top 3 clientes representan 45% del ARR',
      severity: 'high',
      value: 450000
    },
    { 
      type: 'segment_risk',
      message: 'Sector Retail muestra 3x más churn que promedio',
      severity: 'medium',
      value: 120000
    },
    { 
      type: 'seasonal_pattern',
      message: 'Histórico muestra 2x churn en Q1',
      severity: 'low',
      value: 80000
    }
  ];

  const mockSimulations = [
    {
      id: '1',
      name: 'Escenario Optimista',
      description: 'Implementar programa de retención proactiva',
      retention_improvement: 15,
      revenue_impact: 85000,
      cost: 25000,
      roi: 240,
      probability: 75
    },
    {
      id: '2',
      name: 'Escenario Base',
      description: 'Mantener estrategia actual con mejoras menores',
      retention_improvement: 5,
      revenue_impact: 28000,
      cost: 8000,
      roi: 250,
      probability: 85
    },
    {
      id: '3',
      name: 'Escenario Agresivo',
      description: 'Descuentos de retención + QBRs mensuales',
      retention_improvement: 25,
      revenue_impact: 140000,
      cost: 60000,
      roi: 133,
      probability: 60
    }
  ];

  const totalAtRisk = mockRiskBySegment.reduce((sum, s) => sum + s.atRisk, 0);
  const totalAccountsAtRisk = mockRiskBySegment.reduce((sum, s) => sum + s.accounts, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue en Riesgo</p>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(totalAtRisk)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas en Riesgo</p>
                <p className="text-3xl font-bold text-amber-500">{totalAccountsAtRisk}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Protegible</p>
                <p className="text-3xl font-bold text-green-500">{formatCurrency(totalAtRisk * 0.65)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Activas</p>
                <p className="text-3xl font-bold text-purple-500">{mockConcentrationAlerts.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="risk" className="gap-2">
            <PieChart className="h-4 w-4" />
            Riesgo por Segmento
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas de Concentración
          </TabsTrigger>
          <TabsTrigger value="simulations" className="gap-2">
            <Zap className="h-4 w-4" />
            Simulaciones What-If
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Valor en Riesgo por Segmento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockRiskBySegment.map((segment, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{segment.segment}</span>
                        <Badge variant="outline" className="text-xs">
                          {segment.accounts} cuentas
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-red-500">
                          {formatCurrency(segment.atRisk)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({segment.percentage}% del segmento)
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={segment.percentage} className="h-3" />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-red-500/30 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Distribution Visual */}
              <div className="mt-8 p-6 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-4">Distribución de Riesgo</h4>
                <div className="flex items-center gap-2 h-8">
                  {mockRiskBySegment.map((segment, idx) => {
                    const width = (segment.atRisk / totalAtRisk) * 100;
                    const colors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-orange-500'];
                    return (
                      <div 
                        key={idx}
                        className={cn("h-full rounded transition-all hover:opacity-80", colors[idx])}
                        style={{ width: `${width}%` }}
                        title={`${segment.segment}: ${formatCurrency(segment.atRisk)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {mockRiskBySegment.map((segment, idx) => (
                    <span key={idx}>{segment.segment}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas de Concentración de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockConcentrationAlerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      alert.severity === 'high' && "border-red-500/30 bg-red-500/5",
                      alert.severity === 'medium' && "border-amber-500/30 bg-amber-500/5",
                      alert.severity === 'low' && "border-blue-500/30 bg-blue-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          getSeverityColor(alert.severity)
                        )}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity === 'high' ? 'Alto' : alert.severity === 'medium' ? 'Medio' : 'Bajo'}
                            </Badge>
                          </div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Valor afectado: {formatCurrency(alert.value)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver detalles <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Simulaciones What-If de Retención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockSimulations.map((sim) => (
                  <Card key={sim.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{sim.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{sim.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-green-500/10 rounded">
                          <p className="text-muted-foreground text-xs">Mejora Retención</p>
                          <p className="font-bold text-green-500">+{sim.retention_improvement}%</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded">
                          <p className="text-muted-foreground text-xs">Impacto Revenue</p>
                          <p className="font-bold text-blue-500">{formatCurrency(sim.revenue_impact)}</p>
                        </div>
                        <div className="p-2 bg-amber-500/10 rounded">
                          <p className="text-muted-foreground text-xs">Inversión</p>
                          <p className="font-bold text-amber-500">{formatCurrency(sim.cost)}</p>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded">
                          <p className="text-muted-foreground text-xs">ROI</p>
                          <p className="font-bold text-purple-500">{sim.roi}%</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Probabilidad de éxito</span>
                          <span className="font-medium">{sim.probability}%</span>
                        </div>
                        <Progress value={sim.probability} className="h-2" />
                      </div>

                      <Button className="w-full" variant="outline">
                        Simular escenario
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChurnRevenueProtection;
