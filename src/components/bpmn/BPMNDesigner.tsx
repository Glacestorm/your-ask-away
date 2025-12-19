import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { BPMNNode, BPMNEdge, BPMNNodeType, BPMNEntityType, SLAConfig, EscalationRule } from '@/types/bpmn';
import { useProcessDefinitions } from '@/hooks/useProcessDefinitions';
import BPMNCanvas from './BPMNCanvas';
import BPMNNodePalette from './BPMNNodePalette';
import BPMNPropertyPanel from './BPMNPropertyPanel';

interface BPMNDesignerProps {
  definitionId?: string;
  entityType?: string;
  onSave?: (definition: any) => void;
}

const BPMNDesigner = ({ definitionId, entityType = 'opportunity', onSave }: BPMNDesignerProps) => {
  const { createDefinition, updateDefinition } = useProcessDefinitions();
  
  const [name, setName] = useState('Nuevo Proceso');
  const [description] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<BPMNEntityType>(entityType as BPMNEntityType);
  const [nodes, setNodes] = useState<BPMNNode[]>([
    { id: 'start-1', type: 'start', label: 'Inicio', position: { x: 100, y: 200 } },
    { id: 'end-1', type: 'end', label: 'Fin', position: { x: 600, y: 200 } }
  ]);
  const [edges, setEdges] = useState<BPMNEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<BPMNNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<BPMNEdge | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleAddNode = useCallback((type: BPMNNodeType) => {
    const newNode: BPMNNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: type === 'task' ? 'Nueva Tarea' : 
             type === 'gateway_xor' ? 'Decisión XOR' :
             type === 'gateway_and' ? 'Paralelo AND' :
             type === 'gateway_or' ? 'Inclusivo OR' : type,
      position: { x: 300 + Math.random() * 100, y: 150 + Math.random() * 100 },
      config: type === 'task' ? { sla_hours: 24 } : {}
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
  }, []);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  }, []);

  const handleNodeSelect = useCallback((node: BPMNNode | null) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    
    if (isConnecting && connectingFrom && node && node.id !== connectingFrom) {
      // Create edge
      const newEdge: BPMNEdge = {
        id: `edge-${Date.now()}`,
        source: connectingFrom,
        target: node.id
      };
      setEdges(prev => [...prev, newEdge]);
      setIsConnecting(false);
      setConnectingFrom(null);
      toast.success('Conexión creada');
    }
  }, [isConnecting, connectingFrom]);

  const handleStartConnection = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectingFrom(nodeId);
    toast.info('Selecciona el nodo destino');
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelectedEdge(null);
  }, []);

  const handleUpdateNode = useCallback((updates: Partial<BPMNNode>) => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(node => 
      node.id === selectedNode.id ? { ...node, ...updates } : node
    ));
    setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
  }, [selectedNode]);

  const handleUpdateEdge = useCallback((updates: Partial<BPMNEdge>) => {
    if (!selectedEdge) return;
    setEdges(prev => prev.map(edge => 
      edge.id === selectedEdge.id ? { ...edge, ...updates } : edge
    ));
    setSelectedEdge(prev => prev ? { ...prev, ...updates } : null);
  }, [selectedEdge]);

  const handleSave = async () => {
    // Build SLA config from nodes (matching SLAConfig type)
    const slaConfig: SLAConfig = {};
    nodes.forEach(node => {
      if (node.config?.sla_hours) {
        slaConfig[node.id] = {
          maxDuration: node.config.sla_hours,
          warningAt: 80, // Default warning at 80%
          escalateAfter: node.config.escalation_hours
        };
      }
    });

    // Build escalation rules
    const escalationRules: EscalationRule[] = nodes
      .filter(n => n.config?.escalation_hours)
      .map(n => ({
        condition: 'sla_breach' as const,
        escalateTo: n.config?.escalation_to || [],
        notifyVia: ['notification' as const, 'email' as const],
        message: `SLA breach on node ${n.label}`
      }));

    const definition = {
      name,
      description,
      entity_type: selectedEntityType,
      nodes,
      edges,
      sla_config: slaConfig,
      escalation_rules: escalationRules,
      is_active: true
    };

    try {
      if (definitionId) {
        await updateDefinition({ id: definitionId, ...definition });
      } else {
        await createDefinition(definition);
      }
      toast.success('Proceso guardado correctamente');
      onSave?.(definition);
    } catch (error) {
      toast.error('Error al guardar el proceso');
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Panel - Node Palette */}
      <Card className="w-64 shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Elementos BPMN
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <BPMNNodePalette onAddNode={handleAddNode} />
        </CardContent>
      </Card>

      {/* Center - Canvas */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold text-lg w-64"
                placeholder="Nombre del proceso"
              />
              <Select value={selectedEntityType} onValueChange={(v) => setSelectedEntityType(v as BPMNEntityType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunity">Oportunidad</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="task">Tarea</SelectItem>
                  <SelectItem value="quote">Presupuesto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {isConnecting && (
                <Button variant="outline" size="sm" onClick={() => { setIsConnecting(false); setConnectingFrom(null); }}>
                  Cancelar conexión
                </Button>
              )}
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <BPMNCanvas
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            isConnecting={isConnecting}
            onNodeSelect={handleNodeSelect}
            onNodeMove={handleNodeMove}
            onEdgeSelect={setSelectedEdge}
            onStartConnection={handleStartConnection}
          />
        </CardContent>
      </Card>

      {/* Right Panel - Properties */}
      <Card className="w-72 shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <BPMNPropertyPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BPMNDesigner;
