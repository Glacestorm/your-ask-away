import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, TrendingUp, TrendingDown, Receipt, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface IncomeStatementFormProps {
  statementId: string;
  isLocked: boolean;
  fiscalYear: number;
}

interface IncomeStatementData {
  id?: string;
  statement_id: string;
  net_turnover: number;
  inventory_variation: number;
  capitalized_work: number;
  operating_grants: number;
  other_operating_income: number;
  supplies: number;
  personnel_expenses: number;
  other_operating_expenses: number;
  depreciation: number;
  grants_allocation: number;
  excess_provisions: number;
  impairment_trade_operations: number;
  other_operating_results: number;
  financial_income: number;
  financial_expenses: number;
  exchange_differences: number;
  impairment_financial_instruments: number;
  other_financial_results: number;
  corporate_tax: number;
  discontinued_operations_result: number;
}

const defaultData: Omit<IncomeStatementData, 'id' | 'statement_id'> = {
  net_turnover: 0, inventory_variation: 0, capitalized_work: 0, operating_grants: 0,
  other_operating_income: 0, supplies: 0, personnel_expenses: 0, other_operating_expenses: 0,
  depreciation: 0, grants_allocation: 0, excess_provisions: 0, impairment_trade_operations: 0,
  other_operating_results: 0, financial_income: 0, financial_expenses: 0, exchange_differences: 0,
  impairment_financial_instruments: 0, other_financial_results: 0, corporate_tax: 0,
  discontinued_operations_result: 0
};

const IncomeStatementForm = ({ statementId, isLocked, fiscalYear }: IncomeStatementFormProps) => {
  const [data, setData] = useState<IncomeStatementData>({ ...defaultData, statement_id: statementId });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statementId]);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('income_statements')
        .select('*')
        .eq('statement_id', statementId)
        .maybeSingle();
      
      if (error) throw error;
      if (result) setData(result as IncomeStatementData);
    } catch (error) {
      console.error('Error fetching income statement:', error);
      toast.error('Error carregant compte de resultats');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof IncomeStatementData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('income_statements')
        .upsert({ ...data, statement_id: statementId }, { onConflict: 'statement_id' });
      
      if (error) throw error;
      toast.success('Compte de resultats guardat correctament');
    } catch (error) {
      console.error('Error saving income statement:', error);
      toast.error('Error guardant compte de resultats');
    } finally {
      setSaving(false);
    }
  };

  const totalOperatingIncome = 
    (data.net_turnover || 0) + (data.inventory_variation || 0) + (data.capitalized_work || 0) +
    (data.operating_grants || 0) + (data.other_operating_income || 0);

  const totalOperatingExpenses = 
    (data.supplies || 0) + (data.personnel_expenses || 0) + (data.other_operating_expenses || 0) +
    (data.depreciation || 0) - (data.grants_allocation || 0) - (data.excess_provisions || 0) +
    (data.impairment_trade_operations || 0) + (data.other_operating_results || 0);

  const operatingResult = totalOperatingIncome - totalOperatingExpenses;

  const financialResult = 
    (data.financial_income || 0) - (data.financial_expenses || 0) + (data.exchange_differences || 0) -
    (data.impairment_financial_instruments || 0) + (data.other_financial_results || 0);

  const resultBeforeTax = operatingResult + financialResult;
  const netResult = resultBeforeTax - (data.corporate_tax || 0) + (data.discontinued_operations_result || 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const renderField = (label: string, field: keyof IncomeStatementData, isExpense = false) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <Label className="text-sm flex-1">
        {isExpense && <span className="text-red-500 mr-1">(-)</span>}
        {label}
      </Label>
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
      <Card className={`border-2 ${netResult >= 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {netResult >= 0 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
              <div>
                <h3 className="font-semibold">Resultat de l'Exercici {fiscalYear}</h3>
                <p className="text-sm text-muted-foreground">
                  Resultat d'explotació: {formatCurrency(operatingResult)} | Resultat financer: {formatCurrency(financialResult)}
                </p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netResult)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-primary" />
            Compte de Pèrdues i Guanys - {fiscalYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['income', 'expenses', 'financial']}>
            <AccordionItem value="income">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-green-600" />
                  A) Ingressos d'Explotació ({formatCurrency(totalOperatingIncome)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('1. Import net de la xifra de negocis', 'net_turnover')}
                {renderField('2. Variació d\'existències', 'inventory_variation')}
                {renderField('3. Treballs realitzats per l\'empresa', 'capitalized_work')}
                {renderField('4. Subvencions d\'explotació incorporades', 'operating_grants')}
                {renderField('5. Altres ingressos d\'explotació', 'other_operating_income')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="expenses">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-red-600" />
                  B) Despeses d'Explotació ({formatCurrency(totalOperatingExpenses)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('6. Aprovisionaments', 'supplies', true)}
                {renderField('7. Despeses de personal', 'personnel_expenses', true)}
                {renderField('8. Altres despeses d\'explotació', 'other_operating_expenses', true)}
                {renderField('9. Amortització de l\'immobilitzat', 'depreciation', true)}
                {renderField('10. Imputació de subvencions', 'grants_allocation')}
                {renderField('11. Excés de provisions', 'excess_provisions')}
                {renderField('12. Deteriorament d\'operacions comercials', 'impairment_trade_operations', true)}
                {renderField('13. Altres resultats', 'other_operating_results')}
              </AccordionContent>
            </AccordionItem>

            <div className="p-3 bg-blue-500/10 rounded-lg my-2">
              <div className="flex justify-between font-bold text-blue-700">
                <span>A.1) RESULTAT D'EXPLOTACIÓ (A - B)</span>
                <span>{formatCurrency(operatingResult)}</span>
              </div>
            </div>

            <AccordionItem value="financial">
              <AccordionTrigger className="text-sm font-semibold">
                C) Resultat Financer ({formatCurrency(financialResult)})
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('14. Ingressos financers', 'financial_income')}
                {renderField('15. Despeses financeres', 'financial_expenses', true)}
                {renderField('16. Diferències de canvi', 'exchange_differences')}
                {renderField('17. Deteriorament d\'instruments financers', 'impairment_financial_instruments', true)}
                {renderField('18. Altres resultats financers', 'other_financial_results')}
              </AccordionContent>
            </AccordionItem>

            <div className="p-3 bg-purple-500/10 rounded-lg my-2">
              <div className="flex justify-between font-bold text-purple-700">
                <span>A.2) RESULTAT ABANS D'IMPOSTOS (A.1 + C)</span>
                <span>{formatCurrency(resultBeforeTax)}</span>
              </div>
            </div>

            <AccordionItem value="tax">
              <AccordionTrigger className="text-sm font-semibold">
                D) Impost i Operacions Interrompudes
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('19. Impost sobre beneficis', 'corporate_tax', true)}
                {renderField('20. Resultat d\'operacions interrompudes', 'discontinued_operations_result')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className={`mt-4 p-4 rounded-lg ${netResult >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className={`flex justify-between text-xl font-bold ${netResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>RESULTAT DE L'EXERCICI</span>
              <span>{formatCurrency(netResult)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardant...' : 'Guardar Compte de Resultats'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default IncomeStatementForm;
