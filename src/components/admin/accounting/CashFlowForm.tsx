import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Banknote, ArrowRightLeft, Building, Coins } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CashFlowFormProps {
  statementId: string;
  isLocked: boolean;
  fiscalYear: number;
}

const CashFlowForm = ({ statementId, isLocked, fiscalYear }: CashFlowFormProps) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statementId]);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('cash_flow_statements')
        .select('*')
        .eq('statement_id', statementId)
        .maybeSingle();
      
      if (error) throw error;
      if (result) {
        const numericData: Record<string, number> = {};
        Object.entries(result).forEach(([key, value]) => {
          if (typeof value === 'number') numericData[key] = value;
        });
        setData(numericData);
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      toast.error('Error carregant flux d\'efectiu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cash_flow_statements')
        .upsert({ ...data, statement_id: statementId }, { onConflict: 'statement_id' });
      
      if (error) throw error;
      toast.success('Flux d\'efectiu guardat correctament');
    } catch (error) {
      console.error('Error saving cash flow:', error);
      toast.error('Error guardant flux d\'efectiu');
    } finally {
      setSaving(false);
    }
  };

  const operatingCashFlow = 
    (data.operating_result || 0) + (data.depreciation_adjustments || 0) + (data.impairment_adjustments || 0) +
    (data.provisions_variation || 0) + (data.grants_adjustments || 0) + (data.gains_losses_fixed_assets || 0) +
    (data.gains_losses_financial_instruments || 0) + (data.working_capital_changes || 0) -
    (data.corporate_tax_paid || 0);

  const investingCashFlow = 
    -(data.investing_payments_intangible || 0) - (data.investing_payments_tangible || 0) -
    (data.investing_payments_financial || 0) + (data.investing_receipts_intangible || 0) +
    (data.investing_receipts_tangible || 0) + (data.investing_receipts_financial || 0);

  const financingCashFlow = 
    (data.financing_receipts_equity || 0) + (data.financing_receipts_debt || 0) -
    (data.financing_payments_equity || 0) - (data.financing_payments_debt || 0) -
    (data.financing_dividends_paid || 0);

  const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow + (data.exchange_rate_effect || 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const renderField = (label: string, field: string, isNegative = false) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <Label className="text-sm flex-1">
        {isNegative && <span className="text-red-500 mr-1">(-)</span>}
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
      <Card className={`border-2 ${netCashChange >= 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Explotació</p>
              <p className={`text-lg font-bold ${operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(operatingCashFlow)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inversió</p>
              <p className={`text-lg font-bold ${investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(investingCashFlow)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finançament</p>
              <p className={`text-lg font-bold ${financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financingCashFlow)}
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-2">
              <p className="text-sm text-muted-foreground">Variació Neta</p>
              <p className={`text-xl font-bold ${netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netCashChange)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="w-5 h-5 text-primary" />
            Estat de Fluxos d'Efectiu - {fiscalYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['operating']}>
            <AccordionItem value="operating">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-600" />
                  A) Fluxos d'Explotació ({formatCurrency(operatingCashFlow)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('1. Resultat d\'explotació', 'operating_result')}
                {renderField('2. Ajustaments - Amortitzacions', 'depreciation_adjustments')}
                {renderField('3. Ajustaments - Deterioraments', 'impairment_adjustments')}
                {renderField('4. Variació de provisions', 'provisions_variation')}
                {renderField('5. Ajustaments - Subvencions', 'grants_adjustments')}
                {renderField('6. Resultats per baixes d\'immobilitzat', 'gains_losses_fixed_assets')}
                {renderField('7. Canvis en capital circulant', 'working_capital_changes')}
                {renderField('8. Impostos pagats', 'corporate_tax_paid', true)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="investing">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  B) Fluxos d'Inversió ({formatCurrency(investingCashFlow)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('Pagaments - Immobilitzat intangible', 'investing_payments_intangible', true)}
                {renderField('Pagaments - Immobilitzat material', 'investing_payments_tangible', true)}
                {renderField('Pagaments - Inversions financeres', 'investing_payments_financial', true)}
                {renderField('Cobraments - Immobilitzat intangible', 'investing_receipts_intangible')}
                {renderField('Cobraments - Immobilitzat material', 'investing_receipts_tangible')}
                {renderField('Cobraments - Inversions financeres', 'investing_receipts_financial')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="financing">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                  C) Fluxos de Finançament ({formatCurrency(financingCashFlow)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('Cobraments - Instruments de patrimoni', 'financing_receipts_equity')}
                {renderField('Cobraments - Deutes', 'financing_receipts_debt')}
                {renderField('Pagaments - Instruments de patrimoni', 'financing_payments_equity', true)}
                {renderField('Pagaments - Amortització deutes', 'financing_payments_debt', true)}
                {renderField('Dividends pagats', 'financing_dividends_paid', true)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="exchange">
              <AccordionTrigger className="text-sm font-semibold">
                D) Efecte dels Tipus de Canvi
              </AccordionTrigger>
              <AccordionContent>
                {renderField('Efecte de variacions de tipus de canvi', 'exchange_rate_effect')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className={`mt-4 p-4 rounded-lg ${netCashChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className={`flex justify-between text-xl font-bold ${netCashChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>AUGMENT/DISMINUCIÓ NET D'EFECTIU</span>
              <span>{formatCurrency(netCashChange)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardant...' : 'Guardar Flux d\'Efectiu'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CashFlowForm;
