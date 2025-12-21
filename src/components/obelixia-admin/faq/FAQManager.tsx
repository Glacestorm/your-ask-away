import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, ThumbsUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  priority: number;
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  created_at: string;
}

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface FAQManagerProps {
  onUpdate?: () => void;
}

const FAQManager: React.FC<FAQManagerProps> = ({ onUpdate }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category_id: '',
    priority: 50,
    is_published: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        supabase.from('faqs').select('*').order('priority', { ascending: false }),
        supabase.from('faq_categories').select('*').order('order_index'),
      ]);

      if (faqsRes.error) throw faqsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setFaqs(faqsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las FAQs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category_id: '',
      priority: 50,
      is_published: true,
    });
    setEditingFaq(null);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id || '',
      priority: faq.priority,
      is_published: faq.is_published,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = {
        question: formData.question,
        answer: formData.answer,
        category_id: formData.category_id || null,
        priority: formData.priority,
        is_published: formData.is_published,
      };

      if (editingFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(data)
          .eq('id', editingFaq.id);
        if (error) throw error;
        toast({ title: 'FAQ actualizada correctamente' });
      } else {
        const { error } = await supabase.from('faqs').insert(data);
        if (error) throw error;
        toast({ title: 'FAQ creada correctamente' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la FAQ',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta FAQ?')) return;

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'FAQ eliminada' });
      fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la FAQ',
        variant: 'destructive',
      });
    }
  };

  const togglePublished = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_published: !faq.is_published })
        .eq('id', faq.id);
      if (error) throw error;
      fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling published:', error);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
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
          <h3 className="text-lg font-semibold text-white">Gestión de FAQs</h3>
          <p className="text-sm text-slate-400">
            Administra las preguntas frecuentes de tu sitio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingFaq ? 'Editar FAQ' : 'Nueva FAQ'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="question">Pregunta</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={e =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="¿Cuál es tu pregunta?"
                  required
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Respuesta</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={e =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder="Escribe la respuesta detallada..."
                  required
                  rows={6}
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={value =>
                      setFormData({ ...formData, category_id: value })
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
                    value={formData.priority}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Publicada</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingFaq ? 'Guardar Cambios' : 'Crear FAQ'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FAQs Table */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Pregunta</TableHead>
                <TableHead className="text-slate-400">Categoría</TableHead>
                <TableHead className="text-slate-400 text-center">
                  <Eye className="w-4 h-4 inline" />
                </TableHead>
                <TableHead className="text-slate-400 text-center">
                  <ThumbsUp className="w-4 h-4 inline" />
                </TableHead>
                <TableHead className="text-slate-400 text-center">Estado</TableHead>
                <TableHead className="text-slate-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map(faq => (
                <TableRow key={faq.id} className="border-slate-700/50">
                  <TableCell className="text-white font-medium max-w-md truncate">
                    {faq.question}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {getCategoryName(faq.category_id)}
                  </TableCell>
                  <TableCell className="text-center text-slate-400">
                    {faq.views_count}
                  </TableCell>
                  <TableCell className="text-center text-emerald-400">
                    {faq.helpful_count}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={faq.is_published}
                      onCheckedChange={() => togglePublished(faq)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(faq)}
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(faq.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {faqs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-slate-400 py-8"
                  >
                    No hay FAQs creadas. Crea la primera.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQManager;
