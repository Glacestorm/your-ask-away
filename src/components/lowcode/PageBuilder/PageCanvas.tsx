import React from 'react';
import { Card } from '@/components/ui/card';
import { PageComponent } from '../types';
import { GripVertical, Type, Square, LayoutGrid, Table, BarChart3, Gauge, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageCanvasProps {
  components: PageComponent[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onReorder: (components: PageComponent[]) => void;
  layout: string;
}

const COMPONENT_ICONS: Record<string, React.ElementType> = {
  heading: Type,
  text: FileText,
  card: Square,
  grid: LayoutGrid,
  table: Table,
  chart: BarChart3,
  kpi: Gauge,
  image: Image,
};

export function PageCanvas({ components, selectedId, onSelect, layout }: PageCanvasProps) {
  const getLayoutClass = () => {
    switch (layout) {
      case 'two-column':
        return 'grid-cols-2';
      case 'three-column':
        return 'grid-cols-3';
      case 'sidebar-left':
        return 'grid-cols-[250px_1fr]';
      case 'sidebar-right':
        return 'grid-cols-[1fr_250px]';
      default:
        return 'grid-cols-1';
    }
  };

  const renderComponent = (component: PageComponent) => {
    const Icon = COMPONENT_ICONS[component.type] || Square;
    const isSelected = selectedId === component.id;

    return (
      <div
        key={component.id}
        onClick={() => onSelect(component.id)}
        className={cn(
          'group relative p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all',
          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          getWidthClass(component.styles?.width)
        )}
      >
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {component.type}
          </span>
        </div>

        {renderComponentPreview(component)}
      </div>
    );
  };

  return (
    <Card className="flex-1 p-4 min-h-[500px] bg-muted/30">
      {components.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p>Arrastra componentes aquí</p>
        </div>
      ) : (
        <div className={cn('grid gap-4', getLayoutClass())}>
          {components.map(renderComponent)}
        </div>
      )}
    </Card>
  );
}

function getWidthClass(width?: string) {
  switch (width) {
    case '1/2':
      return 'col-span-1';
    case '1/3':
      return 'col-span-1';
    case '1/4':
      return 'col-span-1';
    case 'full':
    default:
      return 'col-span-full';
  }
}

function renderComponentPreview(component: PageComponent) {
  switch (component.type) {
    case 'heading':
      return (
        <h3 className="text-lg font-semibold">
          {(component.props?.text as string) || 'Encabezado'}
        </h3>
      );

    case 'text':
      return (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {(component.props?.content as string) || 'Contenido de texto...'}
        </p>
      );

    case 'card':
      return (
        <div className="p-3 border rounded bg-card">
          <h4 className="font-medium">{(component.props?.title as string) || 'Título'}</h4>
          <p className="text-xs text-muted-foreground">
            {(component.props?.description as string) || 'Descripción...'}
          </p>
        </div>
      );

    case 'kpi':
      return (
        <div className="p-3 border rounded bg-card text-center">
          <p className="text-2xl font-bold">{(component.props?.value as string) || '0'}</p>
          <p className="text-xs text-muted-foreground">
            {(component.props?.title as string) || 'KPI'}
          </p>
        </div>
      );

    case 'table':
      return (
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-3 bg-muted text-xs p-2 font-medium">
            <span>Col 1</span>
            <span>Col 2</span>
            <span>Col 3</span>
          </div>
          <div className="grid grid-cols-3 text-xs p-2 border-t">
            <span>Dato</span>
            <span>Dato</span>
            <span>Dato</span>
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className="h-24 border rounded bg-muted/50 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
      );

    case 'image':
      return (
        <div className="h-24 border rounded bg-muted/50 flex items-center justify-center">
          {(component.props?.src as string) ? (
            <img 
              src={component.props.src as string} 
              alt={(component.props?.alt as string) || ''} 
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Image className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      );

    default:
      return (
        <div className="h-16 border rounded bg-muted/50 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{component.type}</span>
        </div>
      );
  }
}
