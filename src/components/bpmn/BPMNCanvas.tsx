import { useRef, useState, useCallback, useEffect } from 'react';
import { BPMNNode, BPMNEdge } from '@/types/bpmn';
import BPMNNodeComponent from './BPMNNodeComponent';

interface BPMNCanvasProps {
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  selectedNode: BPMNNode | null;
  selectedEdge: BPMNEdge | null;
  isConnecting: boolean;
  onNodeSelect: (node: BPMNNode | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onEdgeSelect: (edge: BPMNEdge | null) => void;
  onStartConnection: (nodeId: string) => void;
}

const BPMNCanvas = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  isConnecting,
  onNodeSelect,
  onNodeMove,
  onEdgeSelect,
  onStartConnection
}: BPMNCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, node: BPMNNode) => {
    if (isConnecting) {
      onNodeSelect(node);
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragging(node.id);
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y
    });
    onNodeSelect(node);
  }, [isConnecting, onNodeSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - 100, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y));
    
    onNodeMove(dragging, { x: newX, y: newY });
  }, [dragging, dragOffset, onNodeMove]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onNodeSelect(null);
      onEdgeSelect(null);
    }
  }, [onNodeSelect, onEdgeSelect]);

  const getNodeCenter = (node: BPMNNode) => {
    const width = node.type === 'start' || node.type === 'end' ? 40 : 
                  node.type.startsWith('gateway') ? 50 : 120;
    const height = node.type === 'start' || node.type === 'end' ? 40 : 
                   node.type.startsWith('gateway') ? 50 : 50;
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2
    };
  };

  const renderEdge = (edge: BPMNEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    const start = getNodeCenter(sourceNode);
    const end = getNodeCenter(targetNode);
    const isSelected = selectedEdge?.id === edge.id;

    // Calculate control points for a smooth curve
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} Q ${midX} ${start.y} ${midX} ${(start.y + end.y) / 2} T ${end.x} ${end.y}`;

    // Arrow marker
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 10;
    const arrowX = end.x - arrowLength * Math.cos(angle);
    const arrowY = end.y - arrowLength * Math.sin(angle);

    return (
      <g key={edge.id} onClick={() => onEdgeSelect(edge)} className="cursor-pointer">
        <path
          d={path}
          fill="none"
          stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          strokeWidth={isSelected ? 3 : 2}
          markerEnd="url(#arrowhead)"
        />
        {edge.label && (
          <text
            x={midX}
            y={(start.y + end.y) / 2 - 10}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-muted/20 overflow-hidden"
      style={{ 
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: isConnecting ? 'crosshair' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* SVG for edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--muted-foreground))"
            />
          </marker>
        </defs>
        <g style={{ pointerEvents: 'auto' }}>
          {edges.map(renderEdge)}
        </g>
      </svg>

      {/* Nodes */}
      {nodes.map(node => (
        <BPMNNodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          isDragging={dragging === node.id}
          onMouseDown={(e) => handleMouseDown(e, node)}
          onConnect={() => onStartConnection(node.id)}
        />
      ))}

      {/* Connection hint */}
      {isConnecting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg">
          Haz clic en el nodo destino para conectar
        </div>
      )}
    </div>
  );
};

export default BPMNCanvas;
