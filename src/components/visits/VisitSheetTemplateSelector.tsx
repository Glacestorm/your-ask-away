import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_data: Record<string, any>;
  is_default: boolean;
}

interface VisitSheetTemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (template: Template | null) => void;
  currentFormData: Record<string, any>;
  canManageTemplates?: boolean;
}

export function VisitSheetTemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  currentFormData,
  canManageTemplates = false
}: VisitSheetTemplateSelectorProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('visit_sheet_templates')
        .select('*')
        .eq('active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates(data as Template[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'none') {
      onTemplateSelect(null);
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
      toast.success(`Plantilla "${template.name}" aplicada`);
    }
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('El nombre de la plantilla es obligatorio');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setSaving(true);
    try {
      // Extract relevant fields to save as template
      const templateData = {
        diagnostico_inicial: currentFormData.diagnosticoInicial,
        necesidades_detectadas: currentFormData.necesidadesDetectadas,
        propuesta_valor: currentFormData.propuestaValor,
        riesgos_cumplimiento: currentFormData.riesgosCumplimiento,
        nivel_riesgo: currentFormData.nivelRiesgo,
        nivel_vinculacion_recomendado: currentFormData.nivelVinculacionRecomendado,
        canal: currentFormData.canal,
        tipo_visita: currentFormData.tipoVisita,
        duracion: currentFormData.duracion
      };

      const { data, error } = await supabase
        .from('visit_sheet_templates')
        .insert({
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || null,
          template_data: templateData,
          created_by: user.id,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([...templates, data as Template]);
      setShowSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      toast.success('Plantilla guardada correctamente');
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar la plantilla: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('visit_sheet_templates')
        .update({ active: false })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        onTemplateSelect(null);
      }
      toast.success('Plantilla eliminada');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar la plantilla');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Plantilla de Ficha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={selectedTemplateId || 'none'}
              onValueChange={handleTemplateChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin plantilla</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.is_default && ' (Por defecto)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canManageTemplates && (
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Guardar como plantilla">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Guardar como Plantilla</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="template-name">Nombre de la plantilla *</Label>
                    <Input
                      id="template-name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ej: Visita comercial estándar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-description">Descripción</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Descripción de cuándo usar esta plantilla..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={saveAsTemplate} 
                    disabled={saving || !newTemplateName.trim()}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Plantilla'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedTemplateId && (
          <div className="text-xs text-muted-foreground">
            {templates.find(t => t.id === selectedTemplateId)?.description || 
             'Los campos se rellenarán con los valores de la plantilla seleccionada.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
