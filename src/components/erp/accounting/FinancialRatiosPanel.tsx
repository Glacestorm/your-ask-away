/**
 * FinancialRatiosPanel - Dashboard de ratios financieros avanzados
 * Fase 2: Visualización con análisis IA y benchmarks sectoriales
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Droplets,
  Shield,
  Percent,
  Clock,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Lightbulb,
  Loader2,
  Building2,
  Download
} from 'lucide-react';
import { useERPFinancialRatios, type FinancialRatiosData, type AIRatioInsight } from '@/hooks/erp/useERPFinancialRatios';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinancialRatiosPanelProps {
  className?: string;
}

// Componente para mostrar un ratio individual
const RatioCard = ({
  name,
  value,
  formattedValue,
  status,
  benchmark,
  description,
  icon: Icon
}: {
  name: string;
  value: number | null;
  formattedValue: string;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';
  benchmark?: number;
  description: string;
  icon: React.ElementType;
}) => {
  const statusColors = {
    excellent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    good: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    critical: 'bg-red-500/10 text-red-600 border-red-500/30',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  const statusIcons = {
    excellent: CheckCircle,
    good: CheckCircle,
    warning: AlertTriangle,
    critical: XCircle,
    neutral: Minus,
  };

  const StatusIcon = statusIcons[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "p-4 rounded-lg border transition-all hover:shadow-md cursor-help",
            statusColors[status]
          )}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-70" />
                <span className="text-xs font-medium">{name}</span>
              </div>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mb-1">{formattedValue}</div>
            {benchmark !== undefined && (
              <div className="text-xs opacity-70">
                Benchmark: {benchmark.toFixed(2)}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Componente para sección de ratios
const RatioSection = ({
  title,
  icon: Icon,
  children,
  className
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {children}
    </div>
  </div>
);

export function FinancialRatiosPanel({ className }: FinancialRatiosPanelProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    isAnalyzing,
    ratios,
    aiInsights,
    error,
    lastCalculation,
    fetchAndCalculateRatios,
    analyzeWithAI,
    formatRatio,
    evaluateRatioStatus
  } = useERPFinancialRatios();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSector, setSelectedSector] = useState('general');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());

  // Cargar ratios al montar
  useEffect(() => {
    if (currentCompany?.id) {
      fetchAndCalculateRatios(currentCompany.id, fiscalYear);
    }
  }, [currentCompany?.id, fiscalYear, fetchAndCalculateRatios]);

  // Analizar con IA
  const handleAnalyze = useCallback(async () => {
    if (ratios) {
      await analyzeWithAI(ratios, selectedSector);
    }
  }, [ratios, selectedSector, analyzeWithAI]);

  // Health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthBg = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-amber-500';
      case 'poor': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  if (!currentCompany) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-10 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Selecciona una empresa para ver los ratios financieros
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Ratios Financieros
              </CardTitle>
              <CardDescription>
                Análisis completo de indicadores financieros con benchmarks sectoriales
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={fiscalYear} onValueChange={setFiscalYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufactura</SelectItem>
                  <SelectItem value="technology">Tecnología</SelectItem>
                  <SelectItem value="services">Servicios</SelectItem>
                  <SelectItem value="healthcare">Salud</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAndCalculateRatios(currentCompany.id, fiscalYear)}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Actualizar
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={!ratios || isAnalyzing}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Analizar con IA
              </Button>
            </div>
          </div>
          {lastCalculation && (
            <p className="text-xs text-muted-foreground mt-2">
              Último cálculo: {formatDistanceToNow(lastCalculation, { locale: es, addSuffix: true })}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !ratios && (
        <Card>
          <CardContent className="py-10 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculando ratios financieros...</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {ratios && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="gap-2">
              <Droplets className="h-4 w-4" />
              Liquidez
            </TabsTrigger>
            <TabsTrigger value="solvency" className="gap-2">
              <Shield className="h-4 w-4" />
              Solvencia
            </TabsTrigger>
            <TabsTrigger value="profitability" className="gap-2">
              <Percent className="h-4 w-4" />
              Rentabilidad
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="gap-2">
              <Clock className="h-4 w-4" />
              Eficiencia
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Score Card */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Salud Financiera
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights ? (
                    <div className="text-center py-4">
                      <div className={cn(
                        "text-5xl font-bold mb-2",
                        getHealthColor(aiInsights.healthScore)
                      )}>
                        {aiInsights.healthScore}
                      </div>
                      <Badge className={cn("mb-4", getHealthBg(aiInsights.overallHealth))}>
                        {aiInsights.overallHealth.toUpperCase()}
                      </Badge>
                      <Progress 
                        value={aiInsights.healthScore} 
                        className="h-2 mb-4" 
                      />
                      <p className="text-sm text-muted-foreground">
                        {aiInsights.summary}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        Ejecuta el análisis IA para obtener el score de salud financiera
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Métricas Clave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <RatioCard
                      name="Current Ratio"
                      value={ratios.liquidity.currentRatio}
                      formattedValue={formatRatio(ratios.liquidity.currentRatio, 'times')}
                      status={evaluateRatioStatus(ratios.liquidity.currentRatio, 'currentRatio')}
                      benchmark={1.5}
                      description="Capacidad de pagar obligaciones a corto plazo"
                      icon={Droplets}
                    />
                    <RatioCard
                      name="Debt/Equity"
                      value={ratios.solvency.debtToEquity}
                      formattedValue={formatRatio(ratios.solvency.debtToEquity, 'times')}
                      status={evaluateRatioStatus(ratios.solvency.debtToEquity, 'debtToEquity')}
                      benchmark={1.0}
                      description="Nivel de apalancamiento financiero"
                      icon={Shield}
                    />
                    <RatioCard
                      name="ROE"
                      value={ratios.profitability.roe}
                      formattedValue={formatRatio(ratios.profitability.roe, 'percent')}
                      status={evaluateRatioStatus(ratios.profitability.roe, 'roe')}
                      benchmark={15}
                      description="Retorno sobre el patrimonio neto"
                      icon={Percent}
                    />
                    <RatioCard
                      name="Margen Neto"
                      value={ratios.profitability.netMargin}
                      formattedValue={formatRatio(ratios.profitability.netMargin, 'percent')}
                      status={evaluateRatioStatus(ratios.profitability.netMargin, 'netMargin')}
                      benchmark={8}
                      description="Beneficio neto sobre ventas"
                      icon={TrendingUp}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            {aiInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fortalezas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                      Fortalezas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.keyStrengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <ArrowUpRight className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Debilidades */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      Áreas de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.keyWeaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <ArrowDownRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recommendations */}
            {aiInsights?.recommendations && aiInsights.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiInsights.recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-3 rounded-lg border-l-4",
                          rec.priority === 'high' 
                            ? 'bg-red-500/5 border-red-500' 
                            : rec.priority === 'medium'
                            ? 'bg-amber-500/5 border-amber-500'
                            : 'bg-blue-500/5 border-blue-500'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {rec.area}
                          </Badge>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{rec.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Impacto esperado: {rec.expectedImpact}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Liquidez */}
          <TabsContent value="liquidity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Ratios de Liquidez
                </CardTitle>
                <CardDescription>
                  Capacidad de la empresa para cumplir con sus obligaciones a corto plazo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <RatioCard
                    name="Current Ratio"
                    value={ratios.liquidity.currentRatio}
                    formattedValue={formatRatio(ratios.liquidity.currentRatio, 'times')}
                    status={evaluateRatioStatus(ratios.liquidity.currentRatio, 'currentRatio')}
                    benchmark={1.5}
                    description="Activo corriente / Pasivo corriente. Indica la capacidad de pagar deudas a corto plazo."
                    icon={Activity}
                  />
                  <RatioCard
                    name="Quick Ratio"
                    value={ratios.liquidity.quickRatio}
                    formattedValue={formatRatio(ratios.liquidity.quickRatio, 'times')}
                    status={evaluateRatioStatus(ratios.liquidity.quickRatio, 'quickRatio')}
                    benchmark={1.0}
                    description="(Activo corriente - Inventario) / Pasivo corriente. Prueba ácida de liquidez."
                    icon={Activity}
                  />
                  <RatioCard
                    name="Cash Ratio"
                    value={ratios.liquidity.cashRatio}
                    formattedValue={formatRatio(ratios.liquidity.cashRatio, 'times')}
                    status={evaluateRatioStatus(ratios.liquidity.cashRatio, 'cashRatio')}
                    benchmark={0.3}
                    description="Efectivo / Pasivo corriente. Capacidad de pago inmediato."
                    icon={Activity}
                  />
                  <RatioCard
                    name="Capital Circulante"
                    value={ratios.liquidity.workingCapital}
                    formattedValue={formatRatio(ratios.liquidity.workingCapital, 'currency')}
                    status={ratios.liquidity.workingCapital && ratios.liquidity.workingCapital > 0 ? 'good' : 'warning'}
                    description="Activo corriente - Pasivo corriente. Fondos disponibles para operaciones."
                    icon={Activity}
                  />
                  <RatioCard
                    name="Intervalo Defensivo"
                    value={ratios.liquidity.defensiveInterval}
                    formattedValue={formatRatio(ratios.liquidity.defensiveInterval, 'days')}
                    status={ratios.liquidity.defensiveInterval && ratios.liquidity.defensiveInterval > 90 ? 'excellent' : ratios.liquidity.defensiveInterval && ratios.liquidity.defensiveInterval > 30 ? 'good' : 'warning'}
                    description="Días que puede operar solo con activos líquidos."
                    icon={Clock}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Solvencia */}
          <TabsContent value="solvency">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Ratios de Solvencia
                </CardTitle>
                <CardDescription>
                  Capacidad de la empresa para cumplir con sus obligaciones a largo plazo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <RatioCard
                    name="Deuda/Patrimonio"
                    value={ratios.solvency.debtToEquity}
                    formattedValue={formatRatio(ratios.solvency.debtToEquity, 'times')}
                    status={evaluateRatioStatus(ratios.solvency.debtToEquity, 'debtToEquity')}
                    benchmark={1.0}
                    description="Pasivo total / Patrimonio neto. Nivel de apalancamiento."
                    icon={Shield}
                  />
                  <RatioCard
                    name="Ratio de Deuda"
                    value={ratios.solvency.debtRatio}
                    formattedValue={formatRatio(ratios.solvency.debtRatio ? ratios.solvency.debtRatio * 100 : null, 'percent')}
                    status={evaluateRatioStatus(ratios.solvency.debtRatio, 'debtRatio')}
                    benchmark={0.5}
                    description="Pasivo total / Activo total. Porcentaje de activos financiados con deuda."
                    icon={Shield}
                  />
                  <RatioCard
                    name="Ratio de Patrimonio"
                    value={ratios.solvency.equityRatio}
                    formattedValue={formatRatio(ratios.solvency.equityRatio ? ratios.solvency.equityRatio * 100 : null, 'percent')}
                    status={ratios.solvency.equityRatio && ratios.solvency.equityRatio > 0.4 ? 'good' : 'warning'}
                    description="Patrimonio neto / Activo total. Solvencia patrimonial."
                    icon={Shield}
                  />
                  <RatioCard
                    name="Cobertura Intereses"
                    value={ratios.solvency.interestCoverage}
                    formattedValue={formatRatio(ratios.solvency.interestCoverage, 'times')}
                    status={evaluateRatioStatus(ratios.solvency.interestCoverage, 'interestCoverage')}
                    benchmark={3.0}
                    description="EBIT / Gastos por intereses. Capacidad de pagar intereses."
                    icon={Shield}
                  />
                  <RatioCard
                    name="DSCR"
                    value={ratios.solvency.debtServiceCoverage}
                    formattedValue={formatRatio(ratios.solvency.debtServiceCoverage, 'times')}
                    status={ratios.solvency.debtServiceCoverage && ratios.solvency.debtServiceCoverage > 1.5 ? 'good' : 'warning'}
                    description="EBITDA / Servicio de deuda. Capacidad de servicio de deuda."
                    icon={Shield}
                  />
                  <RatioCard
                    name="Apalancamiento"
                    value={ratios.solvency.financialLeverage}
                    formattedValue={formatRatio(ratios.solvency.financialLeverage, 'times')}
                    status={ratios.solvency.financialLeverage && ratios.solvency.financialLeverage < 3 ? 'good' : 'warning'}
                    description="Activo total / Patrimonio neto. Multiplicador de capital."
                    icon={Shield}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Rentabilidad */}
          <TabsContent value="profitability">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-500" />
                  Ratios de Rentabilidad
                </CardTitle>
                <CardDescription>
                  Capacidad de la empresa para generar beneficios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                  <RatioCard
                    name="ROE"
                    value={ratios.profitability.roe}
                    formattedValue={formatRatio(ratios.profitability.roe, 'percent')}
                    status={evaluateRatioStatus(ratios.profitability.roe, 'roe')}
                    benchmark={15}
                    description="Return on Equity. Beneficio neto / Patrimonio neto."
                    icon={Percent}
                  />
                  <RatioCard
                    name="ROA"
                    value={ratios.profitability.roa}
                    formattedValue={formatRatio(ratios.profitability.roa, 'percent')}
                    status={evaluateRatioStatus(ratios.profitability.roa, 'roa')}
                    benchmark={5}
                    description="Return on Assets. Beneficio neto / Activo total."
                    icon={Percent}
                  />
                  <RatioCard
                    name="ROIC"
                    value={ratios.profitability.roic}
                    formattedValue={formatRatio(ratios.profitability.roic, 'percent')}
                    status={ratios.profitability.roic && ratios.profitability.roic > 10 ? 'good' : 'warning'}
                    description="Return on Invested Capital. Rentabilidad del capital invertido."
                    icon={Percent}
                  />
                  <RatioCard
                    name="Margen Bruto"
                    value={ratios.profitability.grossMargin}
                    formattedValue={formatRatio(ratios.profitability.grossMargin, 'percent')}
                    status={evaluateRatioStatus(ratios.profitability.grossMargin, 'grossMargin')}
                    benchmark={30}
                    description="(Ingresos - Coste ventas) / Ingresos."
                    icon={Percent}
                  />
                  <RatioCard
                    name="Margen Operativo"
                    value={ratios.profitability.operatingMargin}
                    formattedValue={formatRatio(ratios.profitability.operatingMargin, 'percent')}
                    status={evaluateRatioStatus(ratios.profitability.operatingMargin, 'operatingMargin')}
                    benchmark={10}
                    description="EBIT / Ingresos. Rentabilidad operativa."
                    icon={Percent}
                  />
                  <RatioCard
                    name="Margen Neto"
                    value={ratios.profitability.netMargin}
                    formattedValue={formatRatio(ratios.profitability.netMargin, 'percent')}
                    status={evaluateRatioStatus(ratios.profitability.netMargin, 'netMargin')}
                    benchmark={6}
                    description="Beneficio neto / Ingresos."
                    icon={Percent}
                  />
                  <RatioCard
                    name="Margen EBITDA"
                    value={ratios.profitability.ebitdaMargin}
                    formattedValue={formatRatio(ratios.profitability.ebitdaMargin, 'percent')}
                    status={ratios.profitability.ebitdaMargin && ratios.profitability.ebitdaMargin > 15 ? 'good' : 'warning'}
                    benchmark={15}
                    description="EBITDA / Ingresos. Rentabilidad antes de amortizaciones."
                    icon={Percent}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Eficiencia */}
          <TabsContent value="efficiency">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Ratios de Eficiencia
                </CardTitle>
                <CardDescription>
                  Eficiencia en la gestión de activos y ciclo de conversión de efectivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <RatioCard
                    name="Rotación Inventario"
                    value={ratios.efficiency.inventoryTurnover}
                    formattedValue={formatRatio(ratios.efficiency.inventoryTurnover, 'times')}
                    status={ratios.efficiency.inventoryTurnover && ratios.efficiency.inventoryTurnover > 6 ? 'good' : 'warning'}
                    description="Coste ventas / Inventario medio. Veces que rota el inventario al año."
                    icon={Clock}
                  />
                  <RatioCard
                    name="Días Inventario"
                    value={ratios.efficiency.inventoryDays}
                    formattedValue={formatRatio(ratios.efficiency.inventoryDays, 'days')}
                    status={ratios.efficiency.inventoryDays && ratios.efficiency.inventoryDays < 60 ? 'good' : 'warning'}
                    description="Días promedio que el inventario permanece en almacén."
                    icon={Clock}
                  />
                  <RatioCard
                    name="PMC (Días Cobro)"
                    value={ratios.efficiency.daysReceivables}
                    formattedValue={formatRatio(ratios.efficiency.daysReceivables, 'days')}
                    status={ratios.efficiency.daysReceivables && ratios.efficiency.daysReceivables < 45 ? 'good' : 'warning'}
                    description="Período medio de cobro a clientes."
                    icon={Clock}
                  />
                  <RatioCard
                    name="PMP (Días Pago)"
                    value={ratios.efficiency.daysPayables}
                    formattedValue={formatRatio(ratios.efficiency.daysPayables, 'days')}
                    status={ratios.efficiency.daysPayables && ratios.efficiency.daysPayables > 30 ? 'good' : 'neutral'}
                    description="Período medio de pago a proveedores."
                    icon={Clock}
                  />
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RatioCard
                    name="Rotación Activos"
                    value={ratios.efficiency.assetTurnover}
                    formattedValue={formatRatio(ratios.efficiency.assetTurnover, 'times')}
                    status={ratios.efficiency.assetTurnover && ratios.efficiency.assetTurnover > 1 ? 'good' : 'warning'}
                    description="Ventas / Activo total. Eficiencia en uso de activos."
                    icon={Activity}
                  />
                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Ciclo de Conversión de Efectivo</span>
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatRatio(ratios.efficiency.cashConversionCycle, 'days')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Días inventario + Días cobro - Días pago
                    </p>
                    <Progress 
                      value={Math.min(100, Math.max(0, 100 - (ratios.efficiency.cashConversionCycle || 0)))} 
                      className="h-2 mt-3" 
                    />
                  </Card>
                  <RatioCard
                    name="Rotación Cuentas x Cobrar"
                    value={ratios.efficiency.receivablesTurnover}
                    formattedValue={formatRatio(ratios.efficiency.receivablesTurnover, 'times')}
                    status={ratios.efficiency.receivablesTurnover && ratios.efficiency.receivablesTurnover > 8 ? 'good' : 'warning'}
                    description="Ventas / Cuentas por cobrar. Eficiencia en cobros."
                    icon={Activity}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default FinancialRatiosPanel;
