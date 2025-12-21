import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, TrendingUp, Sparkles, Shield, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getNewsImageFallback } from '@/lib/news/placeholders';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  image_credit?: string | null;
  source_name: string;
  category: string;
  published_at: string;
  ai_summary: string;
  relevance_score: number;
  product_connection?: string | null;
}

interface PremiumNewsHeroProps {
  article: NewsArticle | null;
  onReadMore?: (article: NewsArticle) => void;
}

const PremiumNewsHero: React.FC<PremiumNewsHeroProps> = ({ article, onReadMore }) => {
  if (!article) {
    return (
      <div className="relative h-[600px] rounded-3xl overflow-hidden">
        {/* Premium Loading State */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 p-[2px]"
            >
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Cargando noticias destacadas...</h2>
            <p className="text-slate-400">Analizando contenido relevante para tu empresa</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(article.published_at), { 
    addSuffix: true, 
    locale: es 
  });

  const hasOriginalImage = Boolean(article.image_url);
  const imageUrl = hasOriginalImage
    ? article.image_url
    : getNewsImageFallback(article.id, article.category || article.source_name);

  const imageCredit = hasOriginalImage
    ? (article.image_credit || article.source_name)
    : 'Ilustración (ObelixIA)';

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-[600px] md:h-[650px] rounded-3xl overflow-hidden group"
    >
      {/* Background Image with Ken Burns Effect */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: "linear" }}
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        
        {/* Multiple Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-blue-950/30" />
        
        {/* Image Attribution - Legal compliance */}
        <span 
          className="absolute bottom-3 right-3 text-xs text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
          title={`Imagen: © ${imageCredit}`}
        >
          📷 {imageCredit}
        </span>
      </div>

      {/* Animated Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px]"
        />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,_white_1px,_transparent_1px),_linear-gradient(to_bottom,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-4xl">
          {/* Top Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            {/* Featured Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/40">
              <TrendingUp className="w-4 h-4" />
              Destacado
            </span>
            
            {/* Category */}
            <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20">
              {article.category}
            </span>
            
            {/* Time */}
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-md text-slate-300 text-sm rounded-full">
              <Clock className="w-4 h-4" />
              {timeAgo}
            </span>

            {/* Product Connection Badge */}
            {article.product_connection && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-md text-white text-sm font-medium rounded-full shadow-lg"
              >
                <Shield className="w-4 h-4" />
                ObelixIA Relevante
              </motion.span>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
          >
            {article.title}
          </motion.h1>

          {/* Summary */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-slate-300 mb-8 line-clamp-3 max-w-3xl leading-relaxed"
          >
            {article.ai_summary || article.excerpt}
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button
              onClick={() => onReadMore?.(article)}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/30 group/btn"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Leer artículo completo
              <ArrowRight className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
            </Button>
            
            <div className="flex items-center gap-3 text-slate-400">
              <span className="w-px h-8 bg-slate-700" />
              <span className="text-sm">
                Fuente: <span className="text-white font-medium">{article.source_name}</span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Relevance Score - Premium Floating Widget */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: -50 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="absolute top-8 right-8 hidden lg:flex items-center gap-4 p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl"
      >
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32" cy="32" r="28"
              fill="none" stroke="currentColor" strokeWidth="4"
              className="text-slate-700"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="none" stroke="url(#heroGradient)" strokeWidth="4"
              strokeDasharray={176}
              strokeDashoffset={176 - (176 * article.relevance_score / 100)}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
            {article.relevance_score}
          </span>
        </div>
        <div className="pr-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Relevancia</p>
          <p className="text-sm font-semibold text-white">Score IA</p>
        </div>
      </motion.div>

      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
    </motion.div>
  );
};

export default PremiumNewsHero;
