import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  Type, Hash, Mail, Phone, Calendar, Clock, ChevronDown, 
  CheckSquare, Circle, Upload, AlignLeft, FileText, PenTool, EyeOff,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldType, FIELD_TYPES } from '../types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<any>> = {
  Type, Hash, Mail, Phone, Calendar, Clock, ChevronDown,
  CheckSquare, Circle, Upload, AlignLeft, FileText, PenTool, EyeOff
};

interface DraggableFieldProps {
  type: FieldType;
  label: string;
  icon: string;
}

function DraggableField({ type, label, icon }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, isNew: true },
  });

  const Icon = iconMap[icon] || Type;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card cursor-grab",
        "hover:border-primary hover:bg-primary/5 transition-all",
        isDragging && "opacity-50 shadow-lg scale-105"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

interface FieldPaletteProps {
  className?: string;
}

export function FieldPalette({ className }: FieldPaletteProps) {
  const basicFields = FIELD_TYPES.filter(f => 
    ['text', 'number', 'email', 'phone', 'textarea'].includes(f.type)
  );
  
  const dateFields = FIELD_TYPES.filter(f => 
    ['date', 'datetime'].includes(f.type)
  );
  
  const selectionFields = FIELD_TYPES.filter(f => 
    ['select', 'multiselect', 'checkbox', 'radio'].includes(f.type)
  );
  
  const advancedFields = FIELD_TYPES.filter(f => 
    ['file', 'richtext', 'signature', 'hidden'].includes(f.type)
  );

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Campos Disponibles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Básicos</p>
          <div className="space-y-1.5">
            {basicFields.map((field) => (
              <DraggableField key={field.type} {...field} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Fecha y Hora</p>
          <div className="space-y-1.5">
            {dateFields.map((field) => (
              <DraggableField key={field.type} {...field} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Selección</p>
          <div className="space-y-1.5">
            {selectionFields.map((field) => (
              <DraggableField key={field.type} {...field} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Avanzados</p>
          <div className="space-y-1.5">
            {advancedFields.map((field) => (
              <DraggableField key={field.type} {...field} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
