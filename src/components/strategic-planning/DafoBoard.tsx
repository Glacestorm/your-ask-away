import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Trash2, AlertTriangle, TrendingUp, ThumbsDown, ThumbsUp, Loader2, Check, X, FileDown, FileSpreadsheet } from 'lucide-react';
import { useDafoAnalysis } from '@/hooks/useStrategicPlanning';
import { useStrategicAI } from '@/hooks/useStrategicAI';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { InfoTooltip, DAFO_TOOLTIPS } from '@/components/ui/info-tooltip';
import { toast } from 'sonner';
import { generateDafoPDF, downloadPDF, printPDF } from './PDFGenerator';
import { exportDafoToExcel } from '@/lib/excelExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CATEGORY_CONFIG = {
  strengths: { label: 'Fortalezas', icon: ThumbsUp, color: 'bg-green-500/10 border-green-500/30 text-green-700', tooltipKey: 'strengths' as const },
  weaknesses: { label: 'Debilidades', icon: ThumbsDown, color: 'bg-red-500/10 border-red-500/30 text-red-700', tooltipKey: 'weaknesses' as const },
  opportunities: { label: 'Oportunidades', icon: TrendingUp, color: 'bg-blue-500/10 border-blue-500/30 text-blue-700', tooltipKey: 'opportunities' as const },
  threats: { label: 'Amenazas', icon: AlertTriangle, color: 'bg-orange-500/10 border-orange-500/30 text-orange-700', tooltipKey: 'threats' as const }
};

interface AISuggestion {
  category: string;
  description: string;
  importance: number;
  action_plan?: string;
  concept?: string;
}

export function DafoBoard() {
  const { analyses, items, currentAnalysis, setCurrentAnalysis, createAnalysis, fetchItems, addItem, deleteItem, isLoading } = useDafoAnalysis();
  const { generateDAFOSuggestions, isLoading: isAILoading } = useStrategicAI();
  const [isCreating, setIsCreating] = useState(false);
  const [newAnalysisName, setNewAnalysisName] = useState('');
  const [newAnalysisDescription, setNewAnalysisDescription] = useState('');
  const [newAnalysisSector, setNewAnalysisSector] = useState('general');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ description: '', importance: 5, concept: '', action_plan: '' });
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleCreateAnalysis = async () => {
    if (!newAnalysisName.trim()) return;
    const analysis = await createAnalysis({ 
      project_name: newAnalysisName,
      description: newAnalysisDescription,
      sector_key: newAnalysisSector
    });
    setCurrentAnalysis(analysis);
    setNewAnalysisName('');
    setNewAnalysisDescription('');
    setIsCreating(false);
  };

  const handleSelectAnalysis = async (analysis: typeof analyses[0]) => {
    setCurrentAnalysis(analysis);
    await fetchItems(analysis.id);
  };

  const handleAddItem = async (category: string) => {
    if (!currentAnalysis || !newItem.description.trim()) return;
    await addItem(currentAnalysis.id, { ...newItem, category });
    setNewItem({ description: '', importance: 5, concept: '', action_plan: '' });
    setAddingTo(null);
  };

  const handleGenerateWithAI = async () => {
    if (!currentAnalysis) return;
    
    try {
      const existingItems = items.map(i => ({
        category: i.category,
        description: i.description
      }));

      const suggestions = await generateDAFOSuggestions(
        currentAnalysis.sector_key || 'general',
        currentAnalysis.description || currentAnalysis.project_name,
        existingItems
      );

      if (suggestions && suggestions.length > 0) {
        // Flatten the nested items structure from DAFOSuggestion
        const mappedSuggestions: AISuggestion[] = suggestions.flatMap(s => 
          s.items.map(item => ({
            category: s.category,
            description: item.description || item.concept || '',
            importance: item.importance || 5,
            action_plan: item.action_plan,
            concept: item.concept
          }))
        );
        setAiSuggestions(mappedSuggestions);
        setShowSuggestions(true);
        toast.success(`Se generaron ${mappedSuggestions.length} sugerencias`);
      } else {
        toast.info('No se generaron sugerencias adicionales');
      }
    } catch (error) {
      toast.error('Error al generar sugerencias');
    }
  };

  const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
    if (!currentAnalysis) return;
    await addItem(currentAnalysis.id, {
      category: suggestion.category,
      description: suggestion.description,
      importance: suggestion.importance,
      action_plan: suggestion.action_plan || ''
    });
    setAiSuggestions(prev => prev.filter(s => s.description !== suggestion.description));
    toast.success('Sugerencia aceptada');
  };

  const handleRejectSuggestion = (suggestion: AISuggestion) => {
    setAiSuggestions(prev => prev.filter(s => s.description !== suggestion.description));
  };

  const handleAcceptAll = async () => {
    if (!currentAnalysis) return;
    for (const suggestion of aiSuggestions) {
      await addItem(currentAnalysis.id, {
        category: suggestion.category,
        description: suggestion.description,
        importance: suggestion.importance,
        action_plan: suggestion.action_plan || ''
      });
    }
    setAiSuggestions([]);
    setShowSuggestions(false);
    toast.success('Todas las sugerencias aceptadas');
  };

  const getItemsByCategory = (category: string) => items.filter(i => i.category === category);

  if (!currentAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar o Crear Análisis DAFO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map(analysis => (
              <Card key={analysis.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectAnalysis(analysis)}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{analysis.project_name}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(analysis.created_at).toLocaleDateString()}</p>
                  <Badge variant="outline" className="mt-2">{analysis.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Análisis DAFO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Análisis DAFO</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nombre del Proyecto</Label><Input value={newAnalysisName} onChange={e => setNewAnalysisName(e.target.value)} placeholder="Ej: Plan Estratégico 2025" /></div>
                <div><Label>Descripción (para IA)</Label><Textarea value={newAnalysisDescription} onChange={e => setNewAnalysisDescription(e.target.value)} placeholder="Describe brevemente tu negocio para mejorar las sugerencias de IA..." /></div>
                <div>
                  <Label>Sector</Label>
                  <select 
                    value={newAnalysisSector} 
                    onChange={e => setNewAnalysisSector(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="general">General</option>
                    <option value="retail">Retail/Comercio</option>
                    <option value="servicios">Servicios</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="manufactura">Manufactura</option>
                    <option value="hosteleria">Hostelería</option>
                    <option value="construccion">Construcción</option>
                  </select>
                </div>
                <Button onClick={handleCreateAnalysis} disabled={!newAnalysisName.trim()}>Crear Análisis</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{currentAnalysis.project_name}</h2>
          <p className="text-sm text-muted-foreground">{currentAnalysis.description || 'Sin descripción'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentAnalysis(null)}>Cambiar</Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateWithAI}
            disabled={isAILoading}
          >
            {isAILoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generar con IA
          </Button>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const doc = generateDafoPDF(currentAnalysis.project_name, currentAnalysis.description || '', items);
                downloadPDF(doc, `${currentAnalysis.project_name}_DAFO.pdf`);
                toast.success('PDF descargado');
              }}>
                <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const doc = generateDafoPDF(currentAnalysis.project_name, currentAnalysis.description || '', items);
                printPDF(doc);
              }}>
                <FileDown className="h-4 w-4 mr-2" /> Imprimir PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportDafoToExcel(currentAnalysis.project_name, items);
                toast.success('Excel descargado');
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Sugerencias IA ({aiSuggestions.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAcceptAll}>
                  <Check className="h-3 w-3 mr-1" /> Aceptar todas
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSuggestions(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiSuggestions.map((suggestion, idx) => {
              const config = CATEGORY_CONFIG[suggestion.category as keyof typeof CATEGORY_CONFIG];
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                  <Badge className={config?.color || 'bg-muted'}>{config?.label || suggestion.category}</Badge>
                  <div className="flex-1">
                    <p className="text-sm">{suggestion.description}</p>
                    {suggestion.action_plan && (
                      <p className="text-xs text-muted-foreground mt-1">Plan: {suggestion.action_plan}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleAcceptSuggestion(suggestion)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleRejectSuggestion(suggestion)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(category => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const categoryItems = getItemsByCategory(category);
          const tooltipData = DAFO_TOOLTIPS[config.tooltipKey];
          
          return (
            <Card key={category} className={`${config.color} border`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {config.label}
                    <InfoTooltip {...tooltipData} />
                  </span>
                  <Badge variant="secondary">{categoryItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryItems.map(item => (
                  <div key={item.id} className="bg-background/80 p-3 rounded-lg border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{item.description}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">Imp: {item.importance}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteItem(item.id, currentAnalysis.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {item.action_plan && <p className="text-xs text-muted-foreground">Plan: {item.action_plan}</p>}
                  </div>
                ))}
                
                {addingTo === category ? (
                  <div className="bg-background p-3 rounded-lg border space-y-3">
                    <Textarea placeholder="Descripción..." value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} className="min-h-[60px]" />
                    <div className="space-y-2">
                      <Label className="text-xs">Importancia: {newItem.importance}</Label>
                      <Slider value={[newItem.importance]} onValueChange={([v]) => setNewItem(p => ({ ...p, importance: v }))} min={1} max={10} step={1} />
                    </div>
                    <Input placeholder="Plan de acción (opcional)" value={newItem.action_plan} onChange={e => setNewItem(p => ({ ...p, action_plan: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddItem(category)}>Añadir</Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingTo(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="w-full gap-2" onClick={() => setAddingTo(category)}>
                    <Plus className="h-4 w-4" /> Añadir {config.label.slice(0, -1)}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
