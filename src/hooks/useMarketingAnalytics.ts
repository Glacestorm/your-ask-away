import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketingEvent {
  event_name: string;
  event_type: string;
  metadata?: Record<string, string>;
  page_path?: string;
  user_agent?: string;
  session_id?: string;
}

export function useMarketingAnalytics() {
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
      console.log(`[Marketing] Tracked: ${eventName}`, eventData);
    } catch (error) {
      console.error('[Marketing] Error tracking event:', error);
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
  };
}
