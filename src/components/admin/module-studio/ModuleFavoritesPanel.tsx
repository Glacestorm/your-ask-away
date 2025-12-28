/**
 * ModuleFavoritesPanel - Panel de favoritos y recientes
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Clock, 
  Trash2, 
  X,
  ChevronRight,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleStudioFavorites, type FavoriteModule, type RecentModule } from '@/hooks/admin/useModuleStudioFavorites';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleFavoritesPanelProps {
  onSelectModule: (moduleKey: string) => void;
  selectedModuleKey?: string | null;
  className?: string;
}

export function ModuleFavoritesPanel({ 
  onSelectModule, 
  selectedModuleKey,
  className 
}: ModuleFavoritesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { 
    favorites, 
    recent, 
    removeFavorite, 
    clearRecent 
  } = useModuleStudioFavorites();

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <Star className="h-4 w-4 text-amber-400" />
        {favorites.length > 0 && <Badge variant="secondary">{favorites.length}</Badge>}
      </Button>
    );
  }

  return (
    <Card className={cn('border-amber-500/20', className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          Favoritos & Recientes
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setIsExpanded(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="favorites" className="flex-1 gap-1 text-xs">
              <Star className="h-3 w-3" />
              Favoritos ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Recientes ({recent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-0">
            <ScrollArea className="h-[200px]">
              <AnimatePresence mode="popLayout">
                {favorites.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Sin favoritos aún
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {favorites.map((fav) => (
                      <motion.div
                        key={fav.moduleKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        layout
                      >
                        <FavoriteItem
                          item={fav}
                          isSelected={selectedModuleKey === fav.moduleKey}
                          onSelect={() => onSelectModule(fav.moduleKey)}
                          onRemove={() => removeFavorite(fav.moduleKey)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <ScrollArea className="h-[200px]">
              <AnimatePresence mode="popLayout">
                {recent.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Sin historial reciente
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {recent.map((item) => (
                      <motion.div
                        key={item.moduleKey + item.visitedAt}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        layout
                      >
                        <RecentItem
                          item={item}
                          isSelected={selectedModuleKey === item.moduleKey}
                          onSelect={() => onSelectModule(item.moduleKey)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
              {recent.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={clearRecent}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Limpiar historial
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FavoriteItem({ 
  item, 
  isSelected, 
  onSelect, 
  onRemove 
}: { 
  item: FavoriteModule; 
  isSelected: boolean; 
  onSelect: () => void; 
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer',
        isSelected 
          ? 'bg-amber-500/10 border border-amber-500/30' 
          : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{item.moduleName}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function RecentItem({ 
  item, 
  isSelected, 
  onSelect 
}: { 
  item: RecentModule; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(item.visitedAt), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer',
        isSelected 
          ? 'bg-primary/10 border border-primary/30' 
          : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">{item.moduleName}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      {item.section && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          {item.section}
        </Badge>
      )}
    </div>
  );
}

export default ModuleFavoritesPanel;
