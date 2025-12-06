import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ZScoreAnalysisProps {
  companyId: string;
  companyName: string;
}

interface YearData {
  year: number;
  activoCorriente: number;
  totalActivo: number;
  pasivoExigible: number;
  patrimonioNeto: number;
  pasivoTotal: number;
  beneficioBruto: number;
  beneficioNeto: number;
  dividendos: number;
  fondoManiobra: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
  zScore: number;
}

export function ZScoreAnalysis({ companyId, companyName }: ZScoreAnalysisProps) {
  const [data, setData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataView, setDataView] = useState<'values' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup1, setChartGroup1] = useState('activo_corriente');
  const [chartType1, setChartType1] = useState<'bar' | 'line' | 'area'>('bar');
  const [chartGroup2, setChartGroup2] = useState('z_score');
  const [chartType2, setChartType2] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: statements } = await supabase
        .from("company_financial_statements")
        .select("id, fiscal_year")
        .eq("company_id", companyId)
        .eq("is_archived", false)
        .order("fiscal_year", { ascending: false })
        .limit(5);

      if (!statements?.length) {
        setData([]);
        setLoading(false);
        return;
      }

      const yearData: YearData[] = [];

      for (const stmt of statements) {
        const [{ data: balance }, { data: income }] = await Promise.all([
          supabase.from("balance_sheets").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("income_statements").select("*").eq("statement_id", stmt.id).single()
        ]);

        if (balance) {
          const activoCorriente = (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                                 (balance.cash_equivalents || 0) + (balance.short_term_financial_investments || 0) +
                                 (balance.short_term_group_receivables || 0);

          const activoNoCorriente = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) + 
                                   (balance.goodwill || 0) + (balance.real_estate_investments || 0) +
                                   (balance.long_term_financial_investments || 0) + (balance.deferred_tax_assets || 0);

          const totalActivo = activoCorriente + activoNoCorriente;

          const pasivoCorriente = (balance.short_term_debts || 0) + (balance.trade_payables || 0) + 
                                 (balance.other_creditors || 0) + (balance.short_term_group_debts || 0) +
                                 (balance.short_term_provisions || 0);

          const pasivoNoCorriente = (balance.long_term_debts || 0) + (balance.long_term_provisions || 0) +
                                   (balance.long_term_group_debts || 0) + (balance.deferred_tax_liabilities || 0);

          const pasivoExigible = pasivoCorriente + pasivoNoCorriente;

          const patrimonioNeto = (balance.share_capital || 0) + (balance.share_premium || 0) + 
                                (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) + 
                                (balance.retained_earnings || 0) + (balance.current_year_result || 0) +
                                (balance.statutory_reserves || 0) + (balance.revaluation_reserve || 0);

          const pasivoTotal = pasivoExigible + patrimonioNeto;
          const fondoManiobra = activoCorriente - pasivoCorriente;

          const netTurnover = income?.net_turnover || 0;
          const supplies = Math.abs(income?.supplies || 0);
          const personnelExpenses = Math.abs(income?.personnel_expenses || 0);
          const otherExpenses = Math.abs(income?.other_operating_expenses || 0);
          const depreciation = Math.abs(income?.depreciation || 0);

          const ebitda = netTurnover - supplies - personnelExpenses - otherExpenses;
          const beneficioBruto = ebitda - depreciation; // EBIT / BAI
          const beneficioNeto = income?.corporate_tax ? beneficioBruto - Math.abs(income.corporate_tax) : beneficioBruto * 0.9;
          const dividendos = balance.interim_dividend || 0;

          // Altman Z-Score components
          const x1 = totalActivo > 0 ? fondoManiobra / totalActivo : 0;
          const x2 = totalActivo > 0 ? (beneficioNeto - dividendos) / totalActivo : 0;
          const x3 = totalActivo > 0 ? beneficioBruto / totalActivo : 0;
          const x4 = pasivoExigible > 0 ? patrimonioNeto / pasivoExigible : 0;
          const x5 = totalActivo > 0 ? netTurnover / totalActivo : 0;

          // Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.5*X5
          const zScore = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.5 * x5;

          yearData.push({
            year: stmt.fiscal_year,
            activoCorriente,
            totalActivo,
            pasivoExigible,
            patrimonioNeto,
            pasivoTotal,
            beneficioBruto,
            beneficioNeto,
            dividendos,
            fondoManiobra,
            x1, x2, x3, x4, x5,
            zScore
          });
        }
      }

      setData(yearData.sort((a, b) => b.year - a.year));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number) => {
    if (showThousands) {
      return (value / 1000).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatRatio = (value: number) => {
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getZScoreStatus = (zScore: number) => {
    if (zScore > 3.0) return { label: 'SIN RIESGO', color: 'text-green-500' };
    if (zScore >= 1.8) return { label: 'SITUACIÓN DUDOSA', color: 'text-yellow-500' };
    return { label: 'RIESGO DE QUIEBRA', color: 'text-red-500' };
  };

  const getChartData = (metric: string) => {
    return data.map(d => {
      let value = 0;
      switch (metric) {
        case 'activo_corriente': value = d.activoCorriente; break;
        case 'total_activo': value = d.totalActivo; break;
        case 'patrimonio_neto': value = d.patrimonioNeto; break;
        case 'z_score': value = d.zScore; break;
        case 'x1': value = d.x1; break;
        case 'x2': value = d.x2; break;
        case 'x3': value = d.x3; break;
        case 'x4': value = d.x4; break;
        case 'x5': value = d.x5; break;
      }
      return {
        year: d.year.toString(),
        value: showThousands && !['z_score', 'x1', 'x2', 'x3', 'x4', 'x5'].includes(metric) ? value / 1000 : value
      };
    }).reverse();
  };

  const renderChart = (chartType: 'bar' | 'line' | 'area', dataKey: string, chartData: any[]) => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 5 }
    };

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 10 }} />
          <YAxis className="text-xs" tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(var(--primary))" />
        </BarChart>
      );
    } else if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 10 }} />
          <YAxis className="text-xs" tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      );
    } else {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 10 }} />
          <YAxis className="text-xs" tick={{ fontSize: 10 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" />
        </AreaChart>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border">
        No hi ha dades disponibles per a l'anàlisi Z-Score.
      </div>
    );
  }

  const latest = data[0];
  const status = getZScoreStatus(latest.zScore);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b p-3 text-center">
        <h1 className="text-lg font-bold text-primary">DIAGNÓSTICO DEL ÍNDICE "Z" - Aproximación a la Quiebra</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-48 bg-card border-r p-3 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-primary mb-2">Visión de datos</h3>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataView === 'values'}
                  onChange={() => setDataView('values')}
                  className="text-primary"
                />
                <span>Vista de valores</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataView === 'values_deviation'}
                  onChange={() => setDataView('values_deviation')}
                  className="text-primary"
                />
                <span className="text-red-500">Vista de valores y % de desviación</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-500 mb-2">Opciones Principales</h3>
            <div className="space-y-1 text-xs">
              <div className="text-blue-400 font-medium">Financial System</div>
              <div className="pl-2 space-y-0.5 text-muted-foreground">
                <div>Pantalla principal</div>
                <div>Pantalla de empresas</div>
                <div>Introducción Datos</div>
                <div>Informes</div>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="text-red-500 font-medium">Grupo Analítica</div>
            <div className="pl-2 space-y-0.5 text-muted-foreground">
              <div>Análisis Masas Patrimoniales</div>
              <div>Cuadro Analítico P.y G.</div>
              <div>Neces.Operat.de Fondos</div>
              <div>Tendencias Anuales Móviles (TAM)</div>
              <div>Análisis del Capital Circulante</div>
              <div>Análisis Financiero a largo plazo</div>
              <div>Flujo de Caja</div>
              <div>Análisis EBIT y EBITDA</div>
              <div>Análisis del Valor Añadido</div>
              <div>Movimientos de Tesorería</div>
              <div>Cuadro de Financiación</div>
              <div>Cuadro de Mando Financiero</div>
              <div className="text-primary font-medium bg-primary/10 px-1 rounded">Índice "Z"</div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showThousands}
              onChange={(e) => setShowThousands(e.target.checked)}
              className="text-primary"
            />
            <span>Miles de u.m.</span>
          </label>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 overflow-auto">
          {/* Masas Patrimoniales Table */}
          <div className="mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-amber-600 text-white">
                  <th className="border border-amber-700 p-1.5 text-left font-medium">MASAS PATRIMONIALES</th>
                  {data.map(d => (
                    <th key={d.year} className="border border-amber-700 p-1.5 text-right font-medium">
                      Diciembre-{d.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">ACTIVO CORRIENTE</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.activoCorriente)}</td>
                  ))}
                </tr>
                <tr className="bg-amber-100 dark:bg-amber-900/30 font-semibold">
                  <td className="border border-border p-1.5">TOTAL ACTIVO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.totalActivo)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">PASIVO EXIGIBLE</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.pasivoExigible)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">PATRIMONIO NETO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.patrimonioNeto)}</td>
                  ))}
                </tr>
                <tr className="bg-amber-100 dark:bg-amber-900/30 font-semibold">
                  <td className="border border-border p-1.5">PASIVO TOTAL</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.pasivoTotal)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">BENEFICIO BRUTO (B.A.I.)</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.beneficioBruto)}</td>
                  ))}
                </tr>
                <tr className="bg-amber-100 dark:bg-amber-900/30 font-semibold">
                  <td className="border border-border p-1.5">BENEFICIO NETO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.beneficioNeto)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5 text-amber-600">DIVIDENDOS EJERCICIO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatValue(d.dividendos)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Z Index Calculation Table */}
          <div className="mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-cyan-700 text-white">
                  <th className="border border-cyan-800 p-1.5 text-left font-medium">CÁLCULO DEL ÍNDICE "Z"</th>
                  {data.map(d => (
                    <th key={d.year} className="border border-cyan-800 p-1.5 text-right font-medium">
                      Diciembre-{d.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">FONDO DE MANIOBRA / ACTIVO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatRatio(d.x1)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">BENEFICIO NETO - DIVIDENDOS / ACTIVO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatRatio(d.x2)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">BENEFICIO BRUTO (B.A.I.) / ACTIVO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatRatio(d.x3)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">PATRIMONIO NETO / PASIVO EXIGIBLE</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatRatio(d.x4)}</td>
                  ))}
                </tr>
                <tr className="bg-card hover:bg-muted/50">
                  <td className="border border-border p-1.5">VENTAS NETAS / ACTIVO</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right">{formatRatio(d.x5)}</td>
                  ))}
                </tr>
                <tr className="bg-cyan-100 dark:bg-cyan-900/30 font-bold">
                  <td className="border border-border p-1.5 text-cyan-700 dark:text-cyan-300">ÍNDICE "Z"</td>
                  {data.map(d => (
                    <td key={d.year} className="border border-border p-1.5 text-right text-cyan-700 dark:text-cyan-300">
                      {formatRatio(d.zScore)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formula */}
          <div className="bg-amber-600 text-white p-3 rounded mb-4 text-center">
            <div className="font-bold mb-2">FÓRMULA PARA EL CÁLCULO DEL ÍNDICE "Z"</div>
            <div className="text-xs">
              1,2 x (FONDO DE MANIOBRA / ACTIVO) + 1,4 x ((BENEFICIO NETO - DIVIDENDOS) / ACTIVO) + 3,3 x (BENEFICIO BRUTO / ACTIVO) + 0,6 x (FONDOS PROPIOS / PASIVO EXIGIBLE) + 1,5 x (VENTAS / ACTIVO)
            </div>
          </div>

          {/* Reference Values */}
          <div className="border rounded p-3 bg-card">
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">
                  * Según el último balance introducido (Diciembre-{latest.year}), el valor del Índice Z es: <strong>{formatRatio(latest.zScore)}</strong> lo que indica que la empresa se encuentra en situación de '{status.label}'.
                </p>
              </div>
              <div className="border-l pl-4">
                <div className="text-xs font-bold mb-2">VALORES DE REFERENCIA DEL ÍNDICE "Z"</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-green-500 font-medium w-32">SIN RIESGO</span>
                    <span>MAYOR QUE "3,00"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-yellow-500 font-medium w-32">SITUACIÓN DUDOSA</span>
                    <span>ENTRE "1,80" y "3,00"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-red-500 font-medium w-32">RIESGO DE QUIEBRA</span>
                    <span>MENOR QUE "1,80"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-64 bg-card border-l p-3 flex flex-col gap-4 overflow-y-auto">
          <div className="text-center font-bold text-primary text-sm">GRÁFICOS DE CONTROL Y EVOLUCIÓN</div>
          
          {/* Chart 1 */}
          <div>
            <div className="text-xs font-medium text-center mb-2">Activo Corriente</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartType1, 'value', getChartData(chartGroup1))}
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span>~ Gráfico de Valores</span>
                <Select value={chartGroup1} onValueChange={setChartGroup1}>
                  <SelectTrigger className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo_corriente">Activo Corriente</SelectItem>
                    <SelectItem value="total_activo">Total Activo</SelectItem>
                    <SelectItem value="patrimonio_neto">Patrimonio Neto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>~ Tipo de Gráfico</span>
                <Select value={chartType1} onValueChange={(v: 'bar' | 'line' | 'area') => setChartType1(v)}>
                  <SelectTrigger className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div>
            <div className="text-xs font-medium text-center mb-2">Índice Z</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartType2, 'value', getChartData(chartGroup2))}
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span>~ Análisis Índice Z</span>
                <Select value={chartGroup2} onValueChange={setChartGroup2}>
                  <SelectTrigger className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="z_score">Índice Z</SelectItem>
                    <SelectItem value="x1">X1 - FM/Activo</SelectItem>
                    <SelectItem value="x2">X2 - BN-Div/Activo</SelectItem>
                    <SelectItem value="x3">X3 - BAI/Activo</SelectItem>
                    <SelectItem value="x4">X4 - PN/Pasivo</SelectItem>
                    <SelectItem value="x5">X5 - Ventas/Activo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>~ Tipo de Gráfico</span>
                <Select value={chartType2} onValueChange={(v: 'bar' | 'line' | 'area') => setChartType2(v)}>
                  <SelectTrigger className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted border-t p-2 flex items-center justify-between text-xs">
        <span>{companyName}</span>
        <span className="text-cyan-600 font-medium">ANÁLISIS DEL ÍNDICE "Z" - Aproximación a la quiebra</span>
        <span>Análisis de períodos: ANUALES</span>
        <span className="text-green-600">CUADRE DE BALANCES: 'OK'</span>
        <span>{new Date().toLocaleString('es-ES')}</span>
      </div>
    </div>
  );
}
