import { useState, useEffect, useCallback, useRef } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

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
}

export function useTranslatedFAQs(
  originalFaqs: FAQ[],
  originalCategories: FAQCategory[]
): TranslatedFAQs {
  const { language } = useLanguage();
  const { translateAsync } = useCMSTranslation();
  const [translatedFaqs, setTranslatedFaqs] = useState<FAQ[]>(originalFaqs);
  const [translatedCategories, setTranslatedCategories] = useState<FAQCategory[]>(originalCategories);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Track what we've already translated to avoid re-translating
  const translationCacheRef = useRef<Record<string, string>>({});
  const lastLanguageRef = useRef<string>(language);

  const translateText = useCallback(async (text: string, targetLocale: string): Promise<string> => {
    if (!text || targetLocale === 'es') return text;
    
    const cacheKey = `${targetLocale}|${text}`;
    if (translationCacheRef.current[cacheKey]) {
      return translationCacheRef.current[cacheKey];
    }

    try {
      const translated = await translateAsync(text, targetLocale, 'es');
      translationCacheRef.current[cacheKey] = translated;
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }, [translateAsync]);

  useEffect(() => {
    // Reset cache when language changes
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
    }

    // If Spanish, use originals directly
    if (language === 'es') {
      setTranslatedFaqs(originalFaqs);
      setTranslatedCategories(originalCategories);
      setIsTranslating(false);
      return;
    }

    // If no FAQs, nothing to translate
    if (originalFaqs.length === 0 && originalCategories.length === 0) {
      setTranslatedFaqs([]);
      setTranslatedCategories([]);
      setIsTranslating(false);
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);

      try {
        // Translate categories first (usually fewer)
        const translatedCats = await Promise.all(
          originalCategories.map(async (cat) => ({
            ...cat,
            name: await translateText(cat.name, language),
          }))
        );
        setTranslatedCategories(translatedCats);

        // Translate FAQs
        const translatedFaqsList = await Promise.all(
          originalFaqs.map(async (faq) => ({
            ...faq,
            question: await translateText(faq.question, language),
            answer: await translateText(faq.answer, language),
          }))
        );
        setTranslatedFaqs(translatedFaqsList);
      } catch (error) {
        console.error('Error translating FAQs:', error);
        // Fallback to originals
        setTranslatedFaqs(originalFaqs);
        setTranslatedCategories(originalCategories);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalFaqs, originalCategories, translateText]);

  return {
    faqs: translatedFaqs,
    categories: translatedCategories,
    isTranslating,
  };
}
