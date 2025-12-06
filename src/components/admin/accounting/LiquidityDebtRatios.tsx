import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type BalanceSheet = Database['public']['Tables']['balance_sheets']['Row'];
type IncomeStatement = Database['public']['Tables']['income_statements']['Row'];

interface LiquidityDebtRatiosProps {
  companyId: string;
  companyName: string;
}

const LiquidityDebtRatios: React.FC<LiquidityDebtRatiosProps> = ({
  companyId,
  companyName
}) => {
  const [balanceSheets, setBalanceSheets] = useState<(BalanceSheet & { fiscal_year: number })[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<(IncomeStatement & { fiscal_year: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataViewOption, setDataViewOption] = useState<'values' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(false);
  const [chartGroup1, setChartGroup1] = useState('liquidity');
  const [chartType1, setChartType1] = useState<'bar' | 'line' | 'area'>('bar');
  const [chartGroup2, setChartGroup2] = useState('debt');
  const [chartType2, setChartType2] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    fetchFinancialData();
  }, [companyId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (!statements?.length) {
        setBalanceSheets([]);
        setIncomeStatements([]);
        setLoading(false);
        return;
      }

      const bsPromises = statements.map(s => 
        supabase.from('balance_sheets').select('*').eq('statement_id', s.id).single()
      );
      const isPromises = statements.map(s => 
        supabase.from('income_statements').select('*').eq('statement_id', s.id).single()
      );

      const bsResults = await Promise.all(bsPromises);
      const isResults = await Promise.all(isPromises);

      const bsData = bsResults
        .map((r, i) => r.data ? { ...r.data, fiscal_year: statements[i].fiscal_year } : null)
        .filter(Boolean) as (BalanceSheet & { fiscal_year: number })[];
      
      const isData = isResults
        .map((r, i) => r.data ? { ...r.data, fiscal_year: statements[i].fiscal_year } : null)
        .filter(Boolean) as (IncomeStatement & { fiscal_year: number })[];

      setBalanceSheets(bsData);
      setIncomeStatements(isData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedYears = useMemo(() => {
    const years = [...new Set(balanceSheets.map(bs => bs.fiscal_year))].sort((a, b) => b - a);
    return years.slice(0, 5);
  }, [balanceSheets]);

  const calculateRatios = useMemo(() => {
    return sortedYears.map(year => {
      const bs = balanceSheets.find(b => b.fiscal_year === year);
      const is = incomeStatements.find(i => i.fiscal_year === year);

      if (!bs) return { year, liquidez: 0, fondoManiobra: 0, tesoreria: 0, disponibilidad: 0, endeudamiento: 0, endeudamientoActivo: 0, endeudamientoCP: 0, endeudamientoLP: 0, autonomia: 0, garantia: 0, calidadDeuda: 0, capacidadDevolucion: 0, gastosFinancieros: 0, costeDeuda: 0, costeMedioPasivo: 0 };

      // Current Assets
      const activoCorriente = Number(bs.inventory || 0) + Number(bs.trade_receivables || 0) + 
        Number(bs.short_term_group_receivables || 0) + Number(bs.short_term_financial_investments || 0) + 
        Number(bs.cash_equivalents || 0) + Number(bs.accruals_assets || 0);

      // Current Liabilities
      const pasivoCorriente = Number(bs.short_term_provisions || 0) + Number(bs.short_term_debts || 0) + 
        Number(bs.short_term_group_debts || 0) + Number(bs.trade_payables || 0) + 
        Number(bs.other_creditors || 0) + Number(bs.short_term_accruals || 0);

      // Non-Current Liabilities
      const pasivoNoCorriente = Number(bs.long_term_provisions || 0) + Number(bs.long_term_debts || 0) + 
        Number(bs.long_term_group_debts || 0) + Number(bs.deferred_tax_liabilities || 0) + 
        Number(bs.long_term_accruals || 0);

      // Equity
      const patrimonioNeto = Number(bs.share_capital || 0) + Number(bs.share_premium || 0) + 
        Number(bs.revaluation_reserve || 0) + Number(bs.legal_reserve || 0) + 
        Number(bs.statutory_reserves || 0) + Number(bs.voluntary_reserves || 0) + 
        Number(bs.retained_earnings || 0) + Number(bs.current_year_result || 0) - 
        Number(bs.treasury_shares || 0) - Number(bs.interim_dividend || 0) + 
        Number(bs.capital_grants || 0);

      // Total Assets
      const activoTotal = Number(bs.intangible_assets || 0) + Number(bs.goodwill || 0) + 
        Number(bs.tangible_assets || 0) + Number(bs.real_estate_investments || 0) + 
        Number(bs.long_term_group_investments || 0) + Number(bs.long_term_financial_investments || 0) + 
        Number(bs.deferred_tax_assets || 0) + Number(bs.long_term_trade_receivables || 0) + activoCorriente;

      // Total Liabilities (Deudas Totales)
      const deudasTotales = pasivoCorriente + pasivoNoCorriente;

      // Cash and equivalents (Tesorería)
      const tesoreriaVal = Number(bs.cash_equivalents || 0);

      // Realizable (Trade receivables + short term investments)
      const realizable = Number(bs.trade_receivables || 0) + Number(bs.short_term_group_receivables || 0) + 
        Number(bs.short_term_financial_investments || 0);

      // Working Capital (Fondo de Maniobra)
      const fondoManiobraVal = activoCorriente - pasivoCorriente;

      // Income statement values
      const ventas = Number(is?.net_turnover || 0);
      const gastosFinancierosVal = Number(is?.financial_expenses || 0);
      const beneficioNeto = Number(is?.corporate_tax || 0) ? 
        (Number(is?.net_turnover || 0) + Number(is?.other_operating_income || 0) - 
         Number(is?.supplies || 0) - Number(is?.personnel_expenses || 0) - 
         Number(is?.depreciation || 0) - Number(is?.other_operating_expenses || 0) + 
         Number(is?.financial_income || 0) - Number(is?.financial_expenses || 0) - 
         Number(is?.corporate_tax || 0)) : 0;
      const amortizacion = Number(is?.depreciation || 0);
      const provisiones = Number(is?.excess_provisions || 0);

      // Liquidity Ratios
      const liquidez = pasivoCorriente !== 0 ? activoCorriente / pasivoCorriente : 0;
      const fondoManiobra = pasivoCorriente !== 0 ? (fondoManiobraVal / pasivoCorriente) * 100 : 0;
      const tesoreria = pasivoCorriente !== 0 ? (tesoreriaVal + realizable) / pasivoCorriente : 0;
      const disponibilidad = pasivoCorriente !== 0 ? tesoreriaVal / pasivoCorriente : 0;

      // Debt Ratios
      const endeudamiento = patrimonioNeto !== 0 ? (deudasTotales / patrimonioNeto) * 100 : 0;
      const endeudamientoActivo = activoTotal !== 0 ? (deudasTotales / activoTotal) * 100 : 0;
      const endeudamientoCP = patrimonioNeto !== 0 ? (pasivoCorriente / patrimonioNeto) * 100 : 0;
      const endeudamientoLP = patrimonioNeto !== 0 ? (pasivoNoCorriente / patrimonioNeto) * 100 : 0;
      const autonomia = deudasTotales !== 0 ? (patrimonioNeto / deudasTotales) * 100 : 0;
      const garantia = deudasTotales !== 0 ? activoTotal / deudasTotales : 0;
      const calidadDeuda = deudasTotales !== 0 ? (pasivoCorriente / deudasTotales) * 100 : 0;
      const capacidadDevolucion = deudasTotales !== 0 ? ((beneficioNeto + amortizacion + provisiones) / deudasTotales) * 100 : 0;
      const gastosFinancieros = ventas !== 0 ? (gastosFinancierosVal / ventas) * 100 : 0;
      const costeDeuda = deudasTotales !== 0 ? (gastosFinancierosVal / deudasTotales) * 100 : 0;
      const costeMedioPasivo = (patrimonioNeto + deudasTotales) !== 0 ? (gastosFinancierosVal / (patrimonioNeto + deudasTotales)) * 100 : 0;

      return {
        year,
        liquidez,
        fondoManiobra,
        tesoreria,
        disponibilidad,
        endeudamiento,
        endeudamientoActivo,
        endeudamientoCP,
        endeudamientoLP,
        autonomia,
        garantia,
        calidadDeuda,
        capacidadDevolucion,
        gastosFinancieros,
        costeDeuda,
        costeMedioPasivo
      };
    });
  }, [balanceSheets, incomeStatements, sortedYears]);

  const formatValue = (value: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      return `${value.toFixed(2)} %`;
    }
    return value.toFixed(2);
  };

  const getDeviation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  };

  const liquidityRatios = [
    { key: 'liquidez', name: 'LIQUIDEZ', formula: 'Activo Corriente / Pasivo Corriente', mediaNormal: 'De 1.5 a 2', isPercentage: false },
    { key: 'fondoManiobra', name: 'FONDO DE MANIOBRA SOBRE PASIVO CORRIENTE', formula: 'Fondo de Maniobra / Pasivo Corriente', mediaNormal: 'De 50 a 100', isPercentage: true },
    { key: 'tesoreria', name: 'TESORERÍA', formula: '(Tesorería + Realizable) / Pasivo Corriente', mediaNormal: '1', isPercentage: false },
    { key: 'disponibilidad', name: 'DISPONIBILIDAD', formula: 'Tesorería / Pasivo Corriente', mediaNormal: '0.3', isPercentage: false }
  ];

  const debtRatios = [
    { key: 'endeudamiento', name: 'ENDEUDAMIENTO', formula: 'Deudas Totales / Patrimonio', mediaNormal: 'De 40 a 60', isPercentage: true },
    { key: 'endeudamientoActivo', name: 'ENDEUDAMIENTO DEL ACTIVO', formula: 'Pasivo total / Activo Total', mediaNormal: 'De 40 a 60', isPercentage: true },
    { key: 'endeudamientoCP', name: 'ENDEUDAMIENTO A CORTO PLAZO', formula: 'Pasivo Corriente / Patrimonio Neto', mediaNormal: 'De 40 a 60', isPercentage: true },
    { key: 'endeudamientoLP', name: 'ENDEUDAMIENTO A LARGO PLAZO', formula: 'Pasivo No Corriente / Patrimonio Neto', mediaNormal: 'De 40 a 60', isPercentage: true },
    { key: 'autonomia', name: 'AUTONOMÍA', formula: 'Fondos Propios / Deudas totales', mediaNormal: 'De 70 a 150', isPercentage: true },
    { key: 'garantia', name: 'GARANTÍA', formula: 'Activo real / Deudas totales', mediaNormal: 'Mayor que 1', isPercentage: false },
    { key: 'calidadDeuda', name: 'CALIDAD DE LA DEUDA', formula: 'Pasivo Corriente / Deudas totales', mediaNormal: 'Reducido', isPercentage: true },
    { key: 'capacidadDevolucion', name: 'CAPACIDAD DEVOLUCIÓN DE PRÉSTAMOS', formula: '(Ben.Neto + Amort. + Prov.) / Ptmos.recib.', mediaNormal: 'Elevado', isPercentage: true },
    { key: 'gastosFinancieros', name: 'GASTOS FINANCIEROS SOBRE VENTAS', formula: 'Gastos Financieros / Ventas', mediaNormal: 'Menor que 0.02', isPercentage: true },
    { key: 'costeDeuda', name: 'COSTE DE LA DEUDA', formula: 'Gastos financieros / Deuda con coste', mediaNormal: 'Reducido', isPercentage: true },
    { key: 'costeMedioPasivo', name: 'COSTE MEDIO DEL PASIVO', formula: 'Gastos financieros + Dividendos / Total Pasivo', mediaNormal: 'Reducido', isPercentage: true }
  ];

  const chartData1 = useMemo(() => {
    return [...calculateRatios].reverse().map(r => ({
      name: `${r.year}`,
      liquidez: r.liquidez,
      fondoManiobra: r.fondoManiobra,
      tesoreria: r.tesoreria,
      disponibilidad: r.disponibilidad
    }));
  }, [calculateRatios]);

  const chartData2 = useMemo(() => {
    return [...calculateRatios].reverse().map(r => ({
      name: `${r.year}`,
      endeudamiento: r.endeudamiento,
      autonomia: r.autonomia,
      garantia: r.garantia,
      calidadDeuda: r.calidadDeuda
    }));
  }, [calculateRatios]);

  const renderChart = (data: any[], dataKey: string, chartType: 'bar' | 'line' | 'area', color: string) => {
    const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : AreaChart;
    const DataComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area;

    return (
      <ResponsiveContainer width="100%" height={180}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
          <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            formatter={(value: number) => value.toFixed(2)}
          />
          {chartType === 'bar' && <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />}
          {chartType === 'line' && <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color }} />}
          {chartType === 'area' && <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} fillOpacity={0.3} />}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!balanceSheets.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hi ha dades financeres disponibles per a aquesta empresa.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left Sidebar */}
      <div className="w-48 flex-shrink-0 space-y-4">
        <Card className="bg-card">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs">Visió de dades</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                checked={dataViewOption === 'values'}
                onChange={() => setDataViewOption('values')}
                className="w-3 h-3"
              />
              Vista de valors
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                checked={dataViewOption === 'values_deviation'}
                onChange={() => setDataViewOption('values_deviation')}
                className="w-3 h-3"
              />
              Vista de valors i % de desviació
            </label>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs">Opcions principals</CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-primary">Ràtios</div>
              <div className="pl-2 space-y-0.5 text-muted-foreground">
                <div className="text-primary font-medium">Ràtios de Liquidez i Endeutament</div>
                <div>Ràtios Sectorials</div>
                <div>Simulador Altre Sector</div>
                <div>Piràmide de Ràtios Fin.</div>
                <div>Anàlisi Bancari</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Milers</Label>
              <Switch
                checked={showThousands}
                onCheckedChange={setShowThousands}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Liquidity Ratios Table */}
        <Card className="bg-card">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-lg text-center text-primary font-bold">
              RATIOS GENERALES DE LIQUIDEZ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-500/20">
                  <TableHead className="text-foreground font-bold text-xs py-1">DESCRIPCIÓN</TableHead>
                  <TableHead className="text-foreground font-bold text-xs py-1">FÓRMULA</TableHead>
                  <TableHead className="text-foreground font-bold text-xs py-1 text-center">* Media Normal</TableHead>
                  {sortedYears.map(year => (
                    <TableHead key={year} className="text-foreground font-bold text-xs py-1 text-right">
                      Dic.-{String(year).slice(-2)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidityRatios.map((ratio, idx) => {
                  const values = calculateRatios.map(r => r[ratio.key as keyof typeof r] as number);
                  return (
                    <TableRow key={ratio.key} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium text-xs py-1">{ratio.name}</TableCell>
                      <TableCell className="text-xs py-1 text-muted-foreground">{ratio.formula}</TableCell>
                      <TableCell className="text-xs py-1 text-center text-red-500 font-medium">{ratio.mediaNormal}</TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} className="text-xs py-1 text-right">
                          {formatValue(value, ratio.isPercentage)}
                          {dataViewOption === 'values_deviation' && i < values.length - 1 && (
                            <span className={`block text-[10px] ${getDeviation(value, values[i + 1]) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ({getDeviation(value, values[i + 1]).toFixed(2)}%)
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Debt Ratios Table */}
        <Card className="bg-card">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-lg text-center text-primary font-bold">
              RATIOS GENERALES DE ENDEUDAMIENTO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-500/20">
                  <TableHead className="text-foreground font-bold text-xs py-1">DESCRIPCIÓN</TableHead>
                  <TableHead className="text-foreground font-bold text-xs py-1">FÓRMULA</TableHead>
                  <TableHead className="text-foreground font-bold text-xs py-1 text-center">* Media Normal</TableHead>
                  {sortedYears.map(year => (
                    <TableHead key={year} className="text-foreground font-bold text-xs py-1 text-right">
                      Dic.-{String(year).slice(-2)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtRatios.map((ratio, idx) => {
                  const values = calculateRatios.map(r => r[ratio.key as keyof typeof r] as number);
                  return (
                    <TableRow key={ratio.key} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium text-xs py-1">{ratio.name}</TableCell>
                      <TableCell className="text-xs py-1 text-muted-foreground">{ratio.formula}</TableCell>
                      <TableCell className="text-xs py-1 text-center text-red-500 font-medium">{ratio.mediaNormal}</TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} className="text-xs py-1 text-right">
                          {formatValue(value, ratio.isPercentage)}
                          {dataViewOption === 'values_deviation' && i < values.length - 1 && (
                            <span className={`block text-[10px] ${getDeviation(value, values[i + 1]) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ({getDeviation(value, values[i + 1]).toFixed(2)}%)
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground italic px-2">
          * Media establecida como guía general, aunque pueden haber sectores que esta media no se corresponda con su ciclo económico.
        </p>
      </div>

      {/* Right Sidebar - Charts */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <Card className="bg-card">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs text-center text-primary font-bold">
              GRÁFICOS DE CONTROL Y EVOLUCIÓN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            <div className="text-xs text-center font-medium">Ratio Atenc.Disp.Pagos</div>
            {renderChart(chartData1, 'liquidez', chartType1, 'hsl(var(--primary))')}
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Gràfic de Valors</Label>
                <Select value={chartGroup1} onValueChange={setChartGroup1}>
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liquidity">Valors Anàlisi Masses Patrimon.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Tipus de Gràfic</Label>
                <Select value={chartType1} onValueChange={(v) => setChartType1(v as 'bar' | 'line' | 'area')}>
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barres</SelectItem>
                    <SelectItem value="line">Línies</SelectItem>
                    <SelectItem value="area">Àrea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-2 space-y-2">
            <div className="text-xs text-center font-medium">Ratio Atenc.Disp.Pagos</div>
            {renderChart(chartData2, 'endeudamiento', chartType2, 'hsl(var(--chart-2))')}
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Gràfic de Desviacions</Label>
                <Select value={chartGroup2} onValueChange={setChartGroup2}>
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debt">% s/Totals i Desviacions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] w-20">Tipus de Gràfic</Label>
                <Select value={chartType2} onValueChange={(v) => setChartType2(v as 'bar' | 'line' | 'area')}>
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barres</SelectItem>
                    <SelectItem value="line">Línies</SelectItem>
                    <SelectItem value="area">Àrea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-muted border-t border-border px-4 py-1 flex justify-between items-center text-xs">
        <span>{companyName}</span>
        <span className="font-medium">Ratios Generales de Liquidez y Endeudamiento</span>
        <span>Anàlisi de períodes: ANUALS</span>
        <span className="text-green-500 font-medium">QUADRE DE BALANÇOS: 'OK'</span>
        <span>{new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default LiquidityDebtRatios;
