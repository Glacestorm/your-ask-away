/**
 * Automation Hooks - Barrel Export
 * Fase 5 - Automation & Orchestration
 */

export { useWorkflowAutomation } from './useWorkflowAutomation';
export { useTaskOrchestrator } from './useTaskOrchestrator';
export { useEventProcessor } from './useEventProcessor';
export { useScheduler } from './useScheduler';

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
