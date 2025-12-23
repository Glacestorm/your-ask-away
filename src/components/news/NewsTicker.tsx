import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsItem {
  id: string;
  title: string;
  category: string;
}

interface NewsTickerProps {
  items: NewsItem[];
}

const NewsTicker: React.FC<NewsTickerProps> = ({ items }) => {
  const { t } = useLanguage();
  
  if (!items || items.length === 0) return null;

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-10">
          {/* Label */}
          <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-slate-700">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-md">
              <Zap className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t('news.live')}</span>
            </div>
          </div>

          {/* Scrolling Content */}
          <div className="relative flex-1 overflow-hidden ml-4">
            <motion.div
              className="flex items-center gap-8 whitespace-nowrap"
              animate={{
                x: [0, -100 * items.length + '%'],
              }}
              transition={{
                x: {
                  duration: items.length * 8,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            >
              {duplicatedItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-3">
                  <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-sm text-slate-300">
                    {item.title}
                  </span>
                  <span className="text-slate-600">•</span>
                </div>
              ))}
            </motion.div>
            
            {/* Gradient Fade */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
