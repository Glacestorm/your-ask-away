import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Trash2, AlertTriangle, TrendingUp, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useDafoAnalysis } from '@/hooks/useStrategicPlanning';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const CATEGORY_CONFIG = {
  strengths: { label: 'Fortalezas', icon: ThumbsUp, color: 'bg-green-500/10 border-green-500/30 text-green-700' },
  weaknesses: { label: 'Debilidades', icon: ThumbsDown, color: 'bg-red-500/10 border-red-500/30 text-red-700' },
  opportunities: { label: 'Oportunidades', icon: TrendingUp, color: 'bg-blue-500/10 border-blue-500/30 text-blue-700' },
  threats: { label: 'Amenazas', icon: AlertTriangle, color: 'bg-orange-500/10 border-orange-500/30 text-orange-700' }
};

export function DafoBoard() {
  const { analyses, items, currentAnalysis, setCurrentAnalysis, createAnalysis, fetchItems, addItem, deleteItem, isLoading } = useDafoAnalysis();
  const [isCreating, setIsCreating] = useState(false);
  const [newAnalysisName, setNewAnalysisName] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ description: '', importance: 5, concept: '', action_plan: '' });

  const handleCreateAnalysis = async () => {
    if (!newAnalysisName.trim()) return;
    const analysis = await createAnalysis({ project_name: newAnalysisName });
    setCurrentAnalysis(analysis);
    setNewAnalysisName('');
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
          <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> Generar con IA</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(category => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const categoryItems = getItemsByCategory(category);
          
          return (
            <Card key={category} className={`${config.color} border`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2"><Icon className="h-5 w-5" />{config.label}</span>
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
