import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, TrendingUp, TrendingDown, Building2, Wallet, ChevronRight, ChevronDown } from 'lucide-react';
import { useOptimisticLock } from '@/hooks/useOptimisticLock';
import { ConflictDialog } from '@/components/ui/ConflictDialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface BalanceSheetFormProps {
  statementId: string;
  isLocked: boolean;
  fiscalYear: number;
  companyId?: string;
}

interface BalanceSheetData {
  id?: string;
  statement_id: string;
  fiscal_year?: number;
  intangible_assets: number;
  goodwill: number;
  tangible_assets: number;
  real_estate_investments: number;
  long_term_group_investments: number;
  long_term_financial_investments: number;
  deferred_tax_assets: number;
  long_term_trade_receivables: number;
  non_current_assets_held_for_sale: number;
  inventory: number;
  trade_receivables: number;
  short_term_group_receivables: number;
  short_term_financial_investments: number;
  accruals_assets: number;
  cash_equivalents: number;
  share_capital: number;
  share_premium: number;
  revaluation_reserve: number;
  legal_reserve: number;
  statutory_reserves: number;
  voluntary_reserves: number;
  treasury_shares: number;
  retained_earnings: number;
  current_year_result: number;
  interim_dividend: number;
  other_equity_instruments: number;
  available_for_sale_assets_adjustment: number;
  hedging_operations_adjustment: number;
  translation_differences: number;
  other_value_adjustments: number;
  capital_grants: number;
  long_term_provisions: number;
  long_term_debts: number;
  long_term_group_debts: number;
  deferred_tax_liabilities: number;
  long_term_accruals: number;
  liabilities_held_for_sale: number;
  short_term_provisions: number;
  short_term_debts: number;
  short_term_group_debts: number;
  trade_payables: number;
  other_creditors: number;
  short_term_accruals: number;
  updated_at?: string;
}

const defaultData: Omit<BalanceSheetData, 'id' | 'statement_id' | 'fiscal_year' | 'updated_at'> = {
  intangible_assets: 0, goodwill: 0, tangible_assets: 0, real_estate_investments: 0,
  long_term_group_investments: 0, long_term_financial_investments: 0, deferred_tax_assets: 0,
  long_term_trade_receivables: 0, non_current_assets_held_for_sale: 0, inventory: 0,
  trade_receivables: 0, short_term_group_receivables: 0, short_term_financial_investments: 0,
  accruals_assets: 0, cash_equivalents: 0, share_capital: 0, share_premium: 0,
  revaluation_reserve: 0, legal_reserve: 0, statutory_reserves: 0, voluntary_reserves: 0,
  treasury_shares: 0, retained_earnings: 0, current_year_result: 0, interim_dividend: 0,
  other_equity_instruments: 0, available_for_sale_assets_adjustment: 0,
  hedging_operations_adjustment: 0, translation_differences: 0, other_value_adjustments: 0,
  capital_grants: 0, long_term_provisions: 0, long_term_debts: 0, long_term_group_debts: 0,
  deferred_tax_liabilities: 0, long_term_accruals: 0, liabilities_held_for_sale: 0,
  short_term_provisions: 0, short_term_debts: 0, short_term_group_debts: 0,
  trade_payables: 0, other_creditors: 0, short_term_accruals: 0
};

type BalanceSheetField = keyof Omit<BalanceSheetData, 'id' | 'statement_id' | 'fiscal_year' | 'updated_at'>;

interface YearData {
  year: number;
  statementId: string | null;
  data: BalanceSheetData;
}

const BalanceSheetForm = ({ statementId, isLocked, fiscalYear, companyId }: BalanceSheetFormProps) => {
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'non-current-assets': true,
    'current-assets': true,
    'equity': true,
    'non-current-liab': true,
    'current-liab': true,
  });
  
  const { updateWithLock, forceUpdate, reloadRecord, conflict, isUpdating } = useOptimisticLock({ table: 'balance_sheets' });

  // Generate 5 years array (current + 4 previous)
  const years = useMemo(() => {
    const result = [];
    for (let i = 0; i < 5; i++) {
      result.push(fiscalYear - i);
    }
    return result;
  }, [fiscalYear]);

  useEffect(() => {
    if (companyId) {
      fetchAllYearsData();
    } else {
      fetchSingleYearData();
    }
  }, [statementId, companyId, fiscalYear]);

  const fetchSingleYearData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('balance_sheets')
        .select('*')
        .eq('statement_id', statementId)
        .maybeSingle();
      
      if (error) throw error;
      
      const yearData: YearData = {
        year: fiscalYear,
        statementId,
        data: result ? (result as BalanceSheetData) : { ...defaultData, statement_id: statementId }
      };
      
      setYearsData([yearData]);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      toast.error('Error carregant balanç');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllYearsData = async () => {
    try {
      // Fetch all statements for the company
      const { data: statements, error: stmtError } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .in('fiscal_year', years)
        .order('fiscal_year', { ascending: false });

      if (stmtError) throw stmtError;

      // Get statement IDs
      const stmtIds = statements?.map(s => s.id) || [];
      
      // Fetch all balance sheets for these statements
      let balanceSheets: BalanceSheetData[] = [];
      if (stmtIds.length > 0) {
        const { data: bsData, error: bsError } = await supabase
          .from('balance_sheets')
          .select('*')
          .in('statement_id', stmtIds);
        
        if (bsError) throw bsError;
        balanceSheets = (bsData || []) as BalanceSheetData[];
      }

      // Map years to data
      const result: YearData[] = years.map(year => {
        const stmt = statements?.find(s => s.fiscal_year === year);
        const bs = stmt ? balanceSheets.find(b => b.statement_id === stmt.id) : null;
        
        return {
          year,
          statementId: stmt?.id || null,
          data: bs || { ...defaultData, statement_id: stmt?.id || '' }
        };
      });

      setYearsData(result);
    } catch (error) {
      console.error('Error fetching balance sheets:', error);
      toast.error('Error carregant balanços');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (yearIndex: number, field: BalanceSheetField, value: string) => {
    const numValue = parseFloat(value) || 0;
    setYearsData(prev => {
      const updated = [...prev];
      updated[yearIndex] = {
        ...updated[yearIndex],
        data: { ...updated[yearIndex].data, [field]: numValue }
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentYearData = yearsData.find(y => y.year === fiscalYear);
      if (!currentYearData) return;

      const data = currentYearData.data;
      
      if (data.id) {
        const result = await updateWithLock(
          data.id,
          { ...data, statement_id: currentYearData.statementId || statementId },
          new Date(data.updated_at || Date.now())
        );
        
        if (!result.success) {
          if (result.conflict) {
            setShowConflictDialog(true);
            return;
          }
          throw new Error('Error updating balance sheet');
        }
        
        setYearsData(prev => prev.map(y => 
          y.year === fiscalYear 
            ? { ...y, data: result.data as unknown as BalanceSheetData }
            : y
        ));
      } else {
        const { error } = await supabase
          .from('balance_sheets')
          .upsert({ ...data, statement_id: currentYearData.statementId || statementId }, { onConflict: 'statement_id' });
        
        if (error) throw error;
      }
      toast.success('Balanç guardat correctament');
    } catch (error) {
      console.error('Error saving balance sheet:', error);
      toast.error('Error guardant balanç');
    } finally {
      setSaving(false);
    }
  };

  const handleReloadData = async () => {
    const currentYearData = yearsData.find(y => y.year === fiscalYear);
    if (currentYearData?.data.id) {
      const reloaded = await reloadRecord(currentYearData.data.id);
      if (reloaded) {
        setYearsData(prev => prev.map(y => 
          y.year === fiscalYear 
            ? { ...y, data: reloaded as unknown as BalanceSheetData }
            : y
        ));
        setShowConflictDialog(false);
        toast.success('Dades recarregades correctament');
      }
    }
  };

  const handleForceUpdate = async () => {
    const currentYearData = yearsData.find(y => y.year === fiscalYear);
    if (currentYearData?.data.id && conflict) {
      const result = await forceUpdate(currentYearData.data.id, conflict.attemptedData);
      if (result.success) {
        setYearsData(prev => prev.map(y => 
          y.year === fiscalYear 
            ? { ...y, data: result.data as unknown as BalanceSheetData }
            : y
        ));
        setShowConflictDialog(false);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate totals for each year
  const calculateTotals = (data: BalanceSheetData) => {
    const totalNonCurrentAssets = 
      (data.intangible_assets || 0) + (data.goodwill || 0) + (data.tangible_assets || 0) +
      (data.real_estate_investments || 0) + (data.long_term_group_investments || 0) +
      (data.long_term_financial_investments || 0) + (data.deferred_tax_assets || 0) +
      (data.long_term_trade_receivables || 0);

    const totalCurrentAssets = 
      (data.non_current_assets_held_for_sale || 0) + (data.inventory || 0) + (data.trade_receivables || 0) +
      (data.short_term_group_receivables || 0) + (data.short_term_financial_investments || 0) +
      (data.accruals_assets || 0) + (data.cash_equivalents || 0);

    const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

    const totalEquity = 
      (data.share_capital || 0) + (data.share_premium || 0) + (data.revaluation_reserve || 0) +
      (data.legal_reserve || 0) + (data.statutory_reserves || 0) + (data.voluntary_reserves || 0) -
      (data.treasury_shares || 0) + (data.retained_earnings || 0) + (data.current_year_result || 0) -
      (data.interim_dividend || 0) + (data.other_equity_instruments || 0) + (data.capital_grants || 0);

    const totalNonCurrentLiabilities = 
      (data.long_term_provisions || 0) + (data.long_term_debts || 0) + (data.long_term_group_debts || 0) +
      (data.deferred_tax_liabilities || 0) + (data.long_term_accruals || 0);

    const totalCurrentLiabilities = 
      (data.liabilities_held_for_sale || 0) + (data.short_term_provisions || 0) +
      (data.short_term_debts || 0) + (data.short_term_group_debts || 0) +
      (data.trade_payables || 0) + (data.other_creditors || 0) + (data.short_term_accruals || 0);

    const totalEquityAndLiabilities = totalEquity + totalNonCurrentLiabilities + totalCurrentLiabilities;

    return {
      totalNonCurrentAssets,
      totalCurrentAssets,
      totalAssets,
      totalEquity,
      totalNonCurrentLiabilities,
      totalCurrentLiabilities,
      totalEquityAndLiabilities,
      isBalanced: Math.abs(totalAssets - totalEquityAndLiabilities) < 0.01
    };
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const formatVariation = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? '0.00%' : '∞';
    const variation = ((current - previous) / Math.abs(previous)) * 100;
    return `${variation >= 0 ? '+' : ''}${variation.toFixed(2)}%`;
  };

  // Get current year index for editing
  const currentYearIndex = yearsData.findIndex(y => y.year === fiscalYear);

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </CardContent></Card>
    );
  }

  // Check balance for current year
  const currentYearTotals = currentYearIndex >= 0 ? calculateTotals(yearsData[currentYearIndex].data) : null;

  // Row definition for the table
  interface RowDef {
    label: string;
    field?: BalanceSheetField;
    isSection?: boolean;
    sectionKey?: string;
    isTotal?: boolean;
    isMajorTotal?: boolean;
    indent?: number;
    totalFn?: (data: BalanceSheetData) => number;
    className?: string;
  }

  const assetRows: RowDef[] = [
    { label: 'A) ACTIU NO CORRENT', isSection: true, sectionKey: 'non-current-assets', totalFn: d => calculateTotals(d).totalNonCurrentAssets },
    { label: 'I. Immobilitzat intangible', field: 'intangible_assets', indent: 1 },
    { label: 'II. Fons de comerç', field: 'goodwill', indent: 1 },
    { label: 'III. Immobilitzat material', field: 'tangible_assets', indent: 1 },
    { label: 'IV. Inversions immobiliàries', field: 'real_estate_investments', indent: 1 },
    { label: 'V. Inversions en empreses del grup ll/t', field: 'long_term_group_investments', indent: 1 },
    { label: 'VI. Inversions financeres a llarg termini', field: 'long_term_financial_investments', indent: 1 },
    { label: 'VII. Actius per impost diferit', field: 'deferred_tax_assets', indent: 1 },
    { label: 'VIII. Deutors comercials no corrents', field: 'long_term_trade_receivables', indent: 1 },
    { label: 'B) ACTIU CORRENT', isSection: true, sectionKey: 'current-assets', totalFn: d => calculateTotals(d).totalCurrentAssets },
    { label: 'I. Actius no corrents per a la venda', field: 'non_current_assets_held_for_sale', indent: 1 },
    { label: 'II. Existències', field: 'inventory', indent: 1 },
    { label: 'III. Deutors comercials', field: 'trade_receivables', indent: 1 },
    { label: 'IV. Inversions en empreses del grup c/t', field: 'short_term_group_receivables', indent: 1 },
    { label: 'V. Inversions financeres a curt termini', field: 'short_term_financial_investments', indent: 1 },
    { label: 'VI. Periodificacions a curt termini', field: 'accruals_assets', indent: 1 },
    { label: 'VII. Efectiu i equivalents', field: 'cash_equivalents', indent: 1 },
    { label: 'TOTAL ACTIU', isMajorTotal: true, totalFn: d => calculateTotals(d).totalAssets, className: 'bg-primary/10 font-bold' },
  ];

  const liabilityRows: RowDef[] = [
    { label: 'A) PATRIMONI NET', isSection: true, sectionKey: 'equity', totalFn: d => calculateTotals(d).totalEquity },
    { label: 'I. Capital social', field: 'share_capital', indent: 1 },
    { label: 'II. Prima d\'emissió', field: 'share_premium', indent: 1 },
    { label: 'III. Reserves de revaloració', field: 'revaluation_reserve', indent: 1 },
    { label: 'IV. Reserva legal', field: 'legal_reserve', indent: 1 },
    { label: 'V. Reserves estatutàries', field: 'statutory_reserves', indent: 1 },
    { label: 'VI. Reserves voluntàries', field: 'voluntary_reserves', indent: 1 },
    { label: 'VII. Accions pròpies (-)', field: 'treasury_shares', indent: 1 },
    { label: 'VIII. Resultats d\'exercicis anteriors', field: 'retained_earnings', indent: 1 },
    { label: 'IX. Resultat de l\'exercici', field: 'current_year_result', indent: 1 },
    { label: 'X. Dividend a compte (-)', field: 'interim_dividend', indent: 1 },
    { label: 'XI. Altres instruments de patrimoni', field: 'other_equity_instruments', indent: 1 },
    { label: 'XII. Subvencions de capital', field: 'capital_grants', indent: 1 },
    { label: 'B) PASSIU NO CORRENT', isSection: true, sectionKey: 'non-current-liab', totalFn: d => calculateTotals(d).totalNonCurrentLiabilities },
    { label: 'I. Provisions a llarg termini', field: 'long_term_provisions', indent: 1 },
    { label: 'II. Deutes a llarg termini', field: 'long_term_debts', indent: 1 },
    { label: 'III. Deutes amb empreses del grup ll/t', field: 'long_term_group_debts', indent: 1 },
    { label: 'IV. Passius per impost diferit', field: 'deferred_tax_liabilities', indent: 1 },
    { label: 'V. Periodificacions a llarg termini', field: 'long_term_accruals', indent: 1 },
    { label: 'C) PASSIU CORRENT', isSection: true, sectionKey: 'current-liab', totalFn: d => calculateTotals(d).totalCurrentLiabilities },
    { label: 'I. Passius per a la venda', field: 'liabilities_held_for_sale', indent: 1 },
    { label: 'II. Provisions a curt termini', field: 'short_term_provisions', indent: 1 },
    { label: 'III. Deutes a curt termini', field: 'short_term_debts', indent: 1 },
    { label: 'IV. Deutes amb empreses del grup c/t', field: 'short_term_group_debts', indent: 1 },
    { label: 'V. Creditors comercials', field: 'trade_payables', indent: 1 },
    { label: 'VI. Altres creditors', field: 'other_creditors', indent: 1 },
    { label: 'VII. Periodificacions a curt termini', field: 'short_term_accruals', indent: 1 },
    { label: 'TOTAL PATRIMONI NET I PASSIU', isMajorTotal: true, totalFn: d => calculateTotals(d).totalEquityAndLiabilities, className: 'bg-primary/10 font-bold' },
  ];

  const renderTableSection = (rows: RowDef[], title: string, icon: React.ReactNode) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 text-left p-3 min-w-[280px] font-semibold">
                    CONCEPTES
                  </th>
                  {yearsData.map((yd, idx) => (
                    <th key={yd.year} className="text-right p-3 min-w-[120px] font-semibold">
                      <div className="flex flex-col items-end">
                        <span>Desembre</span>
                        <span className="text-primary">{yd.year}</span>
                        {idx === 0 && (
                          <span className="text-xs text-muted-foreground">(actual)</span>
                        )}
                      </div>
                    </th>
                  ))}
                  {yearsData.length > 1 && (
                    <th className="text-right p-3 min-w-[100px] font-semibold text-muted-foreground">
                      Var. %
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  // Check if this row's section is collapsed
                  if (row.indent && rowIdx > 0) {
                    // Find the parent section
                    let parentSection = '';
                    for (let i = rowIdx - 1; i >= 0; i--) {
                      if (rows[i].isSection && rows[i].sectionKey) {
                        parentSection = rows[i].sectionKey!;
                        break;
                      }
                    }
                    if (parentSection && !expandedSections[parentSection]) {
                      return null;
                    }
                  }

                  return (
                    <tr 
                      key={rowIdx} 
                      className={cn(
                        'border-b hover:bg-muted/30 transition-colors',
                        row.isSection && 'bg-muted/20 font-semibold cursor-pointer',
                        row.isMajorTotal && row.className
                      )}
                      onClick={() => row.isSection && row.sectionKey && toggleSection(row.sectionKey)}
                    >
                      <td 
                        className={cn(
                          'sticky left-0 z-10 p-3 bg-background',
                          row.isSection && 'bg-muted/20',
                          row.isMajorTotal && 'bg-primary/10'
                        )}
                        style={{ paddingLeft: row.indent ? `${row.indent * 1.5 + 0.75}rem` : undefined }}
                      >
                        <div className="flex items-center gap-2">
                          {row.isSection && row.sectionKey && (
                            expandedSections[row.sectionKey] 
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                          )}
                          <span className={cn(row.isMajorTotal && 'text-primary')}>{row.label}</span>
                        </div>
                      </td>
                      {yearsData.map((yd, yearIdx) => {
                        const value = row.field 
                          ? (yd.data[row.field] || 0)
                          : row.totalFn 
                            ? row.totalFn(yd.data)
                            : 0;
                        
                        const isEditable = row.field && yearIdx === 0 && !isLocked;
                        
                        return (
                          <td key={yd.year} className="text-right p-2">
                            {isEditable ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={value || ''}
                                onChange={(e) => handleChange(yearIdx, row.field!, e.target.value)}
                                className="w-full text-right h-8 px-2"
                                placeholder="0.00"
                              />
                            ) : (
                              <span className={cn(
                                'font-mono text-sm',
                                value < 0 && 'text-destructive',
                                row.isMajorTotal && 'font-bold text-base'
                              )}>
                                {formatCurrency(value)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {yearsData.length > 1 && (
                        <td className="text-right p-3 text-sm">
                          {(() => {
                            const current = row.field 
                              ? (yearsData[0]?.data[row.field] || 0)
                              : row.totalFn 
                                ? row.totalFn(yearsData[0]?.data)
                                : 0;
                            const previous = row.field 
                              ? (yearsData[1]?.data[row.field] || 0)
                              : row.totalFn 
                                ? row.totalFn(yearsData[1]?.data)
                                : 0;
                            const variation = formatVariation(current, previous);
                            const isPositive = variation.startsWith('+');
                            const isNegative = variation.startsWith('-');
                            return (
                              <span className={cn(
                                'font-mono',
                                isPositive && 'text-green-600',
                                isNegative && 'text-destructive'
                              )}>
                                {variation}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Balance Check Card */}
      {currentYearTotals && (
        <Card className={cn(
          'border-2',
          currentYearTotals.isBalanced 
            ? 'border-green-500/50 bg-green-500/5' 
            : 'border-destructive/50 bg-destructive/5'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentYearTotals.isBalanced 
                  ? <TrendingUp className="w-6 h-6 text-green-600" /> 
                  : <TrendingDown className="w-6 h-6 text-destructive" />
                }
                <div>
                  <h3 className="font-semibold">Comprovació de Quadratura - {fiscalYear}</h3>
                  <p className="text-sm text-muted-foreground">
                    Actiu: {formatCurrency(currentYearTotals.totalAssets)} € | 
                    Patrimoni Net + Passiu: {formatCurrency(currentYearTotals.totalEquityAndLiabilities)} €
                  </p>
                </div>
              </div>
              <span className={cn(
                'text-lg font-bold',
                currentYearTotals.isBalanced ? 'text-green-600' : 'text-destructive'
              )}>
                {currentYearTotals.isBalanced 
                  ? '✓ Quadrat' 
                  : `Diferència: ${formatCurrency(currentYearTotals.totalAssets - currentYearTotals.totalEquityAndLiabilities)} €`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets Table */}
      {renderTableSection(assetRows, 'ACTIU', <Building2 className="w-5 h-5 text-blue-600" />)}

      {/* Equity & Liabilities Table */}
      {renderTableSection(liabilityRows, 'PATRIMONI NET I PASSIU', <Wallet className="w-5 h-5 text-green-600" />)}

      {/* Save Button */}
      {!isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || isUpdating} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving || isUpdating ? 'Guardant...' : 'Guardar Balanç'}
          </Button>
        </div>
      )}
      
      <ConflictDialog
        conflict={conflict}
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        onReload={handleReloadData}
        onForceUpdate={handleForceUpdate}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default BalanceSheetForm;
