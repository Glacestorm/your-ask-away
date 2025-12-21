import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';
import NewsHero from '@/components/news/NewsHero';
import NewsCard from '@/components/news/NewsCard';
import NewsTicker from '@/components/news/NewsTicker';
import NewsFilters from '@/components/news/NewsFilters';
import NewsSidebar from '@/components/news/NewsSidebar';
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
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/store">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <Button 
            onClick={refreshNews}
            variant="outline" 
            size="sm"
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </header>

      {/* Ticker */}
      {tickerItems.length > 0 && <NewsTicker items={tickerItems} />}

      {/* Hero */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Noticias <span className="text-emerald-400">Empresariales</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Actualización automática con IA • Contenido curado para directivos
            </p>
          </motion.div>
          <NewsHero article={featuredArticle} onReadMore={handleReadMore} />
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-6">
        <div className="container mx-auto max-w-7xl">
          <NewsFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Articles Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-400 mb-4">No hay noticias disponibles</p>
                  <Button onClick={refreshNews} className="bg-emerald-500 hover:bg-emerald-600">
                    Cargar noticias
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 gap-6' 
                  : 'space-y-4'
                }>
                  {articles.map((article, index) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      index={index}
                      onReadMore={handleReadMore}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <NewsSidebar
                trendingNews={[...articles].sort((a, b) => b.relevance_score - a.relevance_score)}
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
