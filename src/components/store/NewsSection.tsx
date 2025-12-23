import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewsTicker from '@/components/news/NewsTicker';
import PremiumNewsCard from '@/components/news/PremiumNewsCard';
import NewsSearch from '@/components/news/NewsSearch';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { useTranslatedNews } from '@/hooks/useTranslatedNews';
import { useLanguage } from '@/contexts/LanguageContext';

const NewsSection: React.FC = () => {
  const { articles: originalArticles } = useNewsArticles({ limit: 6 });
  const { articles } = useTranslatedNews(originalArticles);
  const { t } = useLanguage();

  // Don't render anything if no articles
  if (articles.length === 0) {
    return null;
  }

  const tickerItems = articles.slice(0, 6).map(article => ({
    id: article.id,
    title: article.title,
    category: article.category || t('news.title')
  }));

  return (
    <section id="news" className="py-24 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('news.aiUpdate')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
            {t('news.title')}
          </h2>
          <p className="text-lg text-slate-400">
            {t('news.subtitle')}
          </p>
        </motion.div>

        {/* News Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <NewsSearch />
        </motion.div>

        {/* News Ticker */}
        {tickerItems.length > 0 && (
          <div className="mb-8">
            <NewsTicker items={tickerItems} />
          </div>
        )}

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {articles.slice(0, 3).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <PremiumNewsCard
                article={{
                  id: article.id,
                  title: article.title,
                  slug: article.slug || article.id,
                  excerpt: article.ai_summary || article.content?.substring(0, 150) || '',
                  image_url: article.image_url || '',
                  image_credit: article.image_credit || article.source_name || 'Fuente',
                  source_name: article.source_name || 'Fuente',
                  source_url: article.source_url || '',
                  category: article.category || t('news.title'),
                  tags: article.tags || [],
                  published_at: article.published_at,
                  ai_summary: article.ai_summary || '',
                  relevance_score: article.relevance_score || 0,
                  fetched_at: article.fetched_at || article.published_at
                }}
                index={index}
                variant="default"
              />
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/blog">
            <Button
              variant="outline"
              className="h-12 px-8 text-base font-medium border-slate-700 text-white hover:bg-slate-800 rounded-full"
            >
              {t('news.viewAll')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsSection;
