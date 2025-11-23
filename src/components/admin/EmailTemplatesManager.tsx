import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Plus, Pencil, Trash2, Eye, Code } from "lucide-react";

interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject: string;
  html_content: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailTemplatesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, "id" | "created_at" | "updated_at" | "variables"> & { variables?: Record<string, string> }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert([template])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Plantilla creada exitosamente");
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Plantilla actualizada exitosamente");
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Plantilla eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const template = {
      template_name: formData.get("template_name") as string,
      template_type: formData.get("template_type") as string,
      subject: formData.get("subject") as string,
      html_content: formData.get("html_content") as string,
      is_active: formData.get("is_active") === "on",
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...template });
    } else {
      createMutation.mutate(template);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta plantilla?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPreviewHTML = (template: EmailTemplate) => {
    let html = template.html_content;
    
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      gestor_name: "Juan Pérez",
      month: "Diciembre 2024",
      rank: "3",
      total_gestores: "15",
      badge_emoji: "🥉",
      total_visits: "25",
      conversion_rate: "68.5",
      avg_vinculacion: "72.3",
      avg_visits: "20",
      avg_conversion: "65.0",
      avg_team_vinculacion: "70.0",
      visits_color: "#10b981",
      conversion_color: "#10b981",
      vinculacion_color: "#f59e0b",
      achievements: '<div style="padding: 10px 15px; background: #e0e7ff; border-radius: 20px; font-size: 14px;">🥇 Top 3 Performer</div>',
      top_3_badge: '<div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; font-size: 14px;">🎉 ¡Felicitaciones! Estás en el Top 3</div>',
      top_performer_section: '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;"><div style="font-size: 14px; color: #666; margin-bottom: 5px;">🏆 Top Performer del Mes</div><div style="font-size: 18px; font-weight: bold; color: #333;">María González</div><div style="font-size: 13px; color: #666; margin-top: 5px;">¡Sigue trabajando para alcanzar el primer lugar!</div></div>',
      motivation_title: "💪 ¡Excelente trabajo! Estás entre los mejores",
      motivation_message: "Cada visita cuenta. ¡Sigue adelante!"
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    return html;
  };

  if (isLoading) {
    return <div>Cargando plantillas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Plantillas de Email
          </h2>
          <p className="text-muted-foreground">
            Personaliza el diseño y contenido de los emails automáticos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
              <DialogDescription>
                Crea o edita plantillas de email usando variables como {"{{gestor_name}}"}, {"{{month}}"}, etc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="template_name">Nombre de Plantilla</Label>
                <Input
                  id="template_name"
                  name="template_name"
                  defaultValue={editingTemplate?.template_name}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="template_type">Tipo de Plantilla</Label>
                <Select name="template_type" defaultValue={editingTemplate?.template_type || "monthly_report"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_report">Reporte Mensual</SelectItem>
                    <SelectItem value="weekly_digest">Resumen Semanal</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Asunto del Email</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={editingTemplate?.subject}
                  placeholder="📊 Tu Reporte de Rendimiento - {{month}}"
                  required
                />
              </div>

              <div>
                <Label htmlFor="html_content">Contenido HTML</Label>
                <Textarea
                  id="html_content"
                  name="html_content"
                  defaultValue={editingTemplate?.html_content}
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usa variables como {"{{gestor_name}}"}, {"{{month}}"}, {"{{rank}}"}, etc.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={editingTemplate?.is_active ?? true}
                />
                <Label htmlFor="is_active">Plantilla Activa</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTemplate ? "Actualizar" : "Crear"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.template_name}
                    {template.is_active ? (
                      <Badge variant="default">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Tipo: {template.template_type} • Asunto: {template.subject}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {template.variables && (
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(template.variables).map((key) => (
                    <Badge key={key} variant="outline" className="font-mono text-xs">
                      {`{{${key}}}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Vista Previa: {previewTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Vista previa con datos de ejemplo
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Código HTML
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="max-h-[60vh] overflow-auto">
              {previewTemplate && (
                <div
                  dangerouslySetInnerHTML={{ __html: getPreviewHTML(previewTemplate) }}
                  className="border rounded-lg p-4"
                />
              )}
            </TabsContent>
            <TabsContent value="code" className="max-h-[60vh] overflow-auto">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{previewTemplate?.html_content}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
