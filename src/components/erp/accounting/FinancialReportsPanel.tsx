/**
 * FinancialReportsPanel - Panel de estados financieros con IA
 * Fase 2: Reportes Financieros Avanzados
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPFinancialReports, BalanceSheet, IncomeStatement, FinancialRatios, AIFinancialAnalysis } from '@/hooks/erp/useERPFinancialReports';
import { getCountryCurrency } from '@/lib/erp/accounting-dictionaries';
import { cn } from '@/lib/utils';

interface FinancialReportsPanelProps {
  className?: string;
}

export function FinancialReportsPanel({ className }: FinancialReportsPanelProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    balanceSheet,
    incomeStatement,
    cashFlow,
    ratios,
    aiAnalysis,
    isAnalyzing,
    generateBalanceSheet,
    generateIncomeStatement,
    generateCashFlowStatement,
    calculateFinancialRatios,
    analyzeWithAI,
    exportReport,
    generateAllReports
  } = useERPFinancialReports();

  const countryCode = currentCompany?.country || 'ES';
  const currency = getCountryCurrency(countryCode);

  // Período seleccionado
  const [periodType, setPeriodType] = useState<string>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('balance');

  // Calcular fechas según período
  const getPeriodDates = () => {
    const now = selectedDate;
    switch (periodType) {
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          start: format(quarterStart, 'yyyy-MM-dd'),
          end: format(quarterEnd, 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };

  // Generar reportes
  const handleGenerate = async () => {
    const { start, end } = getPeriodDates();
    await generateAllReports(start, end);
  };

  // Analizar con IA
  const handleAIAnalysis = async () => {
    const { start, end } = getPeriodDates();
    await analyzeWithAI('comprehensive', start, end);
  };

  // Formatear número
  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  // Formatear porcentaje
  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${formatNumber(num, 1)}%`;
  };

  // Renderizar Balance de Situación
  const renderBalanceSheet = () => {
    if (!balanceSheet) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Genere el balance para ver los datos</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Activos */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            ACTIVO
          </h4>
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Activo Corriente</div>
            {balanceSheet.assets.current.map((item) => (
              <div
                key={item.account_code}
                className={cn(
                  "flex justify-between text-sm",
                  item.is_total && "font-semibold border-t pt-1"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono">{formatNumber(item.balance)} {currency.symbol}</span>
              </div>
            ))}
            
            <div className="text-xs text-muted-foreground font-medium mt-3">Activo No Corriente</div>
            {balanceSheet.assets.non_current.map((item) => (
              <div
                key={item.account_code}
                className={cn(
                  "flex justify-between text-sm",
                  item.is_total && "font-semibold border-t pt-1"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono">{formatNumber(item.balance)} {currency.symbol}</span>
              </div>
            ))}
            
            <div className="flex justify-between font-bold text-base border-t-2 pt-2 mt-3">
              <span>TOTAL ACTIVO</span>
              <span className="font-mono">{formatNumber(balanceSheet.assets.total)} {currency.symbol}</span>
            </div>
          </div>
        </div>

        {/* Pasivo + Patrimonio */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            PASIVO Y PATRIMONIO NETO
          </h4>
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Pasivo Corriente</div>
            {balanceSheet.liabilities.current.map((item) => (
              <div
                key={item.account_code}
                className={cn(
                  "flex justify-between text-sm",
                  item.is_total && "font-semibold border-t pt-1"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono">{formatNumber(item.balance)} {currency.symbol}</span>
              </div>
            ))}
            
            <div className="text-xs text-muted-foreground font-medium mt-3">Pasivo No Corriente</div>
            {balanceSheet.liabilities.non_current.map((item) => (
              <div
                key={item.account_code}
                className={cn(
                  "flex justify-between text-sm",
                  item.is_total && "font-semibold border-t pt-1"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono">{formatNumber(item.balance)} {currency.symbol}</span>
              </div>
            ))}

            <div className="text-xs text-muted-foreground font-medium mt-3">Patrimonio Neto</div>
            {balanceSheet.equity.items.map((item) => (
              <div
                key={item.account_code}
                className={cn(
                  "flex justify-between text-sm",
                  item.is_total && "font-semibold border-t pt-1"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono">{formatNumber(item.balance)} {currency.symbol}</span>
              </div>
            ))}
            
            <div className="flex justify-between font-bold text-base border-t-2 pt-2 mt-3">
              <span>TOTAL PASIVO + PATRIMONIO</span>
              <span className="font-mono">{formatNumber(balanceSheet.total_liabilities_equity)} {currency.symbol}</span>
            </div>
          </div>
        </div>

        {/* Verificación cuadre */}
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          balanceSheet.is_balanced ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
        )}>
          {balanceSheet.is_balanced ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Balance cuadrado correctamente
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Error: El balance no cuadra
            </>
          )}
        </div>
      </div>
    );
  };

  // Renderizar Cuenta de Resultados
  const renderIncomeStatement = () => {
    if (!incomeStatement) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Genere la cuenta de resultados para ver los datos</p>
        </div>
      );
    }

    const isProfit = incomeStatement.net_income >= 0;

    return (
      <div className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Ingresos</div>
            <div className="text-lg font-bold text-green-600">
              {formatNumber(incomeStatement.revenue.total)} {currency.symbol}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Margen Bruto</div>
            <div className="text-lg font-bold">
              {formatNumber(incomeStatement.gross_profit)} {currency.symbol}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">EBITDA</div>
            <div className="text-lg font-bold">
              {formatNumber(incomeStatement.ebitda || 0)} {currency.symbol}
            </div>
          </Card>
          <Card className={cn("p-3", isProfit ? "bg-green-500/10" : "bg-red-500/10")}>
            <div className="text-xs text-muted-foreground">Resultado Neto</div>
            <div className={cn(
              "text-lg font-bold flex items-center gap-1",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatNumber(incomeStatement.net_income)} {currency.symbol}
            </div>
          </Card>
        </div>

        {/* Detalle */}
        <div className="border rounded-lg p-4 space-y-3">
          {/* Ingresos */}
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Ingresos de Explotación</div>
            {incomeStatement.revenue.items.map((item) => (
              <div
                key={item.account_code}
                className="flex justify-between text-sm"
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono text-green-600">{formatNumber(item.amount)} {currency.symbol}</span>
              </div>
            ))}
          </div>

          {/* Coste de ventas */}
          <div className="border-t pt-2">
            <div className="text-xs text-muted-foreground font-medium mb-1">Coste de Ventas</div>
            {incomeStatement.cost_of_sales.items.map((item) => (
              <div
                key={item.account_code}
                className="flex justify-between text-sm"
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono text-red-600">({formatNumber(Math.abs(item.amount))}) {currency.symbol}</span>
              </div>
            ))}
          </div>

          {/* Margen bruto */}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>MARGEN BRUTO</span>
            <span className="font-mono">{formatNumber(incomeStatement.gross_profit)} {currency.symbol}</span>
          </div>

          {/* Gastos operativos */}
          <div className="border-t pt-2">
            <div className="text-xs text-muted-foreground font-medium mb-1">Gastos de Explotación</div>
            {incomeStatement.operating_expenses.items.map((item) => (
              <div
                key={item.account_code}
                className="flex justify-between text-sm"
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <span>{item.account_name}</span>
                <span className="font-mono text-red-600">({formatNumber(Math.abs(item.amount))}) {currency.symbol}</span>
              </div>
            ))}
          </div>

          {/* Resultado operativo */}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>RESULTADO DE EXPLOTACIÓN</span>
            <span className="font-mono">{formatNumber(incomeStatement.operating_income)} {currency.symbol}</span>
          </div>

          {/* Resultado neto */}
          <div className={cn(
            "flex justify-between font-bold text-base border-t-2 pt-2",
            isProfit ? "text-green-600" : "text-red-600"
          )}>
            <span>RESULTADO DEL EJERCICIO</span>
            <span className="font-mono">{formatNumber(incomeStatement.net_income)} {currency.symbol}</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar Ratios
  const renderRatios = () => {
    if (!ratios) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Genere los reportes para ver los ratios</p>
        </div>
      );
    }

    const RatioCard = ({ label, value, format: fmt = 'number', benchmark, good }: {
      label: string;
      value: number;
      format?: 'number' | 'percent' | 'currency' | 'times';
      benchmark?: number;
      good?: 'higher' | 'lower';
    }) => {
      let displayValue = '';
      switch (fmt) {
        case 'percent':
          displayValue = `${formatNumber(value * 100, 1)}%`;
          break;
        case 'currency':
          displayValue = `${formatNumber(value)} ${currency.symbol}`;
          break;
        case 'times':
          displayValue = `${formatNumber(value, 2)}x`;
          break;
        default:
          displayValue = formatNumber(value, 2);
      }

      const isGood = benchmark && good 
        ? (good === 'higher' ? value >= benchmark : value <= benchmark)
        : undefined;

      return (
        <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
          <span className="text-sm">{label}</span>
          <span className={cn(
            "font-mono font-medium",
            isGood === true && "text-green-600",
            isGood === false && "text-amber-600"
          )}>
            {displayValue}
          </span>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liquidez */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            Liquidez
          </h4>
          <div className="space-y-1">
            <RatioCard label="Ratio Corriente" value={ratios.current_ratio} format="times" benchmark={1.5} good="higher" />
            <RatioCard label="Prueba Ácida" value={ratios.quick_ratio} format="times" benchmark={1} good="higher" />
            <RatioCard label="Ratio de Caja" value={ratios.cash_ratio} format="times" />
            <RatioCard label="Capital de Trabajo" value={ratios.working_capital} format="currency" />
          </div>
        </Card>

        {/* Solvencia */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-purple-500" />
            Solvencia
          </h4>
          <div className="space-y-1">
            <RatioCard label="Deuda/Patrimonio" value={ratios.debt_to_equity} format="times" benchmark={2} good="lower" />
            <RatioCard label="Ratio de Endeudamiento" value={ratios.debt_ratio} format="percent" benchmark={0.6} good="lower" />
            <RatioCard label="Ratio de Autonomía" value={ratios.equity_ratio} format="percent" benchmark={0.4} good="higher" />
            {ratios.interest_coverage && (
              <RatioCard label="Cobertura de Intereses" value={ratios.interest_coverage} format="times" benchmark={3} good="higher" />
            )}
          </div>
        </Card>

        {/* Rentabilidad */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Rentabilidad
          </h4>
          <div className="space-y-1">
            <RatioCard label="Margen Bruto" value={ratios.gross_margin} format="percent" />
            <RatioCard label="Margen Operativo" value={ratios.operating_margin} format="percent" />
            <RatioCard label="Margen Neto" value={ratios.net_margin} format="percent" />
            <RatioCard label="ROE" value={ratios.roe} format="percent" benchmark={0.15} good="higher" />
            <RatioCard label="ROA" value={ratios.roa} format="percent" benchmark={0.05} good="higher" />
          </div>
        </Card>

        {/* Eficiencia */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            Eficiencia
          </h4>
          <div className="space-y-1">
            <RatioCard label="Rotación de Activos" value={ratios.asset_turnover} format="times" />
            {ratios.inventory_turnover && (
              <RatioCard label="Rotación de Inventario" value={ratios.inventory_turnover} format="times" />
            )}
            {ratios.days_sales_outstanding && (
              <RatioCard label="Días Cobro (DSO)" value={ratios.days_sales_outstanding} />
            )}
            {ratios.days_payables_outstanding && (
              <RatioCard label="Días Pago (DPO)" value={ratios.days_payables_outstanding} />
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Renderizar Análisis IA
  const renderAIAnalysis = () => {
    if (!aiAnalysis) {
      return (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto mb-3 text-primary/40" />
          <p className="text-muted-foreground mb-4">
            Utilice el análisis con IA para obtener insights sobre su situación financiera
          </p>
          <Button onClick={handleAIAnalysis} disabled={isAnalyzing || !balanceSheet}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar con IA
              </>
            )}
          </Button>
        </div>
      );
    }

    const riskColors = {
      low: 'bg-green-500/10 text-green-600 border-green-500/20',
      medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      high: 'bg-red-500/10 text-red-600 border-red-500/20'
    };

    const outlookColors = {
      positive: 'text-green-600',
      neutral: 'text-muted-foreground',
      negative: 'text-red-600'
    };

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={cn("px-3 py-1", riskColors[aiAnalysis.risk_level])}>
              Riesgo: {aiAnalysis.risk_level === 'low' ? 'Bajo' : aiAnalysis.risk_level === 'medium' ? 'Medio' : 'Alto'}
            </Badge>
            <span className={cn("text-sm font-medium", outlookColors[aiAnalysis.outlook])}>
              Perspectiva {aiAnalysis.outlook === 'positive' ? 'Positiva' : aiAnalysis.outlook === 'neutral' ? 'Neutral' : 'Negativa'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleAIAnalysis} disabled={isAnalyzing}>
            <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
          </Button>
        </div>

        {/* Resumen */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <p className="text-sm leading-relaxed">{aiAnalysis.summary}</p>
        </Card>

        {/* Fortalezas y Preocupaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-green-500/20">
            <h4 className="font-semibold text-sm mb-2 text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Fortalezas
            </h4>
            <ul className="space-y-1">
              {aiAnalysis.strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 text-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-amber-500/20">
            <h4 className="font-semibold text-sm mb-2 text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Áreas de Atención
            </h4>
            <ul className="space-y-1">
              {aiAnalysis.concerns.map((c, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 text-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Recomendaciones */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recomendaciones
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.recommendations.map((r, i) => (
              <li key={i} className="text-sm p-2 bg-muted/50 rounded flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>

        {/* Métricas clave */}
        {aiAnalysis.key_metrics_analysis.length > 0 && (
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3">Análisis de Métricas Clave</h4>
            <div className="space-y-2">
              {aiAnalysis.key_metrics_analysis.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="text-sm font-medium">{m.metric}</div>
                    <div className="text-xs text-muted-foreground">{m.assessment}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">{m.value}</div>
                    {m.benchmark && (
                      <div className="text-xs text-muted-foreground">vs {m.benchmark}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Estados Financieros</CardTitle>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de período */}
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensual</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>

            {/* Selector de fecha */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[140px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, 'MMM yyyy', { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            {/* Generar */}
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Generar
                </>
              )}
            </Button>

            {/* Exportar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport(activeTab as any, 'pdf')}
              disabled={!balanceSheet && !incomeStatement}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="balance" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Balance
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              P&L
            </TabsTrigger>
            <TabsTrigger value="ratios" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Ratios
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              IA
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden px-4 pb-4">
            <ScrollArea className="h-full">
              <TabsContent value="balance" className="mt-0">
                {renderBalanceSheet()}
              </TabsContent>
              <TabsContent value="income" className="mt-0">
                {renderIncomeStatement()}
              </TabsContent>
              <TabsContent value="ratios" className="mt-0">
                {renderRatios()}
              </TabsContent>
              <TabsContent value="ai" className="mt-0">
                {renderAIAnalysis()}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FinancialReportsPanel;
