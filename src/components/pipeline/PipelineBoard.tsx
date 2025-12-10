import { useState } from 'react';
import { useOpportunities, Opportunity, OpportunityStage, usePipelineStats } from '@/hooks/useOpportunities';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityForm } from './OpportunityForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Filter, TrendingUp, DollarSign, Target, Trophy, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageColumn {
  id: OpportunityStage;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const stageColumns: StageColumn[] = [
  { id: 'discovery', label: 'Descubrimiento', icon: <Search className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'proposal', label: 'Propuesta', icon: <Target className="h-4 w-4" />, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950' },
  { id: 'negotiation', label: 'Negociación', icon: <TrendingUp className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  { id: 'won', label: 'Ganadas', icon: <Trophy className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' },
  { id: 'lost', label: 'Perdidas', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950' },
];

export function PipelineBoard() {
  const { opportunities, isLoading, createOpportunity, updateOpportunity, deleteOpportunity, moveStage } = useOpportunities();
  const stats = usePipelineStats();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [viewOpportunity, setViewOpportunity] = useState<Opportunity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [pendingLostId, setPendingLostId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');

  const filteredOpportunities = opportunities.filter(o => 
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOpportunitiesByStage = (stage: OpportunityStage) => 
    filteredOpportunities.filter(o => o.stage === stage);

  const getStageValue = (stage: OpportunityStage) => 
    getOpportunitiesByStage(stage).reduce((sum, o) => sum + (o.estimated_value || 0), 0);

  const handleEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormOpen(true);
  };

  const handleSubmit = (data: Partial<Opportunity>) => {
    if (data.id) {
      updateOpportunity.mutate(data as Opportunity);
    } else {
      createOpportunity.mutate(data);
    }
  };

  const handleMoveStage = (id: string, stage: OpportunityStage) => {
    if (stage === 'lost') {
      setPendingLostId(id);
      setLostDialogOpen(true);
    } else {
      moveStage.mutate({ id, stage });
    }
  };

  const confirmLost = () => {
    if (pendingLostId) {
      moveStage.mutate({ id: pendingLostId, stage: 'lost', lostReason });
    }
    setLostDialogOpen(false);
    setPendingLostId(null);
    setLostReason('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor Ponderado</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(stats.weightedValue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ganadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(stats.wonValue)}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setSelectedOpportunity(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Oportunidad
        </Button>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stageColumns.map((stage) => {
          const stageOpps = getOpportunitiesByStage(stage.id);
          const stageValue = getStageValue(stage.id);
          
          return (
            <Card key={stage.id} className={cn("min-h-[400px]", stage.bgColor)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className={cn("flex items-center gap-2", stage.color)}>
                    {stage.icon}
                    {stage.label}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {stageOpps.length}
                  </Badge>
                </CardTitle>
                {stageValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(stageValue)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[350px] pr-2">
                  <div className="space-y-2">
                    {stageOpps.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteId(id)}
                        onView={setViewOpportunity}
                        onMoveStage={handleMoveStage}
                      />
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Sin oportunidades
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <OpportunityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        opportunity={selectedOpportunity}
        onSubmit={handleSubmit}
      />

      {/* View Dialog */}
      <Dialog open={!!viewOpportunity} onOpenChange={() => setViewOpportunity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewOpportunity?.title}</DialogTitle>
          </DialogHeader>
          {viewOpportunity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{viewOpportunity.company?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Etapa</p>
                  <p className="font-medium capitalize">{viewOpportunity.stage}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium">
                    {viewOpportunity.estimated_value 
                      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(viewOpportunity.estimated_value)
                      : 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Probabilidad</p>
                  <p className="font-medium">{viewOpportunity.probability}%</p>
                </div>
              </div>
              {viewOpportunity.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Descripción</p>
                  <p className="text-sm mt-1">{viewOpportunity.description}</p>
                </div>
              )}
              {viewOpportunity.lost_reason && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Motivo de pérdida</p>
                  <p className="text-sm mt-1">{viewOpportunity.lost_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar oportunidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La oportunidad será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteOpportunity.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lost Reason Dialog */}
      <AlertDialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Por qué se perdió esta oportunidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Indica el motivo para futuras referencias y análisis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={lostReason} onValueChange={setLostReason}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un motivo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Precio">Precio no competitivo</SelectItem>
              <SelectItem value="Competencia">Eligió competencia</SelectItem>
              <SelectItem value="Timing">No es el momento adecuado</SelectItem>
              <SelectItem value="Requisitos">No cumple requisitos</SelectItem>
              <SelectItem value="Presupuesto">Sin presupuesto</SelectItem>
              <SelectItem value="Otro">Otro motivo</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingLostId(null); setLostReason(''); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost} disabled={!lostReason}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
