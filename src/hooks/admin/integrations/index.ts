// Existing exports
export { useAPIConnectors } from './useAPIConnectors';
export type { APIConnector, ConnectorHealth } from './useAPIConnectors';

export { useWebhooks } from './useWebhooks';
export type { Webhook as WebhookLegacy, WebhookDelivery as WebhookDeliveryLegacy } from './useWebhooks';

export { useDataSync } from './useDataSync';
export type { SyncJob as SyncJobLegacy, SyncRun, SyncMetrics } from './useDataSync';

export { useETLPipelines } from './useETLPipelines';
export type { ETLPipeline, ETLStage, ETLExecution, ETLLog } from './useETLPipelines';

// Fase 10 exports
export { useExternalIntegrations } from './useExternalIntegrations';
export type { ExternalIntegration, IntegrationHealth } from './useExternalIntegrations';

export { useWebhookManager } from './useWebhookManager';
export type { Webhook, WebhookDelivery } from './useWebhookManager';

export { useAPIGateway } from './useAPIGateway';
export type { APIEndpoint, APIMetrics, APIKey } from './useAPIGateway';

export { useSyncEngine } from './useSyncEngine';
export type { SyncConfig, FieldMapping, SyncJob, SyncStats } from './useSyncEngine';
