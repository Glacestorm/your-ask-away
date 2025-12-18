import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  target?: string;
  isExternal: boolean;
  badge?: { text: string; color: string };
  children?: NavigationItem[];
}

interface NavigationConfig {
  header: NavigationItem[];
  sidebar: NavigationItem[];
  footer: NavigationItem[];
  breadcrumbs: NavigationItem[];
  quickActions: NavigationItem[];
}

const defaultConfig: NavigationConfig = {
  header: [],
  sidebar: [],
  footer: [],
  breadcrumbs: [],
  quickActions: []
};

export function useNavigationConfig() {
  const [navigation, setNavigation] = useState<NavigationConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { userRole } = useAuth();

  useEffect(() => {
    loadNavigation();
  }, [language, userRole]);

  const loadNavigation = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cms_navigation_items')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order');

      if (error) throw error;

      const items = (data || [])
        .filter((item: any) => {
          // Filter by role if specified
          if (item.visible_to_roles && item.visible_to_roles.length > 0 && userRole) {
            return item.visible_to_roles.includes(userRole);
          }
          return true;
        })
        .map((item: any) => mapNavigationItem(item, language));

      // Build hierarchy
      const itemMap = new Map<string, NavigationItem>();
      const rootItems: NavigationItem[] = [];

      for (const item of items) {
        itemMap.set(item.id, { ...item, children: [] });
      }

      for (const item of data || []) {
        const mappedItem = itemMap.get(item.id);
        if (mappedItem) {
          if (item.parent_id && itemMap.has(item.parent_id)) {
            itemMap.get(item.parent_id)!.children!.push(mappedItem);
          } else {
            rootItems.push(mappedItem);
          }
        }
      }

      // Group by location
      const grouped: NavigationConfig = {
        header: [],
        sidebar: [],
        footer: [],
        breadcrumbs: [],
        quickActions: []
      };

      for (const item of data || []) {
        const mappedItem = itemMap.get(item.id);
        if (mappedItem && !item.parent_id) {
          const location = item.menu_location as keyof NavigationConfig;
          if (grouped[location]) {
            grouped[location].push(mappedItem);
          }
        }
      }

      setNavigation(grouped);
    } catch (err) {
      console.error('Error loading navigation:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMenuItems = (location: keyof NavigationConfig): NavigationItem[] => {
    return navigation[location] || [];
  };

  return { 
    navigation, 
    loading, 
    getMenuItems,
    refresh: loadNavigation 
  };
}

function mapNavigationItem(item: any, locale: string): NavigationItem {
  return {
    id: item.id,
    label: getLocalizedValue(item.label, locale),
    url: item.url || '#',
    icon: item.icon,
    target: item.target,
    isExternal: item.is_external || false,
    badge: item.badge_text ? { text: item.badge_text, color: item.badge_color || 'blue' } : undefined,
    children: []
  };
}

function getLocalizedValue(value: any, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || '';
}
