import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Scale, ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface EquityChangesFormProps {
  statementId: string;
  isLocked: boolean;
  fiscalYear: number;
}

const EquityChangesForm = ({ statementId, isLocked, fiscalYear }: EquityChangesFormProps) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statementId]);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('equity_changes_statements')
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
      console.error('Error fetching equity changes:', error);
      toast.error('Error carregant estat de canvis');
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
        .from('equity_changes_statements')
        .upsert({ ...data, statement_id: statementId }, { onConflict: 'statement_id' });
      
      if (error) throw error;
      toast.success('Estat de canvis guardat correctament');
    } catch (error) {
      console.error('Error saving equity changes:', error);
      toast.error('Error guardant estat de canvis');
    } finally {
      setSaving(false);
    }
  };

  const totalInitialEquity = 
    (data.initial_share_capital || 0) + (data.initial_share_premium || 0) + (data.initial_reserves || 0) -
    (data.initial_treasury_shares || 0) + (data.initial_retained_earnings || 0) + (data.initial_result || 0);

  const totalFinalEquity = 
    (data.final_share_capital || 0) + (data.final_share_premium || 0) + (data.final_reserves || 0) -
    (data.final_treasury_shares || 0) + (data.final_retained_earnings || 0) + (data.final_result || 0);

  const netChange = totalFinalEquity - totalInitialEquity;

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
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Patrimoni Inicial</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalInitialEquity)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patrimoni Final</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalFinalEquity)}</p>
            </div>
            <div className={`rounded-lg p-2 ${netChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <p className="text-sm text-muted-foreground">Variació Neta</p>
              <p className={`text-xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netChange)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="w-5 h-5 text-primary" />
            Estat de Canvis en el Patrimoni Net - {fiscalYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['initial']}>
            <AccordionItem value="initial">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-blue-600" />
                  A) Saldo Inicial ({formatCurrency(totalInitialEquity)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('Capital social', 'initial_share_capital')}
                {renderField('Prima d\'emissió', 'initial_share_premium')}
                {renderField('Reserves', 'initial_reserves')}
                {renderField('Accions pròpies', 'initial_treasury_shares', true)}
                {renderField('Resultats d\'exercicis anteriors', 'initial_retained_earnings')}
                {renderField('Resultat de l\'exercici', 'initial_result')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="variations">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-green-600" />
                  B) Variacions del Període
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('Resultat de l\'exercici', 'variation_result')}
                {renderField('Ingressos i despeses a patrimoni', 'variation_income_expenses_equity')}
                {renderField('Variació capital social', 'variation_share_capital')}
                {renderField('Variació reserves', 'variation_reserves')}
                {renderField('Dividends distribuïts', 'variation_dividends', true)}
                {renderField('Altres variacions', 'variation_other')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="final">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-green-600" />
                  C) Saldo Final ({formatCurrency(totalFinalEquity)})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1">
                {renderField('Capital social', 'final_share_capital')}
                {renderField('Prima d\'emissió', 'final_share_premium')}
                {renderField('Reserves', 'final_reserves')}
                {renderField('Accions pròpies', 'final_treasury_shares', true)}
                {renderField('Resultats d\'exercicis anteriors', 'final_retained_earnings')}
                {renderField('Resultat de l\'exercici', 'final_result')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className={`mt-4 p-4 rounded-lg ${netChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className={`flex justify-between text-xl font-bold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>VARIACIÓ NETA DEL PATRIMONI NET</span>
              <span>{formatCurrency(netChange)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardant...' : 'Guardar Estat de Canvis'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EquityChangesForm;
