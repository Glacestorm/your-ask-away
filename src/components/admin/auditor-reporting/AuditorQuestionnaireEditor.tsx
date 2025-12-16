import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bot, Check, Clock, FileText, Save, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditorQuestionnaireEditorProps {
  sectorKey: string;
}

export function AuditorQuestionnaireEditor({ sectorKey }: AuditorQuestionnaireEditorProps) {
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['auditor-questions', sectorKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditor_questions')
        .select('*')
        .eq('sector_key', sectorKey)
        .eq('is_active', true)
        .order('priority')
        .order('category');
      if (error) throw error;
      return data;
    },
  });

  const { data: responses } = useQuery({
    queryKey: ['auditor-responses', sectorKey],
    queryFn: async () => {
      const questionIds = questions?.map(q => q.id) || [];
      if (questionIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('auditor_responses')
        .select('*')
        .in('question_id', questionIds);
      if (error) throw error;
      return data;
    },
    enabled: !!questions?.length,
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ questionId, text, status }: { questionId: string; text: string; status: string }) => {
      const existingResponse = responses?.find(r => r.question_id === questionId);
      
      if (existingResponse) {
        const { error } = await supabase
          .from('auditor_responses')
          .update({ response_text: text, status, last_updated_at: new Date().toISOString() })
          .eq('id', existingResponse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('auditor_responses')
          .insert({ question_id: questionId, response_text: text, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditor-responses'] });
      toast.success('Respuesta guardada');
      setEditingResponse(null);
    },
    onError: (error: any) => {
      toast.error('Error al guardar', { description: error.message });
    },
  });

  const generateAIResponse = async (questionId: string) => {
    setGeneratingFor(questionId);
    try {
      const today = new Date();
      const periodEnd = today.toISOString().split('T')[0];
      const periodStart = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('generate-auditor-response', {
        body: { questionId, periodStart, periodEnd },
      });

      if (error) throw error;

      toast.success('Respuesta generada con IA', {
        description: data.response.ai_generated ? 'Usando datos del sistema' : 'Usando plantilla base',
      });
      queryClient.invalidateQueries({ queryKey: ['auditor-responses'] });
    } catch (error: any) {
      console.error('Error generating response:', error);
      toast.error('Error al generar respuesta', { description: error.message });
    } finally {
      setGeneratingFor(null);
    }
  };

  const getResponseForQuestion = (questionId: string) => {
    return responses?.find(r => r.question_id === questionId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Borrador' },
      reviewed: { variant: 'secondary', label: 'Revisado' },
      approved: { variant: 'default', label: 'Aprobado' },
      submitted: { variant: 'default', label: 'Enviado' },
    };
    const { variant, label } = variants[status] || variants.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.medium}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  // Group questions by category
  const groupedQuestions = questions?.reduce((acc, q) => {
    const category = q.category || 'Otros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(q);
    return acc;
  }, {} as Record<string, typeof questions>);

  if (isLoading) {
    return <div className="text-center py-8">Cargando preguntas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuestionario de Auditor</CardTitle>
        <CardDescription>
          Responde a las preguntas estándar de auditoría para el sector seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedQuestions || {}).map(([category, categoryQuestions]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <span>{category}</span>
                  <Badge variant="secondary">{categoryQuestions?.length} preguntas</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {categoryQuestions?.map((question) => {
                    const response = getResponseForQuestion(question.id);
                    const isEditing = editingResponse === question.id;
                    const isGenerating = generatingFor === question.id;

                    return (
                      <div key={question.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {question.question_code}
                              </code>
                              {getPriorityBadge(question.priority)}
                              <Badge variant="outline">{question.regulation_code}</Badge>
                            </div>
                            <p className="font-medium">{question.question_text}</p>
                          </div>
                          {response && getStatusBadge(response.status)}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={6}
                              placeholder="Escribe la respuesta para el auditor..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveResponseMutation.mutate({
                                  questionId: question.id,
                                  text: responseText,
                                  status: 'draft',
                                })}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Guardar Borrador
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => saveResponseMutation.mutate({
                                  questionId: question.id,
                                  text: responseText,
                                  status: 'reviewed',
                                })}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Marcar Revisado
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingResponse(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : response?.response_text ? (
                          <div className="space-y-3">
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm whitespace-pre-wrap">{response.response_text}</p>
                            </div>
                            {response.auto_generated_evidence && Object.keys(response.auto_generated_evidence).length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                Evidencia automática adjunta
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingResponse(question.id);
                                  setResponseText(response.response_text || '');
                                }}
                              >
                                Editar
                              </Button>
                              {response.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => saveResponseMutation.mutate({
                                    questionId: question.id,
                                    text: response.response_text || '',
                                    status: 'approved',
                                  })}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => generateAIResponse(question.id)}
                              disabled={isGenerating}
                            >
                              {isGenerating ? (
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Bot className="h-4 w-4 mr-1" />
                              )}
                              Generar con IA
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingResponse(question.id);
                                setResponseText(question.standard_response_template || '');
                              }}
                            >
                              Escribir Manual
                            </Button>
                          </div>
                        )}

                        {question.expected_evidence && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Evidencia esperada: </span>
                            {Array.isArray(question.expected_evidence) 
                              ? question.expected_evidence.join(', ')
                              : JSON.stringify(question.expected_evidence)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {(!questions || questions.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No hay preguntas para este sector
          </p>
        )}
      </CardContent>
    </Card>
  );
}
