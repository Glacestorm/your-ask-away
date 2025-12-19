// =====================================================
// BPMN + Process Mining Types
// =====================================================

// Node types in BPMN
export type BPMNNodeType = 
  | 'start_event'
  | 'end_event'
  | 'task'
  | 'user_task'
  | 'service_task'
  | 'gateway_exclusive' // XOR
  | 'gateway_parallel'  // AND
  | 'gateway_inclusive' // OR
  | 'intermediate_event'
  | 'timer_event'
  | 'message_event';

export interface BPMNNodePosition {
  x: number;
  y: number;
}

export interface BPMNNodeConfig {
  assignee?: string;
  assigneeType?: 'user' | 'role' | 'dynamic';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actions?: BPMNAction[];
  form?: Record<string, any>;
}

export interface BPMNAction {
  type: 'email' | 'notification' | 'webhook' | 'update_field' | 'create_task';
  config: Record<string, any>;
}

export interface BPMNNode {
  id: string;
  type: BPMNNodeType;
  label: string;
  position: BPMNNodePosition;
  config?: BPMNNodeConfig;
  description?: string;
}

export interface BPMNEdgeCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface BPMNEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: BPMNEdgeCondition;
  isDefault?: boolean;
}

export interface SLAConfig {
  [nodeId: string]: {
    maxDuration: number; // hours
    warningAt: number; // percentage (0-100)
    escalateAfter?: number; // hours
  };
}

export interface EscalationRule {
  condition: 'sla_warning' | 'sla_breach' | 'time_exceeded' | 'custom';
  escalateTo: string[]; // user IDs or role names
  notifyVia: ('email' | 'notification' | 'sms')[];
  message?: string;
}

export interface TriggerConditions {
  onEntityCreate?: boolean;
  onStatusChange?: string[];
  manual?: boolean;
  scheduled?: string; // cron expression
}

export type BPMNEntityType = 
  | 'opportunity'
  | 'company'
  | 'visit'
  | 'task'
  | 'quote'
  | 'invoice'
  | 'workflow'
  | 'custom';

// Process Definition
export interface ProcessDefinition {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  is_template: boolean;
  entity_type: BPMNEntityType;
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  sla_config: SLAConfig;
  escalation_rules: EscalationRule[];
  variables_schema: Record<string, any>;
  trigger_conditions: TriggerConditions;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Process Instance (running process)
export type ProcessInstanceStatus = 'running' | 'completed' | 'failed' | 'suspended' | 'cancelled';
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

export interface ProcessInstanceHistory {
  nodeId: string;
  nodeName?: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number; // ms
  actorId?: string;
}

export interface ProcessInstance {
  id: string;
  process_definition_id: string;
  entity_type: string;
  entity_id: string;
  current_node_id: string;
  previous_node_id?: string;
  status: ProcessInstanceStatus;
  started_at: string;
  expected_completion?: string;
  actual_completion?: string;
  sla_status: SLAStatus;
  variables: Record<string, any>;
  history: ProcessInstanceHistory[];
  created_by?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  process_definition?: ProcessDefinition;
}

// SLA Violation
export type ViolationType = 'time_exceeded' | 'escalation_triggered' | 'warning_threshold' | 'deadline_missed';

export interface SLAViolation {
  id: string;
  instance_id: string;
  process_definition_id?: string;
  node_id: string;
  node_name?: string;
  violation_type: ViolationType;
  expected_duration?: string;
  actual_duration?: string;
  exceeded_by?: string;
  exceeded_percentage?: number;
  escalated_to: string[];
  escalation_level: number;
  notification_sent: boolean;
  notification_sent_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

// Process Event (Event Log)
export type ActorType = 'user' | 'system' | 'automation' | 'trigger';
export type ProcessEventEntityType = 
  | 'opportunity'
  | 'company'
  | 'visit'
  | 'visit_sheet'
  | 'task'
  | 'quote'
  | 'invoice'
  | 'workflow'
  | 'document'
  | 'contact';

export interface ProcessEvent {
  id: string;
  tenant_id?: string;
  actor_id?: string;
  actor_type: ActorType;
  entity_type: ProcessEventEntityType;
  entity_id: string;
  action: string;
  from_state?: string;
  to_state?: string;
  metadata: Record<string, any>;
  duration_ms?: number;
  process_definition_id?: string;
  process_instance_id?: string;
  node_id?: string;
  occurred_at: string;
  created_at: string;
}

// Process Mining Types
export interface ProcessMiningSnapshot {
  id: string;
  name: string;
  description?: string;
  process_definition_id?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
  analysis_results: ProcessMiningResults;
  created_by?: string;
  created_at: string;
}

export interface ProcessMiningResults {
  processMap?: ProcessMapData;
  bottlenecks?: BottleneckData[];
  variants?: ProcessVariant[];
  slaCompliance?: SLAComplianceData;
  statistics?: ProcessStatistics;
}

export interface ProcessMapData {
  nodes: ProcessMapNode[];
  edges: ProcessMapEdge[];
}

export interface ProcessMapNode {
  id: string;
  label: string;
  frequency: number;
  avgDuration: number;
  isBottleneck: boolean;
}

export interface ProcessMapEdge {
  source: string;
  target: string;
  frequency: number;
  avgDuration: number;
}

export interface BottleneckData {
  nodeId: string;
  nodeName?: string;
  avgDurationMs: number;
  maxDurationMs: number;
  minDurationMs: number;
  eventCount: number;
  bottleneckScore: number;
}

export interface ProcessVariant {
  id: string;
  path: string[];
  frequency: number;
  percentage: number;
  avgDuration: number;
  isExpected: boolean;
}

export interface SLAComplianceData {
  totalInstances: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  complianceRate: number;
  byNode: {
    nodeId: string;
    nodeName: string;
    complianceRate: number;
    avgExceedance?: number;
  }[];
}

export interface ProcessStatistics {
  totalEvents: number;
  uniqueEntities: number;
  uniqueActors: number;
  avgDurationMs: number;
  actionsDistribution: Record<string, number>;
  entityTypeDistribution: Record<string, number>;
  timeSeriesData?: {
    date: string;
    eventCount: number;
    avgDuration: number;
  }[];
}

// BPMN Designer State
export interface BPMNDesignerState {
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDragging: boolean;
  zoom: number;
  pan: { x: number; y: number };
}

// Create/Update DTOs
export interface CreateProcessDefinition {
  name: string;
  description?: string;
  entity_type: BPMNEntityType;
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  sla_config?: SLAConfig;
  escalation_rules?: EscalationRule[];
  trigger_conditions?: TriggerConditions;
  is_template?: boolean;
}

export interface UpdateProcessDefinition extends Partial<CreateProcessDefinition> {
  is_active?: boolean;
}

export interface CreateProcessInstance {
  process_definition_id: string;
  entity_type: string;
  entity_id: string;
  current_node_id: string;
  variables?: Record<string, any>;
}

export interface EmitProcessEventParams {
  entity_type: ProcessEventEntityType;
  entity_id: string;
  action: string;
  from_state?: string;
  to_state?: string;
  metadata?: Record<string, any>;
  actor_type?: ActorType;
}
