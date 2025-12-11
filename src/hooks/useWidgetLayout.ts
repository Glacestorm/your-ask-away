import { useState, useEffect, useCallback } from 'react';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

interface WidgetLayoutState {
  widgets: WidgetConfig[];
  isEditMode: boolean;
}

const STORAGE_KEY = 'dashboard-widget-layout';

const defaultWidgets: WidgetConfig[] = [
  { id: 'personal-kpis', visible: true, order: 0 },
  { id: 'quick-actions', visible: true, order: 1 },
  { id: 'upcoming-visits', visible: true, order: 2 },
  { id: 'resumen-ejecutivo', visible: true, order: 3 },
  { id: 'mi-actividad', visible: true, order: 4 },
];

export function useWidgetLayout(section: string = 'mi-panel') {
  const storageKey = `${STORAGE_KEY}-${section}`;
  
  const [state, setState] = useState<WidgetLayoutState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading widget layout:', e);
    }
    return { widgets: defaultWidgets, isEditMode: false };
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...state, isEditMode: false }));
    } catch (e) {
      console.error('Error saving widget layout:', e);
    }
  }, [state, storageKey]);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      const widgets = [...prev.widgets];
      const activeIndex = widgets.findIndex((w) => w.id === activeId);
      const overIndex = widgets.findIndex((w) => w.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const [removed] = widgets.splice(activeIndex, 1);
      widgets.splice(overIndex, 0, removed);

      // Update order numbers
      const reordered = widgets.map((w, index) => ({ ...w, order: index }));

      return { ...prev, widgets: reordered };
    });
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setState({ widgets: defaultWidgets, isEditMode: false });
  }, []);

  const getWidgetOrder = useCallback((id: string): number => {
    const widget = state.widgets.find((w) => w.id === id);
    return widget?.order ?? 999;
  }, [state.widgets]);

  const isWidgetVisible = useCallback((id: string): boolean => {
    const widget = state.widgets.find((w) => w.id === id);
    return widget?.visible ?? true;
  }, [state.widgets]);

  const sortedWidgets = [...state.widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: sortedWidgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleWidgetVisibility,
    resetLayout,
    getWidgetOrder,
    isWidgetVisible,
  };
}
