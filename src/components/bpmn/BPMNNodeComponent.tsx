import { Play, Square, Diamond, Circle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BPMNNode } from '@/types/bpmn';

interface BPMNNodeComponentProps {
  node: BPMNNode;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onConnect: () => void;
}

const BPMNNodeComponent = ({ 
  node, 
  isSelected, 
  isDragging, 
  onMouseDown,
  onConnect 
}: BPMNNodeComponentProps) => {
  const getNodeStyle = () => {
    switch (node.type) {
      case 'start':
        return {
          width: 40,
          height: 40,
          className: 'rounded-full bg-green-500 border-2 border-green-600',
          icon: <Play className="h-5 w-5 text-white" />
        };
      case 'end':
        return {
          width: 40,
          height: 40,
          className: 'rounded-full bg-red-500 border-4 border-red-600',
          icon: <Circle className="h-4 w-4 text-white" />
        };
      case 'task':
        return {
          width: 120,
          height: 50,
          className: 'rounded-lg bg-blue-500 border-2 border-blue-600',
          icon: <Square className="h-4 w-4 text-white" />
        };
      case 'gateway_xor':
        return {
          width: 50,
          height: 50,
          className: 'rotate-45 bg-amber-500 border-2 border-amber-600',
          icon: <span className="-rotate-45 text-white font-bold text-lg">X</span>
        };
      case 'gateway_and':
        return {
          width: 50,
          height: 50,
          className: 'rotate-45 bg-purple-500 border-2 border-purple-600',
          icon: <span className="-rotate-45 text-white font-bold text-lg">+</span>
        };
      case 'gateway_or':
        return {
          width: 50,
          height: 50,
          className: 'rotate-45 bg-cyan-500 border-2 border-cyan-600',
          icon: <span className="-rotate-45 text-white font-bold text-lg">O</span>
        };
      default:
        return {
          width: 100,
          height: 50,
          className: 'rounded bg-muted border',
          icon: null
        };
    }
  };

  const style = getNodeStyle();
  const isGateway = node.type.startsWith('gateway');
  const isEvent = node.type === 'start' || node.type === 'end';

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center cursor-grab select-none transition-shadow',
        style.className,
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'cursor-grabbing shadow-xl scale-105'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: style.width,
        height: style.height,
        zIndex: isDragging ? 100 : isSelected ? 50 : 10
      }}
      onMouseDown={onMouseDown}
    >
      {/* Icon or label */}
      {isEvent || isGateway ? (
        style.icon
      ) : (
        <div className="flex flex-col items-center justify-center text-white text-xs font-medium px-2 text-center">
          {node.label}
          {node.config?.sla_hours && (
            <span className="text-[10px] opacity-75">{node.config.sla_hours}h SLA</span>
          )}
        </div>
      )}

      {/* Connection button */}
      {isSelected && node.type !== 'end' && (
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "absolute h-6 w-6 rounded-full shadow-lg",
            isGateway ? "-rotate-45 -right-4 top-1/2 -translate-y-1/2" : "-right-3 top-1/2 -translate-y-1/2"
          )}
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
        >
          <ArrowRight className={cn("h-3 w-3", isGateway && "rotate-45")} />
        </Button>
      )}

      {/* Label below for events/gateways */}
      {(isEvent || isGateway) && (
        <div 
          className={cn(
            "absolute text-xs text-muted-foreground whitespace-nowrap",
            isGateway ? "-rotate-45 -bottom-8 left-1/2 -translate-x-1/2" : "-bottom-6 left-1/2 -translate-x-1/2"
          )}
        >
          {node.label}
        </div>
      )}
    </div>
  );
};

export default BPMNNodeComponent;
