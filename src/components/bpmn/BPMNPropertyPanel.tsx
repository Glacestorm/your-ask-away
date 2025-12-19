import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
import { BPMNNode, BPMNEdge } from '@/types/bpmn';

interface BPMNPropertyPanelProps {
  selectedNode: BPMNNode | null;
  selectedEdge: BPMNEdge | null;
  onUpdateNode: (updates: Partial<BPMNNode>) => void;
  onUpdateEdge: (updates: Partial<BPMNEdge>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const BPMNPropertyPanel = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge
}: BPMNPropertyPanelProps) => {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">Selecciona un elemento para ver sus propiedades</p>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-3">Conexión</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Etiqueta</Label>
              <Input
                value={selectedEdge.label || ''}
                onChange={(e) => onUpdateEdge({ label: e.target.value })}
                placeholder="Ej: Aprobado, Rechazado..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Condición (opcional)</Label>
              <Textarea
                value={selectedEdge.condition || ''}
                onChange={(e) => onUpdateEdge({ condition: e.target.value })}
                placeholder="Ej: ${status} == 'approved'"
                className="mt-1 text-xs font-mono"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa ${'{variable}'} para variables del proceso
              </p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDeleteEdge(selectedEdge.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar conexión
        </Button>
      </div>
    );
  }

  if (selectedNode) {
    const isTask = selectedNode.type === 'task';
    const isGateway = selectedNode.type.startsWith('gateway');
    const isEvent = selectedNode.type === 'start' || selectedNode.type === 'end';

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-3">
            {isEvent ? 'Evento' : isGateway ? 'Gateway' : 'Tarea'}
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input
                value={selectedNode.label}
                onChange={(e) => onUpdateNode({ label: e.target.value })}
                className="mt-1"
              />
            </div>

            {isTask && (
              <>
                <Separator />
                <h4 className="font-medium text-xs flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  SLA
                </h4>
                <div>
                  <Label className="text-xs">Tiempo máximo (horas)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={selectedNode.config?.sla_hours || ''}
                    onChange={(e) => onUpdateNode({ 
                      config: { 
                        ...selectedNode.config, 
                        sla_hours: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    })}
                    className="mt-1"
                    placeholder="24"
                  />
                </div>

                <Separator />
                <h4 className="font-medium text-xs flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Escalado
                </h4>
                <div>
                  <Label className="text-xs">Escalar después de (horas)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={selectedNode.config?.escalation_hours || ''}
                    onChange={(e) => onUpdateNode({ 
                      config: { 
                        ...selectedNode.config, 
                        escalation_hours: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    })}
                    className="mt-1"
                    placeholder="36"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Avance automático</Label>
                  <Switch
                    checked={selectedNode.config?.auto_advance || false}
                    onCheckedChange={(checked) => onUpdateNode({ 
                      config: { ...selectedNode.config, auto_advance: checked } 
                    })}
                  />
                </div>
              </>
            )}

            {isGateway && (
              <p className="text-xs text-muted-foreground">
                {selectedNode.type === 'gateway_xor' && 'Solo se activa un camino de salida'}
                {selectedNode.type === 'gateway_and' && 'Se activan todos los caminos en paralelo'}
                {selectedNode.type === 'gateway_or' && 'Se activan uno o más caminos'}
              </p>
            )}
          </div>
        </div>

        {!isEvent && (
          <>
            <Separator />
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onDeleteNode(selectedNode.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar {isTask ? 'tarea' : 'gateway'}
            </Button>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default BPMNPropertyPanel;
