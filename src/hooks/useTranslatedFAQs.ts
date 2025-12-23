import { useState, useEffect, useRef } from 'react';
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
  const { translateBatchAsync } = useCMSTranslation();
  const [translatedFaqs, setTranslatedFaqs] = useState<FAQ[]>(originalFaqs);
  const [translatedCategories, setTranslatedCategories] = useState<FAQCategory[]>(originalCategories);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const lastLanguageRef = useRef<string>(language);
  const lastDataRef = useRef<string>('');

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
      return;
    }

    // If no data, nothing to translate
    if (originalFaqs.length === 0 && originalCategories.length === 0) {
      setTranslatedFaqs([]);
      setTranslatedCategories([]);
      setIsTranslating(false);
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);

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
      } catch (error) {
        console.error('Error translating FAQs:', error);
        setTranslatedFaqs(originalFaqs);
        setTranslatedCategories(originalCategories);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalFaqs, originalCategories, translateBatchAsync]);

  return {
    faqs: translatedFaqs,
    categories: translatedCategories,
    isTranslating,
  };
}
