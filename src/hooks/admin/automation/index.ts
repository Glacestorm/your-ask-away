/**
 * Automation Hooks - Barrel Export
 * Fase 5 - Automation & Orchestration
 * Fase 9 - Automation & Workflow Engine
 */

// Fase 5 exports
export { useWorkflowAutomation } from './useWorkflowAutomation';
export { useTaskOrchestrator } from './useTaskOrchestrator';
export { useEventProcessor } from './useEventProcessor';
export { useScheduler } from './useScheduler';

// Fase 9 exports
export { useWorkflowEngine } from './useWorkflowEngine';
export { useBusinessRules } from './useBusinessRules';
export { useNotificationSystem } from './useNotificationSystem';
export { useScheduledTasks } from './useScheduledTasks';

export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecution,
  WorkflowContext
} from './useWorkflowAutomation';

export type {
  OrchestratedTask,
  TaskQueue,
  OrchestratorMetrics
} from './useTaskOrchestrator';

export type {
  EventDefinition,
  EventHandler,
  ProcessedEvent,
  EventMetrics
} from './useEventProcessor';

export type {
  ScheduledJob,
  JobExecution,
  SchedulerMetrics
} from './useScheduler';
