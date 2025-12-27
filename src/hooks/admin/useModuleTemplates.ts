/**
 * useModuleTemplates - Sistema de templates para módulos
 * Templates predefinidos, customizables y compartibles
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'analytics' | 'integration' | 'automation' | 'ai' | 'custom';
  icon: string;
  previewImage?: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: string;
  features: string[];
  dependencies: string[];
  config: Record<string, unknown>;
  isOfficial: boolean;
  author: string;
  downloads: number;
  rating: number;
  createdAt: string;
}

export interface TemplateFilters {
  category?: string;
  complexity?: string;
  search?: string;
}

interface TemplatesState {
  templates: ModuleTemplate[];
  selectedTemplate: ModuleTemplate | null;
  isLoading: boolean;
  isCreating: boolean;
}

// Default templates
const DEFAULT_TEMPLATES: ModuleTemplate[] = [
  {
    id: 'tpl_dashboard',
    name: 'Dashboard Analítico',
    description: 'Panel de control con KPIs, gráficos y métricas en tiempo real',
    category: 'analytics',
    icon: 'BarChart3',
    complexity: 'intermediate',
    estimatedTime: '15 min',
    features: ['KPIs configurables', 'Gráficos interactivos', 'Filtros por fecha', 'Exportación'],
    dependencies: ['recharts', 'date-fns'],
    config: {
      layout: 'grid',
      refreshInterval: 60000,
      defaultPeriod: '7d'
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 1250,
    rating: 4.8,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tpl_crud',
    name: 'CRUD Básico',
    description: 'Operaciones CRUD con tabla, formularios y validación',
    category: 'core',
    icon: 'Database',
    complexity: 'basic',
    estimatedTime: '10 min',
    features: ['Listado paginado', 'Crear/Editar/Eliminar', 'Búsqueda', 'Validación de formularios'],
    dependencies: ['react-hook-form', 'zod'],
    config: {
      pagination: true,
      pageSize: 10,
      confirmDelete: true
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 3200,
    rating: 4.9,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tpl_ai_chat',
    name: 'Chat con IA',
    description: 'Interfaz de chat con integración de modelos de lenguaje',
    category: 'ai',
    icon: 'MessageSquare',
    complexity: 'advanced',
    estimatedTime: '25 min',
    features: ['Streaming de respuestas', 'Historial de conversación', 'Múltiples modelos', 'Contexto persistente'],
    dependencies: [],
    config: {
      model: 'google/gemini-2.5-flash',
      streaming: true,
      maxTokens: 2000
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 890,
    rating: 4.7,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tpl_workflow',
    name: 'Automatización de Workflows',
    description: 'Editor visual de flujos de trabajo con triggers y acciones',
    category: 'automation',
    icon: 'Workflow',
    complexity: 'advanced',
    estimatedTime: '30 min',
    features: ['Editor drag & drop', 'Triggers configurables', 'Acciones encadenadas', 'Logs de ejecución'],
    dependencies: ['@dnd-kit/core'],
    config: {
      maxSteps: 20,
      parallelExecution: true
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 560,
    rating: 4.5,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tpl_api_integration',
    name: 'Integración de API',
    description: 'Conectar con APIs externas con autenticación y mapeo de datos',
    category: 'integration',
    icon: 'Plug',
    complexity: 'intermediate',
    estimatedTime: '20 min',
    features: ['Auth OAuth/API Key', 'Mapeo de campos', 'Retry automático', 'Rate limiting'],
    dependencies: [],
    config: {
      retryAttempts: 3,
      timeout: 30000
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 780,
    rating: 4.6,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tpl_reports',
    name: 'Generador de Reportes',
    description: 'Sistema de reportes con exportación a PDF, Excel y programación',
    category: 'analytics',
    icon: 'FileText',
    complexity: 'intermediate',
    estimatedTime: '20 min',
    features: ['Plantillas personalizables', 'Exportación multi-formato', 'Programación automática', 'Envío por email'],
    dependencies: ['jspdf', 'xlsx'],
    config: {
      formats: ['pdf', 'xlsx', 'csv'],
      scheduling: true
    },
    isOfficial: true,
    author: 'Obelixia',
    downloads: 1100,
    rating: 4.7,
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export function useModuleTemplates() {
  const [state, setState] = useState<TemplatesState>({
    templates: DEFAULT_TEMPLATES,
    selectedTemplate: null,
    isLoading: false,
    isCreating: false
  });

  // Fetch templates
  const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // For now, filter locally
      let filtered = [...DEFAULT_TEMPLATES];

      if (filters?.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      if (filters?.complexity) {
        filtered = filtered.filter(t => t.complexity === filters.complexity);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
        );
      }

      setState(prev => ({
        ...prev,
        templates: filtered,
        isLoading: false
      }));

      return filtered;
    } catch (error) {
      console.error('[useModuleTemplates] fetchTemplates error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return [];
    }
  }, []);

  // Create module from template
  const createFromTemplate = useCallback(async (
    template: ModuleTemplate,
    customization: {
      moduleKey: string;
      moduleName: string;
      description?: string;
      customConfig?: Record<string, unknown>;
    }
  ) => {
    setState(prev => ({ ...prev, isCreating: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'create_from_template',
          templateId: template.id,
          templateConfig: template.config,
          customization
        }
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isCreating: false }));
      toast.success(`Módulo "${customization.moduleName}" creado desde template`);
      
      return data?.module || { 
        key: customization.moduleKey,
        name: customization.moduleName
      };
    } catch (error) {
      console.error('[useModuleTemplates] createFromTemplate error:', error);
      setState(prev => ({ ...prev, isCreating: false }));
      toast.error('Error al crear módulo desde template');
      return null;
    }
  }, []);

  // Select template
  const selectTemplate = useCallback((template: ModuleTemplate | null) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  }, []);

  // Get categories
  const getCategories = useCallback(() => {
    return [
      { value: 'core', label: 'Core', icon: 'Blocks' },
      { value: 'analytics', label: 'Analytics', icon: 'BarChart3' },
      { value: 'integration', label: 'Integración', icon: 'Plug' },
      { value: 'automation', label: 'Automatización', icon: 'Workflow' },
      { value: 'ai', label: 'IA', icon: 'Brain' },
      { value: 'custom', label: 'Custom', icon: 'Sparkles' }
    ];
  }, []);

  return {
    ...state,
    fetchTemplates,
    createFromTemplate,
    selectTemplate,
    getCategories
  };
}

export default useModuleTemplates;
