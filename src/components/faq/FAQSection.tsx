import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Euro, Rocket, ArrowRightLeft, Blocks, Headphones, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedFAQs } from '@/hooks/useTranslatedFAQs';
import FAQSearchBar from './FAQSearchBar';
import FAQAccordionItem from './FAQAccordionItem';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  priority: number;
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
}

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order_index: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  Euro,
  Rocket,
  ArrowRightLeft,
  Blocks,
  Headphones,
  Shield,
};

const FAQSection: React.FC = () => {
  const { t } = useLanguage();
  const [originalFaqs, setOriginalFaqs] = useState<FAQ[]>([]);
  const [originalCategories, setOriginalCategories] = useState<FAQCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Use translated FAQs hook
  const { faqs, categories, isTranslating } = useTranslatedFAQs(
    originalFaqs as any,
    originalCategories as any
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        supabase.from('faqs').select('*').eq('is_published', true).order('priority', { ascending: false }),
        supabase.from('faq_categories').select('*').eq('is_active', true).order('order_index')
      ]);

      if (faqsRes.error) throw faqsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setOriginalFaqs(faqsRes.data || []);
      setOriginalCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    let result = faqs as FAQ[];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    if (activeCategory) {
      result = result.filter(faq => faq.category_id === activeCategory);
    }

    return result;
  }, [faqs, searchQuery, activeCategory]);

  const handleToggle = async (faqId: string) => {
    const isOpening = openFaqId !== faqId;
    setOpenFaqId(isOpening ? faqId : null);

    // Increment view count when opening
    if (isOpening) {
      try {
        const faq = faqs.find(f => f.id === faqId);
        if (faq) {
          await supabase
            .from('faqs')
            .update({ views_count: (faq.views_count || 0) + 1 })
            .eq('id', faqId);
        }
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    }
  };

  const handleFeedback = async (faqId: string, helpful: boolean) => {
    try {
      const faq = faqs.find(f => f.id === faqId);
      if (!faq) return;

      const updateData = helpful
        ? { helpful_count: (faq.helpful_count || 0) + 1 }
        : { not_helpful_count: (faq.not_helpful_count || 0) + 1 };

      await supabase.from('faqs').update(updateData).eq('id', faqId);

      // Update local state
      setOriginalFaqs(prev =>
        prev.map(f => (f.id === faqId ? { ...f, ...updateData } : f))
      );

      toast({
        title: helpful ? t('faq.feedback.helpful.title') : t('faq.feedback.notHelpful.title'),
        description: helpful
          ? t('faq.feedback.helpful.desc')
          : t('faq.feedback.notHelpful.desc'),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getCategoryById = (id: string | null) =>
    categories.find(c => c.id === id);

  // JSON-LD Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: filteredFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section id="faq" className="py-24 relative">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('faq.badge')}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('faq.subtitle')}
            </p>
            {isTranslating && (
              <div className="flex items-center gap-2 mt-4 text-sm text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('faq.translating')}</span>
              </div>
            )}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <FAQSearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
              placeholder={t('faq.searchPlaceholder')}
            />
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t('faq.categories.all')}
            </button>
            {categories.map(category => {
              const IconComponent = iconMap[category.icon] || HelpCircle;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeCategory === category.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </motion.div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredFaqs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {t('faq.noResults')}
                </p>
              </motion.div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const category = getCategoryById(faq.category_id);
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FAQAccordionItem
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFaqId === faq.id}
                      onToggle={() => handleToggle(faq.id)}
                      onFeedback={helpful => handleFeedback(faq.id, helpful)}
                      helpfulCount={faq.helpful_count}
                      viewsCount={faq.views_count}
                      categoryColor={category?.color}
                    />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
