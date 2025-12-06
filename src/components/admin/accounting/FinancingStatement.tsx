import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface FinancingStatementProps {
  companyId: string;
  companyName: string;
}

const FinancingStatement: React.FC<FinancingStatementProps> = ({ companyId, companyName }) => {
  const [dataView, setDataView] = useState<'values' | 'values_deviation'>('values_deviation');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup, setChartGroup] = useState('activo_no_corriente');
  const [chartType, setChartType] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('patrimonio_neto');
  const [chartType2, setChartType2] = useState('bar');
  const [statements, setStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
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
        const stmtIds = stmts.map(s => s.id);
        
        const [balanceRes, incomeRes] = await Promise.all([
          supabase.from('balance_sheets').select('*').in('statement_id', stmtIds),
          supabase.from('income_statements').select('*').in('statement_id', stmtIds)
        ]);
        
        setBalanceSheets(balanceRes.data || []);
        setIncomeStatements(incomeRes.data || []);
      }
      setLoading(false);
    };
    
    if (companyId) fetchData();
  }, [companyId]);

  const years = useMemo(() => {
    return statements.map(s => s.fiscal_year).sort((a, b) => b - a).slice(0, 2);
  }, [statements]);

  interface YearData {
    year: number;
    intangibleAssets: number;
    tangibleAssets: number;
    realEstateInvestments: number;
    longTermGroupInvestments: number;
    longTermFinancialInvestments: number;
    deferredTaxAssets: number;
    activoNoCorriente: number;
    inventory: number;
    tradeReceivables: number;
    shortTermFinancialInvestments: number;
    cashEquivalents: number;
    activoCorriente: number;
    nonCurrentAssetsHeldForSale: number;
    shareCapital: number;
    sharePremium: number;
    reserves: number;
    treasuryShares: number;
    retainedEarnings: number;
    otherEquity: number;
    currentYearResult: number;
    interimDividend: number;
    patrimonioNeto: number;
  }

  const emptyYearData: YearData = {
    year: 0,
    intangibleAssets: 0,
    tangibleAssets: 0,
    realEstateInvestments: 0,
    longTermGroupInvestments: 0,
    longTermFinancialInvestments: 0,
    deferredTaxAssets: 0,
    activoNoCorriente: 0,
    inventory: 0,
    tradeReceivables: 0,
    shortTermFinancialInvestments: 0,
    cashEquivalents: 0,
    activoCorriente: 0,
    nonCurrentAssetsHeldForSale: 0,
    shareCapital: 0,
    sharePremium: 0,
    reserves: 0,
    treasuryShares: 0,
    retainedEarnings: 0,
    otherEquity: 0,
    currentYearResult: 0,
    interimDividend: 0,
    patrimonioNeto: 0
  };

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

  const yearlyData: YearData[] = useMemo(() => {
    return years.map(year => {
      const balance = getBalanceForYear(year);
      const income = getIncomeForYear(year);
      
      const intangibleAssets = balance?.intangible_assets || 0;
      const tangibleAssets = balance?.tangible_assets || 0;
      const realEstateInvestments = balance?.real_estate_investments || 0;
      const longTermGroupInvestments = balance?.long_term_group_investments || 0;
      const longTermFinancialInvestments = balance?.long_term_financial_investments || 0;
      const deferredTaxAssets = balance?.deferred_tax_assets || 0;
      
      const activoNoCorriente = intangibleAssets + tangibleAssets + realEstateInvestments + 
        longTermGroupInvestments + longTermFinancialInvestments + deferredTaxAssets;
      
      const inventory = balance?.inventory || 0;
      const tradeReceivables = balance?.trade_receivables || 0;
      const shortTermFinancialInvestments = balance?.short_term_financial_investments || 0;
      const cashEquivalents = balance?.cash_equivalents || 0;
      const activoCorriente = inventory + tradeReceivables + shortTermFinancialInvestments + cashEquivalents;
      
      const nonCurrentAssetsHeldForSale = balance?.non_current_assets_held_for_sale || 0;
      
      const shareCapital = balance?.share_capital || 0;
      const sharePremium = balance?.share_premium || 0;
      const reserves = (balance?.legal_reserve || 0) + (balance?.statutory_reserves || 0) + (balance?.voluntary_reserves || 0);
      const treasuryShares = balance?.treasury_shares || 0;
      const retainedEarnings = balance?.retained_earnings || 0;
      const otherEquity = balance?.other_equity_instruments || 0;
      const currentYearResult = balance?.current_year_result || 0;
      const interimDividend = balance?.interim_dividend || 0;
      
      const patrimonioNeto = shareCapital + sharePremium + reserves - treasuryShares + 
        retainedEarnings + otherEquity + currentYearResult - interimDividend;

      return {
        year,
        intangibleAssets,
        tangibleAssets,
        realEstateInvestments,
        longTermGroupInvestments,
        longTermFinancialInvestments,
        deferredTaxAssets,
        activoNoCorriente,
        inventory,
        tradeReceivables,
        shortTermFinancialInvestments,
        cashEquivalents,
        activoCorriente,
        nonCurrentAssetsHeldForSale,
        shareCapital,
        sharePremium,
        reserves,
        treasuryShares,
        retainedEarnings,
        otherEquity,
        currentYearResult,
        interimDividend,
        patrimonioNeto
      };
    });
  }, [years, balanceSheets, incomeStatements, statements]);

  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(displayValue);
  };

  const calculateDifference = (current: number, previous: number) => {
    return current - previous;
  };

  const getValueClass = (value: number, isTotal = false, isIncrease = false) => {
    let baseClass = 'text-right px-2 py-1 ';
    if (isTotal) baseClass += 'font-bold bg-amber-100 dark:bg-amber-900/30 ';
    if (isIncrease) return baseClass + 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return baseClass + 'text-red-600 dark:text-red-400';
    return baseClass;
  };

  const currentYear: YearData = yearlyData[0] || emptyYearData;
  const previousYear: YearData = yearlyData[1] || emptyYearData;

  const chartData = useMemo(() => {
    if (years.length < 2) return [];
    const current = currentYear;
    const previous = previousYear;
    const diff = calculateDifference(
      chartGroup === 'activo_no_corriente' ? current.activoNoCorriente : current.patrimonioNeto,
      chartGroup === 'activo_no_corriente' ? previous.activoNoCorriente : previous.patrimonioNeto
    );
    
    return [
      { name: `Dic-${String(years[0]).slice(-2)}`, value: showThousands ? (chartGroup === 'activo_no_corriente' ? current.activoNoCorriente : current.patrimonioNeto) / 1000 : (chartGroup === 'activo_no_corriente' ? current.activoNoCorriente : current.patrimonioNeto) },
      { name: `Dic-${String(years[1]).slice(-2)}`, value: showThousands ? (chartGroup === 'activo_no_corriente' ? previous.activoNoCorriente : previous.patrimonioNeto) / 1000 : (chartGroup === 'activo_no_corriente' ? previous.activoNoCorriente : previous.patrimonioNeto) },
      { name: 'Diferència', value: showThousands ? diff / 1000 : diff }
    ];
  }, [currentYear, previousYear, years, chartGroup, showThousands]);

  const chartData2 = useMemo(() => {
    if (years.length < 2) return [];
    const current = currentYear;
    const previous = previousYear;
    const diff = calculateDifference(
      chartGroup2 === 'patrimonio_neto' ? current.patrimonioNeto : current.activoCorriente,
      chartGroup2 === 'patrimonio_neto' ? previous.patrimonioNeto : previous.activoCorriente
    );
    
    return [
      { name: `Dic-${String(years[0]).slice(-2)}`, value: showThousands ? (chartGroup2 === 'patrimonio_neto' ? current.patrimonioNeto : current.activoCorriente) / 1000 : (chartGroup2 === 'patrimonio_neto' ? current.patrimonioNeto : current.activoCorriente) },
      { name: `Dic-${String(years[1]).slice(-2)}`, value: showThousands ? (chartGroup2 === 'patrimonio_neto' ? previous.patrimonioNeto : previous.activoCorriente) / 1000 : (chartGroup2 === 'patrimonio_neto' ? previous.patrimonioNeto : previous.activoCorriente) },
      { name: 'Diferència', value: showThousands ? diff / 1000 : diff }
    ];
  }, [currentYear, previousYear, years, chartGroup2, showThousands]);

  const renderChart = (data: any[], dataKey: string, color: string, type: string) => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 10, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        );
    }
  };

  const TableRow = ({ label, currentVal, previousVal, isTotal = false, isSubItem = false, indent = 0 }: {
    label: string;
    currentVal: number;
    previousVal: number;
    isTotal?: boolean;
    isSubItem?: boolean;
    indent?: number;
  }) => {
    const diff = calculateDifference(currentVal, previousVal);
    const increase = diff > 0 ? diff : 0;
    const decrease = diff < 0 ? Math.abs(diff) : 0;
    
    return (
      <tr className={`${isTotal ? 'bg-amber-100 dark:bg-amber-900/30 font-bold' : isSubItem ? 'bg-muted/30' : ''}`}>
        <td className={`px-2 py-1 text-left ${indent > 0 ? `pl-${indent * 4}` : ''}`} style={{ paddingLeft: indent * 16 + 8 }}>
          {label}
        </td>
        <td className={getValueClass(currentVal, isTotal)}>{formatValue(currentVal)}</td>
        <td className={getValueClass(previousVal, isTotal)}>{formatValue(previousVal)}</td>
        <td className={getValueClass(diff, isTotal)}>{formatValue(diff)}</td>
        <td className={getValueClass(increase, isTotal, true)}>{increase > 0 ? formatValue(increase) : ''}</td>
        <td className={getValueClass(decrease, isTotal)}>{decrease > 0 ? formatValue(decrease) : ''}</td>
      </tr>
    );
  };

  // Calculate summary data
  const summaryData = useMemo(() => {
    const resultadoEjercicio = currentYear.currentYearResult || 0;
    const origenesDiversos = (currentYear.patrimonioNeto || 0) - resultadoEjercicio;
    const totalOrigenes = resultadoEjercicio + origenesDiversos;
    
    const variacionesCirculante = (currentYear.activoCorriente || 0) - (previousYear.activoCorriente || 0);
    const otrasAplicaciones = totalOrigenes - variacionesCirculante;
    const totalAplicaciones = variacionesCirculante + otrasAplicaciones;
    
    return {
      totalOrigenes,
      resultadoEjercicio,
      origenesDiversos,
      totalAplicaciones,
      variacionesCirculante,
      otrasAplicaciones
    };
  }, [currentYear, previousYear]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregant dades...</div>;
  }

  if (years.length < 2) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Es necessiten almenys 2 anys de dades per mostrar el quadre de finançament</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 bg-slate-800/50 border-r border-border p-3 overflow-y-auto">
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-amber-400 mb-2">Opcions de Dades</h4>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataView === 'values_deviation'} 
                  onChange={() => setDataView('values_deviation')}
                  className="w-3 h-3"
                />
                <span>Valors i desviació</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataView === 'values'} 
                  onChange={() => setDataView('values')}
                  className="w-3 h-3"
                />
                <span>Només valors</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-amber-400 mb-2">Opcions Principals</h4>
            <div className="space-y-1 text-xs">
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Financial System</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Balances</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Financera</div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-amber-400 mb-2">Grup Analítica</h4>
            <div className="space-y-1 text-xs">
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Anàlisi Masas Patrimonials</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Quadre Analític P.y G.</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Neces.Operat.de Fondos</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Tendències Anuals Mòbils (TAM)</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Anàlisi del Capital Circulant</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Anàlisi Financera a llarg termini</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Flux de Caixa</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Anàlisi EBIT y EBITDA</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Anàlisi del Valor Afegit</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Moviments de Tresoreria</div>
              <div className="py-1 px-2 bg-amber-500/20 text-amber-400 rounded cursor-pointer font-medium">Quadre de Finançament</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Quadre de Comandament Financer</div>
              <div className="py-1 px-2 hover:bg-muted/50 rounded cursor-pointer">Índex 'Z'</div>
            </div>
          </div>

          <div className="mb-4">
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
          <h2 className="text-xl font-bold text-amber-400 text-center mb-4">
            QUADRE DE FINANÇAMENT. (ORÍGENS I APLICACIONS DE FONS)
          </h2>

          {/* ACTIVO NO CORRIENTE Table */}
          <div className="mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-700">
                  <th className="text-left px-2 py-1 border border-slate-600">DESCRIPCIÓ</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Desembre-{years[0]}</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Desembre-{years[1]}</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Diferència</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Augment</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Disminució</th>
                </tr>
              </thead>
              <tbody>
                <TableRow 
                  label="ACTIU NO CORRENT" 
                  currentVal={currentYear.activoNoCorriente || 0} 
                  previousVal={previousYear.activoNoCorriente || 0} 
                  isTotal 
                />
                <TableRow label="Immobilitzat Intangible" currentVal={currentYear.intangibleAssets || 0} previousVal={previousYear.intangibleAssets || 0} indent={1} />
                <TableRow label="Immobilitzat Material" currentVal={currentYear.tangibleAssets || 0} previousVal={previousYear.tangibleAssets || 0} indent={1} />
                <TableRow label="Inversions immobiliàries" currentVal={currentYear.realEstateInvestments || 0} previousVal={previousYear.realEstateInvestments || 0} indent={1} />
                <TableRow label="Invers.en emp.grup i assoc.a llarg termini" currentVal={currentYear.longTermGroupInvestments || 0} previousVal={previousYear.longTermGroupInvestments || 0} indent={1} />
                <TableRow label="Inversions financeres a llarg termini" currentVal={currentYear.longTermFinancialInvestments || 0} previousVal={previousYear.longTermFinancialInvestments || 0} indent={1} />
                <TableRow label="Actiu per Impost Diferit" currentVal={currentYear.deferredTaxAssets || 0} previousVal={previousYear.deferredTaxAssets || 0} indent={1} />
                <TableRow 
                  label="ACTIU CORRENT" 
                  currentVal={currentYear.activoCorriente || 0} 
                  previousVal={previousYear.activoCorriente || 0} 
                  isTotal 
                />
                <TableRow label="Actius no corrents mantinguts per a la venda" currentVal={currentYear.nonCurrentAssetsHeldForSale || 0} previousVal={previousYear.nonCurrentAssetsHeldForSale || 0} indent={1} />
              </tbody>
            </table>
          </div>

          {/* PATRIMONIO NETO Table */}
          <div className="mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-700">
                  <th className="text-left px-2 py-1 border border-slate-600">DESCRIPCIÓ</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Desembre-{years[0]}</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Desembre-{years[1]}</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Diferència</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Augment</th>
                  <th className="text-right px-2 py-1 border border-slate-600">Disminució</th>
                </tr>
              </thead>
              <tbody>
                <TableRow 
                  label="PATRIMONI NET" 
                  currentVal={currentYear.patrimonioNeto || 0} 
                  previousVal={previousYear.patrimonioNeto || 0} 
                  isTotal 
                />
                <TableRow label="Capital" currentVal={currentYear.shareCapital || 0} previousVal={previousYear.shareCapital || 0} indent={1} />
                <TableRow label="Prima d'Emissió" currentVal={currentYear.sharePremium || 0} previousVal={previousYear.sharePremium || 0} indent={1} />
                <TableRow label="Reserves" currentVal={currentYear.reserves || 0} previousVal={previousYear.reserves || 0} indent={1} />
                <TableRow label="Accions i Participacions en Patrimoni Propis" currentVal={-(currentYear.treasuryShares || 0)} previousVal={-(previousYear.treasuryShares || 0)} indent={1} />
                <TableRow label="Resultats Exercicis Anteriors" currentVal={currentYear.retainedEarnings || 0} previousVal={previousYear.retainedEarnings || 0} indent={1} />
                <TableRow label="Altres aportacions de Socis" currentVal={currentYear.otherEquity || 0} previousVal={previousYear.otherEquity || 0} indent={1} />
                <TableRow label="Resultat de l'exercici" currentVal={currentYear.currentYearResult || 0} previousVal={previousYear.currentYearResult || 0} indent={1} />
                <TableRow label="Dividend a compte" currentVal={-(currentYear.interimDividend || 0)} previousVal={-(previousYear.interimDividend || 0)} indent={1} />
              </tbody>
            </table>
          </div>

          {/* RESUMEN DEL ESTADO */}
          <div className="mb-4">
            <h3 className="text-center text-sm font-bold text-amber-400 mb-2">RESUM DE L'ESTAT</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-center text-xs font-semibold mb-2 text-amber-300">ORÍGENS DE FONS</h4>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="bg-amber-100 dark:bg-amber-900/30 font-bold">
                      <td className="px-2 py-1">TOTALS</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.totalOrigenes)}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 pl-4">Resultat de l'exercici</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.resultadoEjercicio)}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 pl-4">Orígens diversos</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.origenesDiversos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-center text-xs font-semibold mb-2 text-amber-300">APLICACIONS DE FONS</h4>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="bg-amber-100 dark:bg-amber-900/30 font-bold">
                      <td className="px-2 py-1">TOTALS</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.totalAplicaciones)}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 pl-4">Variacions Circulant</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.variacionesCirculante)}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 pl-4">Altres Aplicacions</td>
                      <td className="text-right px-2 py-1">{formatValue(summaryData.otrasAplicaciones)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-72 bg-slate-800/50 border-l border-border p-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-amber-400 text-center mb-4">GRÀFICS DE CONTROL I EVOLUCIÓ</h3>
          
          {/* Chart 1 */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-center mb-2 text-amber-300">ACTIU NO CORRENT</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartData, 'value', '#f59e0b', chartType)}
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1">Períodes anuals</p>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Gràfic de Valors</span>
                <select 
                  value={chartGroup} 
                  onChange={(e) => setChartGroup(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-1 py-0.5"
                >
                  <option value="activo_no_corriente">Valors Actiu</option>
                  <option value="patrimonio_neto">Valors Patrimoni</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Tipus de Gràfic</span>
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-1 py-0.5"
                >
                  <option value="bar">Barres</option>
                  <option value="line">Línies</option>
                  <option value="area">Àrea</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-center mb-2 text-amber-300">PATRIMONI NET</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartData2, 'value', '#10b981', chartType2)}
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1">Períodes anuals</p>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Gràfic de Valors</span>
                <select 
                  value={chartGroup2} 
                  onChange={(e) => setChartGroup2(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-1 py-0.5"
                >
                  <option value="patrimonio_neto">Valors Passiu</option>
                  <option value="activo_corriente">Valors Actiu Corrent</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Tipus de Gràfic</span>
                <select 
                  value={chartType2} 
                  onChange={(e) => setChartType2(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-1 py-0.5"
                >
                  <option value="bar">Barres</option>
                  <option value="line">Línies</option>
                  <option value="area">Àrea</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-8 bg-slate-900 border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <span>{companyName}</span>
        <span>Orígens i Aplicacions de Fons</span>
        <span>Anàlisi de períodes: ANUALS</span>
        <span>QUADRE DE BALANÇOS: 'OK'</span>
        <span>📊 Calculadora</span>
        <span>⏰ {new Date().toLocaleString('ca-ES')}</span>
      </div>
    </div>
  );
};

export default FinancingStatement;
