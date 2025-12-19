// Low-Code Builder Types

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'datetime'
  | 'select' 
  | 'multiselect'
  | 'checkbox' 
  | 'radio' 
  | 'file' 
  | 'textarea' 
  | 'richtext'
  | 'signature'
  | 'hidden';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  unique?: boolean;
  customValidator?: string;
}

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface FieldPermissions {
  viewRoles: string[];
  editRoles: string[];
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  helpText?: string;
  options?: FieldOption[];
  validation: FieldValidation;
  conditions?: FieldCondition[];
  permissions?: FieldPermissions;
  readOnly?: boolean;
  hidden?: boolean;
  width?: 'full' | 'half' | 'third';
  order: number;
}

export interface FormDefinition {
  id: string;
  form_key: string;
  form_name: string;
  description?: string;
  module_id?: string;
  fields: FormField[];
  validations: Record<string, any>;
  permissions: {
    viewRoles?: string[];
    submitRoles?: string[];
    adminRoles?: string[];
  };
  settings: {
    submitButtonText?: string;
    successMessage?: string;
    redirectUrl?: string;
    allowMultipleSubmissions?: boolean;
    requireAuthentication?: boolean;
  };
  status: 'draft' | 'published' | 'archived';
  version: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  submitted_by?: string;
  data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Rule Builder Types
export type TriggerType = 
  | 'form_submitted' 
  | 'record_created' 
  | 'record_updated' 
  | 'record_deleted' 
  | 'schedule' 
  | 'manual' 
  | 'webhook';

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than' 
  | 'less_than' 
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty' 
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'matches_regex';

export type ActionType = 
  | 'send_email' 
  | 'send_sms' 
  | 'send_notification'
  | 'update_record' 
  | 'create_record' 
  | 'delete_record'
  | 'call_webhook'
  | 'assign_user'
  | 'change_status'
  | 'execute_rule'
  | 'log_event';

export interface RuleTrigger {
  type: TriggerType;
  config: {
    formId?: string;
    tableName?: string;
    schedule?: string; // cron expression
    webhookPath?: string;
  };
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  order: number;
}

export interface RuleDefinition {
  id: string;
  rule_key: string;
  rule_name: string;
  description?: string;
  module_id?: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_active: boolean;
  priority: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RuleExecution {
  id: string;
  rule_id: string;
  triggered_by?: string;
  trigger_data?: Record<string, any>;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  error_message?: string;
  execution_time_ms?: number;
  created_at?: string;
}

// Report Builder Types
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count';
export type VisualizationType = 'table' | 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'kpi';

export interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  aggregation?: AggregationType;
  formula?: string;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: ConditionOperator;
  value?: any;
  isUserInput?: boolean;
  label?: string;
}

export interface ReportAggregation {
  id: string;
  field: string;
  type: AggregationType;
  label?: string;
}

export interface ReportGrouping {
  field: string;
  order: 'asc' | 'desc';
  showSubtotals?: boolean;
}

export interface ReportSorting {
  field: string;
  order: 'asc' | 'desc';
}

export interface ReportVisualization {
  id: string;
  type: VisualizationType;
  title?: string;
  config: {
    xAxis?: string;
    yAxis?: string;
    series?: string[];
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface ReportDataSource {
  type: 'table' | 'query' | 'api';
  table?: string;
  query?: string;
  apiEndpoint?: string;
  joins?: {
    table: string;
    on: string;
    type: 'inner' | 'left' | 'right';
  }[];
}

export interface ReportDefinition {
  id: string;
  report_key: string;
  report_name: string;
  description?: string;
  module_id?: string;
  data_source: ReportDataSource;
  columns: ReportColumn[];
  filters: ReportFilter[];
  aggregations: ReportAggregation[];
  grouping: ReportGrouping[];
  sorting: ReportSorting[];
  visualizations: ReportVisualization[];
  permissions: {
    viewRoles?: string[];
    exportRoles?: string[];
  };
  export_formats: ('pdf' | 'excel' | 'csv')[];
  schedule?: {
    enabled: boolean;
    cron: string;
    recipients: string[];
  };
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Page Builder Types
export type BlockType = 
  | 'text' 
  | 'heading' 
  | 'image'
  | 'form_embed'
  | 'data_table'
  | 'chart'
  | 'kpi_card'
  | 'tabs'
  | 'accordion'
  | 'grid'
  | 'conditional'
  | 'divider'
  | 'spacer'
  | 'html';

export interface BlockVisibility {
  roles: string[];
  conditions?: FieldCondition[];
}

export interface PageBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  visibility?: BlockVisibility;
  dataSource?: {
    type: 'table' | 'form' | 'report';
    id: string;
    filters?: ReportFilter[];
  };
  children?: PageBlock[];
  order: number;
}

export interface PageDefinition {
  id: string;
  page_key: string;
  page_name: string;
  description?: string;
  module_id?: string;
  layout: {
    type: 'single' | 'sidebar' | 'two-column';
    config?: Record<string, any>;
  };
  blocks: PageBlock[];
  visibility_rules: BlockVisibility;
  data_sources: {
    id: string;
    type: string;
    config: Record<string, any>;
  }[];
  settings: {
    title?: string;
    showBreadcrumbs?: boolean;
    showBackButton?: boolean;
    requireAuth?: boolean;
  };
  status: 'draft' | 'published' | 'archived';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Module Builder Types
export interface LowCodeModule {
  id: string;
  module_key: string;
  module_name: string;
  description?: string;
  icon: string;
  category: string;
  forms: string[];
  pages: string[];
  rules: string[];
  reports: string[];
  permissions: {
    viewRoles: string[];
    adminRoles: string[];
  };
  settings: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  version: number;
  created_by?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Available tables for data sources
export const AVAILABLE_TABLES = [
  { name: 'companies', label: 'Empresas' },
  { name: 'visits', label: 'Visitas' },
  { name: 'products', label: 'Productos' },
  { name: 'profiles', label: 'Usuarios' },
  { name: 'notifications', label: 'Notificaciones' },
  { name: 'lowcode_form_submissions', label: 'Envíos de Formularios' },
] as const;

// Available roles
export const AVAILABLE_ROLES = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'director_comercial', label: 'Director Comercial' },
  { value: 'director_oficina', label: 'Director de Oficina' },
  { value: 'responsable_comercial', label: 'Responsable Comercial' },
  { value: 'user', label: 'Usuario' },
  { value: 'auditor', label: 'Auditor' },
] as const;

// Field type configurations
export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Texto', icon: 'Type' },
  { type: 'number', label: 'Número', icon: 'Hash' },
  { type: 'email', label: 'Email', icon: 'Mail' },
  { type: 'phone', label: 'Teléfono', icon: 'Phone' },
  { type: 'date', label: 'Fecha', icon: 'Calendar' },
  { type: 'datetime', label: 'Fecha y Hora', icon: 'Clock' },
  { type: 'select', label: 'Selector', icon: 'ChevronDown' },
  { type: 'multiselect', label: 'Multi-Selector', icon: 'CheckSquare' },
  { type: 'checkbox', label: 'Casilla', icon: 'CheckSquare' },
  { type: 'radio', label: 'Radio', icon: 'Circle' },
  { type: 'file', label: 'Archivo', icon: 'Upload' },
  { type: 'textarea', label: 'Área de Texto', icon: 'AlignLeft' },
  { type: 'richtext', label: 'Texto Enriquecido', icon: 'FileText' },
  { type: 'signature', label: 'Firma', icon: 'PenTool' },
  { type: 'hidden', label: 'Oculto', icon: 'EyeOff' },
];
