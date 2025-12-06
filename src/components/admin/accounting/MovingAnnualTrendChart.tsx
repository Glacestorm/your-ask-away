import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, TrendingUp, Download, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

interface IncomeStatement {
  fiscal_year: number;
  net_revenue?: number;
  other_income?: number;
  financial_income?: number;
  raw_materials?: number;
  personnel_expenses?: number;
  other_expenses?: number;
  depreciation?: number;
  provisions?: number;
  financial_expenses?: number;
}

interface BalanceSheet {
  fiscal_year: number;
  tangible_assets?: number;
  intangible_assets?: number;
  inventory?: number;
  trade_receivables?: number;
  cash_equivalents?: number;
  long_term_debts?: number;
  short_term_debts?: number;
}

interface MovingAnnualTrendChartProps {
  companyId: string;
  companyName: string;
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
}

type TAMCategory = 'ventas_ingresos' | 'compras_gastos' | 'activo_pasivo';
type TAMMetric = string;

const MovingAnnualTrendChart: React.FC<MovingAnnualTrendChartProps> = ({
  companyId,
  companyName,
  incomeStatements,
  balanceSheets
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TAMCategory>('ventas_ingresos');
  const [selectedMetric, setSelectedMetric] = useState<TAMMetric>('ventas');
  const [showThousands, setShowThousands] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [chartType1, setChartType1] = useState('line');
  const [chartType2, setChartType2] = useState('line');

  const categoryOptions: Record<TAMCategory, { label: string; metrics: { key: string; label: string }[] }> = {
    ventas_ingresos: {
      label: 'T.A.M. de Ventas e Ingresos',
      metrics: [
        { key: 'ventas', label: 'T.A.M. Ventas' },
        { key: 'ing_financieros', label: 'T.A.M. Ing.Financieros' },
        { key: 'ing_extraord', label: 'T.A.M. Ing.Extraord.' },
        { key: 'otros_ingresos', label: 'T.A.M. Otros Ingresos' },
        { key: 'ing_totales', label: 'T.A.M. Ing.Totales' }
      ]
    },
    compras_gastos: {
      label: 'T.A.M. de Compras y Gastos',
      metrics: [
        { key: 'compras', label: 'T.A.M. Compras' },
        { key: 'gastos_personal', label: 'T.A.M. Gastos Personal' },
        { key: 'gtos_financieros', label: 'T.A.M. Gtos.Financieros' },
        { key: 'trab_sum_exter', label: 'T.A.M. Trab y Sum.Exter.' },
        { key: 'gastos_diversos', label: 'T.A.M. Gastos Diversos' },
        { key: 'gastos_extraord', label: 'T.A.M. Gastos Extraord.' },
        { key: 'amortizaciones', label: 'T.A.M. Amortizaciones' },
        { key: 'provisiones', label: 'T.A.M. Provisiones' },
        { key: 'gastos_totales', label: 'T.A.M. Gastos Totales' }
      ]
    },
    activo_pasivo: {
      label: 'T.A.M. del Activo - Pasivo',
      metrics: [
        { key: 'activo_fijo', label: 'T.A.M. Activo Fijo' },
        { key: 'existencias', label: 'T.A.M. Existencias' },
        { key: 'realizable', label: 'T.A.M. Realizable' },
        { key: 'tesoreria', label: 'T.A.M. Tesorería' },
        { key: 'deudas_lgo_pzo', label: 'T.A.M. Deudas Lgo.Pzo.' },
        { key: 'deudas_cto_pzo', label: 'T.A.M. Deudas Cto.Pzo.' }
      ]
    }
  };

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(displayValue);
  };

  // Generate monthly data for TAM analysis (simulated based on annual data)
  const monthlyData = useMemo(() => {
    const months = [
      'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
      'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
    ];

    const sortedStatements = [...incomeStatements].sort((a, b) => b.fiscal_year - a.fiscal_year);
    const currentYear = sortedStatements[0];
    const previousYear = sortedStatements[1];

    if (!currentYear) return [];

    const getMetricValue = (statement: IncomeStatement | undefined, metric: string): number => {
      if (!statement) return 0;
      switch (metric) {
        case 'ventas': return statement.net_revenue || 0;
        case 'ing_financieros': return statement.financial_income || 0;
        case 'otros_ingresos': return statement.other_income || 0;
        case 'ing_totales': return (statement.net_revenue || 0) + (statement.other_income || 0) + (statement.financial_income || 0);
        case 'compras': return statement.raw_materials || 0;
        case 'gastos_personal': return statement.personnel_expenses || 0;
        case 'gtos_financieros': return statement.financial_expenses || 0;
        case 'gastos_diversos': return statement.other_expenses || 0;
        case 'amortizaciones': return statement.depreciation || 0;
        case 'provisiones': return statement.provisions || 0;
        case 'gastos_totales': return (statement.raw_materials || 0) + (statement.personnel_expenses || 0) + 
          (statement.other_expenses || 0) + (statement.depreciation || 0) + (statement.provisions || 0);
        default: return 0;
      }
    };

    const getBalanceMetricValue = (year: number, metric: string): number => {
      const balance = balanceSheets.find(b => b.fiscal_year === year);
      if (!balance) return 0;
      switch (metric) {
        case 'activo_fijo': return (balance.tangible_assets || 0) + (balance.intangible_assets || 0);
        case 'existencias': return balance.inventory || 0;
        case 'realizable': return balance.trade_receivables || 0;
        case 'tesoreria': return balance.cash_equivalents || 0;
        case 'deudas_lgo_pzo': return balance.long_term_debts || 0;
        case 'deudas_cto_pzo': return balance.short_term_debts || 0;
        default: return 0;
      }
    };

    const annualCurrentValue = selectedCategory === 'activo_pasivo' 
      ? getBalanceMetricValue(currentYear.fiscal_year, selectedMetric)
      : getMetricValue(currentYear, selectedMetric);
    
    const annualPreviousValue = selectedCategory === 'activo_pasivo'
      ? getBalanceMetricValue(previousYear?.fiscal_year || 0, selectedMetric)
      : getMetricValue(previousYear, selectedMetric);

    // Distribute annual values across months with some variation
    const monthlyDistribution = [0.07, 0.08, 0.09, 0.08, 0.085, 0.08, 0.075, 0.065, 0.09, 0.10, 0.095, 0.085];

    let accumulated = 0;
    return months.map((month, index) => {
      const currentMonthValue = annualCurrentValue * monthlyDistribution[index];
      const previousMonthValue = annualPreviousValue * monthlyDistribution[index];
      accumulated += currentMonthValue;
      
      // TAM = sum of last 12 months
      const tam = accumulated + (annualPreviousValue * (1 - monthlyDistribution.slice(0, index + 1).reduce((a, b) => a + b, 0)));
      const variation = previousMonthValue !== 0 ? ((currentMonthValue - previousMonthValue) / Math.abs(previousMonthValue)) * 100 : 0;

      return {
        month: `${month} ${currentYear.fiscal_year}`,
        monthShort: month.substring(0, 3),
        ejerActual: currentMonthValue,
        ejerAnterior: previousMonthValue,
        acumulado: accumulated,
        tam: tam,
        variacion: variation
      };
    });
  }, [incomeStatements, balanceSheets, selectedMetric, selectedCategory]);

  const currentYearChartData = monthlyData.map(d => ({
    name: d.monthShort,
    value: d.ejerActual
  }));

  const previousYearChartData = monthlyData.map(d => ({
    name: d.monthShort,
    value: d.ejerAnterior
  }));

  const tamChartData = monthlyData.map(d => ({
    name: d.monthShort,
    tam: d.tam,
    acumulado: d.acumulado,
    actual: d.ejerActual
  }));

  const currentMetricLabel = categoryOptions[selectedCategory].metrics.find(m => m.key === selectedMetric)?.label || selectedMetric;

  return (
    <div className="flex h-full bg-[#1a1a2e] text-amber-100 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#16213e] border-r border-amber-900/30 p-3 overflow-y-auto">
        {/* Category Selection */}
        {Object.entries(categoryOptions).map(([key, category]) => (
          <Collapsible key={key} defaultOpen={key === selectedCategory}>
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded text-sm font-medium"
              onClick={() => setSelectedCategory(key as TAMCategory)}
            >
              <span>{category.label}</span>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-2 space-y-1">
              {category.metrics.map((metric) => (
                <button
                  key={metric.key}
                  onClick={() => {
                    setSelectedCategory(key as TAMCategory);
                    setSelectedMetric(metric.key);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2 ${
                    selectedCategory === key && selectedMetric === metric.key
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-200 hover:bg-amber-900/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {metric.label}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Info Section */}
        <div className="mt-4 pt-4 border-t border-amber-900/30">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 text-amber-300 text-sm hover:text-amber-100"
          >
            <Info className="h-4 w-4" />
            Informació
          </button>
          {showInfo && (
            <div className="mt-2 p-2 bg-amber-900/20 rounded text-xs text-amber-200">
              <p>La Tendència Anual Mòbil (T.A.M.) mostra l'evolució dels darrers 12 mesos per eliminar estacionalitat.</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="thousands" className="text-xs text-amber-200">Milers €</Label>
            <Switch
              id="thousands"
              checked={showThousands}
              onCheckedChange={setShowThousands}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-4 border-b border-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-amber-300">TENDÈNCIA ANUAL MÒBIL (T.A.M.)</h1>
              <p className="text-sm text-amber-200/70">{companyName} - {currentMetricLabel}</p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/30">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-auto">
          {/* Left Column - Table */}
          <div className="space-y-4">
            {/* TAM Data Table */}
            <Card className="bg-[#16213e] border-amber-900/30">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-900/30 to-transparent">
                <CardTitle className="text-sm text-amber-300">TENDÈNCIA ANUAL MÒBIL</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-900/30 hover:bg-transparent">
                        <TableHead className="text-amber-300 text-xs py-2 sticky top-0 bg-[#16213e]">Període</TableHead>
                        <TableHead className="text-amber-300 text-xs py-2 text-right sticky top-0 bg-[#16213e]">Ejer.Actual</TableHead>
                        <TableHead className="text-amber-300 text-xs py-2 text-right sticky top-0 bg-[#16213e]">Ejer.Anter.</TableHead>
                        <TableHead className="text-amber-300 text-xs py-2 text-right sticky top-0 bg-[#16213e]">Acumulat</TableHead>
                        <TableHead className="text-amber-300 text-xs py-2 text-right sticky top-0 bg-[#16213e]">T.A.M.</TableHead>
                        <TableHead className="text-amber-300 text-xs py-2 text-right sticky top-0 bg-[#16213e]">Variació</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((row, idx) => (
                        <TableRow key={idx} className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-xs py-1.5 font-medium">{row.month}</TableCell>
                          <TableCell className="text-cyan-300 text-xs py-1.5 text-right font-mono">
                            {formatValue(row.ejerActual)}
                          </TableCell>
                          <TableCell className="text-amber-200 text-xs py-1.5 text-right font-mono">
                            {formatValue(row.ejerAnterior)}
                          </TableCell>
                          <TableCell className="text-green-300 text-xs py-1.5 text-right font-mono">
                            {formatValue(row.acumulado)}
                          </TableCell>
                          <TableCell className="text-amber-100 text-xs py-1.5 text-right font-mono font-bold">
                            {formatValue(row.tam)}
                          </TableCell>
                          <TableCell className={`text-xs py-1.5 text-right font-mono ${
                            row.variacion >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {row.variacion.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-[#16213e] border-amber-900/30 p-3">
                <div className="text-xs text-amber-300">Total Actual</div>
                <div className="text-lg font-bold text-cyan-300">
                  {formatValue(monthlyData.reduce((sum, d) => sum + d.ejerActual, 0))}
                </div>
              </Card>
              <Card className="bg-[#16213e] border-amber-900/30 p-3">
                <div className="text-xs text-amber-300">Total Anterior</div>
                <div className="text-lg font-bold text-amber-200">
                  {formatValue(monthlyData.reduce((sum, d) => sum + d.ejerAnterior, 0))}
                </div>
              </Card>
              <Card className="bg-[#16213e] border-amber-900/30 p-3">
                <div className="text-xs text-amber-300">Variació Mitjana</div>
                <div className={`text-lg font-bold ${
                  monthlyData.reduce((sum, d) => sum + d.variacion, 0) / monthlyData.length >= 0 
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(monthlyData.reduce((sum, d) => sum + d.variacion, 0) / monthlyData.length).toFixed(1)}%
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column - Charts */}
          <div className="space-y-4">
            {/* Current vs Previous Year Charts */}
            <div className="grid grid-cols-2 gap-3">
              {/* Current Year Chart */}
              <Card className="bg-[#16213e] border-amber-900/30">
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs text-amber-300">Dades Exercici Actual</CardTitle>
                    <Select value={chartType1} onValueChange={setChartType1}>
                      <SelectTrigger className="w-20 h-6 text-xs bg-transparent border-amber-900/30 text-amber-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Línia</SelectItem>
                        <SelectItem value="area">Àrea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType1 === 'line' ? (
                        <LineChart data={currentYearChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#fcd34d', fontSize: 8 }} width={40} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                            labelStyle={{ color: '#fcd34d' }}
                          />
                          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      ) : (
                        <AreaChart data={currentYearChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#fcd34d', fontSize: 8 }} width={40} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Year Chart */}
              <Card className="bg-[#16213e] border-amber-900/30">
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs text-amber-300">Dades Exercici Anterior</CardTitle>
                    <Select value={chartType2} onValueChange={setChartType2}>
                      <SelectTrigger className="w-20 h-6 text-xs bg-transparent border-amber-900/30 text-amber-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Línia</SelectItem>
                        <SelectItem value="area">Àrea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType2 === 'line' ? (
                        <LineChart data={previousYearChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#fcd34d', fontSize: 8 }} width={40} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                          />
                          <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      ) : (
                        <AreaChart data={previousYearChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#fcd34d', fontSize: 8 }} width={40} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TAM Trend Chart */}
            <Card className="bg-[#16213e] border-amber-900/30">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-900/20 to-transparent">
                <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  TENDÈNCIA ANUAL MÒBIL (T.A.M.)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tamChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#fcd34d', fontSize: 9 }} width={50} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                        labelStyle={{ color: '#fcd34d' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="tam" name="T.A.M." stroke="#22d3ee" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Z-Chart */}
            <Card className="bg-[#16213e] border-amber-900/30">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-green-900/20 to-transparent">
                <CardTitle className="text-sm text-amber-300">
                  Gràfic 'Z': (T.A.M., acumulats i valors actuals)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tamChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#fcd34d', fontSize: 9 }} width={50} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                        labelStyle={{ color: '#fcd34d' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="tam" name="T.A.M." stroke="#22d3ee" strokeWidth={2} />
                      <Line type="monotone" dataKey="acumulado" name="Acumulat" stroke="#4ade80" strokeWidth={2} />
                      <Line type="monotone" dataKey="actual" name="Actual" stroke="#fbbf24" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0f0f1a] border-t border-amber-900/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200/60">
          <div className="flex items-center gap-4">
            <span>📊 {companyName}</span>
            <span>Tendències Anuals Mòbils (TAM)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Anàlisi del període: MENSUAL</span>
            <span className="px-2 py-0.5 bg-amber-900/30 rounded">Adaptació PGC Andorra</span>
            <span>{new Date().toLocaleDateString('ca-ES')} {new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovingAnnualTrendChart;
