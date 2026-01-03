/**
 * BudgetManagementPanel - Panel de gestión de presupuestos
 * Fase 4: Budget Management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Maximize2,
  Minimize2,
  Plus,
  Download,
  Loader2,
  Lightbulb,
  DollarSign
} from 'lucide-react';
import { useERPBudget, BudgetLine, AIBudgetInsight } from '@/hooks/erp/useERPBudget';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

interface BudgetManagementPanelProps {
  className?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function BudgetManagementPanel({ className }: BudgetManagementPanelProps) {
  const { currentCompany } = useERPContext();
  const currentYear = new Date().getFullYear();

  const {
    isLoading,
    budgetLines,
    summary,
    versions,
    varianceAnalysis,
    forecasts,
    aiInsights,
    error,
    lastRefresh,
    fetchBudgetData,
    analyzeVariances,
    getAIInsights,
    generateForecast,
  } = useERPBudget();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  const context = useMemo(() => {
    if (!currentCompany) return null;
    return {
      companyId: currentCompany.id,
      fiscalYear: currentYear,
      versionId: selectedVersion || undefined
    };
  }, [currentCompany, currentYear, selectedVersion]);

  useEffect(() => {
    if (context) {
      fetchBudgetData(context);
    }
  }, [context, fetchBudgetData]);

  const handleRefresh = useCallback(async () => {
    if (context) {
      await fetchBudgetData(context);
      toast.success('Datos de presupuesto actualizados');
    }
  }, [context, fetchBudgetData]);

  const handleAnalyzeVariances = useCallback(async () => {
    if (context) {
      await analyzeVariances(context);
      toast.success('Análisis de variaciones completado');
    }
  }, [context, analyzeVariances]);

  const handleGetAIInsights = useCallback(async () => {
    if (context) {
      await getAIInsights(context);
      toast.success('Insights generados');
    }
  }, [context, getAIInsights]);

  const handleGenerateForecast = useCallback(async () => {
    if (context) {
      await generateForecast(context, 6);
      toast.success('Pronóstico generado');
    }
  }, [context, generateForecast]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [currentCompany?.currency]);

  const getStatusColor = (status: BudgetLine['status']) => {
    switch (status) {
      case 'on_track': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      case 'exceeded': return 'bg-red-600';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: BudgetLine['status']) => {
    switch (status) {
      case 'on_track': return <Badge className="bg-emerald-500/20 text-emerald-700">En objetivo</Badge>;
      case 'warning': return <Badge className="bg-amber-500/20 text-amber-700">Atención</Badge>;
      case 'critical': return <Badge className="bg-red-500/20 text-red-700">Crítico</Badge>;
      case 'exceeded': return <Badge className="bg-red-600/20 text-red-700">Excedido</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  const revenueLines = useMemo(() => 
    budgetLines.filter(l => l.category === 'revenue'), [budgetLines]);
  
  const expenseLines = useMemo(() => 
    budgetLines.filter(l => l.category === 'expense'), [budgetLines]);

  const chartData = useMemo(() => 
    budgetLines.map(line => ({
      name: line.accountName.slice(0, 15),
      presupuestado: line.budgetedAmount,
      real: line.actualAmount,
      variacion: line.variancePercentage
    })), [budgetLines]);

  const monthlyTrendData = useMemo(() => {
    if (budgetLines.length === 0) return [];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((month, idx) => {
      const monthData = budgetLines.reduce((acc, line) => {
        const breakdown = line.monthlyBreakdown;
        if (breakdown && Array.isArray(breakdown) && breakdown[idx]) {
          const mb = breakdown[idx];
          acc.presupuestado += mb.budgeted || 0;
          acc.real += mb.actual || 0;
        }
        return acc;
      }, { presupuestado: 0, real: 0 });
      
      return {
        month,
        ...monthData,
        variacion: monthData.presupuestado > 0 
          ? ((monthData.real - monthData.presupuestado) / monthData.presupuestado * 100).toFixed(1)
          : 0
      };
    });
  }, [budgetLines]);

  if (!currentCompany) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona una empresa para ver presupuestos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Gestión de Presupuestos
                {summary && (
                  <Badge variant={
                    summary.overallHealth === 'excellent' ? 'default' :
                    summary.overallHealth === 'good' ? 'secondary' :
                    summary.overallHealth === 'warning' ? 'outline' : 'destructive'
                  }>
                    {summary.overallHealth === 'excellent' ? 'Excelente' :
                     summary.overallHealth === 'good' ? 'Bueno' :
                     summary.overallHealth === 'warning' ? 'Atención' : 'Crítico'}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Versión activa" />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mb-3">
            <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
            <TabsTrigger value="lines" className="text-xs">Partidas</TabsTrigger>
            <TabsTrigger value="variance" className="text-xs">Variaciones</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs">Pronóstico</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">IA</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 mt-0 space-y-4">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Ingresos</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(summary.totalActualRevenue)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">vs</span>
                      <span>{formatCurrency(summary.totalBudgetedRevenue)}</span>
                      <Badge variant={summary.revenueVariance >= 0 ? "default" : "destructive"} className="text-xs">
                        {summary.revenueVariance >= 0 ? '+' : ''}{(summary.revenueVariancePercentage ?? 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-muted-foreground">Gastos</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(summary.totalActualExpenses)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">vs</span>
                      <span>{formatCurrency(summary.totalBudgetedExpenses)}</span>
                      <Badge variant={summary.expenseVariance <= 0 ? "default" : "destructive"} className="text-xs">
                        {summary.expenseVariance >= 0 ? '+' : ''}{(summary.expenseVariancePercentage ?? 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Resultado</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(summary.actualNetIncome)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">Ppto:</span>
                      <span>{formatCurrency(summary.budgetedNetIncome)}</span>
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Utilización</span>
                    </div>
                    <p className="text-lg font-bold">{(summary.budgetUtilization ?? 0).toFixed(1)}%</p>
                    <Progress value={summary.budgetUtilization ?? 0} className="h-1.5 mt-1" />
                  </Card>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3">Presupuesto vs Real por Cuenta</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="presupuestado" fill="#3b82f6" name="Presupuestado" />
                      <Bar dataKey="real" fill="#10b981" name="Real" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3">Tendencia Mensual</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => typeof v === 'number' && v > 100 ? formatCurrency(v) : `${v}%`} />
                      <Legend />
                      <Area type="monotone" dataKey="presupuestado" fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" name="Presupuestado" />
                      <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} name="Real" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Budget Lines Tab */}
          <TabsContent value="lines" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              <div className="space-y-4">
                {/* Revenue Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Ingresos
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Presupuestado</TableHead>
                        <TableHead className="text-right">Real</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueLines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.budgetedAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.actualAmount)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "flex items-center justify-end gap-1",
                              line.varianceAmount >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {line.varianceAmount >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {(line.variancePercentage ?? 0).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(line.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Expense Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Gastos
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Presupuestado</TableHead>
                        <TableHead className="text-right">Real</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseLines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.budgetedAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.actualAmount)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "flex items-center justify-end gap-1",
                              line.varianceAmount <= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {line.varianceAmount <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {Math.abs(line.variancePercentage ?? 0).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(line.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Variance Analysis Tab */}
          <TabsContent value="variance" className="flex-1 mt-0">
            <div className="mb-3">
              <Button onClick={handleAnalyzeVariances} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Analizar Variaciones
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[360px]"}>
              {varianceAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {varianceAnalysis.map((va, idx) => (
                    <Card key={idx} className={cn(
                      "p-3 border-l-4",
                      va.varianceType === 'favorable' ? "border-l-emerald-500" : "border-l-red-500"
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-sm">{va.accountName}</h5>
                          <p className="text-xs text-muted-foreground">{va.accountCode}</p>
                        </div>
                        <Badge variant={va.varianceType === 'favorable' ? 'default' : 'destructive'}>
                          {va.varianceType === 'favorable' ? 'Favorable' : 'Desfavorable'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Variación:</span>
                          <span className="ml-1 font-medium">{formatCurrency(va.varianceAmount)}</span>
                        </div>
                          <div>
                            <span className="text-muted-foreground">%:</span>
                            <span className="ml-1 font-medium">{(va.variancePercentage ?? 0).toFixed(1)}%</span>
                          </div>
                        <div>
                          <span className="text-muted-foreground">Tendencia:</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {va.trend === 'improving' ? '↑ Mejorando' : va.trend === 'worsening' ? '↓ Empeorando' : '→ Estable'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Causas: {va.rootCauses.slice(0, 2).join(', ')}</p>
                        <p className="text-muted-foreground">Recomendación: {va.recommendations[0]}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Haz clic en "Analizar Variaciones" para ver el análisis</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="flex-1 mt-0">
            <div className="mb-3">
              <Button onClick={handleGenerateForecast} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                Generar Pronóstico
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[360px]"}>
              {forecasts.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={forecasts}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="forecastedRevenue" fill="#10b981" fillOpacity={0.3} stroke="#10b981" name="Ingresos" />
                      <Area type="monotone" dataKey="forecastedExpenses" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" name="Gastos" />
                      <Line type="monotone" dataKey="forecastedNetIncome" stroke="#3b82f6" strokeWidth={2} name="Resultado" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {forecasts.map((f, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">{f.period}</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Ingresos:</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(f.forecastedRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Gastos:</span>
                            <span className="font-medium text-red-600">{formatCurrency(f.forecastedExpenses)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-1">
                            <span>Resultado:</span>
                            <span className="font-bold">{formatCurrency(f.forecastedNetIncome)}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            Confianza: {((f.confidenceLevel ?? 0) * 100).toFixed(0)}%
                          </div>
                          <Progress value={(f.confidenceLevel ?? 0) * 100} className="h-1 mt-1" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Haz clic en "Generar Pronóstico" para ver proyecciones</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="flex-1 mt-0">
            <div className="mb-3">
              <Button onClick={handleGetAIInsights} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generar Insights IA
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[360px]"}>
              {aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.map(insight => (
                    <Card key={insight.id} className={cn(
                      "p-4 border-l-4",
                      insight.type === 'opportunity' ? "border-l-emerald-500" :
                      insight.type === 'risk' ? "border-l-red-500" :
                      insight.type === 'optimization' ? "border-l-blue-500" : "border-l-amber-500"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          insight.type === 'opportunity' ? "bg-emerald-500/10" :
                          insight.type === 'risk' ? "bg-red-500/10" :
                          insight.type === 'optimization' ? "bg-blue-500/10" : "bg-amber-500/10"
                        )}>
                          {insight.type === 'opportunity' ? <TrendingUp className="h-4 w-4 text-emerald-600" /> :
                           insight.type === 'risk' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           insight.type === 'optimization' ? <Lightbulb className="h-4 w-4 text-blue-600" /> :
                           <Activity className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-sm">{insight.title}</h5>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                insight.impact === 'high' ? 'destructive' :
                                insight.impact === 'medium' ? 'default' : 'secondary'
                              } className="text-xs">
                                {insight.impact === 'high' ? 'Alto impacto' :
                                 insight.impact === 'medium' ? 'Medio' : 'Bajo'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {((insight.confidence ?? 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          {insight.potentialSavings && (
                            <div className="flex items-center gap-1 text-sm text-emerald-600 mb-2">
                              <DollarSign className="h-3 w-3" />
                              Ahorro potencial: {formatCurrency(insight.potentialSavings)}
                            </div>
                          )}
                          {insight.actionable && insight.suggestedActions.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs font-medium">Acciones sugeridas:</span>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                {insight.suggestedActions.slice(0, 2).map((action, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <CheckCircle className="h-3 w-3 mt-0.5 text-emerald-500" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Haz clic en "Generar Insights IA" para obtener recomendaciones</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default BudgetManagementPanel;
