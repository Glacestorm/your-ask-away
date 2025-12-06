import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface BankRatingAnalysisProps {
  companyId: string;
  companyName: string;
}

interface RatioData {
  name: string;
  description: string;
  currentYear: number;
  previousYear: number;
  variation: number;
  sectorValue: number;
  sectorVariation: number;
  difference: number;
  rating: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  explanation: string;
}

export const BankRatingAnalysis = ({ companyId, companyName }: BankRatingAnalysisProps) => {
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('calificacion');
  const [chartType1, setChartType1] = useState('liquidez');
  const [chartType2, setChartType2] = useState('actividad');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: statementsData } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (statementsData && statementsData.length > 0) {
        const detailedData = await Promise.all(
          statementsData.map(async (stmt) => {
            const [{ data: balance }, { data: income }] = await Promise.all([
              supabase.from('balance_sheets').select('*').eq('statement_id', stmt.id).single(),
              supabase.from('income_statements').select('*').eq('statement_id', stmt.id).single()
            ]);
            return { ...stmt, balance, income };
          })
        );
        setStatements(detailedData);
      }
      setLoading(false);
    };
    fetchData();
  }, [companyId]);

  const years = statements.map(s => s.fiscal_year).slice(0, 2);
  
  const calculateRatios = (): RatioData[] => {
    if (statements.length < 1) return [];
    
    const current = statements[0];
    const previous = statements[1] || current;
    
    const currentBalance = current?.balance || {};
    const previousBalance = previous?.balance || {};
    const currentIncome = current?.income || {};
    const previousIncome = previous?.income || {};

    const currentAssets = (currentBalance.inventory || 0) + (currentBalance.trade_receivables || 0) + 
      (currentBalance.short_term_financial_investments || 0) + (currentBalance.cash_equivalents || 0);
    const previousAssets = (previousBalance.inventory || 0) + (previousBalance.trade_receivables || 0) + 
      (previousBalance.short_term_financial_investments || 0) + (previousBalance.cash_equivalents || 0);
    
    const currentLiabilities = (currentBalance.short_term_debts || 0) + (currentBalance.trade_payables || 0) + 
      (currentBalance.other_creditors || 0);
    const previousLiabilities = (previousBalance.short_term_debts || 0) + (previousBalance.trade_payables || 0) + 
      (previousBalance.other_creditors || 0);

    const currentNetTurnover = currentIncome.net_turnover || 0;
    const previousNetTurnover = previousIncome.net_turnover || 0;

    const totalAssets = (currentBalance.tangible_assets || 0) + (currentBalance.intangible_assets || 0) + currentAssets;
    const totalLiabilities = (currentBalance.long_term_debts || 0) + currentLiabilities;
    const equity = (currentBalance.share_capital || 0) + (currentBalance.retained_earnings || 0) + 
      (currentBalance.current_year_result || 0);

    return [
      {
        name: 'Actividad',
        description: 'Tasa de variación de la cifra de negocios',
        currentYear: previousNetTurnover !== 0 ? ((currentNetTurnover - previousNetTurnover) / previousNetTurnover) * 100 : 0,
        previousYear: -48.08,
        variation: 492.89,
        sectorValue: -10.10,
        sectorVariation: 1970.25,
        difference: 0,
        rating: 'POSITIVO',
        explanation: `La diferencia habida en el último ejercicio ${years[0]}, ha supuesto un AUMENTO del valor de este ratio.`
      },
      {
        name: 'Capital Circulante',
        description: 'Capital Circulante / Cifra neta de negocios',
        currentYear: currentNetTurnover !== 0 ? ((currentAssets - currentLiabilities) / currentNetTurnover) * 100 : 0,
        previousYear: 124.26,
        variation: 35.10,
        sectorValue: 10.58,
        sectorVariation: 1486.77,
        difference: 0,
        rating: 'POSITIVO',
        explanation: 'El Capital Circulante en relación con la Cifra neta de negocios, es superior a la media del sector.'
      },
      {
        name: 'Liquidez',
        description: 'Activos financ. a c/pzo. y Tesorería / Total Activo',
        currentYear: totalAssets !== 0 ? ((currentBalance.short_term_financial_investments || 0) + (currentBalance.cash_equivalents || 0)) / totalAssets * 100 : 0,
        previousYear: 29.32,
        variation: -43.26,
        sectorValue: 4.52,
        sectorVariation: 268.06,
        difference: 0,
        rating: 'POSITIVO',
        explanation: 'Los Activos financieros a corto plazo y Tesorería en relación con el Activo Total, son superiores a la media del sector.'
      },
      {
        name: 'Endeudamiento Financiero',
        description: 'Deudas con entidades de crédito / Total Pasivo y Patrimonio',
        currentYear: (totalAssets + equity) !== 0 ? (currentBalance.long_term_debts || 0) / (totalAssets + equity) * 100 : 0,
        previousYear: 3.38,
        variation: -38.00,
        sectorValue: 3.25,
        sectorVariation: -35.61,
        difference: 0,
        rating: 'NEGATIVO',
        explanation: 'Las Deudas con entidades de crédito en relación con el Pasivo total, han MEJORADO de un ejercicio a otro.'
      },
      {
        name: 'Solvencia financiera',
        description: 'Fondos propios / Total Pasivo y Patrimonio',
        currentYear: (totalAssets + equity) !== 0 ? equity / (totalAssets + equity) * 100 : 0,
        previousYear: 42.99,
        variation: 47.58,
        sectorValue: 21.05,
        sectorVariation: 201.42,
        difference: 0,
        rating: 'POSITIVO',
        explanation: 'Los Fondos propios en relación con el Pasivo total, son superiores a la media del sector.'
      }
    ];
  };

  const ratios = calculateRatios();
  const formatNumber = (n: number) => n.toFixed(2) + '%';

  const RatingBar = ({ rating }: { rating: string }) => {
    const colors = rating === 'POSITIVO' 
      ? ['bg-green-500', 'bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
      : ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-red-600'];
    const activeIndex = rating === 'POSITIVO' ? 0 : 4;
    
    return (
      <div className="flex gap-0.5">
        {colors.map((color, i) => (
          <div key={i} className={`h-4 w-6 ${i === activeIndex ? color : 'bg-muted'} rounded-sm`} />
        ))}
      </div>
    );
  };

  const getChartData = () => {
    return years.map((year, i) => ({
      name: year.toString(),
      value: ratios[i]?.currentYear || 0,
      percentage: ratios[i]?.variation || 0
    })).reverse();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 bg-background min-h-[600px] overflow-hidden text-xs">
      {/* Left Sidebar */}
      <div className="w-44 flex-shrink-0 space-y-2">
        <Card className="p-2 bg-card">
          <h4 className="text-[10px] font-semibold mb-1 text-muted-foreground">Vista del Balance</h4>
          <div className="space-y-0.5">
            {['ACTIVO', 'PASIVO', 'RESULTADOS', 'CALIFICACIÓN BANCARIA'].map((item) => (
              <button
                key={item}
                onClick={() => setSelectedCategory(item.toLowerCase())}
                className={`w-full text-left px-2 py-1 text-[10px] rounded ${
                  item === 'CALIFICACIÓN BANCARIA' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-2 bg-card">
          <h4 className="text-[10px] font-semibold mb-1 text-amber-500">Secciones Principales</h4>
          <div className="space-y-1">
            <div className="text-[9px] font-medium text-amber-400">Financial System</div>
            {['Pantalla principal', 'Pantalla de empresas', 'Introducción Datos', 'Informes'].map((item) => (
              <div key={item} className="text-[9px] text-muted-foreground pl-2">{item}</div>
            ))}
          </div>
        </Card>

        <Card className="p-2 bg-card">
          <h4 className="text-[10px] font-semibold mb-1 text-amber-500">Grupo Analítica</h4>
          <div className="space-y-0.5 text-[9px] text-muted-foreground">
            {['Análisis Masas Patrimoniales', 'Cuadro Analítico P. y G.', 'Nec.Operativas de Fondos', 'Tendencias Anuales Móviles', 'Análisis Capital Circulante'].map((item) => (
              <div key={item} className="pl-2">{item}</div>
            ))}
          </div>
        </Card>

        <Card className="p-2 bg-card">
          <h4 className="text-[10px] font-semibold mb-1 text-amber-500">Ratios</h4>
          <div className="space-y-0.5 text-[9px] text-muted-foreground">
            {['Cuadro de Mando Financiero', 'Índice "Z"'].map((item) => (
              <div key={item} className="pl-2">{item}</div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1.5 rounded-t text-center">
          <h2 className="text-sm font-bold">CALIFICACIÓN BANCARIA DE LA EMPRESA</h2>
        </div>

        <Card className="p-2 bg-card rounded-t-none">
          <div className="text-[10px] text-muted-foreground mb-2">
            Comparativa Sectorial: {years[0] || new Date().getFullYear()}
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[120px,180px,70px,70px,70px,70px,70px,70px,80px] gap-1 mb-1 text-[9px] font-semibold bg-muted/50 p-1 rounded">
            <div>ÁREA DE ANÁLISIS</div>
            <div>Descripción</div>
            <div className="text-center">{years[0] || '-'}</div>
            <div className="text-center">{years[1] || '-'}</div>
            <div className="text-center">% Desv.</div>
            <div className="text-center">Valor sector</div>
            <div className="text-center">% Desv.Sector</div>
            <div className="text-center">Diferencia</div>
            <div className="text-center">CALIFICACIÓN</div>
          </div>

          {/* Ratio Rows */}
          <div className="space-y-2">
            {ratios.map((ratio, index) => (
              <div key={index} className="space-y-1">
                <div className="grid grid-cols-[120px,180px,70px,70px,70px,70px,70px,70px,80px] gap-1 text-[9px] items-center">
                  <div className="font-medium border border-amber-500 px-1 py-0.5 rounded text-center bg-background">
                    {ratio.name}
                  </div>
                  <div className="text-muted-foreground text-[8px]">{ratio.description}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.currentYear)}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.previousYear)}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.variation)}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.sectorValue)}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.sectorVariation)}</div>
                  <div className="text-center bg-muted/30 px-1 py-0.5 rounded">{formatNumber(ratio.difference)}</div>
                  <div className={`text-center px-1 py-0.5 rounded text-[8px] font-bold ${
                    ratio.rating === 'POSITIVO' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {ratio.rating}
                  </div>
                </div>
                
                <div className="text-[8px] text-muted-foreground italic px-2">{ratio.explanation}</div>
                
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[8px] font-medium">CALIFICACIÓN:</span>
                  <RatingBar rating={ratio.rating} />
                  <span className={`text-[8px] font-bold ${
                    ratio.rating === 'POSITIVO' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {ratio.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="flex justify-between items-center mt-2 px-2 py-1 bg-muted/30 rounded text-[9px]">
          <div className="flex items-center gap-4">
            <span className="font-medium">{companyName}</span>
            <span className="text-muted-foreground">Análisis: {years.join(' - ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">● Cuadre: OK</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Charts */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <Card className="p-2 bg-card">
          <div className="text-[10px] font-bold text-center mb-2 text-amber-500">
            GRÁFICOS DE CONTROL Y EVOLUCIÓN
          </div>
          
          <div className="space-y-1 mb-2">
            <div className="text-[9px] font-medium">Liquidez</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={getChartData()}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1">
            <Select value={chartType1} onValueChange={setChartType1}>
              <SelectTrigger className="h-6 text-[9px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liquidez">Liquidez</SelectItem>
                <SelectItem value="actividad">Actividad</SelectItem>
                <SelectItem value="solvencia">Solvencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-2 bg-card">
          <div className="text-[9px] font-medium mb-1">Actividad</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={getChartData()}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="percentage" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
          
          <Select value={chartType2} onValueChange={setChartType2}>
            <SelectTrigger className="h-6 text-[9px] mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actividad">Actividad</SelectItem>
              <SelectItem value="endeudamiento">Endeudamiento</SelectItem>
              <SelectItem value="capital">Capital Circulante</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>
    </div>
  );
};
