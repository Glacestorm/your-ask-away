/**
 * useModuleExportImport - Exportación e importación de módulos
 * Soporte para formatos JSON, YAML, ZIP con assets
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExportOptions {
  format: 'json' | 'yaml' | 'zip';
  includeAssets: boolean;
  includeConfigs: boolean;
  includeVersions: boolean;
  encryptSensitiveData: boolean;
}

export interface ImportResult {
  success: boolean;
  moduleKey: string;
  moduleName: string;
  warnings: string[];
  errors: string[];
  importedAt: string;
}

export interface ExportResult {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

interface ExportImportState {
  isExporting: boolean;
  isImporting: boolean;
  isValidating: boolean;
  exportProgress: number;
  importProgress: number;
  lastExport: ExportResult | null;
  lastImport: ImportResult | null;
}

export function useModuleExportImport() {
  const [state, setState] = useState<ExportImportState>({
    isExporting: false,
    isImporting: false,
    isValidating: false,
    exportProgress: 0,
    importProgress: 0,
    lastExport: null,
    lastImport: null
  });

  // Export module
  const exportModule = useCallback(async (
    moduleKey: string,
    options: ExportOptions
  ): Promise<ExportResult | null> => {
    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          exportProgress: Math.min(prev.exportProgress + 10, 90)
        }));
      }, 200);

      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'export_module',
          moduleKey,
          options
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      const result: ExportResult = {
        success: true,
        downloadUrl: data?.downloadUrl || `data:application/json;base64,${btoa(JSON.stringify(data?.module || {}))}`,
        fileName: `${moduleKey}-export-${new Date().toISOString().split('T')[0]}.${options.format}`,
        fileSize: data?.fileSize || 1024,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      setState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 100,
        lastExport: result
      }));

      toast.success('Módulo exportado correctamente');
      return result;
    } catch (error) {
      console.error('[useModuleExportImport] exportModule error:', error);
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
      toast.error('Error al exportar módulo');
      return null;
    }
  }, []);

  // Validate import file
  const validateImport = useCallback(async (file: File): Promise<{
    isValid: boolean;
    moduleName?: string;
    moduleKey?: string;
    version?: string;
    warnings: string[];
    errors: string[];
  }> => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const content = await file.text();
      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch {
        setState(prev => ({ ...prev, isValidating: false }));
        return {
          isValid: false,
          warnings: [],
          errors: ['El archivo no contiene JSON válido']
        };
      }

      const warnings: string[] = [];
      const errors: string[] = [];

      // Validate required fields
      if (!parsed.moduleKey) errors.push('Falta el campo moduleKey');
      if (!parsed.moduleName) errors.push('Falta el campo moduleName');
      if (!parsed.config) warnings.push('No se encontró configuración de módulo');

      // Check for conflicts
      const { data: existingModule } = await supabase
        .from('app_modules')
        .select('module_key')
        .eq('module_key', parsed.moduleKey)
        .single();

      if (existingModule) {
        warnings.push(`Ya existe un módulo con key "${parsed.moduleKey}", se sobrescribirá`);
      }

      setState(prev => ({ ...prev, isValidating: false }));

      return {
        isValid: errors.length === 0,
        moduleName: parsed.moduleName,
        moduleKey: parsed.moduleKey,
        version: parsed.version,
        warnings,
        errors
      };
    } catch (error) {
      console.error('[useModuleExportImport] validateImport error:', error);
      setState(prev => ({ ...prev, isValidating: false }));
      return {
        isValid: false,
        warnings: [],
        errors: ['Error al procesar el archivo']
      };
    }
  }, []);

  // Import module
  const importModule = useCallback(async (
    file: File,
    overwrite: boolean = false
  ): Promise<ImportResult | null> => {
    setState(prev => ({ ...prev, isImporting: true, importProgress: 0 }));

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          importProgress: Math.min(prev.importProgress + 15, 90)
        }));
      }, 300);

      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'import_module',
          moduleData: parsed,
          overwrite
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      const result: ImportResult = {
        success: true,
        moduleKey: parsed.moduleKey,
        moduleName: parsed.moduleName,
        warnings: data?.warnings || [],
        errors: [],
        importedAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        isImporting: false,
        importProgress: 100,
        lastImport: result
      }));

      toast.success(`Módulo "${parsed.moduleName}" importado correctamente`);
      return result;
    } catch (error) {
      console.error('[useModuleExportImport] importModule error:', error);
      setState(prev => ({ ...prev, isImporting: false, importProgress: 0 }));
      toast.error('Error al importar módulo');
      return null;
    }
  }, []);

  // Generate download
  const triggerDownload = useCallback((result: ExportResult) => {
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    ...state,
    exportModule,
    validateImport,
    importModule,
    triggerDownload
  };
}

export default useModuleExportImport;
