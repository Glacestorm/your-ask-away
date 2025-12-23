import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupportedLanguage {
  locale: string;
  name: string;
  native_name: string | null;
  is_active: boolean;
  translation_progress: number | null;
}

export function useSupportedLanguages() {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching supported languages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return { languages, loading, refetch: fetchLanguages };
}
