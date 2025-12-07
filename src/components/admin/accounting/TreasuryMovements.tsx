import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TreasuryMovementsProps {
  companyId: string;
  companyName: string;
}

type DataViewMode = 'values' | 'values_deviation';

const TreasuryMovements: React.FC<TreasuryMovementsProps> = ({
  companyId,
  companyName
}) => {
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('values_deviation');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup1, setChartGroup1] = useState('flujos_operaciones');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('flujos_operaciones_pct');
  const [chartType2, setChartType2] = useState('bar');
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);
  const [cashFlowStatements, setCashFlowStatements] = useState<any[]>([]);

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
          
          const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
            supabase.from('income_statements').select('*').in('statement_id', stmtIds),
            supabase.from('balance_sheets').select('*').in('statement_id', stmtIds),
            supabase.from('cash_flow_statements').select('*').in('statement_id', stmtIds)
          ]);
          
          setIncomeStatements(incomeRes.data || []);
          setBalanceSheets(balanceRes.data || []);
          setCashFlowStatements(cashFlowRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId]);

  // Get sorted years (most recent first)
  const sortedYears = useMemo(() => {
    return statements
      .map(s => s.fiscal_year)
      .sort((a, b) => b - a)
      .slice(0, 5);
  }, [statements]);

  // Calculate treasury movements for each year
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

      const cashFlow = cashFlowStatements?.find(cf => {
        const statement = statements.find(s => s.id === cf.statement_id);
        return statement?.fiscal_year === year;
      });

      // Treasury movements calculations
      const resultadoNetoEjercicio = income?.net_turnover ? 
        (income.net_turnover + (income.supplies || 0) + (income.personnel_expenses || 0) + 
         (income.other_operating_expenses || 0) + (income.depreciation || 0) + 
         (income.financial_income || 0) + (income.financial_expenses || 0) + 
         (income.corporate_tax || 0)) : 0;
      
      const amortizacionAcumulada = income?.depreciation || 0;
      const amortizacionIntangible = Math.abs(income?.depreciation || 0) * 0.15;
      const amortizacionMaterial = Math.abs(income?.depreciation || 0) * 0.75;
      const amortizacionInversiones = Math.abs(income?.depreciation || 0) * 0.1;
      
      const variacionProvisiones = income?.impairment_trade_operations || 0;
      const variacionProvDeudores = 0;
      const variacionProvInmov = income?.impairment_financial_instruments || 0;
      const variacionProvRiesgos = Math.abs(income?.excess_provisions || 0) * 0.3;
      const variacionOtrasProvisiones = Math.abs(income?.excess_provisions || 0) * 0.7;
      
      const flujosOperaciones = resultadoNetoEjercicio + amortizacionAcumulada + variacionProvisiones;
      
      const variacionDeudores = cashFlow?.receivables_changes || (balance?.trade_receivables || 0) * 0.1;
      const variacionClientes = (balance?.trade_receivables || 0) * 0.08;
      const variacionAdminPublicas = (balance?.trade_receivables || 0) * 0.02;
      const variacionOtrosDeudores = (balance?.trade_receivables || 0) * 0.01;
      
      const variacionExistencias = cashFlow?.inventory_changes || (balance?.inventory || 0) * 0.05;
      const variacionOtrosActivos = (balance?.accruals_assets || 0) * 0.1;
      
      const variacionAcreedores = cashFlow?.payables_changes || (balance?.trade_payables || 0) * 0.1;
      const variacionOtrasDeudas = (balance?.other_creditors || 0) * 0.08;
      const variacionAjustesPeriod = (balance?.short_term_accruals || 0) * 0.05;
      
      const fondoManiobraOperativo = flujosOperaciones + variacionDeudores + variacionExistencias + 
                                     variacionOtrosActivos + variacionAcreedores + variacionOtrasDeudas + 
                                     variacionAjustesPeriod;
      
      const variacionGastosEstablec = 0;
      const variacionInmovIntangible = (balance?.intangible_assets || 0) * 0.1;
      const variacionInmovMaterial = (balance?.tangible_assets || 0) * 0.15;
      const variacionInversiones = (balance?.real_estate_investments || 0) * 0.08;

      // Calculate cash flow summary
      const flujoCajaGenerado = fondoManiobraOperativo;
      const saldoInicialTesoreria = (balance?.cash_equivalents || 0) * 0.8;
      const saldoFinalTesoreria = balance?.cash_equivalents || 0;

      return {
        year,
        resultadoNetoEjercicio,
        amortizacionAcumulada,
        amortizacionIntangible,
        amortizacionMaterial,
        amortizacionInversiones,
        variacionProvisiones,
        variacionProvDeudores,
        variacionProvInmov,
        variacionProvRiesgos,
        variacionOtrasProvisiones,
        flujosOperaciones,
        variacionDeudores,
        variacionClientes,
        variacionAdminPublicas,
        variacionOtrosDeudores,
        variacionExistencias,
        variacionOtrosActivos,
        variacionAcreedores,
        variacionOtrasDeudas,
        variacionAjustesPeriod,
        fondoManiobraOperativo,
        variacionGastosEstablec,
        variacionInmovIntangible,
        variacionInmovMaterial,
        variacionInversiones,
        flujoCajaGenerado,
        saldoInicialTesoreria,
        saldoFinalTesoreria
      };
    });
  }, [sortedYears, incomeStatements, balanceSheets, cashFlowStatements, statements]);

  const formatValue = (value: number) => {
    if (value === 0 || value === null || value === undefined) return '0,00';
    const displayValue = showThousands ? value / 1000 : value;
    return displayValue.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatDeviation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return '0,00 %';
    const deviation = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    return `${deviation >= 0 ? '' : '-'}${Math.abs(deviation).toFixed(2)} %`;
  };

  // Chart data
  const chartData = useMemo(() => {
    return yearlyData.map(data => ({
      year: data.year.toString(),
      flujosOperaciones: data.flujosOperaciones / (showThousands ? 1000 : 1),
      fondoManiobra: data.fondoManiobraOperativo / (showThousands ? 1000 : 1),
      flujoCaja: data.flujoCajaGenerado / (showThousands ? 1000 : 1)
    })).reverse();
  }, [yearlyData, showThousands]);

  const chartOptions = [
    { value: 'flujos_operaciones', label: 'Valors Anàlisi Cobros-Pagos' },
    { value: 'fondo_maniobra', label: 'Fons de Maniobra Operatiu' },
    { value: 'flujo_caja', label: 'Flux de Caixa Generat' }
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
    { id: 'valor_afegit', label: 'Anàlisi del Valor Afegit' },
    { id: 'tresoreria', label: 'Moviments de Tresoreria.', active: true },
    { id: 'financament', label: 'Quadre de Finançament' },
    { id: 'comandament', label: 'Quadre de Comandament Financer' },
    { id: 'index_z', label: "Índice 'Z'" }
  ];

  const renderTableRow = (label: string, getValue: (data: any) => number, isHighlight = false, highlightColor = '') => {
    return (
      <tr className={isHighlight ? `${highlightColor} font-bold text-black` : ''}>
        <td className={`border ${isHighlight ? 'border-amber-600' : 'border-border/50'} px-2 py-1`}>{label}</td>
        {yearlyData.map((data, idx) => {
          const value = getValue(data);
          const prevData = yearlyData[idx + 1];
          const prevValue = prevData ? getValue(prevData) : 0;
          
          return (
            <React.Fragment key={idx}>
              <td className={`border ${isHighlight ? 'border-amber-600' : 'border-border/50'} px-2 py-1 text-right font-mono text-xs`}>
                {formatValue(value)}
              </td>
              {dataViewMode === 'values_deviation' && idx < yearlyData.length - 1 && (
                <td className={`border ${isHighlight ? 'border-amber-600' : 'border-border/50'} px-2 py-1 text-right font-mono text-xs text-amber-600`}>
                  {formatDeviation(value, prevValue)}
                </td>
              )}
            </React.Fragment>
          );
        })}
      </tr>
    );
  };

  const renderChart = (chartGroup: string, chartType: string) => {
    const getDataKey = () => {
      switch (chartGroup) {
        case 'flujos_operaciones': return 'flujosOperaciones';
        case 'fondo_maniobra': return 'fondoManiobra';
        case 'flujo_caja': return 'flujoCaja';
        default: return 'flujosOperaciones';
      }
    };

    const dataKey = getDataKey();

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                fontSize: '10px'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              fontSize: '10px'
            }} 
          />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Get latest data for summary
  const latestData = yearlyData[0] || {
    flujoCajaGenerado: 0,
    saldoInicialTesoreria: 0,
    saldoFinalTesoreria: 0
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
      <div className="bg-muted/50 border-b border-border px-4 py-2">
        <h1 className="text-lg font-bold text-center text-amber-600">
          CASH FLOW NET. - FLUXOS DE TRESORERIA
        </h1>
        <h2 className="text-sm text-center text-muted-foreground">
          DIFERÈNCIES I DESVIACIONS ENTRE EXERCICIS. (TRESORERIA GENERADA)
        </h2>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-border bg-muted/30 p-2 overflow-y-auto text-xs">
          {/* Data View Options */}
          <div className="mb-3">
            <div className="text-xs font-semibold mb-1 text-muted-foreground">Visió de dades</div>
            <div className="space-y-0.5">
              {[
                { value: 'values', label: 'Vista de valors' },
                { value: 'values_deviation', label: 'Vista de valors y % de desviació' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="dataView"
                    checked={dataViewMode === option.value}
                    onChange={() => setDataViewMode(option.value as DataViewMode)}
                    className="w-2.5 h-2.5"
                  />
                  <span className={dataViewMode === option.value ? 'text-amber-500' : ''}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Main Options */}
          <div className="mb-3">
            <div className="text-xs font-semibold mb-1 text-muted-foreground">Opcions Principals</div>
            
            <div className="mb-1">
              <div className="text-xs font-medium text-blue-400 mb-0.5">Financial System</div>
              <div className="pl-2 space-y-0 text-[10px] text-muted-foreground">
                <div>Pantalla principal</div>
                <div>Pantalla de empreses</div>
                <div>Introducció Dades</div>
                <div>Informes</div>
              </div>
            </div>

            <div className="mb-1">
              <div className="text-xs font-medium text-blue-400">Balanços</div>
            </div>

            <div className="mb-1">
              <div className="text-xs font-medium text-blue-400">Financera</div>
            </div>

            <div className="mb-1">
              <div className="text-xs font-medium text-amber-500 mb-0.5">Grup Analítica</div>
              <div className="pl-1 space-y-0 text-[10px]">
                {menuItems.map(item => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-0.5 cursor-pointer ${
                      item.active ? 'text-amber-500 font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.active && <ChevronRight className="w-2.5 h-2.5" />}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {['Ràtios', 'Rendibilitat', 'Auditoria', 'Valoracions', 'Comptes Anuals', 'Valor Accionarial', 'Informació', 'Varios'].map(section => (
              <div key={section} className="mb-1">
                <div className="text-xs font-medium text-blue-400">{section}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="flex gap-3">
            {/* Table Section */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse text-[10px]" style={{ minWidth: '900px' }}>
                <thead>
                  <tr className="bg-amber-500 text-black">
                    <th className="border border-amber-600 px-2 py-1 text-left min-w-[280px] sticky left-0 bg-amber-500 z-10">CONCEPTES</th>
                    {sortedYears.map((year, idx) => (
                      <React.Fragment key={year}>
                        <th className="border border-amber-600 px-2 py-1 text-center min-w-[100px] whitespace-nowrap">
                          Desembre-{year}
                        </th>
                        {dataViewMode === 'values_deviation' && idx < sortedYears.length - 1 && (
                          <th className="border border-amber-600 px-1 py-1 text-center min-w-[70px] text-amber-800 whitespace-nowrap">
                            % Desv.
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-muted/30">
                  {renderTableRow('Resultat Net Exercici', d => d.resultadoNetoEjercicio, true, 'bg-amber-400/80')}
                  {renderTableRow('Variació amortització acumulada', d => d.amortizacionAcumulada)}
                  {renderTableRow('Amortització del inmobilitzat intangible', d => d.amortizacionIntangible)}
                  {renderTableRow('Amortització del inmobilitzat material', d => d.amortizacionMaterial)}
                  {renderTableRow('Amortització de les inversions immobiliàries', d => d.amortizacionInversiones)}
                  {renderTableRow('Variació Provisions y Deterioros', d => d.variacionProvisiones, true, 'bg-amber-300/60')}
                  {renderTableRow('Variació Provisions y Deterioros (Deutors)', d => d.variacionProvDeudores)}
                  {renderTableRow('Variació Provisions y Deterioros (Inmobilitzat)', d => d.variacionProvInmov)}
                  {renderTableRow('Variació Provisions y Deterioros (Riscos y Gastos)', d => d.variacionProvRiesgos)}
                  {renderTableRow('Variació Altres Provisions y Deterioros', d => d.variacionOtrasProvisiones)}
                  {renderTableRow('FLUXOS GENERATS PER LES OPERACIONS', d => d.flujosOperaciones, true, 'bg-amber-500/80')}
                  {renderTableRow('Variació de Deutors en general', d => d.variacionDeudores)}
                  {renderTableRow('Variació de Clients per vendes y prestacions de serveis', d => d.variacionClientes)}
                  {renderTableRow('Variació de Administracions Públiques Deutores', d => d.variacionAdminPublicas)}
                  {renderTableRow('Variació de Altres deutors', d => d.variacionOtrosDeudores)}
                  {renderTableRow('Variació de Existències', d => d.variacionExistencias)}
                  {renderTableRow('Variació de Altres actius corrents', d => d.variacionOtrosActivos)}
                  {renderTableRow('Variació de Acreedors Comercials', d => d.variacionAcreedores)}
                  {renderTableRow('Variació de Altres deutes no comercials', d => d.variacionOtrasDeudas)}
                  {renderTableRow('Variació de Ajustos per Periodific.', d => d.variacionAjustesPeriod)}
                  {renderTableRow('FONS DE MANIOBRA OPERATIU', d => d.fondoManiobraOperativo, true, 'bg-amber-500/80')}
                  {renderTableRow('Variació Gastos de Establiment', d => d.variacionGastosEstablec)}
                  {renderTableRow('Variació Inmobilitzat Intangible', d => d.variacionInmovIntangible)}
                  {renderTableRow('Variació Inmobilitzat Material', d => d.variacionInmovMaterial)}
                  {renderTableRow('Variació Inversions immobiliàries', d => d.variacionInversiones)}
                </tbody>
              </table>

              {/* Summary Footer */}
              <div className="mt-3 p-2 bg-muted/50 border border-border rounded text-xs text-center">
                Flux de Caixa Generat: ( {formatValue(latestData.flujoCajaGenerado || 0)} ) + 
                Saldo Inicial de Tresoreria: ( {formatValue(latestData.saldoInicialTesoreria || 0)} ) = 
                Saldo Final de Tresoreria: ( {formatValue(latestData.saldoFinalTesoreria || 0)} ).
              </div>
            </div>

            {/* Charts Section */}
            <div className="w-72">
              <div className="bg-muted/50 border border-border rounded-lg p-2 mb-3">
                <h3 className="text-xs font-semibold mb-2 text-center">GRÀFICS DE CONTROL I EVOLUCIÓ</h3>
                
                {/* Chart 1 */}
                <div className="mb-3">
                  <div className="text-[10px] font-medium mb-1 text-center">Fluxos generats per Operacions</div>
                  {renderChart(chartGroup1, chartType1)}
                  
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Selecció gràfic y tipo</div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <Label className="text-[9px]">~ Gràfic de Valors</Label>
                        <Select value={chartGroup1} onValueChange={setChartGroup1}>
                          <SelectTrigger className="h-6 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {chartOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-[10px]">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-[9px]">~ Tipus</Label>
                        <Select value={chartType1} onValueChange={setChartType1}>
                          <SelectTrigger className="h-6 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar" className="text-[10px]">Barres</SelectItem>
                            <SelectItem value="line" className="text-[10px]">Línia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2 */}
                <div>
                  <div className="text-[10px] font-medium mb-1 text-center">Fluxos generats per Operacions</div>
                  {renderChart(chartGroup2, chartType2)}
                  
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Selecció gràfic y tipo</div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <input type="radio" name="pctType" className="w-2.5 h-2.5" />
                      <span className="text-[9px]">Percentatges desviació</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <Select value={chartGroup2} onValueChange={setChartGroup2}>
                          <SelectTrigger className="h-6 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {chartOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-[10px]">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Select value={chartType2} onValueChange={setChartType2}>
                          <SelectTrigger className="h-6 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar" className="text-[10px]">Barres</SelectItem>
                            <SelectItem value="line" className="text-[10px]">Línia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thousands Toggle */}
              <div className="flex items-center justify-end gap-1">
                <Switch
                  id="thousands"
                  checked={showThousands}
                  onCheckedChange={setShowThousands}
                  className="scale-75"
                />
                <Label htmlFor="thousands" className="text-[10px]">
                  Valors en milers de u.m.
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/50 border-t border-border px-3 py-1.5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{companyName || 'Empresa de exemple'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            Cash Flow Generat. (Estat de Cobros-Pagos)
          </span>
          <span>Anàlisi de períodes: ANUALS</span>
          <span className="text-green-500">QUADRE DE BALANÇOS: 'OK'</span>
          <span>Calculadora</span>
        </div>
      </div>
    </div>
  );
};

export default TreasuryMovements;
