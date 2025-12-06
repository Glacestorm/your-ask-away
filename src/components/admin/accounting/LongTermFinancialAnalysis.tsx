import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Calculator, FileText, BarChart3, PieChart, TrendingUp, Settings, Info, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FinancialStatement {
  id: string;
  fiscal_year: number;
  statement_type: string;
  status: string;
}

interface BalanceSheet {
  statement_id: string;
  share_capital?: number;
  share_premium?: number;
  revaluation_reserve?: number;
  legal_reserve?: number;
  statutory_reserves?: number;
  voluntary_reserves?: number;
  retained_earnings?: number;
  current_year_result?: number;
  treasury_shares?: number;
  long_term_provisions?: number;
  long_term_debts?: number;
  long_term_group_debts?: number;
  deferred_tax_liabilities?: number;
  deferred_tax_assets?: number;
  long_term_group_investments?: number;
  intangible_assets?: number;
  goodwill?: number;
  tangible_assets?: number;
  long_term_financial_investments?: number;
  real_estate_investments?: number;
  inventory?: number;
  trade_receivables?: number;
  short_term_financial_investments?: number;
  cash_equivalents?: number;
  short_term_debts?: number;
  short_term_group_debts?: number;
  trade_payables?: number;
  other_creditors?: number;
}

interface IncomeStatement {
  statement_id: string;
  net_turnover?: number;
  financial_expenses?: number;
  corporate_tax?: number;
}

interface LongTermFinancialAnalysisProps {
  companyId: string;
  companyName: string;
  statements: FinancialStatement[];
  balanceSheets: Record<string, BalanceSheet>;
  incomeStatements: Record<string, IncomeStatement>;
}

type DataViewMode = 'values_percentages' | 'values' | 'values_total' | 'values_deviation';

const LongTermFinancialAnalysis: React.FC<LongTermFinancialAnalysisProps> = ({
  companyId,
  companyName,
  statements,
  balanceSheets,
  incomeStatements
}) => {
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('values_percentages');
  const [showThousands, setShowThousands] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['grupo_analitica']);
  const [chartGroup1, setChartGroup1] = useState('fondos_propios');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('porcentajes');
  const [chartType2, setChartType2] = useState('bar');

  const sortedStatements = useMemo(() => {
    return [...statements].sort((a, b) => b.fiscal_year - a.fiscal_year).slice(0, 5);
  }, [statements]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0,00';
    const displayValue = showThousands ? value / 1000 : value;
    return displayValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getBalanceValue = (year: number, field: keyof BalanceSheet): number => {
    const statement = sortedStatements.find(s => s.fiscal_year === year);
    if (!statement) return 0;
    const balance = balanceSheets[statement.id];
    return (balance?.[field] as number) || 0;
  };

  const getIncomeValue = (year: number, field: keyof IncomeStatement): number => {
    const statement = sortedStatements.find(s => s.fiscal_year === year);
    if (!statement) return 0;
    const income = incomeStatements[statement.id];
    return (income?.[field] as number) || 0;
  };

  // Calculate aggregated values
  const calculateValues = (year: number) => {
    // Fondos Propios
    const shareCapital = getBalanceValue(year, 'share_capital');
    const sharePremium = getBalanceValue(year, 'share_premium');
    const revaluationReserve = getBalanceValue(year, 'revaluation_reserve');
    const reserves = getBalanceValue(year, 'legal_reserve') + getBalanceValue(year, 'statutory_reserves') + getBalanceValue(year, 'voluntary_reserves');
    const retainedEarnings = getBalanceValue(year, 'retained_earnings');
    const currentYearResult = getBalanceValue(year, 'current_year_result');
    const treasuryShares = getBalanceValue(year, 'treasury_shares');
    
    const totalFondosPropios = shareCapital + sharePremium + revaluationReserve + reserves + retainedEarnings + currentYearResult - treasuryShares;

    // Fondos Ajenos
    const provisions = getBalanceValue(year, 'long_term_provisions');
    const longTermDebts = getBalanceValue(year, 'long_term_debts');
    const longTermGroupDebts = getBalanceValue(year, 'long_term_group_debts');
    const deferredTaxLiabilities = getBalanceValue(year, 'deferred_tax_liabilities');
    
    const totalFondosAjenos = provisions + longTermDebts + longTermGroupDebts + deferredTaxLiabilities;

    const totalFondosFinanciacion = totalFondosPropios + totalFondosAjenos;

    // Inversiones en Activos No Corrientes
    const deferredTaxAssets = getBalanceValue(year, 'deferred_tax_assets');
    const longTermGroupInvestments = getBalanceValue(year, 'long_term_group_investments');
    const intangibleAssets = getBalanceValue(year, 'intangible_assets') + getBalanceValue(year, 'goodwill');
    const tangibleAssets = getBalanceValue(year, 'tangible_assets');
    const financialInvestments = getBalanceValue(year, 'long_term_financial_investments');
    const realEstateInvestments = getBalanceValue(year, 'real_estate_investments');

    const totalInversionesNoCorrientes = deferredTaxAssets + longTermGroupInvestments + intangibleAssets + tangibleAssets + financialInvestments + realEstateInvestments;

    // Capital Corriente
    const currentAssets = getBalanceValue(year, 'inventory') + getBalanceValue(year, 'trade_receivables') + 
                         getBalanceValue(year, 'short_term_financial_investments') + getBalanceValue(year, 'cash_equivalents');
    const currentLiabilities = getBalanceValue(year, 'short_term_debts') + getBalanceValue(year, 'short_term_group_debts') + 
                               getBalanceValue(year, 'trade_payables') + getBalanceValue(year, 'other_creditors');
    const workingCapital = currentAssets - currentLiabilities;

    // Autofinanciación
    const corporateTax = getIncomeValue(year, 'corporate_tax');
    const financialExpenses = getIncomeValue(year, 'financial_expenses');
    const beneficioAntesImpuestos = currentYearResult + corporateTax;
    const autofinanciacionEnriquecimiento = reserves + retainedEarnings + currentYearResult;

    // Solvencia
    const activoNoCorriente = totalInversionesNoCorrientes;
    const proporcionSolvencia = totalFondosFinanciacion > 0 ? (activoNoCorriente / totalFondosFinanciacion) : 0;

    // Endeudamiento
    const proporcionEndeudamiento = totalFondosFinanciacion > 0 ? (totalFondosPropios / totalFondosFinanciacion) : 0;

    // Tipo Impositivo Efectivo
    const tipoImpositivo = beneficioAntesImpuestos !== 0 ? (corporateTax / beneficioAntesImpuestos) * 100 : 0;

    // Cobertura Gastos Financieros
    const coberturaGastosFinancieros = financialExpenses !== 0 ? (currentYearResult / Math.abs(financialExpenses)) : 0;

    return {
      shareCapital,
      sharePremium,
      revaluationReserve,
      reserves,
      retainedEarnings,
      currentYearResult,
      treasuryShares,
      totalFondosPropios,
      provisions,
      longTermDebts,
      longTermGroupDebts,
      deferredTaxLiabilities,
      totalFondosAjenos,
      totalFondosFinanciacion,
      deferredTaxAssets,
      longTermGroupInvestments,
      intangibleAssets,
      tangibleAssets,
      financialInvestments,
      realEstateInvestments,
      totalInversionesNoCorrientes,
      currentAssets,
      currentLiabilities,
      workingCapital,
      totalInversiones: totalInversionesNoCorrientes + currentAssets,
      autofinanciacionEnriquecimiento,
      beneficioAntesImpuestos,
      corporateTax,
      tipoImpositivo,
      financialExpenses,
      coberturaGastosFinancieros,
      activoNoCorriente,
      proporcionSolvencia,
      proporcionEndeudamiento
    };
  };

  const years = sortedStatements.map(s => s.fiscal_year);
  const yearData = years.map(year => ({ year, ...calculateValues(year) }));

  const chartData = yearData.map(d => ({
    name: d.year.toString(),
    fondosPropios: showThousands ? d.totalFondosPropios / 1000 : d.totalFondosPropios,
    fondosAjenos: showThousands ? d.totalFondosAjenos / 1000 : d.totalFondosAjenos,
    proporcion: d.proporcionEndeudamiento * 100
  })).reverse();

  const menuItems = [
    { id: 'financial_system', label: 'FINANCIAL SYSTEM', icon: Building2, children: [
      'Pantalla principal', 'Pantalla de empresas', 'Introducción Datos', 'Informes'
    ]},
    { id: 'balances', label: 'Balances', icon: FileText },
    { id: 'financiera', label: 'Financiera', icon: Calculator },
    { id: 'grupo_analitica', label: 'Grupo Analítica', icon: BarChart3, children: [
      'Anàlisi Masses Patrimonials', 'Quadre Analític P.y G.', 'Quadre Analític (Resum i Porc.)',
      'Neces.Operat.de Fondos', 'Tendències Anuals Mòbils (TAM)', 'Anàlisi del Capital Circulant',
      { id: 'analisis_largo_plazo', label: 'Anàlisi Financer a llarg termini', active: true },
      'Flux de Caixa', 'Anàlisi EBIT i EBITDA', 'Anàlisi del Valor Afegit',
      'Moviments de Tresoreria', 'Quadre de Finançament', 'Quadre de Comandament Financer', "Índex 'Z'"
    ]},
    { id: 'ratios', label: 'Ratios', icon: PieChart },
    { id: 'rentabilidad', label: 'Rentabilitat', icon: TrendingUp },
    { id: 'auditoria', label: 'Auditoria', icon: FileText },
    { id: 'valoraciones', label: 'Valoracions', icon: Calculator },
    { id: 'cuentas_anuales', label: 'Comptes Anuals', icon: FileText },
    { id: 'valor_accionarial', label: 'Valor Accionarial', icon: TrendingUp },
    { id: 'informacion', label: 'Informació', icon: Info },
    { id: 'varios', label: 'Diversos', icon: Settings },
  ];

  return (
    <div className="flex h-full bg-[#1a1a2e] text-foreground">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#0d1117] border-r border-[#30363d] flex flex-col overflow-y-auto">
        {/* Data View Options */}
        <div className="p-3 border-b border-[#30363d]">
          <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            Visió de dades
          </div>
          <div className="space-y-1">
            {[
              { value: 'values_percentages', label: 'Vista de valors i percentatges' },
              { value: 'values', label: 'Vista de valors' },
              { value: 'values_total', label: 'Vista de valors i % sobre total' },
              { value: 'values_deviation', label: 'Vista de valors i % de desviació' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#21262d] p-1 rounded">
                <input
                  type="radio"
                  name="dataView"
                  value={option.value}
                  checked={dataViewMode === option.value}
                  onChange={(e) => setDataViewMode(e.target.value as DataViewMode)}
                  className="w-3 h-3 accent-amber-400"
                />
                <span className="text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Main Menu */}
        <div className="p-3 flex-1">
          <div className="text-xs text-amber-400 font-semibold mb-2">Opcions Principals</div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.id}>
                <Collapsible open={expandedSections.includes(item.id)}>
                  <CollapsibleTrigger
                    onClick={() => item.children && toggleSection(item.id)}
                    className={`flex items-center gap-2 w-full text-left text-xs p-1.5 rounded transition-colors ${
                      item.children ? 'hover:bg-[#21262d] cursor-pointer' : 'hover:bg-[#21262d]'
                    }`}
                  >
                    {item.children ? (
                      expandedSections.includes(item.id) ? (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      )
                    ) : (
                      <span className="w-3" />
                    )}
                    <item.icon className="w-3 h-3 text-amber-400" />
                    <span className="text-gray-300">{item.label}</span>
                  </CollapsibleTrigger>
                  {item.children && (
                    <CollapsibleContent>
                      <div className="ml-6 space-y-0.5 mt-1">
                        {item.children.map((child, idx) => {
                          const isActive = typeof child === 'object' && child.active;
                          const label = typeof child === 'object' ? child.label : child;
                          return (
                            <div
                              key={idx}
                              className={`text-xs p-1.5 rounded cursor-pointer transition-colors ${
                                isActive
                                  ? 'bg-amber-400/20 text-amber-400 border-l-2 border-amber-400'
                                  : 'text-gray-400 hover:bg-[#21262d] hover:text-gray-300'
                              }`}
                            >
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="p-3 border-t border-[#30363d]">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showThousands}
              onChange={(e) => setShowThousands(e.target.checked)}
              className="w-3 h-3 accent-amber-400"
            />
            <span className="text-gray-300">Milers d'unitats</span>
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-amber-400 tracking-wide">
            ANÀLISI DE LA SITUACIÓ FINANCERA A LLARG TERMINI
          </h1>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Main Tables */}
          <div className="col-span-5 space-y-3">
            {/* Fondos de Financiación */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  FONS DE FINANÇAMENT I INVERSIONS TOTALS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">GRUPS PATRIMONIALS</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* I. FONDOS PROPIOS */}
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Capital subscrit</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.shareCapital)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Prima d'emissió</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.sharePremium)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Reserva de revalorització</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.revaluationReserve)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Reserves</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.reserves)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Resultats d'exercicis anteriors</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.retainedEarnings)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Resultat de l'exercici</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentYearResult)}</td>
                      ))}
                    </tr>
                    <tr className="bg-amber-600/30 font-semibold">
                      <td className="p-1.5 text-amber-400">TOTAL FONS PROPIS</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-amber-400">{formatValue(d.totalFondosPropios)}</td>
                      ))}
                    </tr>

                    {/* II. FONDOS AJENOS */}
                    <tr className="bg-[#21262d]">
                      <td colSpan={3} className="p-1.5 text-amber-400 font-semibold">II. FONS DE FINANÇAMENT (ALIENS)</td>
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Provisions per a riscos i despeses</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.provisions)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Deutes amb entitats de crèdit a llarg termini</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.longTermDebts)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Deutes amb entitats del Grup i Associades</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.longTermGroupDebts)}</td>
                      ))}
                    </tr>
                    <tr className="bg-amber-600/30 font-semibold">
                      <td className="p-1.5 text-amber-400">TOTAL FONS ALIENS</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-amber-400">{formatValue(d.totalFondosAjenos)}</td>
                      ))}
                    </tr>
                    <tr className="bg-red-600/30 font-bold">
                      <td className="p-1.5 text-red-400">FONS TOTALS DE FINANÇAMENT</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-red-400">{formatValue(d.totalFondosFinanciacion)}</td>
                      ))}
                    </tr>

                    {/* INVERSIONES */}
                    <tr className="bg-[#21262d]">
                      <td colSpan={3} className="p-1.5 text-amber-400 font-semibold">INVERSIONS EN ACTIUS NO CORRENTS</td>
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Actius per impostos diferits</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.deferredTaxAssets)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Inversions en empreses del grup i ass.</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.longTermGroupInvestments)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Immobilitzat intangible Net</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.intangibleAssets)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Immobilitzat material net</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.tangibleAssets)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Inversions financeres</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.financialInvestments)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Inversions immobiliàries</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.realEstateInvestments)}</td>
                      ))}
                    </tr>
                    <tr className="bg-amber-600/30 font-semibold">
                      <td className="p-1.5 text-amber-400">TOTAL INVERSIONS EN ACTIUS NO CORRENTS</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-amber-400">{formatValue(d.totalInversionesNoCorrientes)}</td>
                      ))}
                    </tr>

                    {/* CAPITAL CORRIENTE */}
                    <tr className="bg-[#21262d]">
                      <td colSpan={3} className="p-1.5 text-amber-400 font-semibold">CAPITAL CORRENT</td>
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Actiu Corrent</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentAssets)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Passiu Corrent</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentLiabilities)}</td>
                      ))}
                    </tr>
                    <tr className="bg-amber-600/30 font-semibold">
                      <td className="p-1.5 text-amber-400">TOTAL CAPITAL CORRENT</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-amber-400">{formatValue(d.workingCapital)}</td>
                      ))}
                    </tr>
                    <tr className="bg-red-600/30 font-bold">
                      <td className="p-1.5 text-red-400">INVERSIONS TOTALS</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-red-400">{formatValue(d.totalInversiones)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Analysis Tables */}
          <div className="col-span-4 space-y-3">
            {/* Autofinanciación */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  AUTOFINANÇAMENT GENERAT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">VALOR DE L'AUTOFINANÇAMENT</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#1c2128]">
                      <td colSpan={3} className="p-1.5 text-amber-400 font-semibold">AUTOFINANÇAMENT D'ENRIQUIMENT</td>
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Reserves</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.reserves)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Resultats d'exercicis anteriors</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.retainedEarnings)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Resultat de l'exercici</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentYearResult)}</td>
                      ))}
                    </tr>
                    <tr className="bg-amber-600/30 font-semibold">
                      <td className="p-1.5 text-amber-400">TOTAL AUTOFINANÇAMENT D'ENRIQUIMENT</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-amber-400">{formatValue(d.autofinanciacionEnriquecimiento)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Solvencia a Largo Plazo */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  SOLVÈNCIA A LLARG TERMINI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">Descripció</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Fons de Finançament</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.totalFondosFinanciacion)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Actiu NoCorrent (b)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.activoNoCorriente)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Proporció (a/b)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{d.proporcionSolvencia.toFixed(2)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Endeudamiento Total */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  ENDEUTAMENT TOTAL GENERAT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">RELACIÓ D'ENDEUTAMENT TOTAL</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Fons de Finançament Aliens l/pzo. (a)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.totalFondosAjenos)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Passiu Corrent (curt termini) (b)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentLiabilities)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Fons de Finançament Propis (c)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.totalFondosPropios)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Proporció (a+b)/(c)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">
                          {d.totalFondosPropios !== 0 
                            ? ((d.totalFondosAjenos + d.currentLiabilities) / d.totalFondosPropios).toFixed(2) 
                            : '0,00'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Tipo Impositivo Efectivo */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  TIPUS IMPOSITIU EFECTIU
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">TIPUS IMPOSITIU EFECTIU</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Impost Societats (a)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.corporateTax)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Benefici abans d'Impostos (BAI) (b)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.beneficioAntesImpuestos)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Tipus efectiu impositu (a/b)*100</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{d.tipoImpositivo.toFixed(2)}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Cobertura Gastos Financieros */}
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  COBERTURA DE DESPESES FINANCERES
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#21262d]">
                      <th className="text-left p-1.5 text-amber-400 font-semibold">RÀTIO DE COBERTURA</th>
                      {years.slice(0, 2).map(year => (
                        <th key={year} className="text-right p-1.5 text-amber-400 font-semibold">
                          Des-{year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Benefici després d'impostos (a)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.currentYearResult)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#0d1117]">
                      <td className="p-1.5 text-gray-300">Impostos (b)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.corporateTax)}</td>
                      ))}
                    </tr>
                    <tr className="bg-[#1c2128]">
                      <td className="p-1.5 text-gray-300">Despeses financeres (c)</td>
                      {yearData.slice(0, 2).map((d, idx) => (
                        <td key={idx} className="text-right p-1.5 text-gray-300">{formatValue(d.financialExpenses)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Charts */}
          <div className="col-span-3 space-y-3">
            <Card className="bg-[#0d1117] border-[#30363d]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700">
                <CardTitle className="text-xs font-bold text-white text-center">
                  GRÀFICS DE CONTROL I EVOLUCIÓ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-4">
                {/* Chart 1 - Fondos Propios */}
                <div>
                  <div className="text-xs text-amber-400 font-semibold mb-2 text-center">Fons Propis Totals</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                          labelStyle={{ color: '#f59e0b' }}
                        />
                        <Bar dataKey="fondosPropios" fill="#3b82f6" name="Fons Propis" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={chartGroup1} onValueChange={setChartGroup1}>
                      <SelectTrigger className="h-6 text-xs bg-[#21262d] border-[#30363d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fondos_propios">Valors Anàlisi Financ.Llarg Pzo.</SelectItem>
                        <SelectItem value="fondos_ajenos">Fons Aliens</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={chartType1} onValueChange={setChartType1}>
                      <SelectTrigger className="h-6 text-xs bg-[#21262d] border-[#30363d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Tipus de Gràfics</SelectItem>
                        <SelectItem value="line">Línia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chart 2 - Percentages */}
                <div>
                  <div className="text-xs text-amber-400 font-semibold mb-2 text-center">Fons Propis Totals</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                          labelStyle={{ color: '#f59e0b' }}
                        />
                        <Bar dataKey="proporcion" fill="#f59e0b" name="Proporció %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-2 mt-2 items-center">
                    <div className="flex items-center gap-1">
                      <input type="radio" name="pctType" className="w-3 h-3 accent-amber-400" defaultChecked />
                      <span className="text-xs text-gray-300">Percentatges totals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" name="pctType" className="w-3 h-3 accent-amber-400" />
                      <span className="text-xs text-gray-300">Percentatges desviació</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={chartGroup2} onValueChange={setChartGroup2}>
                      <SelectTrigger className="h-6 text-xs bg-[#21262d] border-[#30363d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="porcentajes">% s/Totals i Desviacions</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={chartType2} onValueChange={setChartType2}>
                      <SelectTrigger className="h-6 text-xs bg-[#21262d] border-[#30363d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Tipus de Gràfics</SelectItem>
                        <SelectItem value="line">Línia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs bg-[#21262d] px-3 py-2 rounded border border-[#30363d]">
          <span className="text-gray-400">{companyName}</span>
          <span className="text-amber-400 font-semibold">◉ ANÀLISI DE LA SITUACIÓ FINANCERA A LLARG TERMINI</span>
          <span className="text-gray-400">Anàlisi de períodes: ANUALS</span>
          <span className="text-gray-400">QUADRE DE BALANÇOS: 'OK'</span>
          <span className="text-gray-400 flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            Calculadora
          </span>
          <span className="text-gray-400">{new Date().toLocaleString('ca-ES')}</span>
        </div>
      </div>
    </div>
  );
};

export default LongTermFinancialAnalysis;
