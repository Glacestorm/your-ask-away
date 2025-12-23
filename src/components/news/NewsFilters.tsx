import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  const { t } = useLanguage();

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Todos': '🌐',
      'All': '🌐',
      'Tots': '🌐',
      'Tous': '🌐',
      'Fiscal': '📊',
      'Compliance': '⚖️',
      'Finanzas': '💰',
      'Finance': '💰',
      'Finances': '💰',
      'Empresarial': '🏢',
      'Business': '🏢',
      'Tecnología': '💻',
      'Technology': '💻',
      'Technologie': '💻',
      'Seguridad': '🔒',
      'Security': '🔒',
      'Sécurité': '🔒',
      'General': '📰',
    };
    return icons[category] || '📄';
  };

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('news.filters.searchPlaceholder')}
            className="pl-10 bg-slate-900/50 border-slate-700 focus:border-emerald-500 text-white placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <motion.button
              key={category}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryChange(category)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isSelected 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700'
                }
              `}
            >
              <span>{getCategoryIcon(category)}</span>
              <span>{category}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default NewsFilters;
