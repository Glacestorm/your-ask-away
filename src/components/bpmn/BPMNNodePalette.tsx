import { Button } from '@/components/ui/button';
import { Play, Square, Diamond, Circle, GitBranch, Merge } from 'lucide-react';
import { BPMNNodeType } from '@/types/bpmn';

interface BPMNNodePaletteProps {
  onAddNode: (type: BPMNNodeType) => void;
}

const nodeTypes: Array<{
  type: BPMNNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: 'task',
    label: 'Tarea',
    description: 'Estado o actividad del proceso',
    icon: <Square className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  {
    type: 'gateway_xor',
    label: 'Gateway XOR',
    description: 'Solo un camino (exclusivo)',
    icon: <Diamond className="h-5 w-5 rotate-45" />,
    color: 'bg-amber-500'
  },
  {
    type: 'gateway_and',
    label: 'Gateway AND',
    description: 'Todos los caminos (paralelo)',
    icon: <GitBranch className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  {
    type: 'gateway_or',
    label: 'Gateway OR',
    description: 'Uno o más caminos (inclusivo)',
    icon: <Merge className="h-5 w-5" />,
    color: 'bg-cyan-500'
  },
  {
    type: 'start',
    label: 'Evento Inicio',
    description: 'Punto de inicio del proceso',
    icon: <Play className="h-5 w-5" />,
    color: 'bg-green-500'
  },
  {
    type: 'end',
    label: 'Evento Fin',
    description: 'Punto final del proceso',
    icon: <Circle className="h-5 w-5" />,
    color: 'bg-red-500'
  }
];

const BPMNNodePalette = ({ onAddNode }: BPMNNodePaletteProps) => {
  return (
    <div className="space-y-2">
      {nodeTypes.map((nodeType) => (
        <Button
          key={nodeType.type}
          variant="outline"
          className="w-full justify-start h-auto py-2 px-3"
          onClick={() => onAddNode(nodeType.type)}
        >
          <div className={`${nodeType.color} rounded p-1.5 mr-3 text-white`}>
            {nodeType.icon}
          </div>
          <div className="text-left">
            <div className="font-medium text-sm">{nodeType.label}</div>
            <div className="text-xs text-muted-foreground">{nodeType.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default BPMNNodePalette;
