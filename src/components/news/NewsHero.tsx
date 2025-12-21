import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  source_name: string;
  category: string;
  published_at: string;
  ai_summary: string;
  relevance_score: number;
}

interface NewsHeroProps {
  article: NewsArticle | null;
  onReadMore?: (article: NewsArticle) => void;
}

const NewsHero: React.FC<NewsHeroProps> = ({ article, onReadMore }) => {
  if (!article) {
    return (
      <div className="relative h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-emerald-500/50 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-400">Cargando noticias destacadas...</h2>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(article.published_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative h-[500px] md:h-[550px] rounded-3xl overflow-hidden group"
    >
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <motion.img
          src={article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&h=1080&fit=crop'}
          alt={article.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <div className="max-w-3xl">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-emerald-500/30"
            >
              <TrendingUp className="w-3 h-3" />
              Destacado
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-300 text-xs font-medium rounded-full border border-slate-700"
            >
              {article.category}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-400 text-xs rounded-full"
            >
              <Clock className="w-3 h-3" />
              {timeAgo}
            </motion.span>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
          >
            {article.title}
          </motion.h1>

          {/* AI Summary */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-slate-300 text-base md:text-lg mb-6 line-clamp-2 md:line-clamp-3"
          >
            {article.ai_summary || article.excerpt}
          </motion.p>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button
              onClick={() => onReadMore?.(article)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 group/btn"
            >
              Leer artículo
              <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
            </Button>
            <span className="text-slate-500 text-sm">
              Fuente: <span className="text-slate-400">{article.source_name}</span>
            </span>
          </motion.div>
        </div>
      </div>

      {/* Relevance Score Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700"
      >
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-700"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={100}
              strokeDashoffset={100 - article.relevance_score}
              className="text-emerald-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {article.relevance_score}
          </span>
        </div>
        <span className="text-xs text-slate-400 hidden md:block">Relevancia</span>
      </motion.div>
    </motion.div>
  );
};

export default NewsHero;
