/**
 * useCMSContent - KB 2.0 Migration
 * CMS content management with state machine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { KBStatus, KBError, parseError, collectTelemetry } from '@/hooks/core';

interface CMSContent {
  id: string;
  title: unknown;
  content: unknown;
  slug: string;
  status: string;
  metadata: Record<string, unknown>;
}

function getLocalizedValue(value: unknown, locale: string): unknown {
  if (!value) return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj[locale]) return obj[locale];
    if (obj.en) return obj.en;
  }
  return value;
}

export function useCMSContent(key: string, type: 'page' | 'block' = 'page') {
  const [content, setContent] = useState<CMSContent | null>(null);
  const { language } = useLanguage();
  
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setContent(null);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const loadContent = useCallback(async () => {
    if (!key) return;
    
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      if (type === 'page') {
        const { data, error: queryError } = await supabase
          .from('cms_pages' as never)
          .select('*')
          .eq('slug', key)
          .eq('status', 'published')
          .single();

        if (queryError && (queryError as { code?: string }).code !== 'PGRST116') throw queryError;

        if (data) {
          const d = data as Record<string, unknown>;
          setContent({
            id: d.id as string,
            title: getLocalizedValue(d.title, language),
            content: getLocalizedValue(d.content, language),
            slug: d.slug as string,
            status: d.status as string,
            metadata: (d.meta_data as Record<string, unknown>) || {}
          });
        } else {
          setContent(null);
        }
      } else {
        const { data, error: queryError } = await supabase
          .from('cms_blocks' as never)
          .select('*')
          .eq('block_key', key)
          .single();

        if (queryError && (queryError as { code?: string }).code !== 'PGRST116') throw queryError;

        if (data) {
          const d = data as Record<string, unknown>;
          setContent({
            id: d.id as string,
            title: d.block_name as string,
            content: getLocalizedValue(d.content, language),
            slug: d.block_key as string,
            status: 'published',
            metadata: (d.settings as Record<string, unknown>) || {}
          });
        } else {
          setContent(null);
        }
      }

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useCMSContent', 'loadContent', 'success', Date.now() - startTime);
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useCMSContent', 'loadContent', 'error', Date.now() - startTime, kbError);
      console.error('Error loading CMS content:', err);
    }
  }, [key, type, language]);

  useEffect(() => {
    if (key) {
      loadContent();
    }
  }, [key, type, language, loadContent]);

  return { 
    content, 
    loading: isLoading, 
    error, 
    refresh: loadContent,
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

export function useCMSPages(options?: { category?: string; limit?: number }) {
  const [pages, setPages] = useState<CMSContent[]>([]);
  const { language } = useLanguage();
  
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isLoading = status === 'loading';

  const loadPages = useCallback(async () => {
    const startTime = Date.now();
    setStatus('loading');

    try {
      const { data, error: queryError } = await supabase
        .from('cms_pages' as never)
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(options?.limit || 100);

      if (queryError) throw queryError;

      const results = (data || []) as Record<string, unknown>[];
      setPages(results.map((p) => ({
        id: p.id as string,
        title: getLocalizedValue(p.title, language),
        content: getLocalizedValue(p.content, language),
        slug: p.slug as string,
        status: p.status as string,
        metadata: (p.meta_data as Record<string, unknown>) || {}
      })));

      setStatus('success');
      setLastRefresh(new Date());
      collectTelemetry('useCMSPages', 'loadPages', 'success', Date.now() - startTime);
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      collectTelemetry('useCMSPages', 'loadPages', 'error', Date.now() - startTime, kbError);
      console.error('Error loading pages:', err);
    }
  }, [options?.category, options?.limit, language]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  return { 
    pages, 
    loading: isLoading,
    status,
    isLoading,
    error,
    lastRefresh,
    refresh: loadPages,
  };
}
