/**
 * useModulePreview - Live Preview Hook for Module Studio
 * Manages real-time preview of module forms, dashboards, and configurations
 * 
 * @version 1.0.0
 * @category Module Studio Phase 2
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

// === TYPES ===

export type PreviewMode = 'form' | 'dashboard' | 'integration' | 'mobile';
export type ViewAsRole = 'admin' | 'user' | 'client' | 'guest';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface ModuleField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'switch' | 'slider' | 'color' | 'file' | 'date' | 'textarea' | 'richtext';
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  visible?: boolean;
  disabled?: boolean;
  helpText?: string;
  group?: string;
  order?: number;
}

export interface ModuleSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: ModuleField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  order?: number;
}

export interface ModulePreviewData {
  moduleKey: string;
  moduleName: string;
  sections: ModuleSection[];
  theme?: 'light' | 'dark' | 'system';
  layout?: 'vertical' | 'horizontal' | 'grid';
  branding?: {
    primaryColor?: string;
    logo?: string;
    companyName?: string;
  };
}

export interface PreviewState {
  formValues: Record<string, unknown>;
  activeSection: string | null;
  expandedSections: string[];
  validationErrors: Record<string, string>;
  isDirty: boolean;
}

export interface PreviewConfig {
  mode: PreviewMode;
  viewAs: ViewAsRole;
  device: DeviceType;
  showGrid: boolean;
  showLabels: boolean;
  showValidation: boolean;
  zoom: number;
}

// === DEFAULT VALUES ===

const defaultConfig: PreviewConfig = {
  mode: 'form',
  viewAs: 'client',
  device: 'desktop',
  showGrid: false,
  showLabels: true,
  showValidation: true,
  zoom: 100,
};

const defaultPreviewState: PreviewState = {
  formValues: {},
  activeSection: null,
  expandedSections: [],
  validationErrors: {},
  isDirty: false,
};

// === HELPERS ===

function extractFieldsFromFeatures(features: unknown): ModuleField[] {
  if (!features) return [];
  
  const fields: ModuleField[] = [];
  
  if (Array.isArray(features)) {
    features.forEach((feat, index) => {
      if (typeof feat === 'string') {
        fields.push({
          id: `feature_${index}`,
          name: `feature_${index}`,
          label: feat,
          type: 'switch',
          defaultValue: true,
          order: index,
        });
      } else if (typeof feat === 'object' && feat !== null) {
        const featObj = feat as Record<string, unknown>;
        fields.push({
          id: featObj.id as string || `feature_${index}`,
          name: featObj.name as string || `feature_${index}`,
          label: featObj.label as string || featObj.name as string || `Feature ${index + 1}`,
          type: (featObj.type as ModuleField['type']) || 'switch',
          defaultValue: featObj.defaultValue ?? featObj.default ?? true,
          placeholder: featObj.placeholder as string,
          helpText: featObj.description as string,
          options: featObj.options as ModuleField['options'],
          validation: featObj.validation as ModuleField['validation'],
          order: index,
        });
      }
    });
  } else if (typeof features === 'object') {
    Object.entries(features as Record<string, unknown>).forEach(([key, value], index) => {
      if (typeof value === 'boolean') {
        fields.push({
          id: key,
          name: key,
          label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          type: 'switch',
          defaultValue: value,
          order: index,
        });
      } else if (typeof value === 'string') {
        fields.push({
          id: key,
          name: key,
          label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          type: 'text',
          defaultValue: value,
          order: index,
        });
      } else if (typeof value === 'number') {
        fields.push({
          id: key,
          name: key,
          label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          type: 'number',
          defaultValue: value,
          order: index,
        });
      } else if (typeof value === 'object' && value !== null) {
        const fieldObj = value as Record<string, unknown>;
        fields.push({
          id: key,
          name: key,
          label: fieldObj.label as string || key.replace(/_/g, ' '),
          type: (fieldObj.type as ModuleField['type']) || 'text',
          defaultValue: fieldObj.defaultValue ?? fieldObj.default,
          placeholder: fieldObj.placeholder as string,
          helpText: fieldObj.description as string,
          options: fieldObj.options as ModuleField['options'],
          validation: fieldObj.validation as ModuleField['validation'],
          order: index,
        });
      }
    });
  }
  
  return fields.sort((a, b) => (a.order || 0) - (b.order || 0));
}

function generatePreviewData(moduleData: Record<string, unknown>): ModulePreviewData {
  const fields = extractFieldsFromFeatures(moduleData.features);
  
  // Group fields by category or create default sections
  const groupedFields: Record<string, ModuleField[]> = {};
  
  fields.forEach(field => {
    const group = field.group || 'general';
    if (!groupedFields[group]) {
      groupedFields[group] = [];
    }
    groupedFields[group].push(field);
  });
  
  const sections: ModuleSection[] = Object.entries(groupedFields).map(([groupName, groupFields], index) => ({
    id: groupName,
    title: groupName === 'general' ? 'Configuración General' : groupName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
    fields: groupFields,
    collapsible: true,
    defaultExpanded: index === 0,
    order: index,
  }));
  
  // Add module info section
  sections.unshift({
    id: 'module_info',
    title: 'Información del Módulo',
    description: moduleData.description as string,
    fields: [
      {
        id: 'enabled',
        name: 'enabled',
        label: 'Módulo Habilitado',
        type: 'switch',
        defaultValue: true,
        helpText: 'Activa o desactiva este módulo',
      },
      {
        id: 'notifications',
        name: 'notifications',
        label: 'Notificaciones',
        type: 'switch',
        defaultValue: true,
        helpText: 'Recibir notificaciones de este módulo',
      },
    ],
    collapsible: false,
    defaultExpanded: true,
    order: -1,
  });
  
  return {
    moduleKey: moduleData.module_key as string || '',
    moduleName: moduleData.module_name as string || 'Módulo',
    sections: sections.sort((a, b) => (a.order || 0) - (b.order || 0)),
  };
}

// === HOOK ===

export function useModulePreview(moduleData: Record<string, unknown> | null) {
  // State
  const [config, setConfig] = useState<PreviewConfig>(defaultConfig);
  const [previewState, setPreviewState] = useState<PreviewState>(defaultPreviewState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Computed preview data
  const previewData = useMemo<ModulePreviewData | null>(() => {
    if (!moduleData) return null;
    return generatePreviewData(moduleData);
  }, [moduleData]);
  
  // Initialize form values when preview data changes
  useEffect(() => {
    if (previewData) {
      const initialValues: Record<string, unknown> = {};
      const expandedSections: string[] = [];
      
      previewData.sections.forEach(section => {
        if (section.defaultExpanded) {
          expandedSections.push(section.id);
        }
        section.fields.forEach(field => {
          initialValues[field.id] = field.defaultValue;
        });
      });
      
      setPreviewState({
        formValues: initialValues,
        activeSection: previewData.sections[0]?.id || null,
        expandedSections,
        validationErrors: {},
        isDirty: false,
      });
    }
  }, [previewData]);
  
  // === CONFIG METHODS ===
  
  const setMode = useCallback((mode: PreviewMode) => {
    setConfig(prev => ({ ...prev, mode }));
  }, []);
  
  const setViewAs = useCallback((viewAs: ViewAsRole) => {
    setConfig(prev => ({ ...prev, viewAs }));
  }, []);
  
  const setDevice = useCallback((device: DeviceType) => {
    setConfig(prev => ({ ...prev, device }));
  }, []);
  
  const setZoom = useCallback((zoom: number) => {
    setConfig(prev => ({ ...prev, zoom: Math.min(200, Math.max(50, zoom)) }));
  }, []);
  
  const toggleShowGrid = useCallback(() => {
    setConfig(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);
  
  const toggleShowLabels = useCallback(() => {
    setConfig(prev => ({ ...prev, showLabels: !prev.showLabels }));
  }, []);
  
  const toggleShowValidation = useCallback(() => {
    setConfig(prev => ({ ...prev, showValidation: !prev.showValidation }));
  }, []);
  
  // === PREVIEW STATE METHODS ===
  
  const setFieldValue = useCallback((fieldId: string, value: unknown) => {
    setPreviewState(prev => ({
      ...prev,
      formValues: { ...prev.formValues, [fieldId]: value },
      isDirty: true,
      validationErrors: { ...prev.validationErrors, [fieldId]: '' }, // Clear error on change
    }));
  }, []);
  
  const setActiveSection = useCallback((sectionId: string | null) => {
    setPreviewState(prev => ({ ...prev, activeSection: sectionId }));
  }, []);
  
  const toggleSection = useCallback((sectionId: string) => {
    setPreviewState(prev => ({
      ...prev,
      expandedSections: prev.expandedSections.includes(sectionId)
        ? prev.expandedSections.filter(id => id !== sectionId)
        : [...prev.expandedSections, sectionId],
    }));
  }, []);
  
  const expandAllSections = useCallback(() => {
    if (!previewData) return;
    setPreviewState(prev => ({
      ...prev,
      expandedSections: previewData.sections.map(s => s.id),
    }));
  }, [previewData]);
  
  const collapseAllSections = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      expandedSections: [],
    }));
  }, []);
  
  // === VALIDATION ===
  
  const validateField = useCallback((field: ModuleField, value: unknown): string | null => {
    if (!field.validation) return null;
    
    const { required, min, max, pattern, message } = field.validation;
    
    if (required && (value === undefined || value === null || value === '')) {
      return message || `${field.label} es requerido`;
    }
    
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        return message || `${field.label} debe ser al menos ${min}`;
      }
      if (max !== undefined && value > max) {
        return message || `${field.label} debe ser máximo ${max}`;
      }
    }
    
    if (typeof value === 'string' && pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return message || `${field.label} tiene un formato inválido`;
      }
    }
    
    return null;
  }, []);
  
  const validateAll = useCallback((): boolean => {
    if (!previewData) return true;
    
    const errors: Record<string, string> = {};
    let isValid = true;
    
    previewData.sections.forEach(section => {
      section.fields.forEach(field => {
        const value = previewState.formValues[field.id];
        const error = validateField(field, value);
        if (error) {
          errors[field.id] = error;
          isValid = false;
        }
      });
    });
    
    setPreviewState(prev => ({ ...prev, validationErrors: errors }));
    return isValid;
  }, [previewData, previewState.formValues, validateField]);
  
  // === ACTIONS ===
  
  const resetForm = useCallback(() => {
    if (!previewData) return;
    
    const initialValues: Record<string, unknown> = {};
    previewData.sections.forEach(section => {
      section.fields.forEach(field => {
        initialValues[field.id] = field.defaultValue;
      });
    });
    
    setPreviewState(prev => ({
      ...prev,
      formValues: initialValues,
      validationErrors: {},
      isDirty: false,
    }));
  }, [previewData]);
  
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 300));
    resetForm();
    setIsRefreshing(false);
  }, [resetForm]);
  
  const exportFormData = useCallback(() => {
    return {
      moduleKey: previewData?.moduleKey,
      values: previewState.formValues,
      timestamp: new Date().toISOString(),
    };
  }, [previewData, previewState.formValues]);
  
  // === DEVICE DIMENSIONS ===
  
  const deviceDimensions = useMemo(() => {
    const dimensions = {
      desktop: { width: '100%', maxWidth: '1200px', height: 'auto' },
      tablet: { width: '768px', maxWidth: '768px', height: '1024px' },
      mobile: { width: '375px', maxWidth: '375px', height: '667px' },
    };
    return dimensions[config.device];
  }, [config.device]);
  
  // === RETURN ===
  
  return {
    // Data
    previewData,
    config,
    previewState,
    deviceDimensions,
    isRefreshing,
    
    // Config setters
    setMode,
    setViewAs,
    setDevice,
    setZoom,
    toggleShowGrid,
    toggleShowLabels,
    toggleShowValidation,
    
    // State setters
    setFieldValue,
    setActiveSection,
    toggleSection,
    expandAllSections,
    collapseAllSections,
    
    // Actions
    validateField,
    validateAll,
    resetForm,
    refresh,
    exportFormData,
  };
}

export default useModulePreview;
