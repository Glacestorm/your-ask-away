import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface SectoralRatiosAnalysisProps {
  companyId: string;
  companyName: string;
}

const SectoralRatiosAnalysis: React.FC<SectoralRatiosAnalysisProps> = ({ companyId, companyName }) => {
  const [dataViewOption, setDataViewOption] = useState<'values' | 'values_deviation'>('values');
  const [chartGroup1, setChartGroup1] = useState('valoresRatios');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('porcentajesDesviacion');
  const [chartType2, setChartType2] = useState('bar');
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      setCompany(companyData);

      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('*, balance_sheets(*), income_statements(*)')
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

    if (companyId) fetchData();
  }, [companyId]);

  const years = balanceSheets.map(b => b.fiscal_year).sort((a, b) => b - a);

  const getBalanceValue = (year: number, field: string) => {
    const balance = balanceSheets.find(b => b.fiscal_year === year);
    return balance ? (balance[field] || 0) : 0;
  };

  const getIncomeValue = (year: number, field: string) => {
    const income = incomeStatements.find(i => i.fiscal_year === year);
    return income ? (income[field] || 0) : 0;
  };

  // Calculate ratios
  const calculateRatios = (year: number) => {
    const netTurnover = getIncomeValue(year, 'net_turnover') || 1;
    const totalAssets = (
      getBalanceValue(year, 'intangible_assets') +
      getBalanceValue(year, 'tangible_assets') +
      getBalanceValue(year, 'inventory') +
      getBalanceValue(year, 'trade_receivables') +
      getBalanceValue(year, 'cash_equivalents')
    ) || 1;
    const equity = (
      getBalanceValue(year, 'share_capital') +
      getBalanceValue(year, 'reserves') +
      getBalanceValue(year, 'retained_earnings')
    ) || 1;
    const totalDebt = (
      getBalanceValue(year, 'long_term_debts') +
      getBalanceValue(year, 'short_term_debts') +
      getBalanceValue(year, 'trade_payables')
    ) || 1;
    const inventory = getBalanceValue(year, 'inventory');
    const tradeReceivables = getBalanceValue(year, 'trade_receivables');
    const tradePayables = getBalanceValue(year, 'trade_payables');
    const currentAssets = inventory + tradeReceivables + getBalanceValue(year, 'cash_equivalents');
    const personnelExpenses = getIncomeValue(year, 'personnel_expenses');
    const supplies = getIncomeValue(year, 'supplies');
    const grossResult = netTurnover + supplies;
    const financialExpenses = getIncomeValue(year, 'financial_expenses');
    const financialIncome = getIncomeValue(year, 'financial_income');
    const financialResult = financialIncome + financialExpenses;
    const operatingResult = grossResult - personnelExpenses - getIncomeValue(year, 'depreciation');
    const resultBeforeTax = operatingResult + financialResult;
    const netResult = resultBeforeTax - getIncomeValue(year, 'corporate_tax');
    const fixedAssets = getBalanceValue(year, 'intangible_assets') + getBalanceValue(year, 'tangible_assets');
    const financialAssets = getBalanceValue(year, 'long_term_financial_investments') + getBalanceValue(year, 'short_term_financial_investments');
    const tangibleAssets = getBalanceValue(year, 'tangible_assets');

    return {
      valorAnadidoBruto: ((grossResult - supplies) / netTurnover) * 100,
      gastosPersonal: (personnelExpenses / netTurnover) * 100,
      resultadoEconomicoBruto: (operatingResult / netTurnover) * 100,
      resultadoEconomicoDeuda: (operatingResult / totalDebt) * 100,
      margenVentas: (netResult / netTurnover) * 100,
      cifraNegocioActivo: (netTurnover / totalAssets) * 100,
      resultadoNetoActivo: (netResult / totalAssets) * 100,
      resultadoAntesImpuestos: (resultBeforeTax / equity) * 100,
      resultadoDespuesImpuestos: (netResult / equity) * 100,
      existencias: (inventory / netTurnover) * 100,
      deudoresComerciales: (tradeReceivables / netTurnover) * 100,
      acreedoresComerciales: (tradePayables / netTurnover) * 100,
      capitalCirculante: (currentAssets / netTurnover) * 100,
      gastosFinancieros: (Math.abs(financialExpenses) / netTurnover) * 100,
      gastosFinancierosResultado: (Math.abs(financialExpenses) / (operatingResult || 1)) * 100,
      resultadosFinancieros: (financialResult / netTurnover) * 100,
      resultadosFinancierosResultado: (financialResult / (operatingResult || 1)) * 100,
      inmovilizadoFinanciero: (financialAssets / totalAssets) * 100,
      inmovilizadoMaterial: (tangibleAssets / totalAssets) * 100,
      activoCorriente: (currentAssets / totalAssets) * 100,
    };
  };

  // Sector averages (simulated - in real app would come from database)
  const sectorAverages = {
    valorAnadidoBruto: 24.46,
    gastosPersonal: 8.80,
    resultadoEconomicoBruto: 3.28,
    resultadoEconomicoDeuda: 1.67,
    margenVentas: -1.70,
    cifraNegocioActivo: 2.42,
    resultadoNetoActivo: 0.37,
    resultadoAntesImpuestos: -9.53,
    resultadoDespuesImpuestos: -1.72,
    existencias: -0.67,
    deudoresComerciales: 0.71,
    acreedoresComerciales: 0.50,
    capitalCirculante: 0.10,
    gastosFinancieros: 21.04,
    gastosFinancierosResultado: 18.93,
    resultadosFinancieros: 11.29,
    resultadosFinancierosResultado: 2.38,
    inmovilizadoFinanciero: 6.47,
    inmovilizadoMaterial: 0.18,
    activoCorriente: -2.31,
  };

  const formatPercent = (value: number) => `${value.toFixed(2)} %`;
  
  const getDifferenceStatus = (value: number, sectorValue: number) => {
    const diff = value - sectorValue;
    return diff >= 0 ? 'POSITIVO' : 'NEGATIVO';
  };

  const getDifferenceColor = (status: string) => {
    return status === 'POSITIVO' ? 'text-green-400' : 'text-red-400';
  };

  const ratiosByYear = years.reduce((acc, year) => {
    acc[year] = calculateRatios(year);
    return acc;
  }, {} as Record<number, any>);

  const operativosRatios = [
    { key: 'valorAnadidoBruto', label: 'Valor añadido bruto / Cifra neta de negocios' },
    { key: 'gastosPersonal', label: 'Gastos de personal / Cifra neta de negocios' },
    { key: 'resultadoEconomicoBruto', label: 'Resultado económico bruto / Cifra neta de negocios' },
    { key: 'resultadoEconomicoDeuda', label: 'Resultado económico bruto / Total deuda neta' },
    { key: 'margenVentas', label: 'Margen de Ventas / Cifra neta de negocios' },
    { key: 'cifraNegocioActivo', label: 'Cifra neta de negocios / Total Activo' },
    { key: 'resultadoNetoActivo', label: 'Resultado económico neto / Total Activo' },
    { key: 'resultadoAntesImpuestos', label: 'Result.antes de impuestos (BAI) / Patrimonio Neto' },
    { key: 'resultadoDespuesImpuestos', label: 'Resultados después de impuestos / Patrimonio Neto' },
  ];

  const capitalCirculanteRatios = [
    { key: 'existencias', label: 'Existencias / Cifra neta de negocios' },
    { key: 'deudoresComerciales', label: 'Deudores comerciales / Cifra neta de negocios' },
    { key: 'acreedoresComerciales', label: 'Acreedores comerciales / Cifra neta de negocios' },
    { key: 'capitalCirculante', label: 'Capital Circulante / Cifra neta de negocios' },
  ];

  const gastosIngresosRatios = [
    { key: 'gastosFinancieros', label: 'Gastos financieros y asimilados / Cifra neta de negocios' },
    { key: 'gastosFinancierosResultado', label: 'Gastos financieros y asimilados / Resultado económico bruto' },
    { key: 'resultadosFinancieros', label: 'Resultados Financieros / Cifra neta de negocios' },
    { key: 'resultadosFinancierosResultado', label: 'Resultados Financieros / Resultado económico bruto' },
  ];

  const estructuraActivoRatios = [
    { key: 'inmovilizadoFinanciero', label: 'Inmovilizado Financiero / Total Activo' },
    { key: 'inmovilizadoMaterial', label: 'Inmovilizado Material / Total Activo' },
    { key: 'activoCorriente', label: 'Activo Corriente / Total Activo' },
  ];

  const chartData = years.map(year => ({
    name: year.toString(),
    valorAnadido: ratiosByYear[year]?.valorAnadidoBruto || 0,
    margenVentas: ratiosByYear[year]?.margenVentas || 0,
  })).reverse();

  const renderChart = (data: any[], dataKey: string, chartType: string, color: string) => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  const renderRatioRow = (ratio: { key: string; label: string }, index: number, bgColor: string) => {
    const currentYear = years[0];
    const currentValue = ratiosByYear[currentYear]?.[ratio.key] || 0;
    const sectorValue = sectorAverages[ratio.key as keyof typeof sectorAverages] || 0;
    const difference = currentValue - sectorValue;
    const status = getDifferenceStatus(currentValue, sectorValue);

    return (
      <tr key={ratio.key} className={bgColor}>
        <td className="p-2 text-xs border border-border/50 text-foreground">{ratio.label}</td>
        <td className="p-2 text-xs border border-border/50 text-center font-medium">{formatPercent(currentValue)}</td>
        <td className="p-2 text-xs border border-border/50 text-center">{formatPercent(sectorValue)}</td>
        <td className={`p-2 text-xs border border-border/50 text-center font-bold ${getDifferenceColor(status)}`}>{status}</td>
        {years.slice(1).map(year => (
          <td key={year} className="p-2 text-xs border border-border/50 text-center">
            {formatPercent(ratiosByYear[year]?.[ratio.key] || 0)}
          </td>
        ))}
      </tr>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregant dades...</div>;
  }

  if (!balanceSheets.length) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">No hi ha dades financeres disponibles</div>;
  }

  const cnaeCode = company?.cnae || '011';
  const cnaeDescription = 'Cultivos no perennes';

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex gap-8 text-sm">
          <div><span className="text-muted-foreground">Sector:</span> <span className="font-bold text-primary">{cnaeCode}</span></div>
          <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">1</span></div>
        </div>
        <div className="mt-1">
          <span className="text-muted-foreground">DESCRIPCIÓN:</span> <span className="font-bold text-yellow-500">{cnaeCode} {cnaeDescription}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-border bg-muted/20 p-3 overflow-y-auto">
          {/* Data View Options */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2 border-b border-border pb-1">Visión de datos</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={dataViewOption === 'values'}
                  onChange={() => setDataViewOption('values')}
                  className="w-3 h-3"
                />
                <span className={dataViewOption === 'values' ? 'text-primary font-medium' : ''}>Vista de valores</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={dataViewOption === 'values_deviation'}
                  onChange={() => setDataViewOption('values_deviation')}
                  className="w-3 h-3"
                />
                <span className={dataViewOption === 'values_deviation' ? 'text-red-400 font-medium' : ''}>Vista de valores y % de desviación</span>
              </label>
            </div>
          </div>

          {/* Main Options Menu */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2 border-b border-border pb-1">Opciones Principales</div>
            <div className="space-y-1 text-xs">
              <div className="font-medium text-primary">Financial System</div>
              <div className="pl-2 space-y-0.5 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer">📄 Pantalla principal</div>
                <div className="hover:text-foreground cursor-pointer">📄 Pantalla de empresas</div>
                <div className="hover:text-foreground cursor-pointer">📄 Introducción Datos</div>
                <div className="hover:text-foreground cursor-pointer">📄 Informes</div>
              </div>
              <div className="font-medium text-blue-400 mt-2">📊 Balances</div>
              <div className="font-medium text-green-400">📈 Financiera</div>
              <div className="font-medium text-yellow-400">📉 Ratios</div>
              <div className="pl-2 mt-1">
                <div className="text-muted-foreground text-[10px] font-semibold">Grupo Ratios</div>
                <div className="pl-2 space-y-0.5">
                  <div className="hover:text-foreground cursor-pointer text-muted-foreground">Ratios de Liquidez y Endeudamiento</div>
                  <div className="text-yellow-400 font-medium bg-yellow-400/10 px-1 rounded">Ratios Sectoriales</div>
                  <div className="hover:text-foreground cursor-pointer text-muted-foreground">Simulador Otro Sector</div>
                  <div className="hover:text-foreground cursor-pointer text-muted-foreground">Pirámide de Ratios Fin.</div>
                  <div className="hover:text-foreground cursor-pointer text-muted-foreground">Análisis Bancario</div>
                </div>
              </div>
              <div className="font-medium text-red-400 mt-2">💰 Rentabilidad</div>
              <div className="font-medium text-purple-400">🔍 Auditoría</div>
              <div className="font-medium text-cyan-400">📋 Valoraciones</div>
              <div className="font-medium text-orange-400">📑 Cuentas Anuales</div>
              <div className="font-medium text-pink-400">💎 Valor Accionarial</div>
            </div>
          </div>

          {/* Information */}
          <div className="mt-4 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Información</div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>Varios</div>
              <div className="pl-2">🧮 Calculadora</div>
              <div>Ayuda</div>
              <div className="pl-2">🌐 www.financialsystem.es</div>
              <div className="mt-2">Fecha Versión: 01/04/2025</div>
              <div>Número Versión: 10.0.3</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-3">
          <h2 className="text-lg font-bold text-center mb-4 text-yellow-400">
            RATIOS SECTORIALES. (COMPARATIVA SECTORIAL)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 border border-border text-left font-semibold">DESCRIPCIÓN</th>
                  <th className="p-2 border border-border text-center font-semibold">Dic.-{years[0]?.toString().slice(-2) || '25'}</th>
                  <th className="p-2 border border-border text-center font-semibold">Valor sector</th>
                  <th className="p-2 border border-border text-center font-semibold">Diferencia</th>
                  {years.slice(1).map(year => (
                    <th key={year} className="p-2 border border-border text-center font-semibold">Dic.-{year.toString().slice(-2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* COSTES OPERATIVOS Section */}
                <tr className="bg-red-900/50">
                  <td colSpan={4 + years.slice(1).length} className="p-2 font-bold text-yellow-300 border border-border">
                    COSTES OPERATIVOS, BENEFICIO Y RENTABILIDADES
                  </td>
                </tr>
                {operativosRatios.map((ratio, i) => renderRatioRow(ratio, i, i % 2 === 0 ? 'bg-red-950/30' : 'bg-red-900/20'))}

                {/* CAPITAL CIRCULANTE Section */}
                <tr className="bg-red-900/50">
                  <td colSpan={4 + years.slice(1).length} className="p-2 font-bold text-yellow-300 border border-border">
                    CAPITAL CIRCULANTE
                  </td>
                </tr>
                {capitalCirculanteRatios.map((ratio, i) => renderRatioRow(ratio, i, i % 2 === 0 ? 'bg-red-950/30' : 'bg-red-900/20'))}

                {/* GASTOS E INGRESOS FINANCIEROS Section */}
                <tr className="bg-red-900/50">
                  <td colSpan={4 + years.slice(1).length} className="p-2 font-bold text-yellow-300 border border-border">
                    GASTOS E INGRESOS FINANCIEROS
                  </td>
                </tr>
                {gastosIngresosRatios.map((ratio, i) => renderRatioRow(ratio, i, i % 2 === 0 ? 'bg-red-950/30' : 'bg-red-900/20'))}

                {/* ESTRUCTURA DEL ACTIVO Section */}
                <tr className="bg-red-900/50">
                  <td colSpan={4 + years.slice(1).length} className="p-2 font-bold text-yellow-300 border border-border">
                    ESTRUCTURA DEL ACTIVO
                  </td>
                </tr>
                {estructuraActivoRatios.map((ratio, i) => renderRatioRow(ratio, i, i % 2 === 0 ? 'bg-red-950/30' : 'bg-red-900/20'))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Charts */}
        <div className="w-72 border-l border-border bg-muted/20 p-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-center mb-4 text-green-400">GRÁFICOS DE CONTROL Y EVOLUCIÓN</h3>

          {/* Chart 1 */}
          <div className="mb-6">
            <div className="text-xs font-medium text-center mb-2">Val.Añadido / Ventas</div>
            <div className="h-32 bg-background/50 rounded border border-border">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartData, 'valorAnadido', chartType1, 'hsl(var(--primary))')}
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">~ Gráfico de Valores</span>
                <Select value={chartGroup1} onValueChange={setChartGroup1}>
                  <SelectTrigger className="h-5 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valoresRatios">Valores Ratios Sectoriales</SelectItem>
                    <SelectItem value="costesOperativos">Costes Operativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">~ Tipo de Gráfico</span>
                <Select value={chartType1} onValueChange={setChartType1}>
                  <SelectTrigger className="h-5 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Tipos de Gráficos</SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="mb-4">
            <div className="text-xs font-medium text-center mb-2">Val.Añadido / Ventas</div>
            <div className="h-32 bg-background/50 rounded border border-border">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chartData, 'margenVentas', chartType2, 'hsl(var(--chart-2))')}
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">~ Gráfico de Desviaciones</span>
                <Select value={chartGroup2} onValueChange={setChartGroup2}>
                  <SelectTrigger className="h-5 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentajesDesviacion">Porcentajes desviación</SelectItem>
                    <SelectItem value="comparativaSector">Comparativa Sector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">~ Tipo de Gráfico</span>
                <Select value={chartType2} onValueChange={setChartType2}>
                  <SelectTrigger className="h-5 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Tipos de Gráficos</SelectItem>
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
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{company?.bp || '005'} - {companyName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">📊 Ratios Sectoriales (Comparativa Sectorial)</span>
          <span className="text-muted-foreground">Análisis de períodos: ANUALES</span>
          <span className="text-green-400">CUADRE DE BALANCES: 'OK'</span>
          <span className="text-muted-foreground">🧮 Calculadora</span>
          <span className="text-muted-foreground">{new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')}</span>
        </div>
      </div>
    </div>
  );
};

export default SectoralRatiosAnalysis;
