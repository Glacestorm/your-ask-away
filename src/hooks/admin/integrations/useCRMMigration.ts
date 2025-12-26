import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CRMMigration {
  id: string;
  migration_name: string;
  source_crm: string;
  source_version?: string;
  status: 'pending' | 'analyzing' | 'mapping' | 'validating' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'rollback';
  total_records: number;
  migrated_records: number;
  failed_records: number;
  skipped_records: number;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  config: Record<string, unknown>;
  source_file_url?: string;
  source_file_type?: 'csv' | 'json' | 'xml' | 'xlsx' | 'xls';
  source_file_size?: number;
  error_log: Array<{ message: string; timestamp: string; record_index?: number }>;
  warnings: Array<{ message: string; field?: string }>;
  statistics: Record<string, unknown>;
  ai_analysis?: Record<string, unknown>;
  rollback_data?: Record<string, unknown>;
  can_rollback: boolean;
  performed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMFieldMapping {
  id: string;
  migration_id: string;
  source_field: string;
  source_field_type?: string;
  target_table: string;
  target_field: string;
  target_field_type?: string;
  transform_function?: string;
  transform_params: Record<string, unknown>;
  default_value?: string;
  is_required: boolean;
  is_primary_key: boolean;
  is_auto_mapped: boolean;
  ai_confidence?: number;
  validation_rules: Array<Record<string, unknown>>;
  sample_values: unknown[];
  mapped_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface CRMMigrationRecord {
  id: string;
  migration_id: string;
  record_index: number;
  source_data: Record<string, unknown>;
  target_data?: Record<string, unknown>;
  target_table?: string;
  target_record_id?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'skipped' | 'duplicate' | 'rolled_back';
  error_message?: string;
  error_details?: Record<string, unknown>;
  validation_errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  is_duplicate: boolean;
  duplicate_of?: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface CRMMappingTemplate {
  id: string;
  template_name: string;
  source_crm: string;
  description?: string;
  field_mappings: CRMFieldMapping[];
  transform_rules: Array<Record<string, unknown>>;
  validation_rules: Array<Record<string, unknown>>;
  is_default: boolean;
  is_public: boolean;
  usage_count: number;
  success_rate?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMConnector {
  id: string;
  connector_key: string;
  connector_name: string;
  vendor: string;
  logo_url?: string;
  description?: string;
  supported_formats: string[];
  supported_entities: string[];
  field_definitions: Record<string, unknown>;
  export_guide_url?: string;
  documentation: Record<string, unknown>;
  is_active: boolean;
  tier: 'enterprise' | 'popular' | 'standard';
  popularity_rank?: number;
  created_at: string;
  updated_at: string;
}

export interface MigrationAnalysis {
  detected_crm?: string;
  detected_format?: string;
  total_records: number;
  detected_fields: Array<{
    name: string;
    type: string;
    sample_values: unknown[];
    null_count: number;
  }>;
  suggested_mappings: Array<{
    source_field: string;
    target_table: string;
    target_field: string;
    confidence: number;
  }>;
  data_quality_score: number;
  warnings: string[];
  recommendations: string[];
}

export interface MigrationStats {
  total_migrations: number;
  completed_migrations: number;
  failed_migrations: number;
  total_records_migrated: number;
  success_rate: number;
  avg_migration_time_ms: number;
  migrations_by_crm: Record<string, number>;
}

export interface ValidationResult {
  totalValidated: number;
  passed: number;
  failed: number;
  duplicates: number;
  warnings: Array<{ message: string; field?: string }>;
  hasBlockingErrors: boolean;
  canProceed: boolean;
}

export interface DuplicateInfo {
  recordId: string;
  duplicateOf: string;
  field: string;
  reason: string;
  similarity: number;
}

export interface ValidationRule {
  name: string;
  targetField: string;
  type: string;
  pattern?: string;
  min?: number;
  max?: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface Transformation {
  field: string;
  target_field?: string;
  type: string;
  params?: Record<string, unknown>;
}

// === HOOK ===
export function useCRMMigration() {
  // Estado
  const [migrations, setMigrations] = useState<CRMMigration[]>([]);
  const [activeMigration, setActiveMigration] = useState<CRMMigration | null>(null);
  const [records, setRecords] = useState<CRMMigrationRecord[]>([]);
  const [fieldMappings, setFieldMappings] = useState<CRMFieldMapping[]>([]);
  const [connectors, setConnectors] = useState<CRMConnector[]>([]);
  const [templates, setTemplates] = useState<CRMMappingTemplate[]>([]);
  const [analysis, setAnalysis] = useState<MigrationAnalysis | null>(null);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Refs para polling
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH CONNECTORS ===
  const fetchConnectors = useCallback(async (): Promise<CRMConnector[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: { action: 'list_connectors' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.connectors) {
        setConnectors(data.connectors);
        return data.connectors;
      }

      return [];
    } catch (err) {
      console.error('[useCRMMigration] fetchConnectors error:', err);
      return [];
    }
  }, []);

  // === FETCH MIGRATIONS ===
  const fetchMigrations = useCallback(async (limit: number = 50): Promise<CRMMigration[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: { action: 'list_migrations', limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.migrations) {
        setMigrations(data.migrations);
        return data.migrations;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching migrations';
      setError(message);
      console.error('[useCRMMigration] fetchMigrations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async (sourceCrm?: string): Promise<CRMMappingTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: { action: 'list_templates', source_crm: sourceCrm }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.templates) {
        setTemplates(data.templates);
        return data.templates;
      }

      return [];
    } catch (err) {
      console.error('[useCRMMigration] fetchTemplates error:', err);
      return [];
    }
  }, []);

  // === ANALYZE FILE ===
  const analyzeFile = useCallback(async (
    fileContent: string,
    fileType: 'csv' | 'json' | 'xml' | 'xlsx',
    sourceCrm?: string
  ): Promise<MigrationAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'analyze_file',
          file_content: fileContent,
          file_type: fileType,
          source_crm: sourceCrm
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        return data.analysis;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing file';
      setError(message);
      console.error('[useCRMMigration] analyzeFile error:', err);
      toast.error('Error al analizar archivo');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // === CREATE MIGRATION ===
  const createMigration = useCallback(async (
    name: string,
    sourceCrm: string,
    fileContent: string,
    fileType: 'csv' | 'json' | 'xml' | 'xlsx',
    mappings?: Partial<CRMFieldMapping>[]
  ): Promise<CRMMigration | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'create_migration',
          name,
          source_crm: sourceCrm,
          file_content: fileContent,
          file_type: fileType,
          mappings
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.migration) {
        setMigrations(prev => [data.migration, ...prev]);
        setActiveMigration(data.migration);
        toast.success('Migración creada correctamente');
        return data.migration;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating migration';
      setError(message);
      console.error('[useCRMMigration] createMigration error:', err);
      toast.error('Error al crear migración');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE MAPPINGS ===
  const updateMappings = useCallback(async (
    migrationId: string,
    mappings: Partial<CRMFieldMapping>[]
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'update_mappings',
          migration_id: migrationId,
          mappings
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.mappings) {
          setFieldMappings(data.mappings);
        }
        toast.success('Mapeos actualizados');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] updateMappings error:', err);
      toast.error('Error al actualizar mapeos');
      return false;
    }
  }, []);

  // === RUN MIGRATION ===
  const runMigration = useCallback(async (migrationId: string): Promise<boolean> => {
    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'run_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Migración iniciada');
        
        // Start polling for progress
        startProgressPolling(migrationId);
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error running migration';
      setError(message);
      console.error('[useCRMMigration] runMigration error:', err);
      toast.error('Error al ejecutar migración');
      setIsRunning(false);
      return false;
    }
  }, []);

  // === PAUSE MIGRATION ===
  const pauseMigration = useCallback(async (migrationId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'pause_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        stopProgressPolling();
        setIsRunning(false);
        toast.success('Migración pausada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] pauseMigration error:', err);
      toast.error('Error al pausar migración');
      return false;
    }
  }, []);

  // === RESUME MIGRATION ===
  const resumeMigration = useCallback(async (migrationId: string): Promise<boolean> => {
    setIsRunning(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'resume_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        startProgressPolling(migrationId);
        toast.success('Migración reanudada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] resumeMigration error:', err);
      toast.error('Error al reanudar migración');
      setIsRunning(false);
      return false;
    }
  }, []);

  // === CANCEL MIGRATION ===
  const cancelMigration = useCallback(async (migrationId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'cancel_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        stopProgressPolling();
        setIsRunning(false);
        setMigrations(prev => prev.map(m => 
          m.id === migrationId ? { ...m, status: 'cancelled' as const } : m
        ));
        toast.success('Migración cancelada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] cancelMigration error:', err);
      toast.error('Error al cancelar migración');
      return false;
    }
  }, []);

  // === ROLLBACK MIGRATION ===
  const rollbackMigration = useCallback(async (migrationId: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'rollback_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setMigrations(prev => prev.map(m => 
          m.id === migrationId ? { ...m, status: 'rollback' as const } : m
        ));
        toast.success('Rollback completado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] rollbackMigration error:', err);
      toast.error('Error en rollback');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH MIGRATION RECORDS ===
  const fetchRecords = useCallback(async (
    migrationId: string,
    status?: string,
    limit: number = 100
  ): Promise<CRMMigrationRecord[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'list_records',
          migration_id: migrationId,
          status,
          limit
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.records) {
        setRecords(data.records);
        return data.records;
      }

      return [];
    } catch (err) {
      console.error('[useCRMMigration] fetchRecords error:', err);
      return [];
    }
  }, []);

  // === GET MIGRATION STATUS ===
  const getMigrationStatus = useCallback(async (migrationId: string): Promise<CRMMigration | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'get_status',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.migration) {
        const migration = data.migration as CRMMigration;
        setActiveMigration(migration);
        
        // Update progress
        if (migration.total_records > 0) {
          const newProgress = Math.round((migration.migrated_records / migration.total_records) * 100);
          setProgress(newProgress);
        }

        // Check if completed
        if (['completed', 'failed', 'cancelled'].includes(migration.status)) {
          stopProgressPolling();
          setIsRunning(false);
        }

        return migration;
      }

      return null;
    } catch (err) {
      console.error('[useCRMMigration] getMigrationStatus error:', err);
      return null;
    }
  }, []);

  // === FETCH STATS ===
  const fetchStats = useCallback(async (): Promise<MigrationStats | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: { action: 'get_stats' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.stats) {
        setStats(data.stats);
        return data.stats;
      }

      return null;
    } catch (err) {
      console.error('[useCRMMigration] fetchStats error:', err);
      return null;
    }
  }, []);

  // === SAVE TEMPLATE ===
  const saveTemplate = useCallback(async (
    name: string,
    sourceCrm: string,
    mappings: CRMFieldMapping[],
    isPublic: boolean = false
  ): Promise<CRMMappingTemplate | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'save_template',
          name,
          source_crm: sourceCrm,
          mappings,
          is_public: isPublic
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.template) {
        setTemplates(prev => [data.template, ...prev]);
        toast.success('Template guardado');
        return data.template;
      }

      return null;
    } catch (err) {
      console.error('[useCRMMigration] saveTemplate error:', err);
      toast.error('Error al guardar template');
      return null;
    }
  }, []);

  // === GENERATE AI MAPPINGS ===
  const generateAIMappings = useCallback(async (
    detectedFields: Array<{ name: string; type: string; sample_values: unknown[]; null_count: number }>,
    sourceCrm?: string
  ): Promise<Partial<CRMFieldMapping>[] | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'generate_ai_mappings',
          detected_fields: detectedFields,
          source_crm: sourceCrm
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.mappings) {
        return data.mappings;
      }

      return null;
    } catch (err) {
      console.error('[useCRMMigration] generateAIMappings error:', err);
      toast.error('Error al generar mapeos con IA');
      return null;
    }
  }, []);

  // === APPLY TEMPLATE ===
  const applyTemplate = useCallback(async (
    migrationId: string,
    templateId: string
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'apply_template',
          migration_id: migrationId,
          template_id: templateId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.mappings) {
          setFieldMappings(data.mappings);
        }
        toast.success('Template aplicado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCRMMigration] applyTemplate error:', err);
      toast.error('Error al aplicar template');
      return false;
    }
  }, []);

  // === VALIDATE MIGRATION (FASE 4) ===
  const validateMigration = useCallback(async (migrationId: string): Promise<ValidationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'validate_migration',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.validation) {
        toast.success(`Validación completada: ${data.validation.passed} pasaron, ${data.validation.failed} fallaron`);
        return data.validation;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en validación';
      setError(message);
      console.error('[useCRMMigration] validateMigration error:', err);
      toast.error('Error al validar migración');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CHECK DUPLICATES ===
  const checkDuplicates = useCallback(async (
    migrationId: string,
    duplicateFields?: string[],
    threshold?: number
  ): Promise<{ internal: DuplicateInfo[]; external: DuplicateInfo[]; summary: { internal: number; external: number; total: number } } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'check_duplicates',
          migration_id: migrationId,
          duplicate_fields: duplicateFields,
          threshold: threshold || 0.85
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        const total = data.summary?.total || 0;
        if (total > 0) {
          toast.warning(`Se encontraron ${total} posibles duplicados`);
        } else {
          toast.success('No se encontraron duplicados');
        }
        return data.duplicates ? { ...data, duplicates: data.duplicates } : { internal: [], external: [], summary: data.summary };
      }

      return null;
    } catch (err) {
      console.error('[useCRMMigration] checkDuplicates error:', err);
      toast.error('Error al verificar duplicados');
      return null;
    }
  }, []);

  // === GET VALIDATION RULES ===
  const getValidationRules = useCallback(async (): Promise<ValidationRule[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: { action: 'get_validation_rules' }
      });

      if (fnError) throw fnError;

      return data?.rules || [];
    } catch (err) {
      console.error('[useCRMMigration] getValidationRules error:', err);
      return [];
    }
  }, []);

  // === APPLY TRANSFORMATIONS ===
  const applyTransformations = useCallback(async (
    migrationId: string,
    transformations: Transformation[]
  ): Promise<number> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'apply_transformations',
          migration_id: migrationId,
          transformations
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`${data.transformed} registros transformados`);
        return data.transformed;
      }

      return 0;
    } catch (err) {
      console.error('[useCRMMigration] applyTransformations error:', err);
      toast.error('Error al aplicar transformaciones');
      return 0;
    }
  }, []);

  // === PREVIEW TRANSFORMATION ===
  const previewTransformation = useCallback(async (
    sourceData: Record<string, unknown>,
    transformation: Transformation
  ): Promise<{ original: Record<string, unknown>; transformed: Record<string, unknown>; field: string; newValue: unknown } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'preview_transformation',
          source_data: sourceData,
          transformation
        }
      });

      if (fnError) throw fnError;

      return data?.success ? data : null;
    } catch (err) {
      console.error('[useCRMMigration] previewTransformation error:', err);
      return null;
    }
  }, []);

  // === SKIP DUPLICATES ===
  const skipDuplicates = useCallback(async (migrationId: string): Promise<number> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('crm-migration-engine', {
        body: {
          action: 'skip_duplicates',
          migration_id: migrationId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`${data.skipped} duplicados marcados como omitidos`);
        return data.skipped;
      }

      return 0;
    } catch (err) {
      console.error('[useCRMMigration] skipDuplicates error:', err);
      toast.error('Error al omitir duplicados');
      return 0;
    }
  }, []);
  const startProgressPolling = useCallback((migrationId: string) => {
    stopProgressPolling();
    pollingInterval.current = setInterval(() => {
      getMigrationStatus(migrationId);
    }, 2000);
  }, [getMigrationStatus]);

  const stopProgressPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // === REALTIME SUBSCRIPTION ===
  useEffect(() => {
    const channel = supabase
      .channel('crm_migrations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_migrations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMigration = payload.new as CRMMigration;
            setMigrations(prev => {
              if (prev.some(m => m.id === newMigration.id)) return prev;
              return [newMigration, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CRMMigration;
            setMigrations(prev => prev.map(m => m.id === updated.id ? updated : m));
            if (activeMigration?.id === updated.id) {
              setActiveMigration(updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMigration]);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopProgressPolling();
  }, [stopProgressPolling]);

  // === RETURN ===
  return {
    // Estado
    migrations,
    activeMigration,
    records,
    fieldMappings,
    connectors,
    templates,
    analysis,
    stats,
    isLoading,
    isAnalyzing,
    isRunning,
    error,
    progress,
    
    // Acciones
    fetchConnectors,
    fetchMigrations,
    fetchTemplates,
    analyzeFile,
    createMigration,
    updateMappings,
    runMigration,
    pauseMigration,
    resumeMigration,
    cancelMigration,
    rollbackMigration,
    fetchRecords,
    getMigrationStatus,
    fetchStats,
    saveTemplate,
    applyTemplate,
    generateAIMappings,
    
    // Fase 4: Validación
    validateMigration,
    checkDuplicates,
    getValidationRules,
    applyTransformations,
    previewTransformation,
    skipDuplicates,
    
    // Control
    setActiveMigration,
    startProgressPolling,
    stopProgressPolling,
  };
}

export default useCRMMigration;
