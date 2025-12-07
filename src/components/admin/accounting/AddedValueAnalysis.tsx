import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calculator, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddedValueAnalysisProps {
  companyId: string;
  companyName: string;
}

type DataViewMode = 'values_percentages' | 'values' | 'values_total' | 'values_deviation';

const AddedValueAnalysis: React.FC<AddedValueAnalysisProps> = ({
  companyId,
  companyName
}) => {
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('values');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup1, setChartGroup1] = useState('vendes_netes');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('vendes_netes_pct');
  const [chartType2, setChartType2] = useState('bar');
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: stmts } = await supabase
          .from('company_financial_statements')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .order('fiscal_year', { ascending: false });

        if (stmts?.length) {
          setStatements(stmts);
          const stmtIds = stmts.map(s => s.id);
          
          const [incomeRes, balanceRes] = await Promise.all([
            supabase.from('income_statements').select('*').in('statement_id', stmtIds),
            supabase.from('balance_sheets').select('*').in('statement_id', stmtIds)
          ]);
          
          setIncomeStatements(incomeRes.data || []);
          setBalanceSheets(balanceRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId]);

  // Always show 5 years (current year and 4 previous), regardless of data availability
  const sortedYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
  }, []);

  // Calculate added value data for each year
  const yearlyData = useMemo(() => {
    return sortedYears.map(year => {
      const income = incomeStatements.find(i => {
        const statement = statements.find(s => s.id === i.statement_id);
        return statement?.fiscal_year === year;
      });

      const balance = balanceSheets.find(b => {
        const statement = statements.find(s => s.id === b.statement_id);
        return statement?.fiscal_year === year;
      });

      // Generation of Added Value calculations
      const vendesNetes = income?.net_turnover || 0;
      const variacioExistencies = income?.inventory_variation || 0;
      const treballs = income?.capitalized_work || 0;
      const valorProduccio = vendesNetes + variacioExistencies + treballs;
      
      const consumsExplotacio = income?.supplies || 0;
      const gastosExterns = income?.other_operating_expenses || 0;
      const tributs = Math.abs(income?.corporate_tax || 0) * 0.1; // Estimated tributes
      const altresIngressos = income?.other_operating_income || 0;
      const gastosDiversos = Math.abs(income?.other_operating_expenses || 0) * 0.15;
      const provisions = income?.impairment_trade_operations || 0;
      
      const valorAfegitBrut = valorProduccio + consumsExplotacio + gastosExterns + tributs + altresIngressos + gastosDiversos + provisions;
      
      const amortitzacions = income?.depreciation || 0;
      const valorAfegitNet = valorAfegitBrut + amortitzacions;
      
      const altresIngresosFinancers = income?.financial_income || 0;
      const gastosFinancers = income?.financial_expenses || 0;

      // Distribution of Added Value
      const gastosPersonal = income?.personnel_expenses || 0;
      const ingressosFinancers = income?.financial_income || 0;
      const despesesFinanceres = income?.financial_expenses || 0;
      const valorAfegitBrutTotal = valorAfegitBrut + altresIngresosFinancers;

      return {
        year,
        // Generation
        vendesNetes,
        variacioExistencies,
        treballs,
        valorProduccio,
        consumsExplotacio,
        gastosExterns,
        tributs,
        altresIngressos,
        gastosDiversos,
        provisions,
        valorAfegitBrut,
        amortitzacions,
        valorAfegitNet,
        altresIngresosFinancers,
        // Distribution
        gastosPersonal,
        ingressosFinancers,
        despesesFinanceres,
        valorAfegitBrutTotal
      };
    });
  }, [sortedYears, incomeStatements, balanceSheets, statements]);

  const formatValue = (value: number) => {
    if (value === 0 || value === null || value === undefined) return '0,00';
    const displayValue = showThousands ? value / 1000 : value;
    return displayValue.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercentage = (value: number, base: number) => {
    if (base === 0) return '0,00%';
    return ((value / base) * 100).toFixed(2) + '%';
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return yearlyData.map(data => ({
      year: data.year.toString(),
      vendesNetes: Math.abs(data.vendesNetes) / (showThousands ? 1000 : 1),
      valorProduccio: Math.abs(data.valorProduccio) / (showThousands ? 1000 : 1),
      valorAfegitBrut: Math.abs(data.valorAfegitBrut) / (showThousands ? 1000 : 1),
      valorAfegitNet: Math.abs(data.valorAfegitNet) / (showThousands ? 1000 : 1),
      vendesNetesPct: 100
    })).reverse();
  }, [yearlyData, showThousands]);

  const chartOptions = [
    { value: 'vendes_netes', label: 'Vendes del Valor Afegit' },
    { value: 'valor_produccio', label: 'Valor de la Producció' },
    { value: 'valor_afegit_brut', label: 'Valor Afegit Brut' },
    { value: 'valor_afegit_net', label: 'Valor Afegit Net' }
  ];

  const chartOptions2 = [
    { value: 'vendes_netes_pct', label: '% Percentatges totals' },
    { value: 'percentatges_desviacio', label: '% Percentatges desviació' }
  ];

  const menuItems = [
    { id: 'masses', label: 'Anàlisi Masses Patrimonials' },
    { id: 'quadre_pg', label: 'Quadre Analític P. y G.' },
    { id: 'quadre_resum', label: 'Quadre Analític. (Resum y Porc.)' },
    { id: 'necessitats', label: 'Neces.Operat.de Fondos' },
    { id: 'tam', label: 'Tendències Anuals Mòbils. (TAM)' },
    { id: 'capital_circulant', label: 'Anàlisi del Capital Circulant' },
    { id: 'llarg_termini', label: 'Anàlisi Financer a llarg termini' },
    { id: 'flux_caixa', label: 'Flux de Caixa' },
    { id: 'ebit_ebitda', label: 'Anàlisi EBIT y EBITDA' },
    { id: 'valor_afegit', label: 'Anàlisi del Valor Afegit', active: true },
    { id: 'tresoreria', label: 'Moviments de Tresoreria.' },
    { id: 'financament', label: 'Quadre de Finançament' },
    { id: 'comandament', label: 'Quadre de Comandament Financer' },
    { id: 'index_z', label: "Índice 'Z'" }
  ];

  const renderGenerationTable = () => (
    <div className="mb-6">
      <div className="bg-amber-600 text-black font-bold px-3 py-2 text-sm">
        GENERACIÓ DEL VALOR AFEGIT
      </div>
      <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'scroll' }}>
        <table className="border-collapse text-xs" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-amber-500 text-black">
              <th className="border border-amber-600 px-2 py-1 text-left min-w-[280px] sticky left-0 bg-amber-500 z-10">CONCEPTES</th>
              {sortedYears.map(year => (
                <th key={year} className="border border-amber-600 px-2 py-1 text-center min-w-[120px] whitespace-nowrap">
                  Desembre-{year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-muted/30">
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+ Vendes netes</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.vendesNetes)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+ Variac.de existènc.de prod.term.y en curs de fabr.</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.variacioExistencies)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+ Treballs realitzats per l'empresa per al seu inmov.</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.treballs)}
                </td>
              ))}
            </tr>
            <tr className="bg-amber-500/80 font-bold text-black">
              <td className="border border-amber-600 px-2 py-1 sticky left-0 bg-amber-500/80 z-10">= VALOR DE LA PRODUCCIÓ</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-amber-600 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.valorProduccio)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Consums d'explotació</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.consumsExplotacio)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Gastos externs d'explotació</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.gastosExterns)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Tributs</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.tributs)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+ Altres ingressos de gestió corrent</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.altresIngressos)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Gastos diversos</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.gastosDiversos)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Provisions totals</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.provisions)}
                </td>
              ))}
            </tr>
            <tr className="bg-amber-400/80 font-bold text-black">
              <td className="border border-amber-600 px-2 py-1 sticky left-0 bg-amber-400/80 z-10">= Valor afegit brut d'explotació</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-amber-600 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.valorAfegitBrut)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Amortitzacions totals</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.amortitzacions)}
                </td>
              ))}
            </tr>
            <tr className="bg-amber-400/80 font-bold text-black">
              <td className="border border-amber-600 px-2 py-1 sticky left-0 bg-amber-400/80 z-10">= Valor afegit net d'explotació</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-amber-600 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.valorAfegitNet)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+/- Altres ingressos i gastos de caràcter financer</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.altresIngresosFinancers)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDistributionTable = () => (
    <div>
      <div className="bg-amber-600 text-black font-bold px-3 py-2 text-sm">
        DISTRIBUCIÓ DEL VALOR AFEGIT
      </div>
      <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'scroll' }}>
        <table className="border-collapse text-xs" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-amber-500 text-black">
              <th className="border border-amber-600 px-2 py-1 text-left min-w-[280px] sticky left-0 bg-amber-500 z-10">CONCEPTES</th>
              {sortedYears.map(year => (
                <th key={year} className="border border-amber-600 px-2 py-1 text-center min-w-[120px] whitespace-nowrap">
                  Desembre-{year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-muted/30">
            <tr className="bg-amber-400/80 font-bold text-black">
              <td className="border border-amber-600 px-2 py-1 sticky left-0 bg-amber-400/80 z-10">= Valor afegit brut d'explotació</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-amber-600 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.valorAfegitBrut)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+/- Altres ingressos i gastos de caràcter financer</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.altresIngresosFinancers)}
                </td>
              ))}
            </tr>
            <tr className="bg-amber-500/80 font-bold text-black">
              <td className="border border-amber-600 px-2 py-1 sticky left-0 bg-amber-500/80 z-10">= Valor afegit brut</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-amber-600 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.valorAfegitBrutTotal)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Gastos de personal</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.gastosPersonal)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Amortitzacions totals</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.amortitzacions)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">+ Ingressos financers</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.ingressosFinancers)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-border/50 px-2 py-1 sticky left-0 bg-muted/30 z-10">- Gastos financers</td>
              {yearlyData.map((data, idx) => (
                <td key={idx} className="border border-border/50 px-2 py-1 text-right font-mono whitespace-nowrap">
                  {formatValue(data.despesesFinanceres)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChart = (chartGroup: string, chartType: string) => {
    const getDataKey = () => {
      switch (chartGroup) {
        case 'vendes_netes': return 'vendesNetes';
        case 'valor_produccio': return 'valorProduccio';
        case 'valor_afegit_brut': return 'valorAfegitBrut';
        case 'valor_afegit_net': return 'valorAfegitNet';
        case 'vendes_netes_pct': return 'vendesNetesPct';
        default: return 'vendesNetes';
      }
    };

    const dataKey = getDataKey();
    const isPercentage = chartGroup.includes('pct');

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                fontSize: '11px'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              fontSize: '11px'
            }} 
          />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <text 
                key={index} 
                x={0} 
                y={0} 
                fill="white" 
                fontSize={9}
                textAnchor="middle"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!statements.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hi ha dades financeres disponibles per a aquesta empresa.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-center text-amber-600">
          ANÀLISI I CÀLCUL DEL VALOR AFEGIT
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-border bg-muted/30 p-3 overflow-y-auto">
          {/* Data View Options */}
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">Visió de dades</div>
            <div className="space-y-1">
              {[
                { value: 'values_percentages', label: 'Vista de valors y percentatges' },
                { value: 'values', label: 'Vista de valors' },
                { value: 'values_total', label: 'Vista de valors y % sobre total' },
                { value: 'values_deviation', label: 'Vista de valors y % de desviació' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="dataView"
                    checked={dataViewMode === option.value}
                    onChange={() => setDataViewMode(option.value as DataViewMode)}
                    className="w-3 h-3"
                  />
                  <span className={dataViewMode === option.value ? 'text-amber-500' : ''}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Main Options */}
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
              <span>Opcions Principals</span>
            </div>
            
            {/* Financial System Section */}
            <div className="mb-2">
              <div className="text-xs font-medium text-blue-400 mb-1">Financial System</div>
              <div className="pl-2 space-y-0.5 text-xs text-muted-foreground">
                <div>Pantalla principal</div>
                <div>Pantalla de empreses</div>
                <div>Introducció Dades</div>
                <div>Informes</div>
              </div>
            </div>

            {/* Balances */}
            <div className="mb-2">
              <div className="text-xs font-medium text-blue-400 mb-1">Balanços</div>
            </div>

            {/* Financera */}
            <div className="mb-2">
              <div className="text-xs font-medium text-blue-400 mb-1">Financera</div>
            </div>

            {/* Grupo Analítica */}
            <div className="mb-2">
              <div className="text-xs font-medium text-amber-500 mb-1">Grup Analítica</div>
              <div className="pl-2 space-y-0.5 text-xs">
                {menuItems.map(item => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-1 cursor-pointer ${
                      item.active ? 'text-amber-500 font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.active && <ChevronRight className="w-3 h-3" />}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Other sections */}
            {['Ràtios', 'Rendibilitat', 'Auditoria', 'Valoracions', 'Comptes Anuals', 'Valor Accionarial', 'Informació'].map(section => (
              <div key={section} className="mb-2">
                <div className="text-xs font-medium text-blue-400">{section}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex gap-4">
            {/* Tables Section - with forced scroll */}
            <div className="flex-1 min-w-0">
              <div className="max-w-full">
                {renderGenerationTable()}
                {renderDistributionTable()}
              </div>
            </div>

            {/* Charts Section */}
            <div className="w-80">
              <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
                <h3 className="text-sm font-semibold mb-3 text-center">GRÀFICS DE CONTROL I EVOLUCIÓ</h3>
                
                {/* Chart 1 */}
                <div className="mb-4">
                  <div className="text-xs font-medium mb-2 text-center">Vendes netes</div>
                  {renderChart(chartGroup1, chartType1)}
                  
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Selecció gràfic y tipo</div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">~ Gràfic de Valors</Label>
                        <Select value={chartGroup1} onValueChange={setChartGroup1}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {chartOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">~ Tipus de Gràfic</Label>
                        <Select value={chartType1} onValueChange={setChartType1}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar" className="text-xs">Tipus de Gràfics</SelectItem>
                            <SelectItem value="line" className="text-xs">Línia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2 */}
                <div>
                  <div className="text-xs font-medium mb-2 text-center">Vendes netes</div>
                  {renderChart(chartGroup2, chartType2)}
                  
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Selecció gràfic y tipo</div>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="radio" name="pctType" defaultChecked className="w-3 h-3" />
                      <span className="text-xs">Percentatges totals</span>
                      <input type="radio" name="pctType" className="w-3 h-3" />
                      <span className="text-xs">% Percentatges desviació</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">~ Tipus de Gràfic</Label>
                        <Select value={chartType2} onValueChange={setChartType2}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar" className="text-xs">Tipus de Gràfics</SelectItem>
                            <SelectItem value="line" className="text-xs">Línia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thousands Toggle */}
              <div className="flex items-center justify-end gap-2">
                <Switch
                  id="thousands"
                  checked={showThousands}
                  onCheckedChange={setShowThousands}
                />
                <Label htmlFor="thousands" className="text-xs">
                  Valors en milers de u.m.
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/50 border-t border-border px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{companyName || 'Empresa de exemple'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            Anàlisi del Valor Afegit
          </span>
          <span>Anàlisi de períodes: ANUALS</span>
          <span className="text-green-500">QUADRE DE BALANÇOS: 'OK'</span>
          <span>Calculadora</span>
        </div>
      </div>
    </div>
  );
};

export default AddedValueAnalysis;
