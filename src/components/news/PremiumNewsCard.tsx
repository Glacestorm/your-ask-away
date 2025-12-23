import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ExternalLink, Sparkles, TrendingUp, Eye, ChevronDown, Shield, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, fr, ca } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { getNewsImageFallback } from '@/lib/news/placeholders';
import NewsProductConnection from './NewsProductConnection';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavedNews } from '@/hooks/useSavedNews';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  image_credit?: string | null;
  source_name: string;
  source_url: string;
  category: string;
  tags: string[];
  published_at: string;
  ai_summary: string;
  relevance_score: number;
  fetched_at: string;
  read_count?: number;
  product_connection?: string | null;
  product_relevance_reason?: string | null;
  importance_level?: string;
}


interface PremiumNewsCardProps {
  article: NewsArticle;
  index: number;
  variant?: 'default' | 'featured' | 'compact';
  onReadMore?: (article: NewsArticle) => void;
}

const PremiumNewsCard = ({ 
  article, 
  index, 
  variant = 'default',
  onReadMore 
}: PremiumNewsCardProps) => {
  const [showConnection, setShowConnection] = useState(false);
  const { t, language } = useLanguage();
  const { isSaved, toggleSave, isLoading: isSaveLoading } = useSavedNews(article.id);

  const getDateLocale = () => {
    const locales: Record<string, typeof es> = { es, en: enUS, fr, ca };
    return locales[language] || es;
  };

  const hasOriginalImage = Boolean(article.image_url);
  const imageUrl = hasOriginalImage
    ? article.image_url
    : getNewsImageFallback(article.id, article.category || article.source_name);

  // Legal compliance: only show source credit when we actually display the original image.
  const imageCredit = hasOriginalImage
    ? (article.image_credit || article.source_name)
    : 'Ilustración (ObelixIA)';

  const timeAgo = formatDistanceToNow(new Date(article.published_at), { 
    addSuffix: true, 
    locale: getDateLocale() 
  });

  const isNew = new Date().getTime() - new Date(article.fetched_at).getTime() < 3600000;
  const isHighRelevance = article.relevance_score >= 75;
  const hasProductConnection = article.product_connection || article.product_relevance_reason;

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      'Fiscal': 'from-amber-500 to-orange-600',
      'Compliance': 'from-blue-500 to-indigo-600',
      'Finanzas': 'from-emerald-500 to-teal-600',
      'Empresarial': 'from-purple-500 to-violet-600',
      'Tecnología': 'from-cyan-500 to-blue-600',
      'Seguridad': 'from-rose-500 to-red-600',
    };
    return gradients[category] || 'from-slate-500 to-slate-600';
  };

  const getImportanceBadge = () => {
    switch (article.importance_level) {
      case 'critical':
        return { text: 'Crítico', class: 'bg-rose-500 text-white animate-pulse' };
      case 'high':
        return { text: 'Importante', class: 'bg-amber-500 text-white' };
      default:
        return null;
    }
  };

  const importanceBadge = getImportanceBadge();

  if (variant === 'compact') {
    return (
      <Link to={`/news/${article.id}`}>
        <motion.article
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group flex gap-4 p-4 bg-slate-900/30 hover:bg-slate-800/50 rounded-xl border border-slate-800/50 hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <span className="absolute bottom-1 right-1 text-[8px] text-white/50 bg-black/30 px-1 rounded" title={`Imagen: ${imageCredit}`}>
              © {imageCredit.substring(0, 10)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
              {hasProductConnection && (
                <>
                  <span>•</span>
                  <Shield className="w-3 h-3 text-emerald-400" />
                </>
              )}
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all duration-500"
    >
      {/* Image Container with Premium Overlay */}
      <div className="relative h-56 overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Image Attribution - Legal compliance */}
        <span 
          className="absolute bottom-2 right-2 text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm"
          title={`Imagen: © ${imageCredit}`}
        >
          © {imageCredit}
        </span>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r ${getCategoryGradient(article.category)} text-white shadow-lg`}>
            {article.category}
          </span>
          {isNew && (
            <motion.span
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/40"
            >
              <Sparkles className="w-3 h-3" />
              Nueva
            </motion.span>
          )}
          {importanceBadge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`px-3 py-1.5 text-xs font-bold rounded-full ${importanceBadge.class} shadow-lg`}
            >
              {importanceBadge.text}
            </motion.span>
          )}
        </div>

        {/* Relevance Score - Premium Design */}
        {isHighRelevance && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-emerald-500/30"
          >
            <div className="relative">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  cx="20" cy="20" r="16"
                  fill="none" stroke="currentColor" strokeWidth="3"
                  className="text-slate-700"
                />
                <circle
                  cx="20" cy="20" r="16"
                  fill="none" stroke="url(#scoreGradient)" strokeWidth="3"
                  strokeDasharray={100}
                  strokeDashoffset={100 - article.relevance_score}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {article.relevance_score}
              </span>
            </div>
            <div className="hidden sm:block">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </motion.div>
        )}

        {/* Product Connection Indicator */}
        {hasProductConnection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConnection(!showConnection);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-500/90 to-blue-500/90 backdrop-blur-sm rounded-xl text-white text-sm font-medium shadow-lg group/btn hover:from-emerald-500 hover:to-blue-500 transition-all"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                ObelixIA puede ayudarte
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showConnection ? 'rotate-180' : ''}`} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <Link to={`/news/${article.id}`}>
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors cursor-pointer">
            {article.title}
          </h3>
        </Link>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
          {article.ai_summary || article.excerpt}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-800/80 text-slate-400 text-xs rounded-lg hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{article.source_name}</span>
            {article.read_count && article.read_count > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.read_count}
                </span>
              </>
            )}
          </div>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
          >
            <span>Leer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Product Connection Expandable Section */}
      <AnimatePresence>
        {showConnection && hasProductConnection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <NewsProductConnection
                productConnection={article.product_connection || null}
                productRelevanceReason={article.product_relevance_reason || null}
                importanceLevel={article.importance_level}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>
    </motion.article>
  );
};

export default PremiumNewsCard;
