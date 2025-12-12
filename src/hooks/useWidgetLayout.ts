import { useState, useCallback } from 'react';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

const STORAGE_KEY = 'dashboard-widget-layout';

// Default widgets for each dashboard section
const DEFAULT_WIDGETS: Record<string, WidgetConfig[]> = {
  'mi-panel': [
    { id: 'personal-kpis', visible: true, order: 0 },
    { id: 'quick-actions', visible: true, order: 1 },
    { id: 'upcoming-visits', visible: true, order: 2 },
    { id: 'resumen-ejecutivo', visible: true, order: 3 },
    { id: 'mi-actividad', visible: true, order: 4 },
  ],
  'gestor-dashboard': [
    { id: 'stats-cards', visible: true, order: 0 },
    { id: 'quick-cards', visible: true, order: 1 },
    { id: 'goals-tracker', visible: true, order: 2 },
    { id: 'visits-manager', visible: true, order: 3 },
    { id: 'overview', visible: true, order: 4 },
  ],
  'office-director': [
    { id: 'kpi-cards', visible: true, order: 0 },
    { id: 'metrics-cards', visible: true, order: 1 },
    { id: 'quick-cards', visible: true, order: 2 },
    { id: 'analytics', visible: true, order: 3 },
    { id: 'gestores-table', visible: true, order: 4 },
  ],
  'commercial-director': [
    { id: 'kpi-cards', visible: true, order: 0 },
    { id: 'metrics-cards', visible: true, order: 1 },
    { id: 'quick-cards', visible: true, order: 2 },
    { id: 'analytics', visible: true, order: 3 },
    { id: 'offices-ranking', visible: true, order: 4 },
  ],
};

const getDefaultWidgets = (section: string): WidgetConfig[] => {
  return DEFAULT_WIDGETS[section] || DEFAULT_WIDGETS['mi-panel'];
};

function loadWidgets(storageKey: string, section: string): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading widget layout:', e);
  }
  return getDefaultWidgets(section);
}

function saveWidgets(storageKey: string, widgets: WidgetConfig[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(widgets));
  } catch (e) {
    console.error('Error saving widget layout:', e);
  }
}

export function useWidgetLayout(section: string = 'mi-panel') {
  const storageKey = `${STORAGE_KEY}-${section}`;
  
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadWidgets(storageKey, section));
  const [isEditMode, setIsEditMode] = useState(false);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setWidgets((prev) => {
      const newWidgets = [...prev];
      const activeIndex = newWidgets.findIndex((w) => w.id === activeId);
      const overIndex = newWidgets.findIndex((w) => w.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const [removed] = newWidgets.splice(activeIndex, 1);
      newWidgets.splice(overIndex, 0, removed);

      // Update order numbers
      const reordered = newWidgets.map((w, index) => ({ ...w, order: index }));
      
      // Save to localStorage
      saveWidgets(storageKey, reordered);

      return reordered;
    });
  }, [storageKey]);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setWidgets((prev) => {
      const newWidgets = prev.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      saveWidgets(storageKey, newWidgets);
      return newWidgets;
    });
  }, [storageKey]);

  const resetLayout = useCallback(() => {
    const defaultWidgets = getDefaultWidgets(section);
    setWidgets(defaultWidgets);
    saveWidgets(storageKey, defaultWidgets);
  }, [storageKey, section]);

  const isWidgetVisible = useCallback((id: string): boolean => {
    const widget = widgets.find((w) => w.id === id);
    return widget?.visible ?? true;
  }, [widgets]);

  // Always return sorted widgets
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: sortedWidgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleWidgetVisibility,
    resetLayout,
    isWidgetVisible,
  };
}
