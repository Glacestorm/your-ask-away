import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { useSupportedLanguages, isRTLLocale } from '@/hooks/useSupportedLanguages';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Core', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  2: { label: 'Extended', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  3: { label: 'Regional', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  4: { label: 'Specialized', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function LanguageDrawer({ open, onOpenChange }: LanguageDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeLanguages, loading } = useSupportedLanguages();
  const { language, setLanguage } = useLanguage();

  const filteredAndGroupedLanguages = useMemo(() => {
    const filtered = activeLanguages.filter((lang) => {
      const query = searchQuery.toLowerCase();
      return (
        lang.name.toLowerCase().includes(query) ||
        lang.native_name.toLowerCase().includes(query) ||
        lang.locale.toLowerCase().includes(query)
      );
    });

    // Group by tier
    const grouped: Record<number, typeof filtered> = {};
    filtered.forEach((lang) => {
      const tier = lang.tier || 4;
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(lang);
    });

    return grouped;
  }, [activeLanguages, searchQuery]);

  const handleSelectLanguage = (locale: string) => {
    setLanguage(locale as Language);
    onOpenChange(false);
  };

  const tiers = Object.keys(filteredAndGroupedLanguages)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-slate-900/98 backdrop-blur-xl border-white/10">
        <DrawerHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <DrawerTitle className="text-xl text-white">
                Seleccionar idioma
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar idioma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
            />
          </div>

          <p className="text-sm text-gray-400 mt-2">
            {activeLanguages.length} idiomas disponibles
          </p>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No se encontraron idiomas
            </div>
          ) : (
            <div className="space-y-6">
              {tiers.map((tier) => {
                const tierInfo = TIER_LABELS[tier] || TIER_LABELS[4];
                const languages = filteredAndGroupedLanguages[tier];

                return (
                  <div key={tier}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={tierInfo.color}>
                        {tierInfo.label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {languages.length} idioma{languages.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <AnimatePresence mode="popLayout">
                        {languages.map((lang) => {
                          const isActive = language === lang.locale;
                          const isRTL = isRTLLocale(lang.locale);
                          const progress = lang.translation_progress || 0;

                          return (
                            <motion.button
                              key={lang.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              onClick={() => handleSelectLanguage(lang.locale)}
                              className={cn(
                                "relative flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                "border border-transparent hover:border-white/20",
                                isActive
                                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30"
                                  : "bg-white/5 hover:bg-white/10",
                                isRTL && "flex-row-reverse text-right"
                              )}
                            >
                              {/* Flag */}
                              <span className="text-2xl flex-shrink-0">
                                {lang.flag_emoji || '🌐'}
                              </span>

                              {/* Info */}
                              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white truncate">
                                    {lang.native_name}
                                  </span>
                                  {isRTL && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">
                                      RTL
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400 truncate">
                                    {lang.name}
                                  </span>
                                  <span className="text-[10px] text-gray-500 uppercase">
                                    {lang.locale}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                {progress < 100 && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                      <span>Traducción</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <Progress 
                                      value={progress} 
                                      className="h-1 bg-white/10"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Active indicator */}
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

export default LanguageDrawer;
