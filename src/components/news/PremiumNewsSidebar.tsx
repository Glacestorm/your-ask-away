import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Tag, Sparkles, Shield, Newspaper, ArrowRight, Bell, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  published_at: string;
  relevance_score: number;
  read_count?: number;
  product_connection?: string | null;
  importance_level?: string;
}

interface PremiumNewsSidebarProps {
  trendingNews: NewsArticle[];
  popularTags: { tag: string; count: number }[];
  onTagClick?: (tag: string) => void;
  onArticleClick?: (article: NewsArticle) => void;
}

const PremiumNewsSidebar: React.FC<PremiumNewsSidebarProps> = ({
  trendingNews,
  popularTags,
  onTagClick,
  onArticleClick,
}) => {
  const importantNews = trendingNews.filter(a => 
    a.importance_level === 'critical' || a.importance_level === 'high'
  );

  return (
    <div className="space-y-6">
      {/* Newsletter Subscription - Premium CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Alertas Premium</h3>
              <p className="text-xs text-white/70">Noticias críticas en tu inbox</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Tu email empresarial"
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:ring-white/20"
            />
            <Button className="w-full bg-white text-emerald-600 hover:bg-white/90 font-semibold">
              <Mail className="w-4 h-4 mr-2" />
              Suscribirse gratis
            </Button>
          </div>
          
          <p className="text-xs text-white/60 mt-3 text-center">
            Sin spam. Solo noticias relevantes para tu empresa.
          </p>
        </div>
      </motion.div>

      {/* Important News Alert */}
      {importantNews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Noticias Críticas</h3>
          </div>
          
          <div className="space-y-3">
            {importantNews.slice(0, 3).map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onArticleClick?.(article)}
                className="group p-3 -mx-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-amber-500/30"
              >
                <div className="flex items-start gap-2">
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded ${
                    article.importance_level === 'critical' 
                      ? 'bg-rose-500/20 text-rose-300' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {article.importance_level === 'critical' ? '⚠️' : '🔥'}
                  </span>
                  <h4 className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Section - Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Tendencias</h3>
          </div>
          <span className="text-xs text-slate-500">Últimas 24h</span>
        </div>
        
        <div className="space-y-2">
          {trendingNews.slice(0, 5).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={() => onArticleClick?.(article)}
              className="group flex gap-3 p-3 -mx-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-emerald-400 text-sm font-bold rounded-lg border border-emerald-500/20">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                    {article.category}
                  </span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(article.published_at), { locale: es })}</span>
                  {article.product_connection && (
                    <>
                      <span>•</span>
                      <Shield className="w-3 h-3 text-emerald-400" />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <Button variant="ghost" className="w-full mt-4 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
          Ver más tendencias
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>

      {/* Popular Tags - Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Tags Populares</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 15).map((item, index) => (
            <motion.button
              key={item.tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.03 }}
              onClick={() => onTagClick?.(item.tag)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-3 py-1.5 bg-slate-800/80 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-blue-500/20 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all overflow-hidden"
            >
              <span className="relative z-10 text-xs text-slate-400 group-hover:text-emerald-400 transition-colors font-medium">
                #{item.tag}
              </span>
              <span className="absolute top-0 right-0 px-1 text-[10px] text-slate-600 group-hover:text-emerald-500">
                {item.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI Stats Widget - Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
        
        <div className="relative p-5 border border-slate-700/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20"
            >
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">Motor IA</h3>
              <p className="text-xs text-slate-400">Análisis en tiempo real</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-emerald-400">{trendingNews.length}+</p>
              <p className="text-xs text-slate-500 mt-1">Noticias analizadas</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-blue-400">5</p>
              <p className="text-xs text-slate-500 mt-1">Fuentes activas</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-purple-400">
                {trendingNews.filter(a => a.product_connection).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Con ObelixIA</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-amber-400">{importantNews.length}</p>
              <p className="text-xs text-slate-500 mt-1">Críticas</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">Actualización automática</span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-medium">En vivo</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* ObelixIA CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 to-blue-950/50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Noticias que importan</span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            ObelixIA analiza cada noticia para mostrarte exactamente cómo puede afectar a tu empresa y qué puedes hacer al respecto.
          </p>
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm">
            Más sobre ObelixIA
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumNewsSidebar;
