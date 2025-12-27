import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface DocumentationPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: 'overview' | 'api' | 'guide' | 'example' | 'changelog' | 'faq';
  order_index: number;
  is_published: boolean;
  last_updated: string;
  author?: string;
}

export interface APIReference {
  id: string;
  name: string;
  type: 'function' | 'hook' | 'component' | 'type' | 'constant';
  signature: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default_value?: string;
  }>;
  return_type?: string;
  return_description?: string;
  examples: Array<{
    title: string;
    code: string;
    language: string;
  }>;
  deprecated?: boolean;
  deprecation_message?: string;
  since_version?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_runnable: boolean;
  output?: string;
}

export interface GenerationJob {
  id: string;
  module_key: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
  progress: number;
  pages_generated: number;
  apis_documented: number;
  examples_created: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DocumentationStats {
  total_pages: number;
  total_apis: number;
  total_examples: number;
  coverage_percentage: number;
  last_generated: string;
  undocumented_items: string[];
}

// === HOOK ===
export function useModuleDocumentationGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<DocumentationPage[]>([]);
  const [apiReferences, setApiReferences] = useState<APIReference[]>([]);
  const [examples, setExamples] = useState<CodeExample[]>([]);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [stats, setStats] = useState<DocumentationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GENERATE DOCUMENTATION ===
  const generateDocumentation = useCallback(async (
    moduleKey: string,
    options?: {
      includeApi?: boolean;
      includeExamples?: boolean;
      includeChangelog?: boolean;
      language?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'generate_documentation',
            moduleKey,
            options: options || { includeApi: true, includeExamples: true, includeChangelog: true }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.job) {
        setActiveJob(data.job);
        toast.success('Generación de documentación iniciada');
        return data.job;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al generar documentación');
      console.error('[useModuleDocumentationGenerator] generateDocumentation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET DOCUMENTATION ===
  const getDocumentation = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'get_documentation',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.pages) setPages(data.pages);
        if (data.apiReferences) setApiReferences(data.apiReferences);
        if (data.examples) setExamples(data.examples);
        if (data.stats) setStats(data.stats);
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleDocumentationGenerator] getDocumentation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE API REFERENCE ===
  const generateApiReference = useCallback(async (
    moduleKey: string,
    targetFile?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'generate_api_reference',
            moduleKey,
            targetFile
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.apiReferences) {
        setApiReferences(data.apiReferences);
        toast.success('API Reference generada');
        return data.apiReferences;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al generar API Reference');
      console.error('[useModuleDocumentationGenerator] generateApiReference error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE EXAMPLES ===
  const generateExamples = useCallback(async (
    moduleKey: string,
    apiName?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'generate_examples',
            moduleKey,
            apiName
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.examples) {
        setExamples(prev => [...prev, ...data.examples]);
        toast.success('Ejemplos generados');
        return data.examples;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al generar ejemplos');
      console.error('[useModuleDocumentationGenerator] generateExamples error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE PAGE ===
  const updatePage = useCallback(async (
    pageId: string,
    updates: Partial<DocumentationPage>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'update_page',
            pageId,
            updates
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, ...updates } : p));
        toast.success('Página actualizada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleDocumentationGenerator] updatePage error:', err);
      toast.error('Error al actualizar página');
      return false;
    }
  }, []);

  // === EXPORT DOCUMENTATION ===
  const exportDocumentation = useCallback(async (
    moduleKey: string,
    format: 'markdown' | 'html' | 'pdf' | 'json'
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'export_documentation',
            moduleKey,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.downloadUrl) {
        toast.success(`Documentación exportada como ${format.toUpperCase()}`);
        return data.downloadUrl;
      }

      throw new Error('Invalid response');
    } catch (err) {
      console.error('[useModuleDocumentationGenerator] exportDocumentation error:', err);
      toast.error('Error al exportar documentación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET JOB STATUS ===
  const getJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-documentation-generator',
        {
          body: {
            action: 'get_job_status',
            jobId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.job) {
        setActiveJob(data.job);
        return data.job;
      }

      return null;
    } catch (err) {
      console.error('[useModuleDocumentationGenerator] getJobStatus error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((moduleKey: string, intervalMs = 60000) => {
    stopAutoRefresh();
    getDocumentation(moduleKey);
    autoRefreshInterval.current = setInterval(() => {
      getDocumentation(moduleKey);
    }, intervalMs);
  }, [getDocumentation]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    pages,
    apiReferences,
    examples,
    activeJob,
    stats,
    error,
    generateDocumentation,
    getDocumentation,
    generateApiReference,
    generateExamples,
    updatePage,
    exportDocumentation,
    getJobStatus,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useModuleDocumentationGenerator;
