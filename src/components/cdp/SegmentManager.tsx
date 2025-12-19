import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, RefreshCw, Users, Filter, Trash2 } from 'lucide-react';
import { useSegmentRules, SegmentCondition } from '@/hooks/useSegmentRules';

export function SegmentManager() {
  const { segments, isLoading, createSegment, refreshSegment, deleteSegment, fieldOptions } = useSegmentRules();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    conditions: [] as SegmentCondition[],
  });
  const [newCondition, setNewCondition] = useState<Partial<SegmentCondition>>({
    field: '',
    operator: 'equals',
    value: '',
  });

  const addCondition = () => {
    if (newCondition.field && newCondition.operator) {
      setNewSegment(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCondition as SegmentCondition],
      }));
      setNewCondition({ field: '', operator: 'equals', value: '' });
    }
  };

  const handleCreate = () => {
    createSegment({
      name: newSegment.name,
      description: newSegment.description,
      rule_type: 'dynamic',
      conditions: newSegment.conditions,
      condition_logic: 'AND',
      is_active: true,
      auto_enroll_journeys: [],
      tags: [],
    });
    setIsCreateOpen(false);
    setNewSegment({ name: '', description: '', conditions: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Segmentación
          </h2>
          <p className="text-muted-foreground">
            Crea segmentos dinámicos basados en reglas
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Segmento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Segmento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Clientes Premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del segmento..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Condiciones</Label>
                <div className="flex gap-2">
                  <Select value={newCondition.field} onValueChange={(v) => setNewCondition(prev => ({ ...prev, field: v }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newCondition.operator} onValueChange={(v: any) => setNewCondition(prev => ({ ...prev, operator: v }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">=</SelectItem>
                      <SelectItem value="not_equals">≠</SelectItem>
                      <SelectItem value="greater_than">&gt;</SelectItem>
                      <SelectItem value="less_than">&lt;</SelectItem>
                      <SelectItem value="contains">Contiene</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-24"
                    value={newCondition.value as string}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Valor"
                  />
                  <Button size="icon" onClick={addCondition}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newSegment.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSegment.conditions.map((c, i) => (
                      <Badge key={i} variant="secondary">
                        {c.field} {c.operator} {c.value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={!newSegment.name || newSegment.conditions.length === 0}>
                Crear Segmento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando segmentos...</div>
      ) : segments.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Sin segmentos</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer segmento de clientes</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Segmento
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  <Badge variant={segment.is_active ? 'default' : 'secondary'}>
                    {segment.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <CardDescription>{segment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Users className="h-4 w-4" />
                  {segment.member_count} miembros
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => refreshSegment(segment.id)}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refrescar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteSegment(segment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
