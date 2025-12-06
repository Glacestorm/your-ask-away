import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, TrendingUp, TrendingDown, Building2, Wallet } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BalanceSheetFormProps {
  statementId: string;
  isLocked: boolean;
  fiscalYear: number;
}

interface BalanceSheetData {
  id?: string;
  statement_id: string;
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
}

const defaultData: Omit<BalanceSheetData, 'id' | 'statement_id'> = {
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

const BalanceSheetForm = ({ statementId, isLocked, fiscalYear }: BalanceSheetFormProps) => {
  const [data, setData] = useState<BalanceSheetData>({ ...defaultData, statement_id: statementId });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statementId]);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('balance_sheets')
        .select('*')
        .eq('statement_id', statementId)
        .maybeSingle();
      
      if (error) throw error;
      if (result) setData(result as BalanceSheetData);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      toast.error('Error carregant balanç');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BalanceSheetData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('balance_sheets')
        .upsert({ ...data, statement_id: statementId }, { onConflict: 'statement_id' });
      
      if (error) throw error;
      toast.success('Balanç guardat correctament');
    } catch (error) {
      console.error('Error saving balance sheet:', error);
      toast.error('Error guardant balanç');
    } finally {
      setSaving(false);
    }
  };

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
  const isBalanced = Math.abs(totalAssets - totalEquityAndLiabilities) < 0.01;

  const formatCurrency = (value: number) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const renderField = (label: string, field: keyof BalanceSheetData) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <Label className="text-sm flex-1">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={data[field] || 0}
        onChange={(e) => handleChange(field, e.target.value)}
        disabled={isLocked}
        className="w-32 text-right"
      />
    </div>
  );

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={`border-2 ${isBalanced ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBalanced ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
              <div>
                <h3 className="font-semibold">Comprovació de Quadratura</h3>
                <p className="text-sm text-muted-foreground">
                  Actiu: {formatCurrency(totalAssets)} | Patrimoni Net + Passiu: {formatCurrency(totalEquityAndLiabilities)}
                </p>
              </div>
            </div>
            <span className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? '✓ Quadrat' : `Diferència: ${formatCurrency(totalAssets - totalEquityAndLiabilities)}`}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              ACTIU - {fiscalYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['non-current', 'current']}>
              <AccordionItem value="non-current">
                <AccordionTrigger className="text-sm font-semibold">
                  A) Actiu No Corrent ({formatCurrency(totalNonCurrentAssets)})
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {renderField('I. Immobilitzat intangible', 'intangible_assets')}
                  {renderField('II. Fons de comerç', 'goodwill')}
                  {renderField('III. Immobilitzat material', 'tangible_assets')}
                  {renderField('IV. Inversions immobiliàries', 'real_estate_investments')}
                  {renderField('V. Inversions en empreses del grup ll/t', 'long_term_group_investments')}
                  {renderField('VI. Inversions financeres a llarg termini', 'long_term_financial_investments')}
                  {renderField('VII. Actius per impost diferit', 'deferred_tax_assets')}
                  {renderField('VIII. Deutors comercials no corrents', 'long_term_trade_receivables')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="current">
                <AccordionTrigger className="text-sm font-semibold">
                  B) Actiu Corrent ({formatCurrency(totalCurrentAssets)})
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {renderField('I. Actius no corrents per a la venda', 'non_current_assets_held_for_sale')}
                  {renderField('II. Existències', 'inventory')}
                  {renderField('III. Deutors comercials', 'trade_receivables')}
                  {renderField('IV. Inversions en empreses del grup c/t', 'short_term_group_receivables')}
                  {renderField('V. Inversions financeres a curt termini', 'short_term_financial_investments')}
                  {renderField('VI. Periodificacions a curt termini', 'accruals_assets')}
                  {renderField('VII. Efectiu i equivalents', 'cash_equivalents')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex justify-between font-bold">
                <span>TOTAL ACTIU</span>
                <span>{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-green-600" />
              PATRIMONI NET I PASSIU - {fiscalYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['equity', 'non-current-liab', 'current-liab']}>
              <AccordionItem value="equity">
                <AccordionTrigger className="text-sm font-semibold">
                  A) Patrimoni Net ({formatCurrency(totalEquity)})
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {renderField('I. Capital social', 'share_capital')}
                  {renderField('II. Prima d\'emissió', 'share_premium')}
                  {renderField('III. Reserves de revaloració', 'revaluation_reserve')}
                  {renderField('IV. Reserva legal', 'legal_reserve')}
                  {renderField('V. Reserves estatutàries', 'statutory_reserves')}
                  {renderField('VI. Reserves voluntàries', 'voluntary_reserves')}
                  {renderField('VII. Accions pròpies (-)', 'treasury_shares')}
                  {renderField('VIII. Resultats d\'exercicis anteriors', 'retained_earnings')}
                  {renderField('IX. Resultat de l\'exercici', 'current_year_result')}
                  {renderField('X. Dividend a compte (-)', 'interim_dividend')}
                  {renderField('XI. Altres instruments de patrimoni', 'other_equity_instruments')}
                  {renderField('XII. Subvencions de capital', 'capital_grants')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="non-current-liab">
                <AccordionTrigger className="text-sm font-semibold">
                  B) Passiu No Corrent ({formatCurrency(totalNonCurrentLiabilities)})
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {renderField('I. Provisions a llarg termini', 'long_term_provisions')}
                  {renderField('II. Deutes a llarg termini', 'long_term_debts')}
                  {renderField('III. Deutes amb empreses del grup ll/t', 'long_term_group_debts')}
                  {renderField('IV. Passius per impost diferit', 'deferred_tax_liabilities')}
                  {renderField('V. Periodificacions a llarg termini', 'long_term_accruals')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="current-liab">
                <AccordionTrigger className="text-sm font-semibold">
                  C) Passiu Corrent ({formatCurrency(totalCurrentLiabilities)})
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {renderField('I. Passius per a la venda', 'liabilities_held_for_sale')}
                  {renderField('II. Provisions a curt termini', 'short_term_provisions')}
                  {renderField('III. Deutes a curt termini', 'short_term_debts')}
                  {renderField('IV. Deutes amb empreses del grup c/t', 'short_term_group_debts')}
                  {renderField('V. Creditors comercials', 'trade_payables')}
                  {renderField('VI. Altres creditors', 'other_creditors')}
                  {renderField('VII. Periodificacions a curt termini', 'short_term_accruals')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex justify-between font-bold">
                <span>TOTAL PATRIMONI NET I PASSIU</span>
                <span>{formatCurrency(totalEquityAndLiabilities)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardant...' : 'Guardar Balanç'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetForm;
