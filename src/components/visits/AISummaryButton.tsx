import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, Loader2, ChevronDown, CheckCircle2, AlertTriangle, ArrowRight, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AISummaryButtonProps {
  visitSheetId?: string;
  notes: string;
  companyName?: string;
  onSummaryGenerated?: (summary: string, nextSteps: string[], risks: string[]) => void;
  existingSummary?: string | null;
  existingNextSteps?: string[] | null;
  existingRisks?: string[] | null;
}

export function AISummaryButton({
  visitSheetId,
  notes,
  companyName,
  onSummaryGenerated,
  existingSummary,
  existingNextSteps,
  existingRisks,
}: AISummaryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!!existingSummary);
  const [summary, setSummary] = useState(existingSummary || '');
  const [nextSteps, setNextSteps] = useState<string[]>(existingNextSteps || []);
  const [risks, setRisks] = useState<string[]>(existingRisks || []);
  const [notesInput, setNotesInput] = useState(notes || '');

  const generateSummary = async () => {
    if (!notesInput.trim()) {
      toast.error('Introduce las notas de la reunión para generar el resumen');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-visit', {
        body: {
          notes: notesInput,
          companyName: companyName || 'Cliente',
        },
      });

      if (error) throw error;

      const result = data as { summary: string; nextSteps: string[]; risks: string[] };
      
      setSummary(result.summary);
      setNextSteps(result.nextSteps || []);
      setRisks(result.risks || []);
      setExpanded(true);

      if (onSummaryGenerated) {
        onSummaryGenerated(result.summary, result.nextSteps || [], result.risks || []);
      }

      // Save to visit_sheets if we have an ID
      if (visitSheetId) {
        await supabase
          .from('visit_sheets')
          .update({
            ai_summary: result.summary,
            ai_next_steps: result.nextSteps,
            ai_risks: result.risks,
            ai_generated_at: new Date().toISOString(),
          })
          .eq('id', visitSheetId);
      }

      toast.success('Resumen generado con ObelixIA');
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast.error('Error al generar resumen: ' + (error.message || 'Inténtalo de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const hasExistingData = !!existingSummary || summary;

  return (
    <div className="space-y-4">
      {/* Notes Input Area */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Notas de la reunión
        </label>
        <Textarea
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder="Pega aquí las notas de la reunión, transcripción o puntos clave discutidos..."
          rows={6}
          className="resize-none"
        />
        <Button
          onClick={generateSummary}
          disabled={loading || !notesInput.trim()}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analizando con ObelixIA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Resumir con ObelixIA
            </>
          )}
        </Button>
      </div>

      {/* Generated Content */}
      {hasExistingData && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Resumen IA generado
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Resumen Ejecutivo</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(summary)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </CardContent>
            </Card>

            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Próximos Pasos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Risks */}
            {risks.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Riesgos Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                          {idx + 1}
                        </Badge>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
