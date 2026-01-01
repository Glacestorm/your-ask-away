/**
 * AIJournalEntriesPanel - Panel de asientos contables con IA
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Upload,
  Wand2,
  Eye,
  PlusCircle
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SuggestedEntry {
  description: string;
  lines: Array<{
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
  confidence: number;
  reasoning: string;
  regulations_applied: string[];
}

interface AIJournalEntriesPanelProps {
  className?: string;
}

export function AIJournalEntriesPanel({ className }: AIJournalEntriesPanelProps) {
  const { currentCompany } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedEntry[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!inputText.trim() || !currentCompany?.id) {
      toast.error('Introduce una descripción de la operación');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('erp-ai-journal-entries', {
        body: {
          action: 'suggest_entry',
          params: {
            company_id: currentCompany.id,
            country_code: currentCompany.country,
            description: inputText
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.suggestions) {
        setSuggestions(data.suggestions);
        toast.success(`${data.suggestions.length} sugerencias generadas`);
      }
    } catch (err) {
      console.error('[AIJournalEntriesPanel] Error:', err);
      toast.error('Error generando sugerencias');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, currentCompany]);

  const handleApplySuggestion = useCallback(async (suggestion: SuggestedEntry) => {
    toast.success('Asiento aplicado al borrador');
    // En una implementación completa, esto abriría un formulario de edición
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          Asientos Inteligentes con IA
          <HelpTooltip
            type="tip"
            title="IA Contable"
            content="Describe una operación en lenguaje natural y la IA sugerirá el asiento contable correcto según la normativa vigente."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              Describe la operación
              <Badge variant="outline" className="text-xs">Natural Language</Badge>
            </Label>
            <Textarea
              placeholder="Ej: Compra de mercaderías por 5.000€ + IVA 21% a proveedor X, pago a 30 días..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isLoading || !inputText.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generar Asiento
            </Button>
            <Button variant="outline" size="icon" className="gap-2">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Sugerencias ({suggestions.length})
            </p>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {suggestions.map((suggestion, idx) => (
                  <Card 
                    key={idx}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedSuggestion === idx && "border-primary ring-1 ring-primary/30"
                    )}
                    onClick={() => setSelectedSuggestion(idx)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{suggestion.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reasoning}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={suggestion.confidence >= 90 ? 'default' : 'secondary'}
                            className={cn(
                              "text-xs",
                              suggestion.confidence >= 90 && "bg-green-600"
                            )}
                          >
                            {suggestion.confidence}% confianza
                          </Badge>
                        </div>
                      </div>

                      {/* Lines */}
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-2 text-left">Cuenta</th>
                              <th className="p-2 text-right">Debe</th>
                              <th className="p-2 text-right">Haber</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suggestion.lines.map((line, lineIdx) => (
                              <tr key={lineIdx} className="border-t">
                                <td className="p-2">
                                  <span className="font-mono">{line.account_code}</span>
                                  <span className="ml-2 text-muted-foreground">{line.account_name}</span>
                                </td>
                                <td className="p-2 text-right font-mono">
                                  {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                </td>
                                <td className="p-2 text-right font-mono">
                                  {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Regulations */}
                      {suggestion.regulations_applied.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.regulations_applied.map((reg, regIdx) => (
                            <Badge key={regIdx} variant="outline" className="text-xs">
                              {reg}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Eye className="h-3 w-3" />
                          Vista previa
                        </Button>
                        <Button 
                          size="sm" 
                          className="gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySuggestion(suggestion);
                          }}
                        >
                          <PlusCircle className="h-3 w-3" />
                          Aplicar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && suggestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Describe una operación para generar asientos automáticamente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIJournalEntriesPanel;
