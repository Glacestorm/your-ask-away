import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight, FileText, BarChart3, Calculator, Folder, Search, Printer, Settings } from 'lucide-react';

interface BalanceAnalysisAreaProps {
  companyId: string;
  companyName: string;
}

const BalanceAnalysisArea: React.FC<BalanceAnalysisAreaProps> = ({ companyId, companyName }) => {
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'activo' | 'pasivo' | 'resultados' | 'bancario'>('activo');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'financial': true,
    'balances': true,
    'financiera': true,
    'analitica': true,
    'ratios': false,
    'rentabilidad': false,
    'auditoria': false,
    'valoraciones': false,
  });
  const [selectedChart1, setSelectedChart1] = useState('activo_nocorriente');
  const [selectedChart2, setSelectedChart2] = useState('activo_nocorriente_pct');

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      setLoading(true);

      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select(`
          id,
          fiscal_year,
          balance_sheets(*),
          income_statements(*)
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (statements) {
        const balances = statements
          .filter(s => s.balance_sheets)
          .map(s => ({ ...s.balance_sheets, fiscal_year: s.fiscal_year }));
        const incomes = statements
          .filter(s => s.income_statements)
          .map(s => ({ ...s.income_statements, fiscal_year: s.fiscal_year }));
        setBalanceSheets(balances);
        setIncomeStatements(incomes);
      }
      setLoading(false);
    };

    fetchData();
  }, [companyId]);

  const years = [...new Set(balanceSheets.map(b => b.fiscal_year))]
    .sort((a, b) => b - a)
    .slice(0, 5);

  const getYearData = (year: number) => {
    return balanceSheets.find(b => b.fiscal_year === year) || {};
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0,00';
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0,00 %';
    return `${value.toFixed(2)} %`;
  };

  const calculateVariation = (current: number, previous: number): { value: number; percent: number } => {
    const variation = (current || 0) - (previous || 0);
    const percent = previous !== 0 ? ((variation / Math.abs(previous)) * 100) : 0;
    return { value: variation, percent };
  };

  // Calculate totals
  const calculateTotals = (year: number) => {
    const data = getYearData(year);
    
    const activoNoCorriente = 
      (data.intangible_assets || 0) +
      (data.tangible_assets || 0) +
      (data.real_estate_investments || 0) +
      (data.long_term_group_investments || 0) +
      (data.long_term_financial_investments || 0) +
      (data.deferred_tax_assets || 0) +
      (data.long_term_trade_receivables || 0);

    const activoCorriente =
      (data.non_current_assets_held_for_sale || 0) +
      (data.inventory || 0) +
      (data.trade_receivables || 0) +
      (data.short_term_group_receivables || 0) +
      (data.short_term_financial_investments || 0) +
      (data.short_term_accruals || 0) +
      (data.cash_equivalents || 0);

    const totalActivo = activoNoCorriente + activoCorriente;

    const patrimonioNeto =
      (data.share_capital || 0) +
      (data.share_premium || 0) +
      (data.legal_reserve || 0) +
      (data.statutory_reserves || 0) +
      (data.voluntary_reserves || 0) +
      (data.retained_earnings || 0) +
      (data.current_year_result || 0) +
      (data.capital_grants || 0);

    const pasivoNoCorriente =
      (data.long_term_provisions || 0) +
      (data.long_term_debts || 0) +
      (data.long_term_group_debts || 0) +
      (data.deferred_tax_liabilities || 0) +
      (data.long_term_accruals || 0);

    const pasivoCorriente =
      (data.liabilities_held_for_sale || 0) +
      (data.short_term_provisions || 0) +
      (data.short_term_debts || 0) +
      (data.short_term_group_debts || 0) +
      (data.trade_payables || 0) +
      (data.other_creditors || 0) +
      (data.short_term_accruals || 0);

    const totalPasivoPatrimonio = patrimonioNeto + pasivoNoCorriente + pasivoCorriente;

    return {
      activoNoCorriente,
      activoCorriente,
      totalActivo,
      patrimonioNeto,
      pasivoNoCorriente,
      pasivoCorriente,
      totalPasivoPatrimonio,
    };
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const year1 = years[1] || 0; // Previous year
  const year2 = years[0] || 0; // Current year
  const totals1 = calculateTotals(year1);
  const totals2 = calculateTotals(year2);
  const data1 = getYearData(year1);
  const data2 = getYearData(year2);

  // Assets rows data
  const activoRows = [
    { key: 'A', label: 'A) ACTIVO NO CORRIENTE', value1: totals1.activoNoCorriente, value2: totals2.activoNoCorriente, isHeader: true },
    { key: 'I', label: 'I. Inmovilizado intangible', field: 'intangible_assets', indent: 1 },
    { key: 'II', label: 'II. Inmovilizado material', field: 'tangible_assets', indent: 1 },
    { key: 'III', label: 'III. Inversiones inmobiliarias', field: 'real_estate_investments', indent: 1 },
    { key: 'IV', label: 'IV. Invers.en emp.grupo y asoc.a largo plazo', field: 'long_term_group_investments', indent: 1 },
    { key: 'V', label: 'V. Inversiones financieras a largo plazo', field: 'long_term_financial_investments', indent: 1 },
    { key: 'VI', label: 'VI. Activos por impuestos diferidos', field: 'deferred_tax_assets', indent: 1 },
    { key: 'VII', label: 'VII. Deudas comerciales no corrientes', field: 'long_term_trade_receivables', indent: 1 },
    { key: 'B', label: 'B) ACTIVO CORRIENTE', value1: totals1.activoCorriente, value2: totals2.activoCorriente, isHeader: true },
    { key: 'BI', label: 'I. Activos no corrientes mantenidos para la venta', field: 'non_current_assets_held_for_sale', indent: 1 },
    { key: 'BII', label: 'II. Existencias', field: 'inventory', indent: 1 },
    { key: 'BIII', label: 'III. Deudores comerciales y otras cuentas a cobrar', field: 'trade_receivables', indent: 1 },
    { key: 'BIV', label: 'IV. Inversiones en emp.grupo y asoc.a corto plazo', field: 'short_term_group_receivables', indent: 1 },
    { key: 'BV', label: 'V. Inversiones financieras a corto plazo', field: 'short_term_financial_investments', indent: 1 },
    { key: 'BVI', label: 'VI. Periodificaciones a corto plazo', field: 'short_term_accruals', indent: 1 },
    { key: 'BVII', label: 'VII. Efectivo y otros activos líquidos equivalentes', field: 'cash_equivalents', indent: 1 },
  ];

  const getChartData = (type: string) => {
    return years.map(year => {
      const totals = calculateTotals(year);
      let value = 0;
      switch (type) {
        case 'activo_nocorriente': value = totals.activoNoCorriente / 1000; break;
        case 'activo_corriente': value = totals.activoCorriente / 1000; break;
        case 'total_activo': value = totals.totalActivo / 1000; break;
        case 'activo_nocorriente_pct': 
          value = totals.totalActivo !== 0 ? (totals.activoNoCorriente / totals.totalActivo) * 100 : 0; 
          break;
      }
      return { name: year.toString(), value };
    }).reverse();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregant dades...</div>;
  }

  const balanceOk = Math.abs(totals2.totalActivo - totals2.totalPasivoPatrimonio) < 0.01;

  return (
    <div className="flex flex-col h-full bg-[#c4a84b] text-gray-900 overflow-hidden">
      {/* Header */}
      <div className="text-center py-2 border-b border-amber-700">
        <h1 className="text-xl font-bold text-gray-900">ÁREA DE ANÁLISIS</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Menu */}
        <div className="w-56 flex-shrink-0 bg-[#0d0d1a] text-white overflow-y-auto border-r border-gray-600">
          {/* Balance View Selection */}
          <div className="border border-amber-600 m-2 rounded">
            <div className="text-amber-400 text-xs font-bold p-2 border-b border-amber-600">Selección Vista del Balance</div>
            <div className="space-y-1 p-2">
              {[
                { id: 'activo', label: 'ACTIVO', color: 'bg-amber-600' },
                { id: 'pasivo', label: 'PASIVO', color: 'bg-gray-500' },
                { id: 'resultados', label: 'RESULTADOS', color: 'bg-gray-500' },
                { id: 'bancario', label: 'ANÁLISIS BANCARIO', color: 'bg-gray-500' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedView(item.id as any)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 ${
                    selectedView === item.id ? 'bg-amber-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Options */}
          <div className="border border-amber-600 m-2 rounded">
            <div className="flex justify-between items-center text-amber-400 text-xs font-bold p-2 border-b border-amber-600">
              <span>Opciones Principales</span>
              <span className="text-[10px]">≡ ×</span>
            </div>
            
            {/* Financial System */}
            <div>
              <button 
                onClick={() => toggleSection('financial')}
                className="w-full text-left px-2 py-1 text-blue-400 text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.financial ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Financial System
              </button>
              {expandedSections.financial && (
                <div className="pl-4 space-y-0.5 text-[10px]">
                  <div className="flex items-center gap-1 text-amber-300"><Folder className="h-3 w-3" /> Pantalla principal</div>
                  <div className="flex items-center gap-1 text-amber-300"><Folder className="h-3 w-3" /> Pantalla de empresas</div>
                  <div className="flex items-center gap-1 text-amber-300"><Folder className="h-3 w-3" /> Introducción Datos</div>
                  <div className="flex items-center gap-1 text-amber-300"><Folder className="h-3 w-3" /> Informes</div>
                </div>
              )}
            </div>

            {/* Balances */}
            <div>
              <button 
                onClick={() => toggleSection('balances')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.balances ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Balances
              </button>
            </div>

            {/* Financiera */}
            <div>
              <button 
                onClick={() => toggleSection('financiera')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.financiera ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Financiera
              </button>
            </div>

            {/* Grupo Analítica */}
            <div>
              <button 
                onClick={() => toggleSection('analitica')}
                className="w-full text-left px-2 py-1 text-amber-400 text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.analitica ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Grupo Analítica
              </button>
              {expandedSections.analitica && (
                <div className="pl-4 space-y-0.5 text-[10px] text-amber-300">
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Análisis Masas Patrimoniales</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Cuadro Analítico P.y G.</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Cuadro Analítico. (Resumen y Porc.)</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Neces.Operat.de Fondos</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Tendencias Anuales Móviles. (TAM)</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Análisis del Capital Circulante</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Análisis Financiero a largo plazo</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Flujo de Caja</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Análisis EBIT y EBITDA</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Análisis del Valor Añadido</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Movimientos de Tesorería.</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Cuadro de Mando Financiero</div>
                  <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Índice 'Z'</div>
                </div>
              )}
            </div>

            {/* Ratios */}
            <div>
              <button 
                onClick={() => toggleSection('ratios')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.ratios ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Ratios
              </button>
            </div>

            {/* Rentabilidad */}
            <div>
              <button 
                onClick={() => toggleSection('rentabilidad')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.rentabilidad ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Rentabilidad
              </button>
            </div>

            {/* Auditoría */}
            <div>
              <button 
                onClick={() => toggleSection('auditoria')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.auditoria ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Auditoría
              </button>
            </div>

            {/* Valoraciones */}
            <div>
              <button 
                onClick={() => toggleSection('valoraciones')}
                className="w-full text-left px-2 py-1 bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
              >
                {expandedSections.valoraciones ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Valoraciones
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Balance Table */}
        <div className="flex-1 overflow-auto p-2">
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-gray-900">BALANCE DE SITUACIÓN: ACTIVO</h2>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-amber-600 text-white">
                  <th className="border border-amber-700 px-2 py-1 text-left w-1/3">DESCRIPCIÓN</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">{year1 ? `31/12/${year1}` : '-'}</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">%</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">{year2 ? `31/12/${year2}` : '-'}</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">%</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">VAR {year1}/{year2}</th>
                  <th className="border border-amber-700 px-2 py-1 text-right">% VA</th>
                </tr>
              </thead>
              <tbody>
                {activoRows.map((row) => {
                  const val1 = row.isHeader ? row.value1 : (data1[row.field!] || 0);
                  const val2 = row.isHeader ? row.value2 : (data2[row.field!] || 0);
                  const pct1 = totals1.totalActivo !== 0 ? (val1 / totals1.totalActivo) * 100 : 0;
                  const pct2 = totals2.totalActivo !== 0 ? (val2 / totals2.totalActivo) * 100 : 0;
                  const variation = calculateVariation(val2, val1);

                  return (
                    <tr 
                      key={row.key} 
                      className={`${row.isHeader ? 'bg-amber-500 font-bold' : 'bg-amber-100 hover:bg-amber-200'}`}
                    >
                      <td className={`border border-amber-300 px-2 py-0.5 ${row.indent ? 'pl-4' : ''}`}>
                        {row.label}
                      </td>
                      <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(val1)}</td>
                      <td className="border border-amber-300 px-2 py-0.5 text-right">{formatPercent(pct1)}</td>
                      <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(val2)}</td>
                      <td className="border border-amber-300 px-2 py-0.5 text-right">{formatPercent(pct2)}</td>
                      <td className={`border border-amber-300 px-2 py-0.5 text-right ${variation.value < 0 ? 'text-red-600' : ''}`}>
                        {formatNumber(variation.value)}
                      </td>
                      <td className={`border border-amber-300 px-2 py-0.5 text-right ${variation.percent < 0 ? 'text-red-600' : ''}`}>
                        {formatPercent(variation.percent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Tables */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Activo Summary */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-600 text-white">
                    <th className="border border-amber-700 px-2 py-1 text-left">ACTIVO</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year1 ? `31/12/${year1}` : '-'}</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year2 ? `31/12/${year2}` : '-'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">ACTIVO NO CORRIENTE</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals1.activoNoCorriente)}</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals2.activoNoCorriente)}</td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">ACTIVO CORRIENTE</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals1.activoCorriente)}</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals2.activoCorriente)}</td>
                  </tr>
                  <tr className="bg-amber-400 font-bold">
                    <td className="border border-amber-700 px-2 py-0.5">TOTAL ACTIVO</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">{formatNumber(totals1.totalActivo)}</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">{formatNumber(totals2.totalActivo)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="bg-amber-600 text-white">
                    <th className="border border-amber-700 px-2 py-1 text-left">ACTIVO (%)</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year1 ? `31/12/${year1}` : '-'}</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year2 ? `31/12/${year2}` : '-'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">ACTIVO NO CORRIENTE (%)</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals1.totalActivo !== 0 ? (totals1.activoNoCorriente / totals1.totalActivo) * 100 : 0)}
                    </td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals2.totalActivo !== 0 ? (totals2.activoNoCorriente / totals2.totalActivo) * 100 : 0)}
                    </td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">ACTIVO CORRIENTE (%)</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals1.totalActivo !== 0 ? (totals1.activoCorriente / totals1.totalActivo) * 100 : 0)}
                    </td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals2.totalActivo !== 0 ? (totals2.activoCorriente / totals2.totalActivo) * 100 : 0)}
                    </td>
                  </tr>
                  <tr className="bg-amber-400 font-bold">
                    <td className="border border-amber-700 px-2 py-0.5">TOTAL ACTIVO (%)</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">100,00%</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">100,00%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pasivo Summary */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-600 text-white">
                    <th className="border border-amber-700 px-2 py-1 text-left">PASIVO</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year1 ? `31/12/${year1}` : '-'}</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year2 ? `31/12/${year2}` : '-'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PATRIMONIO NETO</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals1.patrimonioNeto)}</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals2.patrimonioNeto)}</td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PASIVO NO CORRIENTE</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals1.pasivoNoCorriente)}</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals2.pasivoNoCorriente)}</td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PASIVO CORRIENTE</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals1.pasivoCorriente)}</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">{formatNumber(totals2.pasivoCorriente)}</td>
                  </tr>
                  <tr className="bg-amber-400 font-bold">
                    <td className="border border-amber-700 px-2 py-0.5">TOTAL PATRIMONIO NETO Y PASIVO</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">{formatNumber(totals1.totalPasivoPatrimonio)}</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">{formatNumber(totals2.totalPasivoPatrimonio)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="bg-amber-600 text-white">
                    <th className="border border-amber-700 px-2 py-1 text-left">PASIVO (%)</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year1 ? `31/12/${year1}` : '-'}</th>
                    <th className="border border-amber-700 px-2 py-1 text-right">{year2 ? `31/12/${year2}` : '-'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PATRIMONIO NETO (%)</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals1.totalPasivoPatrimonio !== 0 ? (totals1.patrimonioNeto / totals1.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals2.totalPasivoPatrimonio !== 0 ? (totals2.patrimonioNeto / totals2.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PASIVO NO CORRIENTE (%)</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals1.totalPasivoPatrimonio !== 0 ? (totals1.pasivoNoCorriente / totals1.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals2.totalPasivoPatrimonio !== 0 ? (totals2.pasivoNoCorriente / totals2.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-amber-300 px-2 py-0.5">PASIVO CORRIENTE (%)</td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals1.totalPasivoPatrimonio !== 0 ? (totals1.pasivoCorriente / totals1.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                    <td className="border border-amber-300 px-2 py-0.5 text-right">
                      {formatPercent(totals2.totalPasivoPatrimonio !== 0 ? (totals2.pasivoCorriente / totals2.totalPasivoPatrimonio) * 100 : 0)}
                    </td>
                  </tr>
                  <tr className="bg-amber-400 font-bold">
                    <td className="border border-amber-700 px-2 py-0.5">TOTAL PATRIMONIO NETO Y PASIVO...</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">100,00%</td>
                    <td className="border border-amber-700 px-2 py-0.5 text-right">100,00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-56 flex-shrink-0 bg-[#0d0d1a] text-white p-2 overflow-y-auto border-l border-gray-600">
          <div className="text-center text-amber-400 font-bold text-xs mb-2">GRÁFICOS DE CONTROL Y EVOLUCIÓN</div>
          
          {/* Chart 1 - Non-current Assets */}
          <div className="bg-gray-800 border border-gray-600 rounded p-2 mb-2">
            <div className="text-center text-[10px] text-amber-400 mb-1">ACTIVO NO CORRIENTE</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={getChartData('activo_nocorriente')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#888' }} />
                <YAxis tick={{ fontSize: 8, fill: '#888' }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} miles`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[8px] text-gray-400 text-center">Periodos anuales</div>
            
            <div className="mt-1 border border-amber-600 rounded p-1">
              <div className="text-[8px] text-amber-400 mb-1">Selección gráfico y tipo</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[8px]">
                  <span className="text-gray-400">~ Gráficos del Activo</span>
                  <select className="bg-gray-700 border border-gray-600 rounded text-[8px] px-0.5 flex-1">
                    <option>Grupos del Activo</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 text-[8px]">
                  <span className="text-gray-400">~ Tipo de Gráfico</span>
                  <select className="bg-gray-700 border border-gray-600 rounded text-[8px] px-0.5 flex-1">
                    <option>Tipos de Gráficos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2 - Non-current Assets % */}
          <div className="bg-gray-800 border border-gray-600 rounded p-2">
            <div className="text-center text-[10px] text-amber-400 mb-1">ACTIVO NO CORRIENTE</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={getChartData('activo_nocorriente_pct')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#888' }} />
                <YAxis tick={{ fontSize: 8, fill: '#888' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[8px] text-gray-400 text-center">Periodos anuales</div>
            
            <div className="mt-1 border border-amber-600 rounded p-1">
              <div className="text-[8px] text-amber-400 mb-1">Selección gráfico y tipo</div>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1 text-[8px]">
                  <input type="radio" name="chartMode" defaultChecked className="w-2 h-2" />
                  <span>Porcentajes totales</span>
                </label>
                <label className="flex items-center gap-1 text-[8px]">
                  <input type="radio" name="chartMode" className="w-2 h-2" />
                  <span className="text-red-400">Porcentajes desviación</span>
                </label>
                <div className="flex items-center gap-1 text-[8px]">
                  <span className="text-gray-400">~</span>
                  <select className="bg-gray-700 border border-gray-600 rounded text-[8px] px-0.5 flex-1">
                    <option>Grupos del Pasivo</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 text-[8px]">
                  <span className="text-gray-400">~ Tipo de Gráfico</span>
                  <select className="bg-gray-700 border border-gray-600 rounded text-[8px] px-0.5 flex-1">
                    <option>Tipos de Gráficos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-700 text-white text-[10px] px-2 py-1 flex items-center justify-between border-t border-gray-600">
        <span>{companyName}</span>
        <span className="flex items-center gap-4">
          <span className="bg-amber-600 px-2 py-0.5 rounded">BALANCE DE SITUACIÓN</span>
          <span>Análisis de periodos: ANUALES</span>
          <span className={`px-2 py-0.5 rounded ${balanceOk ? 'bg-green-600' : 'bg-red-600'}`}>
            CUADRE DE BALANCES: '{balanceOk ? 'OK' : 'ERROR'}'
          </span>
          <Calculator className="h-4 w-4" />
        </span>
        <span>{new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default BalanceAnalysisArea;
