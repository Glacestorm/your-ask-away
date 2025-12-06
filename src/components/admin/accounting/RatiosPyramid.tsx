import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface RatiosPyramidProps {
  companyId: string;
  companyName: string;
}

const RatiosPyramid: React.FC<RatiosPyramidProps> = ({ companyId, companyName }) => {
  const [dataViewMode, setDataViewMode] = useState<'values' | 'values_deviation'>('values');
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRatios, setSelectedRatios] = useState<number[]>([1]);
  const [employees, setEmployees] = useState(0);
  const [sectorSales, setSectorSales] = useState(0);

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

  // Always show 5 years (current year and 4 previous, even if no data)
  const currentYear = new Date().getFullYear();
  const displayYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

  const getYearData = (year: number) => {
    const balance = balanceSheets.find(b => b.fiscal_year === year);
    const income = incomeStatements.find(i => i.fiscal_year === year);
    return { balance, income };
  };

  const calculateRatio = (yearData: any, ratioNum: number): number => {
    const { balance, income } = yearData;
    if (!balance && !income) return 0;

    const netTurnover = income?.net_turnover || 0;
    const totalAssets = (balance?.tangible_assets || 0) + (balance?.intangible_assets || 0) + 
                        (balance?.inventory || 0) + (balance?.trade_receivables || 0) + 
                        (balance?.cash_equivalents || 0);
    const equity = (balance?.share_capital || 0) + (balance?.retained_earnings || 0) + 
                   (balance?.current_year_result || 0);
    const personnelExpenses = Math.abs(income?.personnel_expenses || 0);
    const supplies = Math.abs(income?.supplies || 0);
    const depreciation = Math.abs(income?.depreciation || 0);
    const otherExpenses = Math.abs(income?.other_operating_expenses || 0);
    const financialExpenses = Math.abs(income?.financial_expenses || 0);
    const corporateTax = Math.abs(income?.corporate_tax || 0);
    const netResult = income?.current_year_result || balance?.current_year_result || 0;
    const grossMargin = netTurnover - supplies;
    const ebit = grossMargin - personnelExpenses - depreciation - otherExpenses;
    const resultBeforeTax = ebit - financialExpenses;
    const currentAssets = (balance?.inventory || 0) + (balance?.trade_receivables || 0) + (balance?.cash_equivalents || 0);
    const addedValue = netTurnover - supplies;

    const fixedAssets = (balance?.tangible_assets || 0) + (balance?.intangible_assets || 0);
    const longTermDebts = (balance?.long_term_debts || 0) + (balance?.long_term_group_debts || 0);
    const shortTermDebts = (balance?.short_term_debts || 0) + (balance?.trade_payables || 0) + (balance?.other_creditors || 0);
    const totalDebts = longTermDebts + shortTermDebts;
    const cashFlow = netResult + depreciation;
    const shareCapital = balance?.share_capital || 0;
    const operatingResult = ebit;
    const financialResult = -financialExpenses;
    const realizable = balance?.trade_receivables || 0;
    const available = balance?.cash_equivalents || 0;
    const workingCapitalNeeds = currentAssets - shortTermDebts;

    switch (ratioNum) {
      case 1: return equity !== 0 ? (netResult / equity) * 100 : 0;
      case 2: return netTurnover !== 0 ? (netResult / netTurnover) * 100 : 0;
      case 3: return equity !== 0 ? (netTurnover / equity) * 100 : 0;
      case 4: return totalAssets !== 0 ? (netTurnover / totalAssets) * 100 : 0;
      case 5: return equity !== 0 ? (totalAssets / equity) * 100 : 0;
      case 6: return netTurnover !== 0 ? (supplies / netTurnover) * 100 : 0;
      case 7: return netTurnover !== 0 ? ((netTurnover - (income?.inventory_variation || 0)) / netTurnover) * 100 : 0;
      case 8: return netTurnover !== 0 ? (otherExpenses / netTurnover) * 100 : 0;
      case 9: return netTurnover !== 0 ? (financialExpenses / netTurnover) * 100 : 0;
      case 10: return netTurnover !== 0 ? (corporateTax / netTurnover) * 100 : 0;
      case 11: return netTurnover !== 0 ? (resultBeforeTax / netTurnover) * 100 : 0;
      case 12: return netTurnover !== 0 ? (supplies / netTurnover) * 100 : 0;
      case 13: return addedValue !== 0 ? ((addedValue - (income?.inventory_variation || 0)) / addedValue) * 100 : 0;
      case 14: return grossMargin !== 0 ? (supplies / grossMargin) * 100 : 0;
      case 15: return netTurnover !== 0 ? (otherExpenses / netTurnover) * 100 : 0;
      case 16: return netTurnover !== 0 ? (otherExpenses / netTurnover) * 100 : 0;
      case 17: return netTurnover !== 0 ? (depreciation / netTurnover) * 100 : 0;
      case 18: return employees !== 0 ? (personnelExpenses / employees) : 0;
      case 19: return employees !== 0 ? (netTurnover / employees) : 0;
      case 20: return ebit !== 0 ? (financialExpenses / ebit) * 100 : 0;
      case 21: return netTurnover !== 0 ? (cashFlow / netTurnover) * 100 : 0;
      case 22: return longTermDebts !== 0 ? (cashFlow / longTermDebts) * 100 : 0;
      case 23: return netResult !== 0 ? 0 : 0; // Dividendo no disponible
      case 24: return shareCapital !== 0 ? 0 : 0; // Dividendo no disponible
      case 25: return fixedAssets !== 0 ? (netTurnover / fixedAssets) * 100 : 0;
      case 26: return currentAssets !== 0 ? (netTurnover / currentAssets) * 100 : 0;
      case 27: return netTurnover !== 0 ? (fixedAssets / netTurnover) * 100 : 0;
      case 28: return 0; // Requiere datos del ejercicio anterior
      case 29: return sectorSales !== 0 ? (netTurnover / sectorSales) * 100 : 0;
      case 30: return sectorSales !== 0 ? (netResult / sectorSales) * 100 : 0;
      case 31: return netTurnover !== 0 ? (addedValue / netTurnover) * 100 : 0;
      case 32: return totalAssets !== 0 ? (addedValue / totalAssets) * 100 : 0;
      case 33: return totalAssets !== 0 ? (operatingResult / totalAssets) * 100 : 0;
      case 34: return totalAssets !== 0 ? (financialResult / totalAssets) * 100 : 0;
      case 35: return totalAssets !== 0 ? (resultBeforeTax / totalAssets) * 100 : 0;
      case 36: return netTurnover !== 0 ? (workingCapitalNeeds / netTurnover) * 100 : 0;
      case 37: return totalDebts !== 0 ? (totalAssets / totalDebts) * 100 : 0;
      case 38: return shortTermDebts !== 0 ? (sectorSales / shortTermDebts) * 100 : 0;
      case 39: return shortTermDebts !== 0 ? ((available + realizable) / shortTermDebts) * 100 : 0;
      case 40: return shortTermDebts !== 0 ? (available / shortTermDebts) * 100 : 0;
      default: return 0;
    }
  };

  const ratioDefinitions = [
    { num: 1, formula: 'Beneficio Neto / Patrimonio Neto' },
    { num: 2, formula: 'Beneficio Neto / Ventas' },
    { num: 3, formula: 'Ventas / Patrimonio Neto' },
    { num: 4, formula: 'Ventas / Activo' },
    { num: 5, formula: 'Activo / Patrimonio Neto' },
    { num: 6, formula: 'Gastos Proporcionales de Fabricación / Ventas' },
    { num: 7, formula: 'Expansión Ventas / Ventas' },
    { num: 8, formula: 'Gastos de Estructura / Ventas' },
    { num: 9, formula: 'Gastos Financieros / Ventas' },
    { num: 10, formula: 'Impuesto Beneficios / Ventas' },
    { num: 11, formula: 'B.A.I. / Ventas' },
    { num: 12, formula: 'Compras Materias Primas / Ventas' },
    { num: 13, formula: 'Incremento Valor Añadido / Valor Añadido' },
    { num: 14, formula: 'Consumos de Explotación / Margen Bruto' },
    { num: 15, formula: 'Gastos de Publicidad / Ventas' },
    { num: 16, formula: 'Otros Gastos Comerciales / Ventas' },
    { num: 17, formula: 'Amortizaciones / Ventas' },
    { num: 18, formula: 'Gastos Personal / Nº de empleados' },
    { num: 19, formula: 'Ventas / Nº de empleados' },
    { num: 20, formula: 'Gastos Financieros / B.A.I.I.' },
    { num: 21, formula: 'Cash Flow / Ventas' },
    { num: 22, formula: 'Cash Flow / Préstamos' },
    { num: 23, formula: 'Dividendo / Bº Neto' },
    { num: 24, formula: 'Dividendo / Capital social' },
    { num: 25, formula: 'Ventas / Activo Fijo' },
    { num: 26, formula: 'Ventas / Activo Circulante' },
    { num: 27, formula: 'Inversiones / Ventas' },
    { num: 28, formula: 'Ventas Ej. Actual / Ventas Ej. Anterior' },
    { num: 29, formula: 'Ventas / Ventas Sector' },
    { num: 30, formula: 'Beneficio / Ventas Sector' },
    { num: 31, formula: 'Valor Añadido / Ventas' },
    { num: 32, formula: 'Valor Añadido / Activo' },
    { num: 33, formula: 'Resultado Explotación / Activo' },
    { num: 34, formula: 'Resultado Financiero / Activo' },
    { num: 35, formula: 'Resultado Antes Impuestos / Activo' },
    { num: 36, formula: 'Necesidades Fondo Maniobra / Ventas' },
    { num: 37, formula: 'Activo real / Deudas' },
    { num: 38, formula: 'Ventas Sector / Exigible c/p' },
    { num: 39, formula: 'Disponible + Realizable / Exigible c/p' },
    { num: 40, formula: 'Disponible / Exigible c/p' },
  ];

  const formatValue = (value: number): string => {
    return value.toFixed(2) + ' %';
  };

  const toggleRatioSelection = (num: number) => {
    setSelectedRatios(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const chartData = displayYears.map(year => ({
    name: year.toString(),
    value: calculateRatio(getYearData(year), selectedRatios[0] || 1),
  })).reverse();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregant dades...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-3 border-b border-amber-800">
        <h1 className="text-xl font-bold text-center">PIRÁMIDE DE RATIOS FINANCIEROS</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Pyramid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="relative">
            {/* Pyramid Grid */}
            <div className="grid gap-2" style={{ fontSize: '10px' }}>
              {/* Row 1 - Top Level */}
              <div className="flex justify-center gap-2 mb-4">
                <div className="bg-amber-100 border-2 border-amber-600 p-2 text-center text-gray-800 w-24">
                  <div className="text-red-600 font-bold">1</div>
                  <div className="font-semibold">Bº Neto</div>
                  <div className="border-t border-gray-400">Cap.Propios</div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex justify-center gap-4 mb-2">
                <div className="bg-amber-100 border-2 border-amber-600 p-2 text-center text-gray-800 w-24">
                  <div className="text-red-600 font-bold">2</div>
                  <div className="font-semibold">Bº Neto</div>
                  <div className="border-t border-gray-400">Ventas</div>
                </div>
                <div className="flex items-center text-amber-400 font-bold">×</div>
                <div className="bg-amber-100 border-2 border-amber-600 p-2 text-center text-gray-800 w-24">
                  <div className="text-red-600 font-bold">3</div>
                  <div className="font-semibold">Ventas</div>
                  <div className="border-t border-gray-400">Cap.Propios</div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">6</div>
                  <div className="text-xs">Gtos.Prop.Fabric.</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">11</div>
                  <div className="text-xs">B.A.I.</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">12</div>
                  <div className="text-xs">Compra Mat.Primas</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">13</div>
                  <div className="text-xs">Val.Añadido(1,-1)</div>
                  <div className="border-t border-gray-400 text-xs">Val.Añadido(-1)</div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">7</div>
                  <div className="text-xs">Expansión Ventas</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">14</div>
                  <div className="text-xs">Consumos Explot.</div>
                  <div className="border-t border-gray-400 text-xs">Margen Bruto</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">15</div>
                  <div className="text-xs">Gtos.Publicidad</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">16</div>
                  <div className="text-xs">Otros Gtos.Ciales.</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
              </div>

              {/* Row 5 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">8</div>
                  <div className="text-xs">Gtos.Estructura</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">17</div>
                  <div className="text-xs">Amortizaciones</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">18</div>
                  <div className="text-xs">Gtos.Personal</div>
                  <div className="border-t border-gray-400 text-xs">Nº de empleados</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">19</div>
                  <div className="text-xs">Ventas</div>
                  <div className="border-t border-gray-400 text-xs">Nº de empleados</div>
                </div>
              </div>

              {/* Row 6 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">9</div>
                  <div className="text-xs">Gtos.Financieros</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">20</div>
                  <div className="text-xs">Gtos.Financieros</div>
                  <div className="border-t border-gray-400 text-xs">B.A.I.I.</div>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">36</div>
                  <div className="text-xs">Nec.Fdo.Maniobra</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
              </div>

              {/* Row 7 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-yellow-200 border-2 border-yellow-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">10</div>
                  <div className="text-xs">Impto.Sociedades</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">21</div>
                  <div className="text-xs">Cash Flow</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">22</div>
                  <div className="text-xs">Cash Flow</div>
                  <div className="border-t border-gray-400 text-xs">Préstamos</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">23</div>
                  <div className="text-xs">Dividendo</div>
                  <div className="border-t border-gray-400 text-xs">Bº Neto</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">24</div>
                  <div className="text-xs">Dividendo</div>
                  <div className="border-t border-gray-400 text-xs">Capital social</div>
                </div>
              </div>

              {/* Row 8 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-amber-100 border-2 border-amber-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">4</div>
                  <div className="text-xs">Ventas</div>
                  <div className="border-t border-gray-400 text-xs">Activo</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">25</div>
                  <div className="text-xs">Ventas</div>
                  <div className="border-t border-gray-400 text-xs">Activo Fijo</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">27</div>
                  <div className="text-xs">Inversiones</div>
                  <div className="border-t border-gray-400 text-xs">Ventas</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">28</div>
                  <div className="text-xs">Vtas. Ej.Act.</div>
                  <div className="border-t border-gray-400 text-xs">Vtas. Ej.Anter.</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">29</div>
                  <div className="text-xs">Ventas</div>
                  <div className="border-t border-gray-400 text-xs">Ventas Sector</div>
                </div>
              </div>

              {/* Row 9 */}
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                <div className="bg-amber-100 border-2 border-amber-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">5</div>
                  <div className="text-xs">Activo</div>
                  <div className="border-t border-gray-400 text-xs">Cap.Propios</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">37</div>
                  <div className="text-xs">Activo real</div>
                  <div className="border-t border-gray-400 text-xs">Deudas</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">38</div>
                  <div className="text-xs">Ventas Sec...</div>
                  <div className="border-t border-gray-400 text-xs">Exig.c/pzo.</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">39</div>
                  <div className="text-xs">Disp. + Real.</div>
                  <div className="border-t border-gray-400 text-xs">Exig.c/pzo.</div>
                </div>
                <div className="bg-green-200 border-2 border-green-600 p-1 text-center text-gray-800 w-20">
                  <div className="text-red-600 text-xs font-bold">40</div>
                  <div className="text-xs">Disponible</div>
                  <div className="border-t border-gray-400 text-xs">Exig.c/pzo.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Ratios Table and Chart */}
        <div className="w-[550px] bg-[#2d2d44] p-3 border-l border-gray-700 flex flex-col">
          {/* Ratios Table with scroll */}
          <div className="mb-2">
            <div className="h-[350px] overflow-y-auto overflow-x-auto border border-gray-600 rounded">
              <table className="w-full text-xs border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-amber-800">
                    <th className="border border-amber-900 p-1 text-center w-10 bg-amber-800">Gráfico</th>
                    <th className="border border-amber-900 p-1 text-center w-10 bg-amber-800">Nº Ratio</th>
                    <th className="border border-amber-900 p-1 text-left min-w-[200px] bg-amber-800">Fórmula del Ratio</th>
                    {displayYears.map(year => (
                      <th key={year} className="border border-amber-900 p-1 text-center w-16 bg-amber-800 whitespace-nowrap">Dic-{year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ratioDefinitions.map((ratio, idx) => (
                    <tr key={ratio.num} className={idx % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}>
                      <td className="border border-gray-600 p-1 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedRatios.includes(ratio.num)}
                          onChange={() => toggleRatioSelection(ratio.num)}
                          className="w-3 h-3"
                        />
                      </td>
                      <td className="border border-gray-600 p-1 text-center text-amber-400">{ratio.num}</td>
                      <td className="border border-gray-600 p-1 text-gray-300 whitespace-nowrap">{ratio.formula}</td>
                      {displayYears.map(year => {
                        const value = calculateRatio(getYearData(year), ratio.num);
                        return (
                          <td key={year} className={`border border-gray-600 p-1 text-center whitespace-nowrap ${value < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {formatValue(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="mb-2">
            <div className="text-amber-400 text-sm font-semibold mb-2 border-b border-amber-400 pb-1">GRÁFICO DE EVOLUCIÓN</div>
            <div className="flex items-center gap-4 mb-2 text-xs">
              <span className="text-gray-400">Visión de datos</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="chartView" 
                  checked={dataViewMode === 'values'}
                  onChange={() => setDataViewMode('values')}
                  className="w-3 h-3"
                />
                <span className="text-blue-400">Vista de valores</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="chartView" 
                  checked={dataViewMode === 'values_deviation'}
                  onChange={() => setDataViewMode('values_deviation')}
                  className="w-3 h-3"
                />
                <span className="text-gray-400">Vista de valores y % de desviación</span>
              </label>
            </div>
            <div className="text-amber-400 text-xs mb-1">Ratio {selectedRatios[0] || 1}: {ratioDefinitions.find(r => r.num === (selectedRatios[0] || 1))?.formula}</div>
            <div className="bg-gray-200 p-2 rounded h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(2) + '%'} />
                  <Tooltip formatter={(value: number) => value.toFixed(2) + '%'} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">Periodos anuales</div>
          </div>

          {/* Data Entry Section */}
          <div className="mb-4">
            <div className="text-amber-400 text-sm font-semibold mb-2 border-b border-amber-400 pb-1">INTRODUCCIÓN DE DATOS</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-600 p-1 bg-gray-700"></th>
                    {displayYears.map(year => (
                      <th key={year} className="border border-gray-600 p-1 bg-amber-700 text-center whitespace-nowrap">Dic - {year.toString().slice(-2)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-100">
                    <td className="border border-gray-400 p-1 text-gray-800 font-semibold whitespace-nowrap">Nº de empleados</td>
                    {displayYears.map((year, idx) => (
                      <td key={year} className="border border-gray-400 p-1 text-center">
                        <input 
                          type="number" 
                          value={idx === 0 ? employees : 0}
                          onChange={(e) => idx === 0 && setEmployees(Number(e.target.value))}
                          className="w-full bg-white text-gray-800 text-center text-xs p-0.5"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-gray-400 p-1 text-gray-800 font-semibold whitespace-nowrap">Ventas Sector</td>
                    {displayYears.map((year, idx) => (
                      <td key={year} className="border border-gray-400 p-1 text-center">
                        <input 
                          type="number"
                          value={idx === 0 ? sectorSales : 0}
                          onChange={(e) => idx === 0 && setSectorSales(Number(e.target.value))}
                          className="w-full bg-white text-gray-800 text-center text-xs p-0.5"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs">GRABAR DATOS</Button>
            </div>
            <div className="text-gray-500 text-xs mt-1">* Los ratios 18, 19 y 29 están calculados en miles de u.m. // Introduzca las "Ventas Sector" en miles de...</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs">
        <div className="mb-1 text-amber-400">
          Gastos proporcionales de Fabricación: Ratio 6 y 12. // Gastos proporcionales de Comercialización: Ratio 16. // Gastos proporcionales de Administración: Ratio 8. // Gastos financieros: Ratios 9 y 20. // Expansión de Ventas y Competencia: Ratio 7, 11, 28 y 29. // Flujo de Caja:
        </div>
        <div className="mb-1 text-amber-400">
          Autofinanciación: Ratios 21 al 24 y 44. // Evolución del valor añadido bruto: Ratio 13. // Ratio Política de Inversiones: Ratio 27. // Apalancamiento: Ratio 5. // Efecto fiscal: Ratio 10. // Endeudamiento: Ratios 37, 41, 42, 43 y 44. // Liquidez: Ratios 38 al 40. // Rotación del Activo
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">005 - {companyName || 'Empresa de ejemplo'}.</span>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">📊 PIRÁMIDE DE RATIOS FINANCIEROS</span>
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
    </div>
  );
};

export default RatiosPyramid;
