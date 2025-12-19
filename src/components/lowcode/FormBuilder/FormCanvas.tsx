import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField, FIELD_TYPES } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Settings, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface SortableFieldProps {
  field: FormField;
  onEdit: (field: FormField) => void;
  onDelete: (id: string) => void;
  onDuplicate: (field: FormField) => void;
  isSelected: boolean;
}

function SortableField({ field, onEdit, onDelete, onDuplicate, isSelected }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldType = FIELD_TYPES.find(f => f.type === field.type);
  const Icon = fieldType?.icon ? (Icons as any)[fieldType.icon] || Icons.Type : Icons.Type;

  const widthClasses = {
    full: 'col-span-12',
    half: 'col-span-6',
    third: 'col-span-4',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        widthClasses[field.width || 'full'],
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          field.hidden && "opacity-60"
        )}
        onClick={() => onEdit(field)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-muted p-1 rounded mt-0.5"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium text-sm truncate">{field.label}</span>
                {field.validation.required && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Req.
                  </Badge>
                )}
                {field.hidden && (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <code className="bg-muted px-1 rounded">{field.name}</code>
                <span>•</span>
                <span>{fieldType?.label || field.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(field);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(field);
                }}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(field.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldEdit: (field: FormField) => void;
  onFieldDelete: (id: string) => void;
  onFieldDuplicate: (field: FormField) => void;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onFieldEdit,
  onFieldDelete,
  onFieldDuplicate,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 p-6 min-h-[400px] rounded-lg border-2 border-dashed transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        fields.length === 0 && "flex items-center justify-center"
      )}
    >
      {fields.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">Arrastra campos aquí</p>
          <p className="text-sm">O haz clic en un campo de la paleta</p>
        </div>
      ) : (
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-12 gap-3">
            {fields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                isSelected={selectedFieldId === field.id}
                onEdit={onFieldEdit}
                onDelete={onFieldDelete}
                onDuplicate={onFieldDuplicate}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
