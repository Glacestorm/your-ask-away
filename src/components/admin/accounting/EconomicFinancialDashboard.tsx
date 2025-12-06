import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface EconomicFinancialDashboardProps {
  companyId: string;
  companyName: string;
}

const EconomicFinancialDashboard: React.FC<EconomicFinancialDashboardProps> = ({ companyId, companyName }) => {
  const [dataView, setDataView] = useState<'values_percentages' | 'values' | 'values_total' | 'values_deviation'>('values_percentages');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup, setChartGroup] = useState('activo_no_corriente');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [chartGroup2, setChartGroup2] = useState('percentages');
  const [chartType2, setChartType2] = useState<'bar' | 'line' | 'area'>('bar');
  const [statements, setStatements] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: stmts } = await supabase
        .from('company_financial_statements')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (stmts && stmts.length > 0) {
        setStatements(stmts);
        const statementIds = stmts.map(s => s.id);

        const [incomeRes, balanceRes] = await Promise.all([
          supabase.from('income_statements').select('*').in('statement_id', statementIds),
          supabase.from('balance_sheets').select('*').in('statement_id', statementIds)
        ]);

        setIncomeStatements(incomeRes.data || []);
        setBalanceSheets(balanceRes.data || []);
      }
      setLoading(false);
    };

    if (companyId) fetchData();
  }, [companyId]);

  const years = useMemo(() => {
    return statements.map(s => s.fiscal_year).sort((a, b) => b - a).slice(0, 5);
  }, [statements]);

  const getBalanceForYear = (year: number) => {
    const stmt = statements.find(s => s.fiscal_year === year);
    if (!stmt) return null;
    return balanceSheets.find(b => b.statement_id === stmt.id);
  };

  const getIncomeForYear = (year: number) => {
    const stmt = statements.find(s => s.fiscal_year === year);
    if (!stmt) return null;
    return incomeStatements.find(i => i.statement_id === stmt.id);
  };

  const yearlyData = useMemo(() => {
    return years.map(year => {
      const balance = getBalanceForYear(year);
      const income = getIncomeForYear(year);

      const activoNoCorriente = (balance?.intangible_assets || 0) + (balance?.goodwill || 0) + 
        (balance?.tangible_assets || 0) + (balance?.real_estate_investments || 0) + 
        (balance?.long_term_financial_investments || 0) + (balance?.long_term_group_investments || 0);

      const existencias = balance?.inventory || 0;
      const realizable = (balance?.trade_receivables || 0) + (balance?.short_term_group_receivables || 0) + 
        (balance?.short_term_financial_investments || 0);
      const tesoreria = balance?.cash_equivalents || 0;

      const activoTotal = activoNoCorriente + existencias + realizable + tesoreria;

      const patrimonioNeto = (balance?.share_capital || 0) + (balance?.share_premium || 0) + 
        (balance?.legal_reserve || 0) + (balance?.voluntary_reserves || 0) + 
        (balance?.retained_earnings || 0) + (balance?.current_year_result || 0);

      const pasivoNoCorriente = (balance?.long_term_debts || 0) + (balance?.long_term_group_debts || 0) + 
        (balance?.long_term_provisions || 0) + (balance?.deferred_tax_liabilities || 0);

      const pasivoCorriente = (balance?.short_term_debts || 0) + (balance?.short_term_group_debts || 0) + 
        (balance?.trade_payables || 0) + (balance?.other_creditors || 0) + (balance?.short_term_provisions || 0);

      const pasivoTotal = patrimonioNeto + pasivoNoCorriente + pasivoCorriente;

      const ingresosExplotacion = income?.net_turnover || 0;
      const gastosProporcionalesFabricacion = income?.supplies || 0;

      const beneficioNeto = income?.corporate_tax ? 
        (ingresosExplotacion + gastosProporcionalesFabricacion - (income?.personnel_expenses || 0) - 
         (income?.depreciation || 0) - (income?.other_operating_expenses || 0) + 
         (income?.financial_income || 0) - (income?.financial_expenses || 0) - 
         Math.abs(income?.corporate_tax || 0)) : 0;

      const roe = patrimonioNeto !== 0 ? (beneficioNeto / patrimonioNeto) : 0;
      const rotacionActivo = activoTotal !== 0 ? (ingresosExplotacion / activoTotal) : 0;
      const margenBruto = ingresosExplotacion !== 0 ? 
        ((ingresosExplotacion + gastosProporcionalesFabricacion) / ingresosExplotacion) : 0;
      const apalancamiento = patrimonioNeto !== 0 ? (activoTotal / patrimonioNeto) : 0;

      return {
        year,
        activoNoCorriente,
        existencias,
        realizable,
        tesoreria,
        activoTotal,
        patrimonioNeto,
        pasivoNoCorriente,
        pasivoCorriente,
        pasivoTotal,
        ingresosExplotacion,
        gastosProporcionalesFabricacion,
        beneficioNeto,
        roe,
        rotacionActivo,
        margenBruto,
        apalancamiento
      };
    });
  }, [years, balanceSheets, incomeStatements, statements]);

  const formatValue = (value: number | null | undefined, isPercentage = false) => {
    if (value === null || value === undefined) return '-';
    if (isPercentage) return `${(value * 100).toFixed(2)} %`;
    const displayValue = showThousands ? value / 1000 : value;
    return displayValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const chartData = useMemo(() => {
    return yearlyData.map(d => ({
      year: d.year.toString(),
      value: showThousands ? (d.activoNoCorriente / 1000) : d.activoNoCorriente
    })).reverse();
  }, [yearlyData, showThousands]);

  const chartData2 = useMemo(() => {
    return yearlyData.map(d => ({
      year: d.year.toString(),
      value: d.roe * 100
    })).reverse();
  }, [yearlyData]);

  const renderChart = (data: any[], dataKey: string, color: string, type: 'bar' | 'line' | 'area') => {
    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const TableRow = ({ label, values, isTotal = false, isHighlight = false, highlightColor = '' }: { 
    label: string; 
    values: (number | null | undefined)[]; 
    isTotal?: boolean;
    isHighlight?: boolean;
    highlightColor?: string;
  }) => (
    <tr className={`border-b border-border/50 ${isTotal ? 'bg-amber-900/30 font-bold' : ''} ${isHighlight ? highlightColor : ''}`}>
      <td className="py-1 px-2 text-xs">{label}</td>
      {values.map((val, idx) => (
        <td key={idx} className="py-1 px-2 text-xs text-right">
          {formatValue(val)}
        </td>
      ))}
    </tr>
  );

  const PercentageRow = ({ label, values, isHighlight = false, highlightColor = '' }: { 
    label: string; 
    values: (number | null | undefined)[]; 
    isHighlight?: boolean;
    highlightColor?: string;
  }) => (
    <tr className={`border-b border-border/50 ${isHighlight ? highlightColor : ''}`}>
      <td className="py-1 px-2 text-xs">{label}</td>
      {values.map((val, idx) => (
        <td key={idx} className="py-1 px-2 text-xs text-right">
          {formatValue(val, true)}
        </td>
      ))}
    </tr>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregant dades...</div>;
  }

  if (years.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">No hi ha dades financeres disponibles</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-border bg-card/50 p-3 overflow-y-auto">
          <div className="mb-4">
            <h4 className="text-xs font-semibold mb-2 text-amber-400">Visió de dades</h4>
            <div className="space-y-1">
              {[
                { value: 'values_percentages', label: 'Vista de valors i percentatges' },
                { value: 'values', label: 'Vista de valors' },
                { value: 'values_total', label: 'Vista de valors i % sobre total' },
                { value: 'values_deviation', label: 'Vista de valors i % de desviació' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="dataView"
                    value={option.value}
                    checked={dataView === option.value}
                    onChange={(e) => setDataView(e.target.value as any)}
                    className="w-3 h-3"
                  />
                  <span className={dataView === option.value ? 'text-amber-400' : 'text-muted-foreground'}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Opcions Principals</h4>
            <div className="space-y-1">
              {[
                { id: 'financial', label: 'Financial System', items: ['Pantalla principal', 'Pantalla de empreses', 'Introducció Dades', 'Informes'] },
                { id: 'balances', label: 'Balances' },
                { id: 'financera', label: 'Financera' },
                { id: 'analitica', label: 'Grup Analítica', items: [
                  'Anàlisis Masses Patrimonials',
                  'Quadre Analític P. y G.',
                  'Quadre Analític. (Resum i Porc.)',
                  'Neces.Operat.de Fons',
                  'Tendències Anuals Mòbils (TAM)',
                  'Anàlisi del Capital Circulant',
                  'Anàlisi Financer a llarg termini',
                  'Flux de Caixa',
                  'Anàlisi EBIT y EBITDA',
                  'Anàlisi del Valor Afegit',
                  'Moviments de Tresoreria',
                  'Quadre de Finançament',
                  'Quadre de Mando Financer',
                  'Índex \'Z\''
                ]},
                { id: 'ratios', label: 'Ratios' },
                { id: 'rentabilitat', label: 'Rentabilitat' },
                { id: 'auditoria', label: 'Auditoria' },
                { id: 'valoracions', label: 'Valoracions' },
                { id: 'comptes', label: 'Comptes Anuals' },
                { id: 'accionarial', label: 'Valor Accionarial' }
              ].map(section => (
                <div key={section.id} className="text-xs">
                  <div className={`py-1 px-2 rounded cursor-pointer ${section.id === 'analitica' ? 'bg-primary/20' : 'hover:bg-muted/50'}`}>
                    {section.label}
                  </div>
                  {section.items && section.id === 'analitica' && (
                    <div className="ml-3 mt-1 space-y-0.5">
                      {section.items.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`py-0.5 px-2 text-[10px] rounded cursor-pointer ${item === 'Quadre de Mando Financer' ? 'bg-amber-600/30 text-amber-400' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showThousands}
                onChange={(e) => setShowThousands(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Mostrar en milers</span>
            </label>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-center mb-4 text-amber-400">
            CUADRO DE MANDO ECONÓMICO-FINANCIERO
          </h2>

          {/* Balance de Situación */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-center mb-2 text-amber-300">
              BALANCES EJERCICIOS: UNIDADES MONETARIAS Y PORCENTAJES
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="py-1 px-2 text-left font-semibold">CONCEPTOS</th>
                  {years.map(year => (
                    <th key={year} className="py-1 px-2 text-right font-semibold">Diciembre-{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-red-900/40">
                  <td colSpan={years.length + 1} className="py-1 px-2 text-xs font-bold text-red-300">BALANCE DE SITUACIÓN</td>
                </tr>
                <TableRow label="Activo NoCorriente" values={yearlyData.map(d => d.activoNoCorriente)} />
                <TableRow label="Existencias" values={yearlyData.map(d => d.existencias)} />
                <TableRow label="Realizable" values={yearlyData.map(d => d.realizable)} />
                <TableRow label="Tesorería" values={yearlyData.map(d => d.tesoreria)} />
                <TableRow label="Activo Total" values={yearlyData.map(d => d.activoTotal)} isTotal />
                <TableRow label="Patrimonio Neto" values={yearlyData.map(d => d.patrimonioNeto)} />
                <TableRow label="Pasivo No Corriente" values={yearlyData.map(d => d.pasivoNoCorriente)} />
                <TableRow label="Pasivo Corriente" values={yearlyData.map(d => d.pasivoCorriente)} />
                <TableRow label="Pasivo total" values={yearlyData.map(d => d.pasivoTotal)} isTotal />
                <tr className="bg-amber-900/40">
                  <td colSpan={years.length + 1} className="py-1 px-2 text-xs font-bold text-amber-300">CUENTA DE RESULTADOS</td>
                </tr>
                <TableRow label="Ingresos de Explotación" values={yearlyData.map(d => d.ingresosExplotacion)} isHighlight highlightColor="bg-amber-800/30" />
                <TableRow label="Gastos Proporcionales de Fabricación" values={yearlyData.map(d => d.gastosProporcionalesFabricacion)} />
              </tbody>
            </table>
          </div>

          {/* Cuadro de Financiación */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-center mb-2 text-amber-300">
              CUADRO DE FINANCIACIÓN (ORÍGENES Y APLICACIONES DE FONDOS)
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="py-1 px-2 text-left font-semibold">CONCEPTOS</th>
                  {years.slice(0, 3).map(year => (
                    <React.Fragment key={year}>
                      <th className="py-1 px-2 text-right font-semibold">Origen</th>
                      <th className="py-1 px-2 text-right font-semibold">Aplicación</th>
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <th></th>
                  {years.slice(0, 3).map(year => (
                    <th key={year} colSpan={2} className="py-1 px-2 text-center text-[10px]">Diciembre-{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Activo NoCorriente', 'Existencias', 'Realizable', 'Tesorería', 'Patrimonio Neto', 'Pasivo No Corriente'].map((concept, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-1 px-2 text-xs">{concept}</td>
                    {years.slice(0, 3).map((year, yIdx) => {
                      const currentData = yearlyData.find(d => d.year === year);
                      const prevData = yearlyData.find(d => d.year === years[yIdx + 1]);
                      const fieldMap: Record<string, keyof typeof currentData> = {
                        'Activo NoCorriente': 'activoNoCorriente',
                        'Existencias': 'existencias',
                        'Realizable': 'realizable',
                        'Tesorería': 'tesoreria',
                        'Patrimonio Neto': 'patrimonioNeto',
                        'Pasivo No Corriente': 'pasivoNoCorriente'
                      };
                      const field = fieldMap[concept];
                      const current = currentData?.[field] as number || 0;
                      const prev = prevData?.[field] as number || 0;
                      const diff = current - prev;
                      return (
                        <React.Fragment key={year}>
                          <td className="py-1 px-2 text-xs text-right">{diff > 0 ? formatValue(diff) : '0,00'}</td>
                          <td className="py-1 px-2 text-xs text-right">{diff < 0 ? formatValue(Math.abs(diff)) : '0,00'}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desglose de la Rentabilidad Financiera (R.O.E.) */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-center mb-2 text-amber-300">
              DESGLOSE DE LA RENTABILIDAD FINANCIERA (R.O.E.)
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="py-1 px-2 text-left font-semibold">CONCEPTOS</th>
                  {years.map(year => (
                    <th key={year} className="py-1 px-2 text-right font-semibold">Diciembre-{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <PercentageRow 
                  label="Beneficio Neto / Patrimonio Neto (Rentabilidad Financiera)" 
                  values={yearlyData.map(d => d.roe)} 
                  isHighlight 
                  highlightColor="bg-amber-700/40 font-bold"
                />
                <tr className="border-b border-border/50">
                  <td className="py-1 px-2 text-xs">Ventas / Activo (Rotación del Activo)</td>
                  {yearlyData.map((d, idx) => (
                    <td key={idx} className="py-1 px-2 text-xs text-right">
                      {d.rotacionActivo.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <PercentageRow label="B.A.I.I. / Ventas (Margen Bruto s/Ventas)" values={yearlyData.map(d => d.margenBruto)} />
                <PercentageRow label="B.A.I. / B.A.I.I. (1ª parte del Apalancamiento)" values={yearlyData.map(d => d.apalancamiento)} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-64 border-l border-border bg-card/50 p-3 overflow-y-auto">
          <h4 className="text-xs font-semibold mb-3 text-center text-amber-400">GRÁFICOS DE CONTROL Y EVOLUCIÓN</h4>
          
          <div className="mb-4">
            <h5 className="text-[10px] font-medium mb-2 text-center">Activo NoCorriente</h5>
            {renderChart(chartData, 'value', 'hsl(var(--primary))', chartType)}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Selecció gràfic i tipo:</span>
              </div>
              <select 
                value={chartGroup}
                onChange={(e) => setChartGroup(e.target.value)}
                className="w-full text-[10px] p-1 rounded bg-muted border border-border"
              >
                <option value="activo_no_corriente">Valores Cuadro de Mando Financi...</option>
                <option value="activo_total">Activo Total</option>
                <option value="patrimonio">Patrimonio Neto</option>
              </select>
              <select 
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full text-[10px] p-1 rounded bg-muted border border-border"
              >
                <option value="bar">Tipos de Gráficos</option>
                <option value="line">Líneas</option>
                <option value="area">Área</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-[10px] font-medium mb-2 text-center">Activo NoCorriente</h5>
            {renderChart(chartData2, 'value', 'hsl(var(--chart-2))', chartType2)}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Selecció gràfic i tipo:</span>
              </div>
              <div className="flex gap-2 text-[10px]">
                <label className="flex items-center gap-1">
                  <input type="radio" name="pct" defaultChecked className="w-2 h-2" />
                  <span>Porcentajes totales</span>
                </label>
              </div>
              <div className="flex gap-2 text-[10px]">
                <label className="flex items-center gap-1">
                  <input type="radio" name="pct" className="w-2 h-2" />
                  <span>Porcentajes desviación</span>
                </label>
              </div>
              <select 
                value={chartGroup2}
                onChange={(e) => setChartGroup2(e.target.value)}
                className="w-full text-[10px] p-1 rounded bg-muted border border-border"
              >
                <option value="percentages">% s/Totales y Desviaciones</option>
              </select>
              <select 
                value={chartType2}
                onChange={(e) => setChartType2(e.target.value as any)}
                className="w-full text-[10px] p-1 rounded bg-muted border border-border"
              >
                <option value="bar">Tipos de Gráficos</option>
                <option value="line">Líneas</option>
                <option value="area">Área</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="h-8 bg-muted/50 border-t border-border flex items-center px-4 text-xs text-muted-foreground">
        <span className="mr-4">Empresa: {companyName}</span>
        <span className="mr-4">|</span>
        <span>Anàlisi: Quadre de Mando Econòmic-Financer</span>
      </div>
    </div>
  );
};

export default EconomicFinancialDashboard;
