import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getNewsImageFallback } from '@/lib/news/placeholders';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  source_name: string;
  source_url: string;
  category: string;
  tags: string[];
  published_at: string;
  ai_summary: string;
  relevance_score: number;
  fetched_at: string;
}

interface NewsCardProps {
  article: NewsArticle;
  index: number;
  onReadMore?: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, index, onReadMore }) => {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { 
    addSuffix: true, 
    locale: es 
  });

  const isNew = new Date().getTime() - new Date(article.fetched_at).getTime() < 3600000; // 1 hour
  const isHighRelevance = article.relevance_score >= 75;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fiscal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Compliance': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Finanzas': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Empresarial': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Tecnología': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'Seguridad': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer"
      onClick={() => onReadMore?.(article)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.image_url || getNewsImageFallback(article.id, article.category || article.source_name)}
          alt={article.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          {isNew && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/30"
            >
              <Sparkles className="w-3 h-3" />
              Nueva
            </motion.span>
          )}
        </div>

        {/* Relevance indicator */}
        {isHighRelevance && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{article.relevance_score}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {article.title}
        </h3>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {article.ai_summary || article.excerpt}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="text-slate-600">•</span>
            <span>{article.source_name}</span>
          </div>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent" />
      </div>
    </motion.article>
  );
};

export default NewsCard;
