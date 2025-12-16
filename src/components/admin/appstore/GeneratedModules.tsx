import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Puzzle, Sparkles, Loader2, Eye, Trash2, RefreshCw,
  CheckCircle2, Building2, Shield, Database, FileCode2,
  Calendar, Zap, Settings
} from 'lucide-react';
import type { GeneratedModule } from './AppStoreManager';

interface GeneratedModulesProps {
  modules: GeneratedModule[];
  loading: boolean;
  onRefresh: () => void;
}

export const GeneratedModules: React.FC<GeneratedModulesProps> = ({
  modules,
  loading,
  onRefresh
}) => {
  const [selectedModule, setSelectedModule] = useState<GeneratedModule | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteModule = async (moduleId: string) => {
    if (!confirm('¿Estás seguro de eliminar este módulo generado?')) return;

    setDeleting(moduleId);
    try {
      const { error } = await supabase
        .from('generated_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      toast.success('Módulo eliminado');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast.error('Error al eliminar el módulo');
    } finally {
      setDeleting(null);
    }
  };

  const publishModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('generated_modules')
        .update({ is_published: true })
        .eq('id', moduleId);

      if (error) throw error;
      toast.success('Módulo publicado');
      onRefresh();
    } catch (error: any) {
      console.error('Error publishing module:', error);
      toast.error('Error al publicar el módulo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <Puzzle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No hay módulos generados</h3>
        <p className="text-sm text-muted-foreground">
          Usa el generador CNAE para crear módulos sectoriales
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {modules.length} módulo(s) generado(s)
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {modules.map(module => (
            <Card key={module.id} className="relative">
              {module.ai_generated && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Puzzle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{module.module_name}</CardTitle>
                    <CardDescription className="text-xs">
                      CNAE: {module.cnae_code} • {module.module_key}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {module.sector_name && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                      <Building2 className="h-3 w-3 mr-1" />
                      {module.sector_name}
                    </Badge>
                  )}
                  {module.is_published ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Publicado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Borrador
                    </Badge>
                  )}
                </div>

                {module.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {module.components && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {(module.components as any[]).length} componentes
                    </span>
                  )}
                  {module.regulations && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {(module.regulations as any[]).length} regulaciones
                    </span>
                  )}
                  {module.kpis && (
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {(module.kpis as any[]).length} KPIs
                    </span>
                  )}
                </div>

                {module.created_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(module.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedModule(module)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  {!module.is_published && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => publishModule(module.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Publicar
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteModule(module.id)}
                    disabled={deleting === module.id}
                  >
                    {deleting === module.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Module Detail Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-purple-500" />
              {selectedModule?.module_name}
            </DialogTitle>
            <DialogDescription>
              CNAE: {selectedModule?.cnae_code} • {selectedModule?.sector_name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {selectedModule?.description && (
                <div>
                  <h4 className="font-medium mb-1">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{selectedModule.description}</p>
                </div>
              )}

              <Accordion type="single" collapsible className="w-full">
                {selectedModule?.components && (
                  <AccordionItem value="components">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Componentes ({(selectedModule.components as any[]).length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {(selectedModule.components as any[]).map((comp: any, i: number) => (
                          <div key={i} className="p-2 rounded bg-muted/50">
                            <p className="font-medium text-sm">{comp.name || comp}</p>
                            {comp.description && (
                              <p className="text-xs text-muted-foreground">{comp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedModule?.regulations && (
                  <AccordionItem value="regulations">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Regulaciones ({(selectedModule.regulations as any[]).length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {(selectedModule.regulations as any[]).map((reg: any, i: number) => (
                          <div key={i} className="p-2 rounded bg-red-500/5 border border-red-500/20">
                            <p className="font-medium text-sm">{reg.name || reg}</p>
                            {reg.description && (
                              <p className="text-xs text-muted-foreground">{reg.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedModule?.kpis && (
                  <AccordionItem value="kpis">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        KPIs ({(selectedModule.kpis as any[]).length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {(selectedModule.kpis as any[]).map((kpi: any, i: number) => (
                          <div key={i} className="p-2 rounded bg-blue-500/5 border border-blue-500/20">
                            <p className="font-medium text-sm">{kpi.name || kpi}</p>
                            {kpi.formula && (
                              <code className="text-xs bg-muted px-1 rounded">{kpi.formula}</code>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedModule?.accounting_ratios && (
                  <AccordionItem value="ratios">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <FileCode2 className="h-4 w-4" />
                        Ratios Contables
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedModule.accounting_ratios, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedModule?.visit_form_config && (
                  <AccordionItem value="visit-form">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configuración Ficha Visita
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedModule.visit_form_config, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {selectedModule?.generation_metadata && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  <p><strong>Metadatos de generación:</strong></p>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(selectedModule.generation_metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
