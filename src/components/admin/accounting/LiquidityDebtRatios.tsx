import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, ChevronDown, ChevronRight, Home, Building2, FileText, Calculator, PieChart, TrendingUp, ClipboardCheck, Star, BookOpen, HelpCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type BalanceSheet = Database['public']['Tables']['balance_sheets']['Row'];
type IncomeStatement = Database['public']['Tables']['income_statements']['Row'];

interface LiquidityDebtRatiosProps {
  companyId: string;
  companyName: string;
  onNavigate?: (section: string) => void;
}

type MenuSection = 'financial-system' | 'balances' | 'financiera' | 'ratios' | 'rentabilidad' | 'auditoria' | 'valoraciones' | 'cuentas-anuales' | 'valor-accionarial' | 'informacion';

const LiquidityDebtRatios: React.FC<LiquidityDebtRatiosProps> = ({
  companyId,
  companyName,
  onNavigate
}) => {
  const [balanceSheets, setBalanceSheets] = useState<(BalanceSheet & { fiscal_year: number })[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<(IncomeStatement & { fiscal_year: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataViewOption, setDataViewOption] = useState<'values' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(false);
  const [chartGroup1, setChartGroup1] = useState('liquidez');
  const [chartType1, setChartType1] = useState<'bar' | 'line' | 'area'>('bar');
  const [chartGroup2, setChartGroup2] = useState('endeudamiento');
  const [chartType2, setChartType2] = useState<'bar' | 'line' | 'area'>('bar');
  const [expandedSections, setExpandedSections] = useState<MenuSection[]>(['ratios']);

  useEffect(() => {
    fetchFinancialData();
  }, [companyId]);

  const toggleSection = (section: MenuSection) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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

  const currentYear = new Date().getFullYear();
  const displayYears = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentYear]);

  const sortedYears = useMemo(() => {
    const years = [...new Set(balanceSheets.map(bs => bs.fiscal_year))].sort((a, b) => b - a);
    return years.slice(0, 5);
  }, [balanceSheets]);

  const calculateRatios = useMemo(() => {
    return displayYears.map(year => {
      const bs = balanceSheets.find(b => b.fiscal_year === year);
      const is = incomeStatements.find(i => i.fiscal_year === year);

      if (!bs) return { year, liquidez: 0, fondoManiobra: 0, tesoreria: 0, disponibilidad: 0, endeudamiento: 0, endeudamientoActivo: 0, endeudamientoCP: 0, endeudamientoLP: 0, autonomia: 0, garantia: 0, calidadDeuda: 0, capacidadDevolucion: 0, gastosFinancieros: 0, costeDeuda: 0, costeMedioPasivo: 0 };

      const activoCorriente = Number(bs.inventory || 0) + Number(bs.trade_receivables || 0) + 
        Number(bs.short_term_group_receivables || 0) + Number(bs.short_term_financial_investments || 0) + 
        Number(bs.cash_equivalents || 0) + Number(bs.accruals_assets || 0);

      const pasivoCorriente = Number(bs.short_term_provisions || 0) + Number(bs.short_term_debts || 0) + 
        Number(bs.short_term_group_debts || 0) + Number(bs.trade_payables || 0) + 
        Number(bs.other_creditors || 0) + Number(bs.short_term_accruals || 0);

      const pasivoNoCorriente = Number(bs.long_term_provisions || 0) + Number(bs.long_term_debts || 0) + 
        Number(bs.long_term_group_debts || 0) + Number(bs.deferred_tax_liabilities || 0) + 
        Number(bs.long_term_accruals || 0);

      const patrimonioNeto = Number(bs.share_capital || 0) + Number(bs.share_premium || 0) + 
        Number(bs.revaluation_reserve || 0) + Number(bs.legal_reserve || 0) + 
        Number(bs.statutory_reserves || 0) + Number(bs.voluntary_reserves || 0) + 
        Number(bs.retained_earnings || 0) + Number(bs.current_year_result || 0) - 
        Number(bs.treasury_shares || 0) - Number(bs.interim_dividend || 0) + 
        Number(bs.capital_grants || 0);

      const activoTotal = Number(bs.intangible_assets || 0) + Number(bs.goodwill || 0) + 
        Number(bs.tangible_assets || 0) + Number(bs.real_estate_investments || 0) + 
        Number(bs.long_term_group_investments || 0) + Number(bs.long_term_financial_investments || 0) + 
        Number(bs.deferred_tax_assets || 0) + Number(bs.long_term_trade_receivables || 0) + activoCorriente;

      const deudasTotales = pasivoCorriente + pasivoNoCorriente;
      const tesoreriaVal = Number(bs.cash_equivalents || 0);
      const realizable = Number(bs.trade_receivables || 0) + Number(bs.short_term_group_receivables || 0) + 
        Number(bs.short_term_financial_investments || 0);
      const fondoManiobraVal = activoCorriente - pasivoCorriente;

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

      const liquidez = pasivoCorriente !== 0 ? activoCorriente / pasivoCorriente : 0;
      const fondoManiobra = pasivoCorriente !== 0 ? (fondoManiobraVal / pasivoCorriente) * 100 : 0;
      const tesoreria = pasivoCorriente !== 0 ? (tesoreriaVal + realizable) / pasivoCorriente : 0;
      const disponibilidad = pasivoCorriente !== 0 ? tesoreriaVal / pasivoCorriente : 0;

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
  }, [balanceSheets, incomeStatements, displayYears]);

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
    { key: 'liquidez', name: 'LIQUIDEZ', formula: 'Activo Corriente / Pasivo Corriente', mediaNormal: 'De 1.5 a 2.', isPercentage: false },
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

  const chartOptions1 = [
    { value: 'liquidez', label: 'Ratio de Liquidez' },
    { value: 'fondoManiobra', label: 'Fondo Maniobra' },
    { value: 'tesoreria', label: 'Tesorería' },
    { value: 'disponibilidad', label: 'Disponibilidad' }
  ];

  const chartOptions2 = [
    { value: 'endeudamiento', label: 'Endeudamiento' },
    { value: 'autonomia', label: 'Autonomía' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'calidadDeuda', label: 'Calidad Deuda' }
  ];

  const chartData = useMemo(() => {
    return [...calculateRatios].reverse().map(r => ({
      name: `${r.year}`,
      ...r
    }));
  }, [calculateRatios]);

  const renderChart = (dataKey: string, chartType: 'bar' | 'line' | 'area', title: string) => {
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-center">{title}</h4>
        <ResponsiveContainer width="100%" height={150}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Area type="monotone" dataKey={dataKey} fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.3} />
            </AreaChart>
          )}
        </ResponsiveContainer>
        <p className="text-[9px] text-center text-muted-foreground">Períodos anuales</p>
      </div>
    );
  };

  const handleMenuClick = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 h-full min-h-[600px]" style={{ backgroundColor: '#c0c000' }}>
      {/* Left Sidebar - Matching screenshot style */}
      <div className="w-52 flex-shrink-0 space-y-1 p-2 overflow-y-auto" style={{ backgroundColor: '#c0c000' }}>
        {/* Vision de datos */}
        <div className="bg-black/20 p-2 rounded text-xs">
          <div className="border border-black/30 p-1 mb-2 text-black font-semibold">Visión de datos</div>
          <label className="flex items-center gap-2 cursor-pointer text-red-600 font-medium">
            <input
              type="radio"
              checked={dataViewOption === 'values'}
              onChange={() => setDataViewOption('values')}
              className="w-3 h-3"
            />
            Vista de valores
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-black mt-1">
            <input
              type="radio"
              checked={dataViewOption === 'values_deviation'}
              onChange={() => setDataViewOption('values_deviation')}
              className="w-3 h-3"
            />
            Vista de valores y % de desviación
          </label>
        </div>

        {/* Opciones Principales */}
        <Collapsible open={expandedSections.includes('financial-system')} onOpenChange={() => toggleSection('financial-system')}>
          <div className="bg-black/20 p-1 rounded">
            <div className="border border-black/30 p-1 text-black font-semibold text-xs">Opciones Principales</div>
            <CollapsibleTrigger className="flex items-center gap-1 w-full text-left p-1 text-xs text-blue-800 font-semibold hover:bg-black/10">
              {expandedSections.includes('financial-system') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Financial System
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5 text-[10px]">
              <button onClick={() => handleMenuClick('inicio')} className="flex items-center gap-1 text-black hover:text-blue-600 w-full text-left">
                <Home className="h-3 w-3" /> Pantalla principal
              </button>
              <button onClick={() => handleMenuClick('empresas')} className="flex items-center gap-1 text-black hover:text-blue-600 w-full text-left">
                <Building2 className="h-3 w-3" /> Pantalla de empresas
              </button>
              <button onClick={() => handleMenuClick('datos')} className="flex items-center gap-1 text-black hover:text-blue-600 w-full text-left">
                <FileText className="h-3 w-3" /> Introducción Datos
              </button>
              <button onClick={() => handleMenuClick('informes')} className="flex items-center gap-1 text-black hover:text-blue-600 w-full text-left">
                <FileText className="h-3 w-3" /> Informes
              </button>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Balances */}
        <Collapsible open={expandedSections.includes('balances')} onOpenChange={() => toggleSection('balances')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            Balances
            {expandedSections.includes('balances') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-black/10 p-1 text-[10px] space-y-0.5">
            <button onClick={() => handleMenuClick('balance-situacion')} className="block w-full text-left text-black hover:text-blue-600">Balance de Situación</button>
            <button onClick={() => handleMenuClick('cuenta-resultados')} className="block w-full text-left text-black hover:text-blue-600">Cuenta de Resultados</button>
            <button onClick={() => handleMenuClick('cuadro-pgc')} className="block w-full text-left text-black hover:text-blue-600">Cuadro General PGC</button>
          </CollapsibleContent>
        </Collapsible>

        {/* Financiera */}
        <Collapsible open={expandedSections.includes('financiera')} onOpenChange={() => toggleSection('financiera')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            Financiera
            {expandedSections.includes('financiera') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-black/10 p-1 text-[10px] space-y-0.5">
            <button onClick={() => handleMenuClick('flujo-caja')} className="block w-full text-left text-black hover:text-blue-600">Flujo de Caja</button>
            <button onClick={() => handleMenuClick('ebit-ebitda')} className="block w-full text-left text-black hover:text-blue-600">EBIT/EBITDA</button>
            <button onClick={() => handleMenuClick('capital-circulante')} className="block w-full text-left text-black hover:text-blue-600">Capital Circulante</button>
          </CollapsibleContent>
        </Collapsible>

        {/* Ratios */}
        <Collapsible open={expandedSections.includes('ratios')} onOpenChange={() => toggleSection('ratios')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            <span className="flex items-center gap-1"><PieChart className="h-3 w-3" /> Ratios</span>
            {expandedSections.includes('ratios') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-black/10 p-1 text-[10px] space-y-0.5">
            <div className="text-blue-800 font-semibold">Grupo Ratios</div>
            <button onClick={() => handleMenuClick('ratios-liquidez')} className="flex items-center gap-1 w-full text-left text-blue-800 font-medium pl-2">
              <PieChart className="h-3 w-3" /> Ratios de Liquidez y Endeudamiento
            </button>
            <button onClick={() => handleMenuClick('ratios-sectoriales')} className="flex items-center gap-1 w-full text-left text-black hover:text-blue-600 pl-2">
              <FileText className="h-3 w-3" /> Ratios Sectoriales
            </button>
            <button onClick={() => handleMenuClick('simulador-sector')} className="flex items-center gap-1 w-full text-left text-black hover:text-blue-600 pl-2">
              <Calculator className="h-3 w-3" /> Simulador Otro Sector
            </button>
            <button onClick={() => handleMenuClick('piramide-ratios')} className="flex items-center gap-1 w-full text-left text-black hover:text-blue-600 pl-2">
              <TrendingUp className="h-3 w-3" /> Pirámide de Ratios Fin.
            </button>
            <button onClick={() => handleMenuClick('analisis-bancario')} className="flex items-center gap-1 w-full text-left text-black hover:text-blue-600 pl-2">
              <Building2 className="h-3 w-3" /> Análisis Bancario
            </button>
          </CollapsibleContent>
        </Collapsible>

        {/* Rentabilidad */}
        <Collapsible open={expandedSections.includes('rentabilidad')} onOpenChange={() => toggleSection('rentabilidad')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            Rentabilidad
            {expandedSections.includes('rentabilidad') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-black/10 p-1 text-[10px] space-y-0.5">
            <button onClick={() => handleMenuClick('rentabilidad-economica')} className="block w-full text-left text-black hover:text-blue-600">Rentabilidad Económica</button>
            <button onClick={() => handleMenuClick('rentabilidad-financiera')} className="block w-full text-left text-black hover:text-blue-600">Rentabilidad Financiera</button>
            <button onClick={() => handleMenuClick('apalancamiento')} className="block w-full text-left text-black hover:text-blue-600">Apalancamiento</button>
          </CollapsibleContent>
        </Collapsible>

        {/* Auditoría */}
        <Collapsible open={expandedSections.includes('auditoria')} onOpenChange={() => toggleSection('auditoria')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            <span className="flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Auditoría</span>
            {expandedSections.includes('auditoria') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {/* Valoraciones */}
        <Collapsible open={expandedSections.includes('valoraciones')} onOpenChange={() => toggleSection('valoraciones')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#000080] text-white p-1 text-xs font-semibold rounded">
            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Valoraciones</span>
            {expandedSections.includes('valoraciones') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {/* Cuentas Anuales */}
        <Collapsible open={expandedSections.includes('cuentas-anuales')} onOpenChange={() => toggleSection('cuentas-anuales')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#800000] text-white p-1 text-xs font-semibold rounded">
            Cuentas Anuales
            {expandedSections.includes('cuentas-anuales') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {/* Valor Accionarial */}
        <Collapsible open={expandedSections.includes('valor-accionarial')} onOpenChange={() => toggleSection('valor-accionarial')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-[#800000] text-white p-1 text-xs font-semibold rounded">
            Valor Accionarial
            {expandedSections.includes('valor-accionarial') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {/* Información */}
        <div className="bg-black/20 p-1 rounded text-[10px]">
          <div className="border border-black/30 p-1 mb-1 text-black font-semibold text-xs">Información</div>
          <div className="text-blue-800 font-semibold">Varios</div>
          <button onClick={() => handleMenuClick('calculadora')} className="flex items-center gap-1 text-black hover:text-blue-600 pl-2">
            <Calculator className="h-3 w-3" /> Calculadora
          </button>
          <div className="text-blue-800 font-semibold mt-1">Ayuda</div>
          <button onClick={() => handleMenuClick('contenido')} className="flex items-center gap-1 text-green-700 hover:text-blue-600 pl-2">
            <BookOpen className="h-3 w-3" /> Contenido
          </button>
          <a href="https://www.financialsystem.es" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-700 hover:text-blue-600 pl-2">
            <Info className="h-3 w-3" /> www.financialsystem.es
          </a>
          <div className="mt-2 text-[9px] text-black/70">
            <div>Fecha Versión: 01/11/2025</div>
            <div>Número Versión: 10.0.5.0</div>
            <div>Tipo Versión: 'MASTER'</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-2 p-2 overflow-auto bg-[#c0c000]">
        {/* Liquidity Ratios Table */}
        <div className="bg-white rounded shadow">
          <h2 className="text-lg font-bold text-center py-2 text-amber-600 italic">
            RATIOS GENERALES DE LIQUIDEZ
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-400">
                  <TableHead className="text-black font-bold text-xs py-1 border border-black/20">DESCRIPCIÓN</TableHead>
                  <TableHead className="text-black font-bold text-xs py-1 border border-black/20">FÓRMULA</TableHead>
                  <TableHead className="text-black font-bold text-xs py-1 text-center border border-black/20">* Media Normal</TableHead>
                  {displayYears.map(year => (
                    <TableHead key={year} className="text-black font-bold text-xs py-1 text-right border border-black/20">
                      Dic.-{String(year).slice(-2)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidityRatios.map((ratio, idx) => {
                  const values = calculateRatios.map(r => r[ratio.key as keyof typeof r] as number);
                  return (
                    <TableRow key={ratio.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <TableCell className="font-medium text-xs py-1 border border-black/20">{ratio.name}</TableCell>
                      <TableCell className="text-xs py-1 border border-black/20">{ratio.formula}</TableCell>
                      <TableCell className="text-xs py-1 text-center border border-black/20 text-green-600 font-semibold">{ratio.mediaNormal}</TableCell>
                      {displayYears.map((year, i) => {
                        const ratioData = calculateRatios.find(r => r.year === year);
                        const value = ratioData ? (ratioData[ratio.key as keyof typeof ratioData] as number) : 0;
                        const prevRatioData = calculateRatios.find(r => r.year === displayYears[i + 1]);
                        const prevValue = prevRatioData ? (prevRatioData[ratio.key as keyof typeof prevRatioData] as number) : 0;
                        const deviation = getDeviation(value, prevValue);
                        
                        return (
                          <TableCell key={year} className="text-xs py-1 text-right border border-black/20">
                            {formatValue(value, ratio.isPercentage)}
                            {dataViewOption === 'values_deviation' && i < displayYears.length - 1 && (
                              <span className={`block text-[9px] ${deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%)
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Debt Ratios Table */}
        <div className="bg-white rounded shadow">
          <h2 className="text-lg font-bold text-center py-2 text-amber-600 italic">
            RATIOS GENERALES DE ENDEUDAMIENTO
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-400">
                  <TableHead className="text-black font-bold text-xs py-1 border border-black/20">DESCRIPCIÓN</TableHead>
                  <TableHead className="text-black font-bold text-xs py-1 border border-black/20">FÓRMULA</TableHead>
                  <TableHead className="text-black font-bold text-xs py-1 text-center border border-black/20">* Media Normal</TableHead>
                  {displayYears.map(year => (
                    <TableHead key={year} className="text-black font-bold text-xs py-1 text-right border border-black/20">
                      Dic.-{String(year).slice(-2)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtRatios.map((ratio, idx) => {
                  return (
                    <TableRow key={ratio.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <TableCell className="font-medium text-xs py-1 border border-black/20">{ratio.name}</TableCell>
                      <TableCell className="text-xs py-1 border border-black/20">{ratio.formula}</TableCell>
                      <TableCell className="text-xs py-1 text-center border border-black/20 text-green-600 font-semibold">{ratio.mediaNormal}</TableCell>
                      {displayYears.map((year, i) => {
                        const ratioData = calculateRatios.find(r => r.year === year);
                        const value = ratioData ? (ratioData[ratio.key as keyof typeof ratioData] as number) : 0;
                        const prevRatioData = calculateRatios.find(r => r.year === displayYears[i + 1]);
                        const prevValue = prevRatioData ? (prevRatioData[ratio.key as keyof typeof prevRatioData] as number) : 0;
                        const deviation = getDeviation(value, prevValue);
                        
                        return (
                          <TableCell key={year} className="text-xs py-1 text-right border border-black/20">
                            {formatValue(value, ratio.isPercentage)}
                            {dataViewOption === 'values_deviation' && i < displayYears.length - 1 && (
                              <span className={`block text-[9px] ${deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%)
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-black/70 italic">
          * Media establecida como guía general, aunque pueden haber sectores que esta media no se corresponda con su ciclo económico.
        </p>
      </div>

      {/* Right Charts Panel */}
      <div className="w-64 flex-shrink-0 p-2 space-y-2 overflow-y-auto" style={{ backgroundColor: '#c0c000' }}>
        <h3 className="text-sm font-bold text-center text-black italic">GRÁFICOS DE CONTROL Y EVOLUCIÓN</h3>
        
        {/* Chart 1 */}
        <div className="bg-white rounded p-2 shadow">
          {renderChart(chartGroup1, chartType1, chartOptions1.find(o => o.value === chartGroup1)?.label || 'Ratio de Liquidez')}
          
          <div className="mt-2 space-y-1 border-t pt-2">
            <div className="text-[9px] font-semibold">Selección gráfico y tipo</div>
            <div className="flex items-center gap-1 text-[9px]">
              <span>~ Gráfico de Valores</span>
              <select 
                value={chartGroup1}
                onChange={(e) => setChartGroup1(e.target.value)}
                className="text-[9px] border rounded px-1 py-0.5 flex-1"
              >
                {chartOptions1.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-[9px]">
              <span>~ Tipo de Gráfico</span>
              <select 
                value={chartType1}
                onChange={(e) => setChartType1(e.target.value as 'bar' | 'line' | 'area')}
                className="text-[9px] border rounded px-1 py-0.5 flex-1"
              >
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
                <option value="area">Área</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded p-2 shadow">
          {renderChart(chartGroup2, chartType2, chartOptions2.find(o => o.value === chartGroup2)?.label || 'Ratio de Liquidez')}
          
          <div className="mt-2 space-y-1 border-t pt-2">
            <div className="text-[9px] font-semibold">Selección gráfico y tipo</div>
            <div className="flex items-center gap-1 text-[9px]">
              <span>Gráfico de Desviaciones</span>
              <select 
                value={chartGroup2}
                onChange={(e) => setChartGroup2(e.target.value)}
                className="text-[9px] border rounded px-1 py-0.5 flex-1"
              >
                {chartOptions2.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-[9px]">
              <span>~ Tipo de Gráfico</span>
              <select 
                value={chartType2}
                onChange={(e) => setChartType2(e.target.value as 'bar' | 'line' | 'area')}
                className="text-[9px] border rounded px-1 py-0.5 flex-1"
              >
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
                <option value="area">Área</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityDebtRatios;
