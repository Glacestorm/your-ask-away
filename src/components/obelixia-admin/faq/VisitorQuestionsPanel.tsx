import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  CheckCircle,
  Clock,
  MessageSquare,
  Loader2,
  ArrowUpFromLine,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VisitorQuestion {
  id: string;
  question: string;
  response: string | null;
  session_id: string | null;
  source: string;
  resolved: boolean;
  converted_to_faq: boolean;
  confidence_score: number | null;
  created_at: string;
}

interface FAQCategory {
  id: string;
  name: string;
}

interface VisitorQuestionsPanelProps {
  onUpdate?: () => void;
}

const VisitorQuestionsPanel: React.FC<VisitorQuestionsPanelProps> = ({
  onUpdate,
}) => {
  const [questions, setQuestions] = useState<VisitorQuestion[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<VisitorQuestion | null>(
    null
  );
  const [convertForm, setConvertForm] = useState({
    question: '',
    answer: '',
    category_id: '',
    priority: 50,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('visitor_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'pending') {
        query = query.eq('resolved', false);
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true);
      }

      const [questionsRes, categoriesRes] = await Promise.all([
        query,
        supabase.from('faq_categories').select('id, name').order('order_index'),
      ]);

      if (questionsRes.error) throw questionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setQuestions(questionsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openConvertDialog = (question: VisitorQuestion) => {
    setSelectedQuestion(question);
    setConvertForm({
      question: question.question,
      answer: question.response || '',
      category_id: '',
      priority: 50,
    });
    setIsConvertDialogOpen(true);
  };

  const handleConvertToFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    setIsSaving(true);
    try {
      // Create FAQ
      const { error: faqError } = await supabase.from('faqs').insert({
        question: convertForm.question,
        answer: convertForm.answer,
        category_id: convertForm.category_id || null,
        priority: convertForm.priority,
        is_published: true,
      });

      if (faqError) throw faqError;

      // Mark question as converted
      await supabase
        .from('visitor_questions')
        .update({ converted_to_faq: true, resolved: true })
        .eq('id', selectedQuestion.id);

      toast({ title: 'Pregunta convertida a FAQ correctamente' });
      setIsConvertDialogOpen(false);
      fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error converting to FAQ:', error);
      toast({
        title: 'Error',
        description: 'No se pudo convertir la pregunta',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      await supabase
        .from('visitor_questions')
        .update({ resolved: true })
        .eq('id', id);
      fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      faq_chatbot: 'bg-blue-500/20 text-blue-400',
      faq_search: 'bg-purple-500/20 text-purple-400',
      contact_form: 'bg-emerald-500/20 text-emerald-400',
    };
    const labels: Record<string, string> = {
      faq_chatbot: 'Chatbot',
      faq_search: 'Búsqueda',
      contact_form: 'Contacto',
    };
    return (
      <Badge className={colors[source] || 'bg-slate-500/20 text-slate-400'}>
        {labels[source] || source}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Preguntas de Visitantes
          </h3>
          <p className="text-sm text-slate-400">
            Preguntas recibidas del chatbot y búsquedas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Pendientes
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('resolved')}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Resueltas
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
        </div>
      </div>

      {/* Questions Table */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Pregunta</TableHead>
                <TableHead className="text-slate-400">Fuente</TableHead>
                <TableHead className="text-slate-400">Fecha</TableHead>
                <TableHead className="text-slate-400 text-center">Estado</TableHead>
                <TableHead className="text-slate-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map(q => (
                <TableRow key={q.id} className="border-slate-700/50">
                  <TableCell className="text-white max-w-md">
                    <div className="truncate">{q.question}</div>
                    {q.response && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        R: {q.response}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{getSourceBadge(q.source)}</TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {format(new Date(q.created_at), 'dd MMM HH:mm', {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {q.converted_to_faq ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        FAQ
                      </Badge>
                    ) : q.resolved ? (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        Resuelta
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!q.converted_to_faq && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openConvertDialog(q)}
                          className="gap-1 text-primary hover:text-primary"
                        >
                          <ArrowUpFromLine className="w-4 h-4" />
                          Convertir a FAQ
                        </Button>
                      )}
                      {!q.resolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsResolved(q.id)}
                          className="h-8 w-8 text-slate-400 hover:text-emerald-400"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-slate-400 py-8"
                  >
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay preguntas {filter === 'pending' ? 'pendientes' : ''}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Convert to FAQ Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Convertir a FAQ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConvertToFAQ} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="question">Pregunta</Label>
              <Input
                id="question"
                value={convertForm.question}
                onChange={e =>
                  setConvertForm({ ...convertForm, question: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Respuesta</Label>
              <Textarea
                id="answer"
                value={convertForm.answer}
                onChange={e =>
                  setConvertForm({ ...convertForm, answer: e.target.value })
                }
                required
                rows={6}
                className="bg-slate-800 border-slate-700"
                placeholder="Escribe una respuesta completa..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={convertForm.category_id}
                  onValueChange={value =>
                    setConvertForm({ ...convertForm, category_id: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad (0-100)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  max={100}
                  value={convertForm.priority}
                  onChange={e =>
                    setConvertForm({
                      ...convertForm,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConvertDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorQuestionsPanel;
