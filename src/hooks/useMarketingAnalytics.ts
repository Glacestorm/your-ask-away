import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// Re-export for backwards compat
export type MarketingAnalyticsError = KBError;

interface MarketingEvent {
  event_name: string;
  event_type: string;
  metadata?: Record<string, string>;
  page_path?: string;
  user_agent?: string;
  session_id?: string;
}

export function useMarketingAnalytics() {
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

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
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

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
      
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useMarketingAnalytics', 'trackEvent', 'success', Date.now() - startTime);
      console.log(`[Marketing] Tracked: ${eventName}`, eventData);
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('TRACK_EVENT_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useMarketingAnalytics', 'trackEvent', 'error', Date.now() - startTime, kbError);
      console.error('[Marketing] Error tracking event:', err);
    }
  }, [getSessionId]);

  const trackPageView = useCallback((pageName: string) => {
    return trackEvent('page_view', { page: pageName });
  }, [trackEvent]);

  const trackTabView = useCallback((tabName: string) => {
    return trackEvent('tab_view', { tab: tabName });
  }, [trackEvent]);

  const trackDemoRequest = useCallback(async (formData: Record<string, string>) => {
    // Guardar en marketing_events para analytics
    await trackEvent('demo_request', formData);
    
    // Guardar también en demo_requests para seguimiento comercial
    try {
      await supabase.from('demo_requests').insert([{
        full_name: formData.name || formData.full_name || '',
        email: formData.email || '',
        company: formData.company || '',
        message: formData.message || null,
        source_page: window.location.pathname,
        status: 'pending',
      }]);
      console.log('[Marketing] Demo request saved to demo_requests table');
    } catch (err) {
      console.error('[Marketing] Error saving to demo_requests:', err);
    }
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
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
