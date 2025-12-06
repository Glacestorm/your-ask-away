import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiYearComparisonProps {
  companyId: string;
  companyName: string;
}

interface YearData {
  fiscal_year: number;
  statement_type: string;
  status: string;
  balance: {
    total_assets: number;
    total_equity: number;
    total_non_current_liabilities: number;
    total_current_liabilities: number;
    cash_equivalents: number;
  };
  income: {
    net_turnover: number;
    operating_result: number;
    financial_result: number;
    pretax_result: number;
    net_result: number;
  };
}

const MultiYearComparison = ({ companyId, companyName }: MultiYearComparisonProps) => {
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchAllYearsData();
    }
  }, [companyId]);

  const fetchAllYearsData = async () => {
    setLoading(true);
    try {
      // Fetch all statements for this company
      const { data: statements, error: stmtError } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, statement_type, status')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false });

      if (stmtError) throw stmtError;
      if (!statements || statements.length === 0) {
        setYearsData([]);
        setLoading(false);
        return;
      }

      // Fetch balance sheets and income statements for all years
      const statementIds = statements.map(s => s.id);
      
      const [balanceResult, incomeResult] = await Promise.all([
        supabase.from('balance_sheets').select('*').in('statement_id', statementIds),
        supabase.from('income_statements').select('*').in('statement_id', statementIds)
      ]);

      const balanceMap = new Map(balanceResult.data?.map(b => [b.statement_id, b]) || []);
      const incomeMap = new Map(incomeResult.data?.map(i => [i.statement_id, i]) || []);

      const processedData: YearData[] = statements.map(stmt => {
        const balance = balanceMap.get(stmt.id);
        const income = incomeMap.get(stmt.id);

        const totalNonCurrentAssets = 
          (balance?.intangible_assets || 0) + (balance?.goodwill || 0) + (balance?.tangible_assets || 0) +
          (balance?.real_estate_investments || 0) + (balance?.long_term_group_investments || 0) +
          (balance?.long_term_financial_investments || 0) + (balance?.deferred_tax_assets || 0) +
          (balance?.long_term_trade_receivables || 0);

        const totalCurrentAssets = 
          (balance?.non_current_assets_held_for_sale || 0) + (balance?.inventory || 0) + (balance?.trade_receivables || 0) +
          (balance?.short_term_group_receivables || 0) + (balance?.short_term_financial_investments || 0) +
          (balance?.accruals_assets || 0) + (balance?.cash_equivalents || 0);

        const totalEquity = 
          (balance?.share_capital || 0) + (balance?.share_premium || 0) + (balance?.revaluation_reserve || 0) +
          (balance?.legal_reserve || 0) + (balance?.statutory_reserves || 0) + (balance?.voluntary_reserves || 0) -
          (balance?.treasury_shares || 0) + (balance?.retained_earnings || 0) + (balance?.current_year_result || 0) -
          (balance?.interim_dividend || 0) + (balance?.other_equity_instruments || 0) + (balance?.capital_grants || 0);

        const totalNonCurrentLiabilities = 
          (balance?.long_term_provisions || 0) + (balance?.long_term_debts || 0) + (balance?.long_term_group_debts || 0) +
          (balance?.deferred_tax_liabilities || 0) + (balance?.long_term_accruals || 0);

        const totalCurrentLiabilities = 
          (balance?.liabilities_held_for_sale || 0) + (balance?.short_term_provisions || 0) +
          (balance?.short_term_debts || 0) + (balance?.short_term_group_debts || 0) +
          (balance?.trade_payables || 0) + (balance?.other_creditors || 0) + (balance?.short_term_accruals || 0);

        const operatingResult = 
          (income?.net_turnover || 0) + (income?.inventory_variation || 0) + (income?.capitalized_work || 0) +
          (income?.other_operating_income || 0) + (income?.operating_grants || 0) -
          (income?.supplies || 0) - (income?.personnel_expenses || 0) - (income?.depreciation || 0) -
          (income?.impairment_trade_operations || 0) - (income?.other_operating_expenses || 0) +
          (income?.excess_provisions || 0) + (income?.other_operating_results || 0);

        const financialResult = 
          (income?.financial_income || 0) - (income?.financial_expenses || 0) +
          (income?.exchange_differences || 0) - (income?.impairment_financial_instruments || 0) +
          (income?.other_financial_results || 0);

        const pretaxResult = operatingResult + financialResult;
        const netResult = pretaxResult - (income?.corporate_tax || 0) + (income?.discontinued_operations_result || 0);

        return {
          fiscal_year: stmt.fiscal_year,
          statement_type: stmt.statement_type,
          status: stmt.status,
          balance: {
            total_assets: totalNonCurrentAssets + totalCurrentAssets,
            total_equity: totalEquity,
            total_non_current_liabilities: totalNonCurrentLiabilities,
            total_current_liabilities: totalCurrentLiabilities,
            cash_equivalents: balance?.cash_equivalents || 0
          },
          income: {
            net_turnover: income?.net_turnover || 0,
            operating_result: operatingResult,
            financial_result: financialResult,
            pretax_result: pretaxResult,
            net_result: netResult
          }
        };
      });

      setYearsData(processedData);
    } catch (error) {
      console.error('Error fetching multi-year data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const calculateVariation = (current: number, previous: number): { value: number; percentage: number } | null => {
    if (previous === 0) return current !== 0 ? { value: current, percentage: 100 } : null;
    const variation = current - previous;
    const percentage = (variation / Math.abs(previous)) * 100;
    return { value: variation, percentage };
  };

  const renderVariation = (current: number, previous: number | undefined) => {
    if (previous === undefined) return null;
    const variation = calculateVariation(current, previous);
    if (!variation) return <Minus className="w-4 h-4 text-muted-foreground" />;

    const isPositive = variation.percentage > 0;
    const isNegative = variation.percentage < 0;

    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        {isPositive && <TrendingUp className="w-3 h-3" />}
        {isNegative && <TrendingDown className="w-3 h-3" />}
        <span>{isPositive && '+'}{variation.percentage.toFixed(1)}%</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      submitted: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      approved: 'bg-green-500/10 text-green-600 border-green-500/30'
    };
    return <Badge variant="outline" className={styles[status] || ''}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregant dades...</p>
        </CardContent>
      </Card>
    );
  }

  if (yearsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hi ha estats financers disponibles per a aquesta empresa</p>
        </CardContent>
      </Card>
    );
  }

  const balanceRows = [
    { label: 'Total Actiu', key: 'total_assets' },
    { label: 'Patrimoni Net', key: 'total_equity' },
    { label: 'Passiu No Corrent', key: 'total_non_current_liabilities' },
    { label: 'Passiu Corrent', key: 'total_current_liabilities' },
    { label: 'Efectiu', key: 'cash_equivalents' }
  ];

  const incomeRows = [
    { label: 'Ingressos Nets', key: 'net_turnover' },
    { label: 'Resultat Operatiu', key: 'operating_result' },
    { label: 'Resultat Financer', key: 'financial_result' },
    { label: 'Resultat Abans Impostos', key: 'pretax_result' },
    { label: 'Resultat Net', key: 'net_result' }
  ];

  return (
    <div className="space-y-6">
      {/* Balance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Balanç - Comparativa Plurianual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Concepte</TableHead>
                  {yearsData.map((year, idx) => (
                    <TableHead key={year.fiscal_year} className="text-right min-w-[150px]">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold">{year.fiscal_year}</span>
                        {getStatusBadge(year.status)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceRows.map(row => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {yearsData.map((year, idx) => {
                      const value = year.balance[row.key as keyof typeof year.balance];
                      const previousValue = yearsData[idx + 1]?.balance[row.key as keyof typeof year.balance];
                      return (
                        <TableCell key={year.fiscal_year} className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span>{formatCurrency(value)}</span>
                            {renderVariation(value, previousValue)}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Income Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compte de Resultats - Comparativa Plurianual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Concepte</TableHead>
                  {yearsData.map(year => (
                    <TableHead key={year.fiscal_year} className="text-right min-w-[150px]">
                      <span className="font-bold">{year.fiscal_year}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeRows.map(row => (
                  <TableRow key={row.key} className={row.key === 'net_result' ? 'bg-primary/5 font-bold' : ''}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {yearsData.map((year, idx) => {
                      const value = year.income[row.key as keyof typeof year.income];
                      const previousValue = yearsData[idx + 1]?.income[row.key as keyof typeof year.income];
                      return (
                        <TableCell key={year.fiscal_year} className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={value < 0 ? 'text-red-600' : ''}>{formatCurrency(value)}</span>
                            {renderVariation(value, previousValue)}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiYearComparison;
