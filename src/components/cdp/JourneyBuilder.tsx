import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Play, Pause, Trash2, Mail, MessageSquare, Phone, 
  Clock, GitBranch, Target, Users, Zap, ArrowRight
} from 'lucide-react';
import { useCustomerJourneys, CustomerJourney } from '@/hooks/useCustomerJourneys';

const STEP_TYPES = [
  { value: 'send_email', label: 'Enviar Email', icon: Mail, color: 'bg-blue-500' },
  { value: 'send_sms', label: 'Enviar SMS', icon: MessageSquare, color: 'bg-green-500' },
  { value: 'send_whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-emerald-500' },
  { value: 'call', label: 'Llamar', icon: Phone, color: 'bg-purple-500' },
  { value: 'delay', label: 'Esperar', icon: Clock, color: 'bg-yellow-500' },
  { value: 'condition', label: 'Condición', icon: GitBranch, color: 'bg-orange-500' },
];

export function JourneyBuilder() {
  const { journeys, isLoading, createJourney, activateJourney, pauseJourney, deleteJourney } = useCustomerJourneys();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newJourney, setNewJourney] = useState({
    name: '',
    description: '',
    trigger_type: 'manual' as const,
  });

  const handleCreate = () => {
    createJourney({
      name: newJourney.name,
      description: newJourney.description,
      trigger_type: newJourney.trigger_type,
      trigger_config: {},
      status: 'draft',
      exit_conditions: [],
      goals: [],
    });
    setIsCreateOpen(false);
    setNewJourney({ name: '', description: '', trigger_type: 'manual' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Journey Builder
          </h2>
          <p className="text-muted-foreground">
            Diseña journeys automatizados para tus clientes
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Journey
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Journey</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newJourney.name}
                  onChange={(e) => setNewJourney(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Onboarding nuevos clientes"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={newJourney.description}
                  onChange={(e) => setNewJourney(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este journey..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Trigger</Label>
                <Select
                  value={newJourney.trigger_type}
                  onValueChange={(v: any) => setNewJourney(prev => ({ ...prev, trigger_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="event">Por Evento</SelectItem>
                    <SelectItem value="segment">Por Segmento</SelectItem>
                    <SelectItem value="schedule">Programado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newJourney.name}>
                Crear Journey
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando journeys...</div>
      ) : journeys.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Sin journeys</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer journey automatizado</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Journey
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <Card key={journey.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{journey.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {journey.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(journey.status)}>
                    {journey.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {journey.stats?.enrolled || 0} inscritos
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {journey.stats?.converted || 0} convertidos
                  </div>
                </div>
                <div className="flex gap-2">
                  {journey.status === 'active' ? (
                    <Button size="sm" variant="outline" onClick={() => pauseJourney(journey.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => activateJourney(journey.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Activar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteJourney(journey.id)}>
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
