import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Tag, Clock, BarChart3, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  published_at: string;
  relevance_score: number;
  read_count: number;
}

interface NewsSidebarProps {
  trendingNews: NewsArticle[];
  popularTags: { tag: string; count: number }[];
  onTagClick?: (tag: string) => void;
  onArticleClick?: (article: NewsArticle) => void;
}

const NewsSidebar: React.FC<NewsSidebarProps> = ({
  trendingNews,
  popularTags,
  onTagClick,
  onArticleClick,
}) => {
  return (
    <div className="space-y-6">
      {/* Trending Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Tendencias</h3>
        </div>
        
        <div className="space-y-3">
          {trendingNews.slice(0, 5).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onArticleClick?.(article)}
              className="group flex gap-3 p-3 -mx-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(article.published_at), { locale: es })}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Popular Tags */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Tags Populares</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 12).map((item, index) => (
            <motion.button
              key={item.tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onTagClick?.(item.tag)}
              className="group px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all"
            >
              <span className="text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">
                #{item.tag}
              </span>
              <span className="ml-1.5 text-xs text-slate-600">
                {item.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Widget */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Actualización IA</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Noticias analizadas</span>
            <span className="text-sm font-semibold text-emerald-400">{trendingNews.length}+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Fuentes activas</span>
            <span className="text-sm font-semibold text-emerald-400">5</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Última actualización</span>
            <span className="text-sm font-semibold text-slate-300">Hace 4h</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-emerald-500/20">
          <p className="text-xs text-slate-500 text-center">
            Contenido curado por IA para máxima relevancia empresarial
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NewsSidebar;
