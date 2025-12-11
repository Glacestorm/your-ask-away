import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';

interface SortableWidgetContainerProps {
  items: string[];
  onReorder: (activeId: string, overId: string) => void;
  children: React.ReactNode;
  isEditMode: boolean;
}

export function SortableWidgetContainer({
  items,
  onReorder,
  children,
  isEditMode,
}: SortableWidgetContainerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="bg-background/80 backdrop-blur-sm rounded-lg border-2 border-primary shadow-xl p-4">
            <p className="text-sm text-muted-foreground">Arrastrando widget...</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
