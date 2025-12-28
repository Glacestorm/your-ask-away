/**
 * Financial Reports Component
 * Balance, PyG, Flujo de Caja con exportación
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  Scale,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useObelixiaReports } from '@/hooks/admin/obelixia-accounting/useObelixiaReports';
import { format, startOfYear, endOfYear, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function FinancialReports() {
  const [activeTab, setActiveTab] = useState('balance');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [periodStart, setPeriodStart] = useState<Date>(startOfYear(new Date()));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date());
  const [showComparative, setShowComparative] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const {
    isLoading,
    balanceSheet,
    incomeStatement,
    cashFlow,
    getBalanceSheet,
    getIncomeStatement,
    getCashFlowStatement,
    exportReport
  } = useObelixiaReports();

  useEffect(() => {
    handleRefresh();
  }, [activeTab, selectedYear, asOfDate, periodStart, periodEnd]);

  const handleRefresh = () => {
    switch (activeTab) {
      case 'balance':
        getBalanceSheet(
          format(asOfDate, 'yyyy-MM-dd'),
          showComparative ? format(subYears(asOfDate, 1), 'yyyy-MM-dd') : undefined
        );
        break;
      case 'income':
        getIncomeStatement(
          format(periodStart, 'yyyy-MM-dd'),
          format(periodEnd, 'yyyy-MM-dd'),
          showComparative
        );
        break;
      case 'cashflow':
        getCashFlowStatement(
          format(periodStart, 'yyyy-MM-dd'),
          format(periodEnd, 'yyyy-MM-dd')
        );
        break;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    const reportType = activeTab === 'balance' ? 'balance_sheet' :
                       activeTab === 'income' ? 'income_statement' :
                       'cash_flow';
    await exportReport(reportType, {
      format,
      include_comparatives: showComparative,
      include_notes: true,
      language: 'es'
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Reportes Financieros
          </h2>
          <p className="text-sm text-muted-foreground">
            Balance, Cuenta de Resultados y Flujo de Caja
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={isLoading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="balance" className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              Balance
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              PyG
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Flujo de Caja
            </TabsTrigger>
          </TabsList>

          {/* Date Controls */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === 'balance' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {format(asOfDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={asOfDate}
                    onSelect={(date) => date && setAsOfDate(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant={showComparative ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowComparative(!showComparative)}
            >
              Comparativo
            </Button>
          </div>
        </div>

        {/* Balance Sheet */}
        <TabsContent value="balance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Assets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    Activo
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(balanceSheet?.assets?.total || 0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        {showComparative && (
                          <TableHead className="text-right">Variación</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Non-Current Assets */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={showComparative ? 3 : 2}>
                          Activo No Corriente
                        </TableCell>
                      </TableRow>
                      {balanceSheet?.assets?.non_current?.map((row, idx) => (
                        <TableRow key={`nc-${idx}`}>
                          <TableCell className="pl-6">{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.balance)}
                          </TableCell>
                          {showComparative && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs",
                                (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                                (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatPercent(row.variation_percent)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Current Assets */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={showComparative ? 3 : 2}>
                          Activo Corriente
                        </TableCell>
                      </TableRow>
                      {balanceSheet?.assets?.current?.map((row, idx) => (
                        <TableRow key={`c-${idx}`}>
                          <TableCell className="pl-6">{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.balance)}
                          </TableCell>
                          {showComparative && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs",
                                (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                                (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatPercent(row.variation_percent)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                    Pasivo y Patrimonio
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(balanceSheet?.total_liabilities_equity || 0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        {showComparative && (
                          <TableHead className="text-right">Variación</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Equity */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={showComparative ? 3 : 2}>
                          Patrimonio Neto
                        </TableCell>
                      </TableRow>
                      {balanceSheet?.equity?.items?.map((row, idx) => (
                        <TableRow key={`eq-${idx}`}>
                          <TableCell className="pl-6">{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.balance)}
                          </TableCell>
                          {showComparative && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs",
                                (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                                (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatPercent(row.variation_percent)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Non-Current Liabilities */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={showComparative ? 3 : 2}>
                          Pasivo No Corriente
                        </TableCell>
                      </TableRow>
                      {balanceSheet?.liabilities?.non_current?.map((row, idx) => (
                        <TableRow key={`pnc-${idx}`}>
                          <TableCell className="pl-6">{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.balance)}
                          </TableCell>
                          {showComparative && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs",
                                (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                                (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatPercent(row.variation_percent)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Current Liabilities */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={showComparative ? 3 : 2}>
                          Pasivo Corriente
                        </TableCell>
                      </TableRow>
                      {balanceSheet?.liabilities?.current?.map((row, idx) => (
                        <TableRow key={`pc-${idx}`}>
                          <TableCell className="pl-6">{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.balance)}
                          </TableCell>
                          {showComparative && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs",
                                (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                                (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatPercent(row.variation_percent)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Balance Check */}
          <Card className={cn(
            "border-2",
            balanceSheet?.is_balanced ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"
          )}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {balanceSheet?.is_balanced ? (
                  <Badge className="bg-emerald-100 text-emerald-800">✓ Cuadrado</Badge>
                ) : (
                  <Badge variant="destructive">✗ Descuadrado</Badge>
                )}
                <span className="text-sm">
                  Activo: {formatCurrency(balanceSheet?.assets?.total || 0)} | 
                  Pasivo + PN: {formatCurrency(balanceSheet?.total_liabilities_equity || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Cuenta de Pérdidas y Ganancias</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {format(periodStart, 'dd/MM/yyyy')} - {format(periodEnd, 'dd/MM/yyyy')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Concepto</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    {showComparative && (
                      <>
                        <TableHead className="text-right">Anterior</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Operating Income */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={showComparative ? 4 : 2}>
                      1. Ingresos de Explotación
                    </TableCell>
                  </TableRow>
                  {incomeStatement?.operating_income?.map((row, idx) => (
                    <TableRow key={`oi-${idx}`} className={row.is_subtotal ? "font-medium bg-muted/30" : ""}>
                      <TableCell className={row.is_subtotal ? "" : "pl-6"}>
                        {row.account_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {formatCurrency(row.amount)}
                      </TableCell>
                      {showComparative && (
                        <>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatCurrency(row.previous_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "text-xs",
                              (row.variation_percent || 0) > 0 ? "text-emerald-600" : 
                              (row.variation_percent || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                            )}>
                              {formatPercent(row.variation_percent)}
                            </span>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

                  {/* Operating Expenses */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={showComparative ? 4 : 2}>
                      2. Gastos de Explotación
                    </TableCell>
                  </TableRow>
                  {incomeStatement?.operating_expenses?.map((row, idx) => (
                    <TableRow key={`oe-${idx}`} className={row.is_subtotal ? "font-medium bg-muted/30" : ""}>
                      <TableCell className={row.is_subtotal ? "" : "pl-6"}>
                        {row.account_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        ({formatCurrency(Math.abs(row.amount))})
                      </TableCell>
                      {showComparative && (
                        <>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            ({formatCurrency(Math.abs(row.previous_amount || 0))})
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "text-xs",
                              (row.variation_percent || 0) < 0 ? "text-emerald-600" : 
                              (row.variation_percent || 0) > 0 ? "text-red-600" : "text-muted-foreground"
                            )}>
                              {formatPercent(row.variation_percent)}
                            </span>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

                  {/* Results */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell>A) RESULTADO DE EXPLOTACIÓN</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      (incomeStatement?.operating_result || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(incomeStatement?.operating_result || 0)}
                    </TableCell>
                    {showComparative && <TableCell colSpan={2}></TableCell>}
                  </TableRow>

                  <TableRow>
                    <TableCell>Resultado Financiero</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      (incomeStatement?.financial_result || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(incomeStatement?.financial_result || 0)}
                    </TableCell>
                    {showComparative && <TableCell colSpan={2}></TableCell>}
                  </TableRow>

                  <TableRow className="font-medium">
                    <TableCell>B) RESULTADO ANTES DE IMPUESTOS</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      (incomeStatement?.pre_tax_result || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(incomeStatement?.pre_tax_result || 0)}
                    </TableCell>
                    {showComparative && <TableCell colSpan={2}></TableCell>}
                  </TableRow>

                  <TableRow>
                    <TableCell className="pl-6">Impuesto sobre beneficios</TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      ({formatCurrency(Math.abs(incomeStatement?.tax_expense || 0))})
                    </TableCell>
                    {showComparative && <TableCell colSpan={2}></TableCell>}
                  </TableRow>

                  <TableRow className="bg-primary/20 font-bold text-lg">
                    <TableCell>C) RESULTADO DEL EJERCICIO</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      (incomeStatement?.net_result || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(incomeStatement?.net_result || 0)}
                    </TableCell>
                    {showComparative && (
                      <>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(incomeStatement?.previous_net_result)}
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EBITDA Card */}
          {incomeStatement?.ebitda !== undefined && (
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="py-4 flex items-center justify-between">
                <span className="font-medium">EBITDA</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(incomeStatement.ebitda)}
                </span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Estado de Flujos de Efectivo</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {format(periodStart, 'dd/MM/yyyy')} - {format(periodEnd, 'dd/MM/yyyy')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Concepto</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance */}
                  <TableRow className="font-medium">
                    <TableCell>Efectivo al inicio del período</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(cashFlow?.opening_balance || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Operating Activities */}
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 font-medium">
                    <TableCell>A) Flujos de Efectivo de Actividades de Explotación</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      (cashFlow?.operating_activities?.total || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(cashFlow?.operating_activities?.total || 0)}
                    </TableCell>
                  </TableRow>
                  {cashFlow?.operating_activities?.items?.map((item, idx) => (
                    <TableRow key={`op-${idx}`}>
                      <TableCell className="pl-6">{item.description}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        item.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Investing Activities */}
                  <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 font-medium">
                    <TableCell>B) Flujos de Efectivo de Actividades de Inversión</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      (cashFlow?.investing_activities?.total || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(cashFlow?.investing_activities?.total || 0)}
                    </TableCell>
                  </TableRow>
                  {cashFlow?.investing_activities?.items?.map((item, idx) => (
                    <TableRow key={`inv-${idx}`}>
                      <TableCell className="pl-6">{item.description}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        item.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Financing Activities */}
                  <TableRow className="bg-purple-50/50 dark:bg-purple-950/20 font-medium">
                    <TableCell>C) Flujos de Efectivo de Actividades de Financiación</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      (cashFlow?.financing_activities?.total || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(cashFlow?.financing_activities?.total || 0)}
                    </TableCell>
                  </TableRow>
                  {cashFlow?.financing_activities?.items?.map((item, idx) => (
                    <TableRow key={`fin-${idx}`}>
                      <TableCell className="pl-6">{item.description}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        item.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Net Change */}
                  <TableRow className="bg-muted font-medium">
                    <TableCell>D) Aumento/Disminución Neta del Efectivo (A+B+C)</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      (cashFlow?.net_change || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(cashFlow?.net_change || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Closing Balance */}
                  <TableRow className="bg-primary/10 font-bold text-lg">
                    <TableCell>Efectivo al Final del Período</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(cashFlow?.closing_balance || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancialReports;
