import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Widget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  gridConfig: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
}

const defaultLayout: DashboardLayout = {
  id: '',
  name: 'Default',
  widgets: [],
  gridConfig: {
    columns: 12,
    rowHeight: 100,
    gap: 16
  }
};

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole) {
      loadLayout();
    }
  }, [userRole]);

  const loadLayout = async () => {
    try {
      // First try to get role-specific layout
      let { data, error } = await (supabase as any)
        .from('cms_dashboard_layouts')
        .select('*')
        .eq('target_role', userRole)
        .single();

      // If no role-specific, get default
      if (error || !data) {
        const result = await (supabase as any)
          .from('cms_dashboard_layouts')
          .select('*')
          .eq('is_default', true)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLayout({
          id: data.id,
          name: data.layout_name,
          widgets: (data.widgets || []).map((w: any) => ({
            id: w.id,
            type: w.type,
            title: w.title || w.type,
            config: w.config || {},
            position: w.position || { x: 0, y: 0, w: 4, h: 2 },
            isVisible: w.is_visible !== false
          })),
          gridConfig: data.grid_config || defaultLayout.gridConfig
        });
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading dashboard layout:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateWidgetPosition = async (widgetId: string, position: Widget['position']) => {
    const updatedWidgets = layout.widgets.map(w => 
      w.id === widgetId ? { ...w, position } : w
    );

    try {
      await (supabase as any)
        .from('cms_dashboard_layouts')
        .update({ 
          widgets: updatedWidgets,
          updated_at: new Date().toISOString()
        })
        .eq('id', layout.id);

      setLayout(prev => ({ ...prev, widgets: updatedWidgets }));
      return true;
    } catch (err) {
      console.error('Error updating widget:', err);
      return false;
    }
  };

  const toggleWidgetVisibility = async (widgetId: string) => {
    const updatedWidgets = layout.widgets.map(w => 
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    );

    try {
      await (supabase as any)
        .from('cms_dashboard_layouts')
        .update({ 
          widgets: updatedWidgets,
          updated_at: new Date().toISOString()
        })
        .eq('id', layout.id);

      setLayout(prev => ({ ...prev, widgets: updatedWidgets }));
      return true;
    } catch (err) {
      console.error('Error toggling widget:', err);
      return false;
    }
  };

  const getVisibleWidgets = (): Widget[] => {
    return layout.widgets.filter(w => w.isVisible);
  };

  return { 
    layout, 
    loading, 
    error,
    updateWidgetPosition,
    toggleWidgetVisibility,
    getVisibleWidgets,
    refresh: loadLayout 
  };
}
