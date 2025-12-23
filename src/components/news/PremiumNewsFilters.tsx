import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, LayoutGrid, List, Filter, SlidersHorizontal, Clock, TrendingUp, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export type RecencyFilter = 'all' | '24h' | '7d' | '30d';
export type SortOption = 'relevance' | 'date';

interface PremiumNewsFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalArticles?: number;
  recency?: RecencyFilter;
  onRecencyChange?: (recency: RecencyFilter) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  showSaved?: boolean;
  onShowSavedChange?: (show: boolean) => void;
}

const PremiumNewsFilters: React.FC<PremiumNewsFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalArticles = 0,
  recency = 'all',
  onRecencyChange,
  sortBy = 'relevance',
  onSortChange,
  showSaved = false,
  onShowSavedChange,
}) => {
  const { t } = useLanguage();

  const getCategoryData = (category: string) => {
    const data: Record<string, { icon: string; gradient: string; glow: string }> = {
      'Todos': { icon: '🌐', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/30' },
      'All': { icon: '🌐', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/30' },
      'Tots': { icon: '🌐', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/30' },
      'Tous': { icon: '🌐', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/30' },
      'Fiscal': { icon: '📊', gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
      'Compliance': { icon: '⚖️', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
      'Finanzas': { icon: '💰', gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
      'Empresarial': { icon: '🏢', gradient: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/30' },
      'Tecnología': { icon: '💻', gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/30' },
      'Seguridad': { icon: '🔒', gradient: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/30' },
      'General': { icon: '📰', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/30' },
    };
    return data[category] || data['General'];
  };

  const recencyOptions: { value: RecencyFilter; label: string }[] = [
    { value: 'all', label: t('news.filters.recency.all') || 'All' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'relevance', label: t('news.filters.sort.relevance') || 'Relevance', icon: <TrendingUp className="w-3 h-3" /> },
    { value: 'date', label: t('news.filters.sort.date') || 'Date', icon: <Clock className="w-3 h-3" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar - Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('news.filters.searchPlaceholder')}
              className="pl-12 pr-12 py-6 bg-slate-900/80 border-slate-700 focus:border-emerald-500/50 text-white placeholder-slate-500 rounded-2xl text-base"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 p-1 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* View Toggle & Filter Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-1.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Lista</span>
            </button>
          </div>

          {onShowSavedChange && (
            <Button 
              variant={showSaved ? "default" : "outline"}
              onClick={() => onShowSavedChange(!showSaved)}
              className={`rounded-xl px-4 py-6 ${
                showSaved 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {t('news.filters.saved')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Recency & Sort Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-4"
      >
        {/* Recency Filter */}
        {onRecencyChange && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">{t('news.filters.recency.label') || 'Time'}:</span>
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg p-1">
              {recencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRecencyChange(option.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    recency === option.value
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Filter */}
        {onSortChange && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">{t('news.filters.sort.label') || 'Sort'}:</span>
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg p-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    sortBy === option.value
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Category Pills - Premium */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>{t('news.filters.categories') || 'Categories'}</span>
          {totalArticles > 0 && (
            <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">
              {totalArticles} {t('news.filters.articles')}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category;
            const catData = getCategoryData(category);
            
            return (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onCategoryChange(category)}
                className={`
                  relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-300 overflow-hidden
                  ${isSelected 
                    ? `bg-gradient-to-r ${catData.gradient} text-white shadow-lg ${catData.glow}` 
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50 hover:border-slate-600'
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    layoutId="categoryBg"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                
                <span className="relative z-10 text-lg leading-none">{catData.icon}</span>
                <span className="relative z-10">{category}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Active Filters Display */}
      {(searchQuery || selectedCategory !== 'Todos' || recency !== 'all' || showSaved) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 pt-2"
        >
          <span className="text-xs text-slate-500">{t('news.filters.activeFilters')}:</span>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                <Search className="w-3 h-3" />
                "{searchQuery}"
                <button onClick={() => onSearchChange('')} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'Todos' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/30">
                {getCategoryData(selectedCategory).icon} {selectedCategory}
                <button onClick={() => onCategoryChange('Todos')} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {recency !== 'all' && onRecencyChange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/30">
                <Clock className="w-3 h-3" />
                {recency}
                <button onClick={() => onRecencyChange('all')} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {showSaved && onShowSavedChange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/30">
                <Bookmark className="w-3 h-3" />
                {t('news.filters.saved')}
                <button onClick={() => onShowSavedChange(false)} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onSearchChange('');
              onCategoryChange('Todos');
              onRecencyChange?.('all');
              onShowSavedChange?.(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-300 underline ml-auto"
          >
            {t('news.filters.clearAll')}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default PremiumNewsFilters;
