import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';
import PremiumNewsHero from '@/components/news/PremiumNewsHero';
import PremiumNewsCard from '@/components/news/PremiumNewsCard';
import NewsTicker from '@/components/news/NewsTicker';
import PremiumNewsFilters from '@/components/news/PremiumNewsFilters';
import PremiumNewsSidebar from '@/components/news/PremiumNewsSidebar';
import NewsAudioPlayer from '@/components/news/NewsAudioPlayer';
import { useNewsArticles, NewsArticle } from '@/hooks/useNewsArticles';

const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { 
    articles, 
    featuredArticle, 
    isLoading, 
    refreshNews, 
    getCategories, 
    getPopularTags 
  } = useNewsArticles({ category: selectedCategory, searchQuery });

  const categories = useMemo(() => getCategories(), [getCategories]);
  const popularTags = useMemo(() => getPopularTags(), [getPopularTags]);

  const tickerItems = useMemo(() => 
    articles.slice(0, 8).map(a => ({ id: a.id, title: a.title, category: a.category })),
    [articles]
  );

  const handleReadMore = (article: NewsArticle) => {
    window.open(article.source_url, '_blank');
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Premium Header */}
      <header className="relative bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="relative container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/store">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              IA Activa
            </span>
            <Button 
              onClick={refreshNews}
              variant="outline" 
              size="sm"
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      {tickerItems.length > 0 && <NewsTicker items={tickerItems} />}

      {/* Premium Hero Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Actualización automática con IA</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Noticias <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Empresariales</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Contenido curado por inteligencia artificial para directivos y profesionales del sector empresarial español
            </p>
          </motion.div>
          <PremiumNewsHero article={featuredArticle} onReadMore={handleReadMore} />
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-7xl">
          <PremiumNewsFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalArticles={articles.length}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Articles Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 p-[3px] mb-4"
                  >
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  </motion.div>
                  <p className="text-slate-400">Analizando noticias relevantes...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4 text-lg">No hay noticias disponibles</p>
                  <Button onClick={refreshNews} className="bg-emerald-500 hover:bg-emerald-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cargar noticias
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 gap-6' 
                  : 'space-y-4'
                }>
                  {articles.map((article, index) => (
                    <PremiumNewsCard
                      key={article.id}
                      article={article as any}
                      index={index}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                      onReadMore={handleReadMore}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Audio Summary Player */}
              <NewsAudioPlayer />
              
              <PremiumNewsSidebar
                trendingNews={[...articles].sort((a, b) => b.relevance_score - a.relevance_score) as any}
                popularTags={popularTags}
                onTagClick={handleTagClick}
                onArticleClick={handleReadMore}
              />
            </div>
          </div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default Blog;
