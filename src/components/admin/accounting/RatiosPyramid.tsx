import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pyramid, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatiosPyramidProps {
  companyId: string;
  companyName: string;
}

interface FinancialData {
  fiscal_year: number;
  // Balance data
  total_assets: number;
  total_current_assets: number;
  total_non_current_assets: number;
  total_equity: number;
  total_current_liabilities: number;
  total_non_current_liabilities: number;
  inventory: number;
  trade_receivables: number;
  cash_equivalents: number;
  short_term_debts: number;
  long_term_debts: number;
  // Income data
  net_turnover: number;
  operating_result: number;
  net_result: number;
  financial_expenses: number;
}

interface Ratio {
  name: string;
  value: number;
  category: 'liquidity' | 'solvency' | 'profitability' | 'efficiency';
  description: string;
  benchmark: { min: number; max: number; optimal: number };
  format: 'percentage' | 'decimal' | 'times';
}

const RatiosPyramid = ({ companyId, companyName }: RatiosPyramidProps) => {
  const [yearsData, setYearsData] = useState<FinancialData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchFinancialData();
    }
  }, [companyId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false });

      if (!statements || statements.length === 0) {
        setYearsData([]);
        setLoading(false);
        return;
      }

      const statementIds = statements.map(s => s.id);
      
      const [balanceResult, incomeResult] = await Promise.all([
        supabase.from('balance_sheets').select('*').in('statement_id', statementIds),
        supabase.from('income_statements').select('*').in('statement_id', statementIds)
      ]);

      const balanceMap = new Map(balanceResult.data?.map(b => [b.statement_id, b]) || []);
      const incomeMap = new Map(incomeResult.data?.map(i => [i.statement_id, i]) || []);

      const processedData: FinancialData[] = statements.map(stmt => {
        const b = balanceMap.get(stmt.id);
        const i = incomeMap.get(stmt.id);

        const totalNonCurrentAssets = 
          (b?.intangible_assets || 0) + (b?.goodwill || 0) + (b?.tangible_assets || 0) +
          (b?.real_estate_investments || 0) + (b?.long_term_group_investments || 0) +
          (b?.long_term_financial_investments || 0) + (b?.deferred_tax_assets || 0) +
          (b?.long_term_trade_receivables || 0);

        const totalCurrentAssets = 
          (b?.non_current_assets_held_for_sale || 0) + (b?.inventory || 0) + (b?.trade_receivables || 0) +
          (b?.short_term_group_receivables || 0) + (b?.short_term_financial_investments || 0) +
          (b?.accruals_assets || 0) + (b?.cash_equivalents || 0);

        const totalEquity = 
          (b?.share_capital || 0) + (b?.share_premium || 0) + (b?.revaluation_reserve || 0) +
          (b?.legal_reserve || 0) + (b?.statutory_reserves || 0) + (b?.voluntary_reserves || 0) -
          (b?.treasury_shares || 0) + (b?.retained_earnings || 0) + (b?.current_year_result || 0) -
          (b?.interim_dividend || 0) + (b?.other_equity_instruments || 0) + (b?.capital_grants || 0);

        const totalNonCurrentLiabilities = 
          (b?.long_term_provisions || 0) + (b?.long_term_debts || 0) + (b?.long_term_group_debts || 0) +
          (b?.deferred_tax_liabilities || 0) + (b?.long_term_accruals || 0);

        const totalCurrentLiabilities = 
          (b?.liabilities_held_for_sale || 0) + (b?.short_term_provisions || 0) +
          (b?.short_term_debts || 0) + (b?.short_term_group_debts || 0) +
          (b?.trade_payables || 0) + (b?.other_creditors || 0) + (b?.short_term_accruals || 0);

        const operatingResult = 
          (i?.net_turnover || 0) + (i?.inventory_variation || 0) + (i?.capitalized_work || 0) +
          (i?.other_operating_income || 0) + (i?.operating_grants || 0) -
          (i?.supplies || 0) - (i?.personnel_expenses || 0) - (i?.depreciation || 0) -
          (i?.impairment_trade_operations || 0) - (i?.other_operating_expenses || 0) +
          (i?.excess_provisions || 0) + (i?.other_operating_results || 0);

        const financialResult = 
          (i?.financial_income || 0) - (i?.financial_expenses || 0) +
          (i?.exchange_differences || 0) - (i?.impairment_financial_instruments || 0) +
          (i?.other_financial_results || 0);

        const netResult = operatingResult + financialResult - (i?.corporate_tax || 0) + (i?.discontinued_operations_result || 0);

        return {
          fiscal_year: stmt.fiscal_year,
          total_assets: totalNonCurrentAssets + totalCurrentAssets,
          total_current_assets: totalCurrentAssets,
          total_non_current_assets: totalNonCurrentAssets,
          total_equity: totalEquity,
          total_current_liabilities: totalCurrentLiabilities,
          total_non_current_liabilities: totalNonCurrentLiabilities,
          inventory: b?.inventory || 0,
          trade_receivables: b?.trade_receivables || 0,
          cash_equivalents: b?.cash_equivalents || 0,
          short_term_debts: b?.short_term_debts || 0,
          long_term_debts: b?.long_term_debts || 0,
          net_turnover: i?.net_turnover || 0,
          operating_result: operatingResult,
          net_result: netResult,
          financial_expenses: i?.financial_expenses || 0
        };
      });

      setYearsData(processedData);
      if (processedData.length > 0) {
        setSelectedYear(processedData[0].fiscal_year);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRatios = (data: FinancialData): Ratio[] => {
    const safeDiv = (a: number, b: number) => (b !== 0 ? a / b : 0);

    return [
      // Apex - ROE
      {
        name: 'ROE (Rendibilitat Financera)',
        value: safeDiv(data.net_result, data.total_equity) * 100,
        category: 'profitability',
        description: 'Rendibilitat dels fons propis',
        benchmark: { min: 5, max: 20, optimal: 15 },
        format: 'percentage'
      },
      // Level 2 - ROA and Leverage
      {
        name: 'ROA (Rendibilitat Econòmica)',
        value: safeDiv(data.operating_result, data.total_assets) * 100,
        category: 'profitability',
        description: 'Rendibilitat dels actius totals',
        benchmark: { min: 3, max: 15, optimal: 10 },
        format: 'percentage'
      },
      {
        name: 'Palanquejament Financer',
        value: safeDiv(data.total_assets, data.total_equity),
        category: 'solvency',
        description: 'Actius totals / Patrimoni net',
        benchmark: { min: 1, max: 3, optimal: 2 },
        format: 'times'
      },
      // Level 3 - Margin and Rotation
      {
        name: 'Marge Net',
        value: safeDiv(data.net_result, data.net_turnover) * 100,
        category: 'profitability',
        description: 'Benefici net / Vendes',
        benchmark: { min: 2, max: 15, optimal: 8 },
        format: 'percentage'
      },
      {
        name: 'Rotació d\'Actius',
        value: safeDiv(data.net_turnover, data.total_assets),
        category: 'efficiency',
        description: 'Vendes / Actius totals',
        benchmark: { min: 0.5, max: 2, optimal: 1.2 },
        format: 'times'
      },
      // Level 4 - Liquidity
      {
        name: 'Ràtio de Liquiditat',
        value: safeDiv(data.total_current_assets, data.total_current_liabilities),
        category: 'liquidity',
        description: 'Actiu corrent / Passiu corrent',
        benchmark: { min: 1, max: 2, optimal: 1.5 },
        format: 'times'
      },
      {
        name: 'Prova Àcida',
        value: safeDiv(data.total_current_assets - data.inventory, data.total_current_liabilities),
        category: 'liquidity',
        description: '(Actiu corrent - Existències) / Passiu corrent',
        benchmark: { min: 0.8, max: 1.5, optimal: 1 },
        format: 'times'
      },
      {
        name: 'Tresoreria Immediata',
        value: safeDiv(data.cash_equivalents, data.total_current_liabilities),
        category: 'liquidity',
        description: 'Efectiu / Passiu corrent',
        benchmark: { min: 0.1, max: 0.5, optimal: 0.3 },
        format: 'times'
      },
      // Level 5 - Solvency
      {
        name: 'Ràtio d\'Endeutament',
        value: safeDiv(data.total_current_liabilities + data.total_non_current_liabilities, data.total_assets) * 100,
        category: 'solvency',
        description: 'Passiu total / Actiu total',
        benchmark: { min: 30, max: 60, optimal: 45 },
        format: 'percentage'
      },
      {
        name: 'Autonomia Financera',
        value: safeDiv(data.total_equity, data.total_assets) * 100,
        category: 'solvency',
        description: 'Patrimoni net / Actiu total',
        benchmark: { min: 40, max: 70, optimal: 55 },
        format: 'percentage'
      },
      {
        name: 'Cobertura d\'Interessos',
        value: data.financial_expenses > 0 ? safeDiv(data.operating_result, data.financial_expenses) : 999,
        category: 'solvency',
        description: 'Resultat operatiu / Despeses financeres',
        benchmark: { min: 2, max: 10, optimal: 5 },
        format: 'times'
      }
    ];
  };

  const getRatioStatus = (ratio: Ratio): 'good' | 'warning' | 'danger' => {
    const { value, benchmark } = ratio;
    if (value >= benchmark.min && value <= benchmark.max) {
      if (Math.abs(value - benchmark.optimal) < (benchmark.max - benchmark.min) * 0.3) {
        return 'good';
      }
      return 'warning';
    }
    return 'danger';
  };

  const formatRatioValue = (ratio: Ratio): string => {
    switch (ratio.format) {
      case 'percentage':
        return `${ratio.value.toFixed(1)}%`;
      case 'times':
        return `${ratio.value.toFixed(2)}x`;
      default:
        return ratio.value.toFixed(2);
    }
  };

  const currentData = yearsData.find(d => d.fiscal_year === selectedYear);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregant ràtios...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Pyramid className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hi ha dades disponibles per calcular ràtios</p>
        </CardContent>
      </Card>
    );
  }

  const ratios = calculateRatios(currentData);
  const categoryColors: Record<string, string> = {
    profitability: 'bg-green-500/10 border-green-500/30 text-green-700',
    liquidity: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
    solvency: 'bg-purple-500/10 border-purple-500/30 text-purple-700',
    efficiency: 'bg-amber-500/10 border-amber-500/30 text-amber-700'
  };

  const categoryLabels: Record<string, string> = {
    profitability: 'Rendibilitat',
    liquidity: 'Liquiditat',
    solvency: 'Solvència',
    efficiency: 'Eficiència'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pyramid className="w-5 h-5 text-primary" />
            Piràmide de Ràtios Financers
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Any:</span>
            <Select value={selectedYear?.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearsData.map(y => (
                  <SelectItem key={y.fiscal_year} value={y.fiscal_year.toString()}>
                    {y.fiscal_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* ROE - Apex */}
          <div className="flex justify-center mb-6">
            <RatioCard ratio={ratios[0]} status={getRatioStatus(ratios[0])} formatValue={formatRatioValue} isApex />
          </div>

          {/* Level 2 */}
          <div className="flex justify-center gap-4 mb-6">
            <RatioCard ratio={ratios[1]} status={getRatioStatus(ratios[1])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[2]} status={getRatioStatus(ratios[2])} formatValue={formatRatioValue} />
          </div>

          {/* Level 3 */}
          <div className="flex justify-center gap-4 mb-6">
            <RatioCard ratio={ratios[3]} status={getRatioStatus(ratios[3])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[4]} status={getRatioStatus(ratios[4])} formatValue={formatRatioValue} />
          </div>

          {/* Level 4 - Liquidity */}
          <div className="flex justify-center gap-4 mb-6">
            <RatioCard ratio={ratios[5]} status={getRatioStatus(ratios[5])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[6]} status={getRatioStatus(ratios[6])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[7]} status={getRatioStatus(ratios[7])} formatValue={formatRatioValue} />
          </div>

          {/* Level 5 - Solvency */}
          <div className="flex justify-center gap-4">
            <RatioCard ratio={ratios[8]} status={getRatioStatus(ratios[8])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[9]} status={getRatioStatus(ratios[9])} formatValue={formatRatioValue} />
            <RatioCard ratio={ratios[10]} status={getRatioStatus(ratios[10])} formatValue={formatRatioValue} />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Badge key={key} variant="outline" className={categoryColors[key]}>
                {label}
              </Badge>
            ))}
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Òptim</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Acceptable</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Alerta</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface RatioCardProps {
  ratio: Ratio;
  status: 'good' | 'warning' | 'danger';
  formatValue: (ratio: Ratio) => string;
  isApex?: boolean;
}

const RatioCard = ({ ratio, status, formatValue, isApex }: RatioCardProps) => {
  const statusStyles = {
    good: 'border-green-500/50 bg-green-500/5',
    warning: 'border-amber-500/50 bg-amber-500/5',
    danger: 'border-red-500/50 bg-red-500/5'
  };

  const statusIcons = {
    good: <CheckCircle className="w-4 h-4 text-green-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    danger: <AlertTriangle className="w-4 h-4 text-red-600" />
  };

  const categoryColors: Record<string, string> = {
    profitability: 'text-green-700',
    liquidity: 'text-blue-700',
    solvency: 'text-purple-700',
    efficiency: 'text-amber-700'
  };

  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-md",
      statusStyles[status],
      isApex && "min-w-[280px]"
    )}>
      <CardContent className={cn("p-3", isApex && "p-4")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={cn(
            "font-medium text-sm leading-tight",
            categoryColors[ratio.category],
            isApex && "text-base"
          )}>
            {ratio.name}
          </span>
          {statusIcons[status]}
        </div>
        <div className={cn(
          "font-bold text-2xl",
          isApex && "text-3xl"
        )}>
          {formatValue(ratio)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{ratio.description}</p>
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Rang: {ratio.format === 'percentage' ? `${ratio.benchmark.min}% - ${ratio.benchmark.max}%` : `${ratio.benchmark.min}x - ${ratio.benchmark.max}x`}
        </div>
      </CardContent>
    </Card>
  );
};

export default RatiosPyramid;
