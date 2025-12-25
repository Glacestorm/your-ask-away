/**
 * useEventProcessor - Hook para procesamiento de eventos
 * Fase 5 - Automation & Orchestration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventDefinition {
  id: string;
  event_name: string;
  event_type: 'system' | 'user' | 'integration' | 'scheduled' | 'webhook';
  source: string;
  schema: Record<string, unknown>;
  handlers: EventHandler[];
  is_active: boolean;
  retention_days: number;
  created_at: string;
}

export interface EventHandler {
  id: string;
  handler_name: string;
  handler_type: 'function' | 'workflow' | 'notification' | 'webhook' | 'aggregation';
  config: Record<string, unknown>;
  filters?: Record<string, unknown>;
  is_async: boolean;
  timeout_ms: number;
  retry_policy?: {
    max_retries: number;
    backoff_ms: number;
  };
}

export interface ProcessedEvent {
  id: string;
  event_id: string;
  event_name: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'dead_letter';
  processed_by: string[];
  processing_time_ms: number;
  error_message?: string;
  received_at: string;
  processed_at?: string;
}

export interface EventMetrics {
  events_per_minute: number;
  avg_processing_time_ms: number;
  success_rate: number;
  dead_letter_count: number;
  active_handlers: number;
  events_by_type: Record<string, number>;
}

export function useEventProcessor() {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventDefinition[]>([]);
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'event-processor',
        {
          body: {
            action: 'list_events'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setEvents(data.events || []);
        setMetrics(data.metrics || null);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useEventProcessor] fetchEvents error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProcessedEvents = useCallback(async (filters?: { 
    event_name?: string; 
    status?: string;
    limit?: number;
  }) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'event-processor',
        {
          body: {
            action: 'get_processed_events',
            filters
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setProcessedEvents(data.processed_events || []);
        return data.processed_events;
      }

      return [];
    } catch (err) {
      console.error('[useEventProcessor] fetchProcessedEvents error:', err);
      return [];
    }
  }, []);

  const publishEvent = useCallback(async (eventName: string, payload: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'event-processor',
        {
          body: {
            action: 'publish_event',
            eventName,
            payload
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Evento publicado');
        return data.event_id;
      }

      return null;
    } catch (err) {
      console.error('[useEventProcessor] publishEvent error:', err);
      toast.error('Error al publicar evento');
      return null;
    }
  }, []);

  const registerHandler = useCallback(async (eventId: string, handler: Partial<EventHandler>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'event-processor',
        {
          body: {
            action: 'register_handler',
            eventId,
            handler
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Handler registrado');
        await fetchEvents();
        return data.handler;
      }

      return null;
    } catch (err) {
      console.error('[useEventProcessor] registerHandler error:', err);
      toast.error('Error al registrar handler');
      return null;
    }
  }, [fetchEvents]);

  const reprocessDeadLetter = useCallback(async (eventId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'event-processor',
        {
          body: {
            action: 'reprocess_dead_letter',
            eventId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Evento reencolado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useEventProcessor] reprocessDeadLetter error:', err);
      toast.error('Error al reprocesar evento');
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = 10000) => {
    stopAutoRefresh();
    fetchEvents();
    autoRefreshInterval.current = setInterval(() => {
      fetchEvents();
    }, intervalMs);
  }, [fetchEvents]);

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
    events,
    processedEvents,
    metrics,
    error,
    lastRefresh,
    fetchEvents,
    fetchProcessedEvents,
    publishEvent,
    registerHandler,
    reprocessDeadLetter,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useEventProcessor;
