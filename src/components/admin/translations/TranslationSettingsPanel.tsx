import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslationSettings } from '@/hooks/admin/useTranslationSettings';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Settings, 
  Loader2,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslationSettingsPanelProps {
  className?: string;
}

export const TranslationSettingsPanel: React.FC<TranslationSettingsPanelProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    languages,
    isLoading,
    lastRefresh,
    savingLocale,
    deletingLocale,
    fetchLanguages,
    toggleLanguageActive,
    deleteTranslations,
    resetProgress,
    startAutoRefresh,
    stopAutoRefresh
  } = useTranslationSettings();

  // Auto-refresh on mount
  useEffect(() => {
    startAutoRefresh(60000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const getTierConfig = (tier: number) => {
    const configs: Record<number, { label: string; color: string }> = {
      1: { label: 'Core', color: 'bg-primary/10 text-primary' },
      2: { label: 'Extended', color: 'bg-blue-500/10 text-blue-600' },
      3: { label: 'Regional', color: 'bg-amber-500/10 text-amber-600' },
      4: { label: 'Specialized', color: 'bg-purple-500/10 text-purple-600' },
    };
    return configs[tier] || { label: 'Other', color: 'bg-muted text-muted-foreground' };
  };

  const groupedByTier = languages.reduce((acc, lang) => {
    const tier = lang.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(lang);
    return acc;
  }, {} as Record<number, typeof languages>);

  const handleDeleteWithConfirm = async (locale: string) => {
    if (!confirm(`¿Eliminar todas las traducciones de ${locale}?`)) return;
    await deleteTranslations(locale);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Idiomas
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Gestiona idiomas activos y traducciones
              {lastRefresh && (
                <Badge variant="outline" className="text-xs">
                  Actualizado {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchLanguages()}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(isExpanded ? "h-[calc(100vh-180px)]" : "h-[600px]", "pr-4")}>
          <div className="space-y-6">
            {Object.entries(groupedByTier)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, langs]) => {
                const config = getTierConfig(Number(tier));
                
                return (
                  <div key={tier} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={config.color}>{config.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {langs.length} idiomas
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {langs.map(lang => {
                        const isBase = ['es', 'en', 'ca', 'fr'].includes(lang.locale);
                        
                        return (
                          <div
                            key={lang.locale}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              lang.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{lang.flag_emoji || '🌐'}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{lang.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {lang.locale}
                                  </Badge>
                                  {lang.is_rtl && (
                                    <Badge variant="secondary" className="text-xs">RTL</Badge>
                                  )}
                                  {isBase && (
                                    <Badge className="bg-green-500/10 text-green-600 text-xs">
                                      Base
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {lang.native_name} • {lang.translation_progress || 0}%
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isBase && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => resetProgress(lang.locale)}
                                    title="Recalcular progreso"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteWithConfirm(lang.locale)}
                                    disabled={deletingLocale === lang.locale}
                                    className="text-destructive hover:text-destructive"
                                    title="Eliminar traducciones"
                                  >
                                    {deletingLocale === lang.locale ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                              <Switch
                                checked={lang.is_active}
                                onCheckedChange={() => toggleLanguageActive(lang)}
                                disabled={savingLocale === lang.locale || isBase}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranslationSettingsPanel;
