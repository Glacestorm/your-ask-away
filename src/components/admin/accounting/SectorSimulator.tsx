import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SectorSimulatorProps {
  companyId: string;
  companyName: string;
}

const SectorSimulator: React.FC<SectorSimulatorProps> = ({ companyId, companyName }) => {
  const [dataViewMode, setDataViewMode] = useState<'values' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(false);
  const [selectedChartGroup1, setSelectedChartGroup1] = useState('Val.Añadido / Ventas');
  const [selectedChartType1, setSelectedChartType1] = useState('Tipos de Gráficos');
  const [selectedChartGroup2, setSelectedChartGroup2] = useState('Porcentajes desviación');
  const [selectedChartType2, setSelectedChartType2] = useState('Tipos de Gráficos');
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorCode, setSectorCode] = useState('016');
  const [sectorType, setSectorType] = useState('1');
  const [simulatorSector, setSimulatorSector] = useState('');
  const [sectorDescription, setSectorDescription] = useState('016 - Actividades de apoyo a la agricultura, a la ganadería y de preparación posterior a la cosecha');

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

  const getYearData = (year: number) => {
    const balance = balanceSheets.find(b => b.fiscal_year === year);
    const income = incomeStatements.find(i => i.fiscal_year === year);
    return { balance, income };
  };

  const years = [...new Set([...balanceSheets.map(b => b.fiscal_year), ...incomeStatements.map(i => i.fiscal_year)])]
    .sort((a, b) => b - a)
    .slice(0, 5);

  const calculateRatio = (yearData: any, ratioType: string): number => {
    const { balance, income } = yearData;
    if (!balance && !income) return 0;

    const netTurnover = income?.net_turnover || 0;
    const totalAssets = (balance?.tangible_assets || 0) + (balance?.intangible_assets || 0) + 
                        (balance?.inventory || 0) + (balance?.trade_receivables || 0) + 
                        (balance?.cash_equivalents || 0);
    const equity = (balance?.share_capital || 0) + (balance?.retained_earnings || 0) + 
                   (balance?.current_year_result || 0);
    const personnelExpenses = income?.personnel_expenses || 0;
    const supplies = income?.supplies || 0;
    const operatingResult = netTurnover + (income?.inventory_variation || 0) - 
                           Math.abs(supplies) - Math.abs(personnelExpenses) - 
                           Math.abs(income?.depreciation || 0);
    const financialExpenses = Math.abs(income?.financial_expenses || 0);
    const financialIncome = income?.financial_income || 0;
    const totalDebt = (balance?.long_term_debts || 0) + (balance?.short_term_debts || 0);
    const inventory = balance?.inventory || 0;
    const tradeReceivables = balance?.trade_receivables || 0;
    const tradePayables = balance?.trade_payables || 0;
    const currentAssets = inventory + tradeReceivables + (balance?.cash_equivalents || 0);
    const tangibleAssets = balance?.tangible_assets || 0;
    const intangibleAssets = balance?.intangible_assets || 0;
    const financialAssets = (balance?.long_term_financial_investments || 0) + 
                            (balance?.short_term_financial_investments || 0);

    const addedValue = netTurnover - Math.abs(supplies);
    const grossResult = operatingResult;
    const netResult = income?.current_year_result || balance?.current_year_result || 0;
    const resultBeforeTax = netResult + Math.abs(income?.corporate_tax || 0);
    const financialResult = financialIncome - financialExpenses;

    switch (ratioType) {
      case 'valor_anadido_ventas': return netTurnover !== 0 ? (addedValue / netTurnover) * 100 : 0;
      case 'gastos_personal_ventas': return netTurnover !== 0 ? (Math.abs(personnelExpenses) / netTurnover) * 100 : 0;
      case 'resultado_bruto_ventas': return netTurnover !== 0 ? (grossResult / netTurnover) * 100 : 0;
      case 'resultado_bruto_deuda': return totalDebt !== 0 ? (grossResult / totalDebt) * 100 : 0;
      case 'margen_ventas': return netTurnover !== 0 ? ((netTurnover - Math.abs(supplies)) / netTurnover) * 100 : 0;
      case 'ventas_activo': return totalAssets !== 0 ? (netTurnover / totalAssets) * 100 : 0;
      case 'resultado_neto_activo': return totalAssets !== 0 ? (netResult / totalAssets) * 100 : 0;
      case 'resultado_bai_patrimonio': return equity !== 0 ? (resultBeforeTax / equity) * 100 : 0;
      case 'resultado_neto_patrimonio': return equity !== 0 ? (netResult / equity) * 100 : 0;
      case 'existencias_ventas': return netTurnover !== 0 ? (inventory / netTurnover) * 100 : 0;
      case 'deudores_ventas': return netTurnover !== 0 ? (tradeReceivables / netTurnover) * 100 : 0;
      case 'acreedores_ventas': return netTurnover !== 0 ? (tradePayables / netTurnover) * 100 : 0;
      case 'capital_circulante_ventas': return netTurnover !== 0 ? (currentAssets / netTurnover) * 100 : 0;
      case 'gastos_financieros_ventas': return netTurnover !== 0 ? (financialExpenses / netTurnover) * 100 : 0;
      case 'gastos_financieros_resultado': return grossResult !== 0 ? (financialExpenses / grossResult) * 100 : 0;
      case 'resultado_financiero_ventas': return netTurnover !== 0 ? (financialResult / netTurnover) * 100 : 0;
      case 'resultado_financiero_bruto': return grossResult !== 0 ? (financialResult / grossResult) * 100 : 0;
      case 'inmov_financiero_activo': return totalAssets !== 0 ? (financialAssets / totalAssets) * 100 : 0;
      case 'inmov_material_activo': return totalAssets !== 0 ? (tangibleAssets / totalAssets) * 100 : 0;
      case 'activo_corriente_activo': return totalAssets !== 0 ? (currentAssets / totalAssets) * 100 : 0;
      case 'activo_financiero_tesoreria': return totalAssets !== 0 ? ((financialAssets + (balance?.cash_equivalents || 0)) / totalAssets) * 100 : 0;
      default: return 0;
    }
  };

  const sectorAverages: Record<string, number> = {
    valor_anadido_ventas: 0,
    gastos_personal_ventas: 0,
    resultado_bruto_ventas: 0,
    resultado_bruto_deuda: 0,
    margen_ventas: 0,
    ventas_activo: 0,
    resultado_neto_activo: 0,
    resultado_bai_patrimonio: 0,
    resultado_neto_patrimonio: 0,
    existencias_ventas: 0,
    deudores_ventas: 0,
    acreedores_ventas: 0,
    capital_circulante_ventas: 0,
    gastos_financieros_ventas: 0,
    gastos_financieros_resultado: 0,
    resultado_financiero_ventas: 0,
    resultado_financiero_bruto: 0,
    inmov_financiero_activo: 0,
    inmov_material_activo: 0,
    activo_corriente_activo: 0,
    activo_financiero_tesoreria: 0,
  };

  const formatValue = (value: number): string => {
    return value.toFixed(2) + ' %';
  };

  const ratioRows = [
    { section: 'COSTES OPERATIVOS, BENEFICIO Y RENTABILIDADES', items: [
      { key: 'valor_anadido_ventas', label: 'Valor añadido bruto / Cifra neta de negocios' },
      { key: 'gastos_personal_ventas', label: 'Gastos de personal / Cifra neta de negocios' },
      { key: 'resultado_bruto_ventas', label: 'Resultado económico bruto / Cifra neta de negocios' },
      { key: 'resultado_bruto_deuda', label: 'Resultado económico bruto / Total deuda neta' },
      { key: 'margen_ventas', label: 'Margen de Ventas / Cifra neta de negocios' },
      { key: 'ventas_activo', label: 'Cifra neta de negocios / Total Activo' },
      { key: 'resultado_neto_activo', label: 'Resultado económico neto / Total Activo' },
      { key: 'resultado_bai_patrimonio', label: 'Result.antes de impuestos (BAI) / Patrimonio Neto' },
      { key: 'resultado_neto_patrimonio', label: 'Resultados después de Impuestos / Patrimonio Neto' },
    ]},
    { section: 'CAPITAL CIRCULANTE', items: [
      { key: 'existencias_ventas', label: 'Existencias / Cifra neta de negocios' },
      { key: 'deudores_ventas', label: 'Deudores comerciales / Cifra neta de negocios' },
      { key: 'acreedores_ventas', label: 'Acreedores comerciales / Cifra neta de negocios' },
      { key: 'capital_circulante_ventas', label: 'Capital Circulante / Cifra neta de negocios' },
    ]},
    { section: 'GASTOS E INGRESOS FINANCIEROS', items: [
      { key: 'gastos_financieros_ventas', label: 'Gastos financieros y asimilados / Cifra neta de negocios' },
      { key: 'gastos_financieros_resultado', label: 'Gastos financieros y asimilados / Resultado económico bruto' },
      { key: 'resultado_financiero_ventas', label: 'Resultados Financieros / Cifra neta de negocios' },
      { key: 'resultado_financiero_bruto', label: 'Resultados Financieros / Resultado económico bruto' },
    ]},
    { section: 'ESTRUCTURA DEL ACTIVO', items: [
      { key: 'inmov_financiero_activo', label: 'Inmovilizado Financiero / Total Activo' },
      { key: 'inmov_material_activo', label: 'Inmovilizado Material / Total Activo' },
      { key: 'activo_corriente_activo', label: 'Activo Corriente / Total Activo' },
      { key: 'activo_financiero_tesoreria', label: 'Activo financ.a corto + Tesorería / Total Activo' },
    ]},
  ];

  const chartData1 = years.map(year => ({
    name: year.toString(),
    value: calculateRatio(getYearData(year), 'valor_anadido_ventas'),
  })).reverse();

  const chartData2 = years.map(year => ({
    name: year.toString(),
    value: calculateRatio(getYearData(year), 'valor_anadido_ventas') - sectorAverages.valor_anadido_ventas,
  })).reverse();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregant dades...</div>;
  }

  if (years.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">No hi ha dades financeres disponibles</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-3 border-b border-amber-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-amber-200 text-sm">Sector:</span>
              <span className="text-white font-bold">{sectorCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-200 text-sm">Tipo:</span>
              <span className="text-white font-bold">{sectorType}</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center flex-1">RATIOS SECTORIALES. (SIMULADOR OTROS SECTORES)</h1>
          <div className="text-amber-200 text-sm">GRÁFICOS DE CONTROL Y EVOLUCIÓN</div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-200 text-sm">Simulador Otro Sector:</span>
            <select 
              className="bg-white text-black px-3 py-1 rounded text-sm min-w-[300px]"
              value={simulatorSector}
              onChange={(e) => setSimulatorSector(e.target.value)}
            >
              <option value="">Seleccionar sector...</option>
              <option value="001">001 - Agricultura</option>
              <option value="016">016 - Actividades de apoyo a la agricultura</option>
              <option value="045">045 - Comercio de vehículos</option>
            </select>
            <span className="text-amber-200 text-sm ml-4">Tipo:</span>
            <select className="bg-white text-black px-2 py-1 rounded text-sm w-16">
              <option>~</option>
              <option>1</option>
              <option>2</option>
            </select>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 ml-2">ACEPTAR</Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-amber-200 text-sm">DESCRIPCIÓN:</span>
          <span className="text-white text-sm">{sectorDescription}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 bg-[#2d2d44] p-3 border-r border-gray-700 overflow-y-auto">
          <div className="mb-4">
            <div className="text-amber-400 text-sm font-semibold mb-2 border-b border-amber-400 pb-1">Visión de datos</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataViewMode === 'values'}
                  onChange={() => setDataViewMode('values')}
                  className="text-amber-500"
                />
                <span className={dataViewMode === 'values' ? 'text-green-400' : 'text-gray-300'}>Vista de valores</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataViewMode === 'values_deviation'}
                  onChange={() => setDataViewMode('values_deviation')}
                  className="text-amber-500"
                />
                <span className={dataViewMode === 'values_deviation' ? 'text-amber-400' : 'text-gray-300'}>Vista de valores y % de desviación</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-amber-400 text-sm font-semibold mb-2 border-b border-amber-400 pb-1">Opciones Principales</div>
            <div className="space-y-1 text-xs">
              <div className="text-blue-400 font-semibold">Financial System</div>
              <div className="pl-2 space-y-1 text-gray-300">
                <div className="flex items-center gap-1"><span>📊</span> Pantalla principal</div>
                <div className="flex items-center gap-1"><span>🏢</span> Pantalla de empresas</div>
                <div className="flex items-center gap-1"><span>📝</span> Introducción Datos</div>
                <div className="flex items-center gap-1"><span>📋</span> Informes</div>
              </div>
              <div className="text-blue-400 font-semibold mt-2">Balances</div>
              <div className="text-blue-400 font-semibold mt-2">Financiera</div>
              <div className="text-blue-400 font-semibold mt-2">Ratios</div>
              <div className="pl-2 space-y-1">
                <div className="text-amber-400 font-semibold">Grupo Ratios</div>
                <div className="pl-2 space-y-1 text-gray-300">
                  <div>📊 Ratios de Liquidez y Endeudamiento</div>
                  <div>📊 Ratios Sectoriales</div>
                  <div className="text-amber-400 font-semibold">📊 Simulador Otro Sector</div>
                  <div>📊 Pirámide de Ratios Fin.</div>
                  <div>📊 Análisis Bancario</div>
                </div>
              </div>
              <div className="text-blue-400 font-semibold mt-2">Rentabilidad</div>
              <div className="text-blue-400 font-semibold mt-2">Auditoría</div>
              <div className="text-blue-400 font-semibold mt-2">Valoraciones</div>
              <div className="text-blue-400 font-semibold mt-2">Cuentas Anuales</div>
              <div className="text-blue-400 font-semibold mt-2">Valor Accionarial</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-amber-400 text-sm font-semibold mb-2 border-b border-amber-400 pb-1">Información</div>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="text-blue-400 font-semibold">Varios</div>
              <div className="pl-2">📱 Calculadora</div>
              <div className="text-blue-400 font-semibold mt-2">Ayuda</div>
              <div className="pl-2">📖 Contenido</div>
              <div className="pl-2">🌐 www.financialsystem.es</div>
              <div className="text-gray-500 text-xs mt-2">Fecha Versión: 01/04/2025</div>
              <div className="text-gray-500 text-xs">Número Versión: 10.0.3</div>
              <div className="text-gray-500 text-xs">Tipo Versión: 'MASTER'</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-amber-800">
                  <th className="border border-amber-900 p-2 text-left min-w-[300px]">DESCRIPCIÓN</th>
                  <th className="border border-amber-900 p-2 text-center w-20">Dic.-{years[0]?.toString().slice(-2) || '25'}</th>
                  <th className="border border-amber-900 p-2 text-center w-20 bg-amber-700">Valor sector</th>
                  <th className="border border-amber-900 p-2 text-center w-20 bg-amber-600">Diferencia</th>
                  {years.slice(1).map(year => (
                    <th key={year} className="border border-amber-900 p-2 text-center w-20">Dic.-{year.toString().slice(-2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ratioRows.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-red-900">
                      <td colSpan={4 + years.slice(1).length} className="border border-amber-900 p-2 font-bold text-white">
                        {section.section}
                      </td>
                    </tr>
                    {section.items.map((item, iIdx) => {
                      const currentValue = calculateRatio(getYearData(years[0]), item.key);
                      const sectorValue = sectorAverages[item.key] || 0;
                      const difference = currentValue - sectorValue;
                      
                      return (
                        <tr key={iIdx} className={iIdx % 2 === 0 ? 'bg-amber-100' : 'bg-amber-50'}>
                          <td className="border border-amber-300 p-2 text-gray-800">{item.label}</td>
                          <td className={`border border-amber-300 p-2 text-center font-medium ${currentValue < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {formatValue(currentValue)}
                          </td>
                          <td className="border border-amber-300 p-2 text-center text-gray-600 bg-amber-200">
                            {formatValue(sectorValue)}
                          </td>
                          <td className="border border-amber-300 p-2 text-center bg-amber-300 text-gray-800">
                            {/* Empty difference when sector is 0 */}
                          </td>
                          {years.slice(1).map(year => {
                            const value = calculateRatio(getYearData(year), item.key);
                            return (
                              <td key={year} className={`border border-amber-300 p-2 text-center ${value < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                {formatValue(value)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-72 bg-[#2d2d44] p-3 border-l border-gray-700 overflow-y-auto">
          {/* Chart 1 */}
          <div className="mb-6">
            <div className="text-amber-400 text-sm font-semibold mb-2 text-center">Val.Añadido / Ventas</div>
            <div className="bg-gray-200 p-2 rounded h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData1}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => value.toFixed(2) + '%'} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">Periodos anuales</div>
            
            <div className="mt-3 space-y-2">
              <div className="text-amber-400 text-xs font-semibold border-b border-amber-400 pb-1">Selección gráfico y tipo</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">~ Gráfico de Valores</span>
                <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1">
                  <option>* Valores Ratios Sectoriales</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">~ Tipo de Gráfico</span>
                <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1">
                  <option>* Tipos de Gráficos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="mb-6">
            <div className="text-amber-400 text-sm font-semibold mb-2 text-center">Val.Añadido / Ventas</div>
            <div className="bg-gray-200 p-2 rounded h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData2}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0) + '%'} />
                  <Tooltip formatter={(value: number) => value.toFixed(2) + '%'} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">Periodos anuales</div>
            
            <div className="mt-3 space-y-2">
              <div className="text-amber-400 text-xs font-semibold border-b border-amber-400 pb-1">Selección gráfico y tipo</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">~ Gráfico de Desviaciones</span>
                <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1">
                  <option>* Porcentajes desviación</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">~ Tipo de Gráfico</span>
                <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1">
                  <option>* Tipos de Gráficos</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">05 - {companyName || 'Empresa de ejemplo'}.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">📊 Ratios Generales de Liquidez y Endeudamiento</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">Análisis de periodos: ANUALES</span>
          <span className="text-gray-400">|</span>
          <span className="text-green-400">CUADRE DE BALANCES: 'OK'</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">📱 Calculadora</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SectorSimulator;
