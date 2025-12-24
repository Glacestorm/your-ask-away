import { useState, useEffect, useRef, useCallback } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string;
  helpful_count: number;
  not_helpful_count: number;
  views_count: number;
}

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface TranslatedFAQs {
  faqs: FAQ[];
  categories: FAQCategory[];
  isTranslating: boolean;
  // === KB 2.0 ===
  status: KBStatus;
  error: KBError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
}

export function useTranslatedFAQs(
  originalFaqs: FAQ[],
  originalCategories: FAQCategory[]
): TranslatedFAQs {
  const { language } = useLanguage();
  const { translateBatchAsync } = useCMSTranslation();
  const [translatedFaqs, setTranslatedFaqs] = useState<FAQ[]>(originalFaqs);
  const [translatedCategories, setTranslatedCategories] = useState<FAQCategory[]>(originalCategories);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const lastLanguageRef = useRef<string>(language);
  const lastDataRef = useRef<string>('');

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

  useEffect(() => {
    const dataKey = `${originalFaqs.map(f => f.id).join(',')}|${originalCategories.map(c => c.id).join(',')}`;
    
    // Skip if nothing changed
    if (lastLanguageRef.current === language && lastDataRef.current === dataKey) {
      return;
    }
    
    lastLanguageRef.current = language;
    lastDataRef.current = dataKey;

    // If Spanish, use originals directly
    if (language === 'es') {
      setTranslatedFaqs(originalFaqs);
      setTranslatedCategories(originalCategories);
      setIsTranslating(false);
      setStatus('success');
      return;
    }

    // If no data, nothing to translate
    if (originalFaqs.length === 0 && originalCategories.length === 0) {
      setTranslatedFaqs([]);
      setTranslatedCategories([]);
      setIsTranslating(false);
      setStatus('success');
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);
      setStatus('loading');
      setError(null);
      const startTime = Date.now();

      try {
        // Collect all texts to translate
        const textsToTranslate: string[] = [];
        const textIndexes: { type: 'faq' | 'category'; index: number; field: string }[] = [];
        
        // Collect category names
        originalCategories.forEach((cat, index) => {
          if (cat.name) {
            textsToTranslate.push(cat.name);
            textIndexes.push({ type: 'category', index, field: 'name' });
          }
        });
        
        // Collect FAQ questions and answers
        originalFaqs.forEach((faq, index) => {
          if (faq.question) {
            textsToTranslate.push(faq.question);
            textIndexes.push({ type: 'faq', index, field: 'question' });
          }
          if (faq.answer) {
            textsToTranslate.push(faq.answer);
            textIndexes.push({ type: 'faq', index, field: 'answer' });
          }
        });
        
        // Batch translate all texts at once
        const translatedTexts = await translateBatchAsync(textsToTranslate, language, 'es');
        
        // Reconstruct data with translations
        const newCategories = originalCategories.map(cat => ({ ...cat }));
        const newFaqs = originalFaqs.map(faq => ({ ...faq }));
        
        translatedTexts.forEach((translated, i) => {
          const { type, index, field } = textIndexes[i];
          if (type === 'category') {
            (newCategories[index] as any)[field] = translated;
          } else {
            (newFaqs[index] as any)[field] = translated;
          }
        });
        
        setTranslatedCategories(newCategories);
        setTranslatedFaqs(newFaqs);
        setStatus('success');
        setLastSuccess(new Date());
        setRetryCount(0);
        collectTelemetry('useTranslatedFAQs', 'translateAll', 'success', Date.now() - startTime);
      } catch (err) {
        const parsedErr = parseError(err);
        const kbError = createKBError('TRANSLATION_ERROR', parsedErr.message, { originalError: String(err) });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useTranslatedFAQs', 'translateAll', 'error', Date.now() - startTime, kbError);
        console.error('Error translating FAQs:', err);
        setTranslatedFaqs(originalFaqs);
        setTranslatedCategories(originalCategories);
      } finally {
        setIsTranslating(false);
        setLastRefresh(new Date());
      }
    };

    translateAll();
  }, [language, originalFaqs, originalCategories, translateBatchAsync]);

  return {
    faqs: translatedFaqs,
    categories: translatedCategories,
    isTranslating,
    // === KB 2.0 ===
    status,
    error,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}
