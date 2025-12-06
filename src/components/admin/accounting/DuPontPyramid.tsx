import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DuPontPyramidProps {
  companyId: string;
  companyName: string;
}

const DuPontPyramid: React.FC<DuPontPyramidProps> = ({ companyId, companyName }) => {
  const [dataViewMode, setDataViewMode] = useState<'values' | 'deviation'>('values');
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart1, setSelectedChart1] = useState('activo_nocorriente');
  const [selectedChart2, setSelectedChart2] = useState('activo_nocorriente_pct');
  const [chartType1, setChartType1] = useState('bar');
  const [chartType2, setChartType2] = useState('bar');

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

  const years = [...new Set([...balanceSheets.map(b => b.fiscal_year), ...incomeStatements.map(i => i.fiscal_year)])]
    .sort((a, b) => b - a)
    .slice(0, 3);

  const getYearData = (year: number) => {
    const balance = balanceSheets.find(b => b.fiscal_year === year);
    const income = incomeStatements.find(i => i.fiscal_year === year);
    return { balance, income };
  };

  const calculateMetrics = (year: number) => {
    const { balance, income } = getYearData(year);
    
    const netTurnover = income?.net_turnover || 0;
    const supplies = Math.abs(income?.supplies || 0);
    const personnelExpenses = Math.abs(income?.personnel_expenses || 0);
    const depreciation = Math.abs(income?.depreciation || 0);
    const otherExpenses = Math.abs(income?.other_operating_expenses || 0);
    
    const tangibleAssets = balance?.tangible_assets || 0;
    const intangibleAssets = balance?.intangible_assets || 0;
    const realEstateInvestments = balance?.real_estate_investments || 0;
    const longTermFinancialInvestments = balance?.long_term_financial_investments || 0;
    
    const inventory = balance?.inventory || 0;
    const tradeReceivables = balance?.trade_receivables || 0;
    const cashEquivalents = balance?.cash_equivalents || 0;
    const shortTermFinancialInvestments = balance?.short_term_financial_investments || 0;
    
    const nonCurrentAssets = tangibleAssets + intangibleAssets + realEstateInvestments + longTermFinancialInvestments;
    const currentAssets = inventory + tradeReceivables + cashEquivalents + shortTermFinancialInvestments;
    const totalAssets = nonCurrentAssets + currentAssets;
    
    const bait = netTurnover - supplies - personnelExpenses - depreciation - otherExpenses;
    const costOfSalesAndOther = netTurnover - bait;
    
    const rotacionActivo = totalAssets !== 0 ? netTurnover / totalAssets : 0;
    const baitSobreVentas = netTurnover !== 0 ? bait / netTurnover : 0;
    const roa = rotacionActivo * baitSobreVentas;
    
    return {
      ventas: netTurnover,
      activo: totalAssets,
      activoCorriente: currentAssets,
      activoNoCorriente: nonCurrentAssets,
      bait,
      costOfSalesAndOther,
      otrosGastos: otherExpenses,
      costoVentas: supplies + personnelExpenses + depreciation,
      tesoreria: cashEquivalents,
      cuentasCobrar: tradeReceivables,
      inventarios: inventory,
      rotacionActivo,
      baitSobreVentas,
      roa
    };
  };

  const formatNumber = (value: number, decimals: number = 3): string => {
    if (Math.abs(value) < 1) {
      return value.toFixed(decimals);
    }
    return value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const chartOptions = [
    { value: 'activo_nocorriente', label: 'Activo NoCorriente' },
    { value: 'activo_corriente', label: 'Activo Corriente' },
    { value: 'ventas', label: 'Ventas' },
    { value: 'bait', label: 'BAIT' },
    { value: 'roa', label: 'ROA' },
  ];

  const getChartData = (metric: string) => {
    return years.map(year => {
      const metrics = calculateMetrics(year);
      let value = 0;
      switch (metric) {
        case 'activo_nocorriente': value = metrics.activoNoCorriente; break;
        case 'activo_corriente': value = metrics.activoCorriente; break;
        case 'ventas': value = metrics.ventas; break;
        case 'bait': value = metrics.bait; break;
        case 'roa': value = metrics.roa * 100; break;
        case 'activo_nocorriente_pct': value = metrics.activo !== 0 ? (metrics.activoNoCorriente / metrics.activo) * 100 : 0; break;
      }
      return { name: year.toString(), value };
    }).reverse();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregant dades...</div>;
  }

  if (years.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">No hi ha dades financeres disponibles</div>;
  }

  const yearHeaders = years.map(y => `Dic-${y}`);

  const DataBox = ({ label, values, bgColor = 'bg-amber-100', borderColor = 'border-amber-500' }: { 
    label: string; 
    values: (string | number)[]; 
    bgColor?: string;
    borderColor?: string;
  }) => (
    <div className={`${bgColor} ${borderColor} border-2 rounded text-center text-gray-800 min-w-[100px] max-w-[140px]`}>
      <div className="text-red-700 font-bold text-[10px] leading-tight py-1 px-1 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
      <div className="flex">
        {values.map((val, idx) => (
          <div key={idx} className="flex-1 p-0.5 text-[10px] border-r last:border-r-0 border-gray-300">
            <div className="text-[8px] text-gray-500">{yearHeaders[idx]}</div>
            <div className="font-semibold text-[10px]">{typeof val === 'number' ? formatNumber(val) : val}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const metricsPerYear = years.map(y => calculateMetrics(y));

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white min-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-lg font-bold text-amber-400">PIRÁMIDE DUPONT</h1>
      </div>

      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Left Sidebar - Data View Options */}
        <div className="w-40 flex-shrink-0">
          <div className="border border-amber-600 rounded p-3 bg-[#0d0d1a]">
            <div className="text-amber-400 text-sm font-bold mb-2">Visión de datos</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataViewMode === 'values'}
                  onChange={() => setDataViewMode('values')}
                  className="accent-amber-500"
                />
                <span className="text-red-400">Vista de valores</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="radio" 
                  name="dataView" 
                  checked={dataViewMode === 'deviation'}
                  onChange={() => setDataViewMode('deviation')}
                  className="accent-amber-500"
                />
                <span>Porcentajes desviación</span>
              </label>
            </div>
          </div>

          {/* ROA Box */}
          <div className="mt-4">
            <div className="text-red-400 text-xs mb-2">Retorno de la inversión</div>
            <div className="bg-amber-100 border-2 border-amber-500 rounded text-center text-gray-800">
              <div className="text-red-700 font-bold text-sm py-1 border-b border-gray-300">ROA</div>
              <div className="flex">
                {metricsPerYear.map((m, idx) => (
                  <div key={idx} className="flex-1 p-1 text-xs border-r last:border-r-0 border-gray-300">
                    <div className="text-[10px] text-gray-500">{yearHeaders[idx]}</div>
                    <div className="font-semibold">{formatNumber(m.roa, 2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BAIT/Ventas Box */}
          <div className="mt-4">
            <div className="bg-amber-100 border-2 border-amber-500 rounded text-center text-gray-800">
              <div className="text-red-700 font-bold text-sm py-1 border-b border-gray-300">BAIT / Ventas</div>
              <div className="flex">
                {metricsPerYear.map((m, idx) => (
                  <div key={idx} className="flex-1 p-1 text-xs border-r last:border-r-0 border-gray-300">
                    <div className="text-[10px] text-gray-500">{yearHeaders[idx]}</div>
                    <div className="font-semibold">{formatNumber(m.baitSobreVentas, 2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Pyramid Diagram */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-4 items-start justify-center scale-[0.9] origin-top">
            {/* Left Column - Main Ratios */}
            <div className="flex flex-col items-center gap-3">
              {/* Rotación del Activo */}
              <DataBox 
                label="Rotación del Activo" 
                values={metricsPerYear.map(m => formatNumber(m.rotacionActivo, 2))}
              />
              
              {/* Division indicator */}
              <div className="text-amber-400 text-xl">..</div>
              
              {/* Ventas */}
              <DataBox 
                label="Ventas" 
                values={metricsPerYear.map(m => m.ventas)}
              />
              
              {/* Division indicator */}
              <div className="text-amber-400 text-xl">..</div>
              
              {/* Activo */}
              <DataBox 
                label="Activo" 
                values={metricsPerYear.map(m => m.activo)}
              />
            </div>

            {/* Multiplication symbol */}
            <div className="text-amber-400 text-3xl font-bold mt-12">X.</div>

            {/* Middle Column - BAIT breakdown */}
            <div className="flex flex-col items-center gap-3">
              {/* Ventas (duplicate) */}
              <DataBox 
                label="Ventas" 
                values={metricsPerYear.map(m => m.ventas)}
              />
              
              {/* Minus indicator */}
              <div className="text-amber-400 text-xl">-</div>
              
              {/* BAIT */}
              <DataBox 
                label="BAIT" 
                values={metricsPerYear.map(m => m.bait)}
              />
              
              {/* Division indicator */}
              <div className="text-amber-400 text-xl">..</div>
              
              {/* Ventas (for BAIT/Ventas) */}
              <DataBox 
                label="Ventas" 
                values={metricsPerYear.map(m => m.ventas)}
              />
              
              {/* Coste Ventas y Otros gastos */}
              <DataBox 
                label="Coste Ventas y Otros gastos" 
                values={metricsPerYear.map(m => -m.costOfSalesAndOther)}
                bgColor="bg-yellow-100"
                borderColor="border-yellow-500"
              />
            </div>

            {/* Right Column - Asset breakdown */}
            <div className="flex flex-col gap-3">
              {/* Top section - Current Assets breakdown */}
              <div className="flex flex-col items-center gap-2">
                <DataBox 
                  label="Tesorería" 
                  values={metricsPerYear.map(m => m.tesoreria)}
                  bgColor="bg-yellow-100"
                  borderColor="border-yellow-500"
                />
                <DataBox 
                  label="Cuentas a cobrar" 
                  values={metricsPerYear.map(m => m.cuentasCobrar)}
                  bgColor="bg-yellow-100"
                  borderColor="border-yellow-500"
                />
                <DataBox 
                  label="Inventarios" 
                  values={metricsPerYear.map(m => m.inventarios)}
                  bgColor="bg-yellow-100"
                  borderColor="border-yellow-500"
                />
              </div>

              {/* Activo Corriente */}
              <div className="flex items-center gap-2">
                <DataBox 
                  label="Activo Corriente" 
                  values={metricsPerYear.map(m => m.activoCorriente)}
                />
                <div className="text-amber-400">+</div>
              </div>

              {/* Activo NoCorriente */}
              <DataBox 
                label="Activo NoCorriente" 
                values={metricsPerYear.map(m => m.activoNoCorriente)}
              />

              {/* Cost breakdown */}
              <div className="mt-4 flex flex-col gap-2">
                <DataBox 
                  label="Costo de Ventas" 
                  values={metricsPerYear.map(m => m.costoVentas)}
                  bgColor="bg-yellow-100"
                  borderColor="border-yellow-500"
                />
                <DataBox 
                  label="Otros gastos" 
                  values={metricsPerYear.map(m => m.otrosGastos)}
                  bgColor="bg-yellow-100"
                  borderColor="border-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
          <div className="text-center text-amber-400 font-bold text-sm mb-2">GRÁFICO DE EVOLUCIÓN</div>
          
          {/* Chart 1 */}
          <div className="bg-[#0d0d1a] border border-gray-600 rounded p-2">
            <div className="text-center text-xs text-amber-400 mb-2">Activo NoCorriente</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={getChartData('activo_nocorriente')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-gray-400 text-center">Periodos mensuales</div>
            
            <div className="mt-2 space-y-1">
              <div className="text-[10px] text-amber-400">Selección gráfico y tipo</div>
              <div className="flex gap-2 text-[10px]">
                <span className="text-gray-400">~ Gráfico de Valores</span>
                <select className="bg-[#1a1a2e] border border-gray-600 rounded text-[10px] px-1">
                  <option>Valores Piramide Dupont</option>
                </select>
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="text-gray-400">~ Tipo de Gráfico</span>
                <select className="bg-[#1a1a2e] border border-gray-600 rounded text-[10px] px-1">
                  <option>Tipos de Gráficos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="bg-[#0d0d1a] border border-gray-600 rounded p-2">
            <div className="text-center text-xs text-amber-400 mb-2">Activo NoCorriente</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={getChartData('activo_nocorriente_pct')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-gray-400 text-center">Periodos mensuales</div>
            
            <div className="mt-2 space-y-1">
              <div className="text-[10px] text-amber-400">Selección gráfico y tipo</div>
              <div className="flex gap-2 text-[10px]">
                <span className="text-gray-400">~ Gráfico de Desviaciones</span>
                <select className="bg-[#1a1a2e] border border-gray-600 rounded text-[10px] px-1">
                  <option>% Porcentajes desviación</option>
                </select>
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="text-gray-400">~ Tipo de Gráfico</span>
                <select className="bg-[#1a1a2e] border border-gray-600 rounded text-[10px] px-1">
                  <option>Tipos de Gráficos</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="p-4 bg-[#0d0d1a] border-t border-gray-700">
        <div className="text-red-500 font-bold text-sm mb-2">NOTA</div>
        <div className="text-[10px] text-gray-300 space-y-1">
          <p><strong>R.O.A.</strong> : Es la rentabilidad económica o rentabilidad de los activos. Es el acrónimo de Return of Assets.</p>
          <p>Su fórmula viene dada por el Margen de las Ventas y la rotación del Activo. El Margen de Ventas nos viene dado a su vez por los Beneficios antes de impuestos (BAII) dividos en las Ventas del ejercicio. También indicamos que la Rotación del Activo viene dada por el volumen de las Ventas dividido entre el Activo Total Medio.</p>
          <p>Otra forma de calcular el ROA es a través de dividir el Beneficio antes de Impuestos (BAII) o (EBIT) por los activos totales. El beneficio EBIT es el obtenido antes de descontar intereses, amortizaciones e impuestos.</p>
          <p>La razón de utilizar el EBIT se debe a que la generación de ingresos provenientes del Activo, es independiente de la carga fiscal sobre los beneficios y de la fuente de financiación empleada. Este indicador permite conocer que puede hacer la empresa con los activos que posee, es decir cuanta rentabilidad se obtiene de cada unidad monetaria invertida en la misma. Un ROA correcto esta en torno a 5%.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-2 flex justify-between items-center text-xs border-t border-gray-600">
        <span className="text-amber-400">{companyName}</span>
        <span className="bg-amber-600 px-3 py-1 rounded text-white font-bold">📊 PIRÁMIDE DE RATIOS FINANCIEROS</span>
        <span>Anàlisi de períodes: ANUALES</span>
        <span className="text-green-400">CUADRE DE BALANCES: 'OK'</span>
        <span className="flex items-center gap-1">📊 Calculadora</span>
        <span className="text-gray-400">© {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default DuPontPyramid;
