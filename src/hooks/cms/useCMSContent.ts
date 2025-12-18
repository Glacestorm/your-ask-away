import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface CMSContent {
  id: string;
  title: string;
  content: any;
  slug: string;
  status: string;
  metadata: Record<string, any>;
}

export function useCMSContent(key: string, type: 'page' | 'block' = 'page') {
  const [content, setContent] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (key) {
      loadContent();
    }
  }, [key, type, language]);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      if (type === 'page') {
        const { data, error } = await (supabase as any)
          .from('cms_pages')
          .select('*')
          .eq('slug', key)
          .eq('status', 'published')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setContent({
            id: data.id,
            title: getLocalizedValue(data.title, language),
            content: getLocalizedValue(data.content, language),
            slug: data.slug,
            status: data.status,
            metadata: data.meta_data || {}
          });
        } else {
          setContent(null);
        }
      } else {
        const { data, error } = await (supabase as any)
          .from('cms_blocks')
          .select('*')
          .eq('block_key', key)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setContent({
            id: data.id,
            title: data.block_name,
            content: getLocalizedValue(data.content, language),
            slug: data.block_key,
            status: 'published',
            metadata: data.settings || {}
          });
        } else {
          setContent(null);
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading CMS content:', err);
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, refresh: loadContent };
}

export function useCMSPages(options?: { category?: string; limit?: number }) {
  const [pages, setPages] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    loadPages();
  }, [options?.category, options?.limit, language]);

  const loadPages = async () => {
    try {
      let query = (supabase as any)
        .from('cms_pages')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPages((data || []).map((p: any) => ({
        id: p.id,
        title: getLocalizedValue(p.title, language),
        content: getLocalizedValue(p.content, language),
        slug: p.slug,
        status: p.status,
        metadata: p.meta_data || {}
      })));
    } catch (err) {
      console.error('Error loading pages:', err);
    } finally {
      setLoading(false);
    }
  };

  return { pages, loading };
}

function getLocalizedValue(value: any, locale: string): any {
  if (!value) return value;
  if (typeof value === 'object' && value[locale]) {
    return value[locale];
  }
  if (typeof value === 'object' && value.en) {
    return value.en;
  }
  return value;
}
