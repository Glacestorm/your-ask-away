import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === ERROR TIPADO KB ===
export interface MarketingAnalyticsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
interface MarketingEvent {
  event_name: string;
  event_type: string;
  metadata?: Record<string, string>;
  page_path?: string;
  user_agent?: string;
  session_id?: string;
}

export function useMarketingAnalytics() {
  // === ESTADO KB ===
  const [error, setError] = useState<MarketingAnalyticsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('marketing_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('marketing_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const trackEvent = useCallback(async (
    eventName: string, 
    eventData: Record<string, string> = {}
  ) => {
    try {
      const event: MarketingEvent = {
        event_name: eventName,
        event_type: 'marketing',
        metadata: eventData,
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
      };

      await supabase.from('marketing_events').insert([event]);
      setLastRefresh(new Date());
      setError(null);
      console.log(`[Marketing] Tracked: ${eventName}`, eventData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error tracking event';
      setError({
        code: 'TRACK_EVENT_ERROR',
        message,
        details: { originalError: String(err) }
      });
      console.error('[Marketing] Error tracking event:', err);
    }
  }, [getSessionId]);

  const trackPageView = useCallback((pageName: string) => {
    return trackEvent('page_view', { page: pageName });
  }, [trackEvent]);

  const trackTabView = useCallback((tabName: string) => {
    return trackEvent('tab_view', { tab: tabName });
  }, [trackEvent]);

  const trackDemoRequest = useCallback((formData: Record<string, string>) => {
    return trackEvent('demo_request', formData);
  }, [trackEvent]);

  const trackLeadCapture = useCallback((source: string, email: string) => {
    return trackEvent('lead_capture', { source, email });
  }, [trackEvent]);

  const trackCTAClick = useCallback((ctaName: string, location: string) => {
    return trackEvent('cta_click', { cta: ctaName, location });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackTabView,
    trackDemoRequest,
    trackLeadCapture,
    trackCTAClick,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}
