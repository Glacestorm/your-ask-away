import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';

interface LanguageProgressGridProps {
  languages: SupportedLanguage[];
  loading: boolean;
  onRefresh: () => void;
  onInstallLanguage?: (locale: string) => void;
  installingLocale?: string | null;
  translationProgress?: { current: number; total: number } | null;
}

const getTierConfig = (tier: number) => {
  const configs: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Core', color: 'text-primary', bg: 'bg-primary/10' },
    2: { label: 'Extended', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    3: { label: 'Regional', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    4: { label: 'Specialized', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  };
  return configs[tier] || { label: 'Other', color: 'text-muted-foreground', bg: 'bg-muted' };
};

const getStatusIcon = (progress: number) => {
  if (progress === 100) return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (progress > 0) return <Clock className="h-4 w-4 text-amber-500" />;
  return <AlertCircle className="h-4 w-4 text-red-500" />;
};

export const LanguageProgressGrid: React.FC<LanguageProgressGridProps> = ({
  languages,
  loading,
  onRefresh,
  onInstallLanguage,
  installingLocale,
  translationProgress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTiers, setExpandedTiers] = useState<number[]>([1, 2, 3, 4]);
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('progress');

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.locale.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByTier = filteredLanguages.reduce((acc, lang) => {
    const tier = lang.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(lang);
    return acc;
  }, {} as Record<number, SupportedLanguage[]>);

  // Sort languages within each tier
  Object.keys(groupedByTier).forEach(tier => {
    groupedByTier[Number(tier)].sort((a, b) => {
      if (sortBy === 'progress') {
        return (b.translation_progress || 0) - (a.translation_progress || 0);
      }
      return a.name.localeCompare(b.name);
    });
  });

  const toggleTier = (tier: number) => {
    setExpandedTiers(prev => 
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedByTier)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, langs]) => {
                const tierNum = Number(tier);
                const config = getTierConfig(tierNum);
                const isExpanded = expandedTiers.includes(tierNum);
                const tierProgress = Math.round(
                  langs.reduce((acc, l) => acc + (l.translation_progress || 0), 0) / langs.length
                );

                return (
                  <div key={tier} className="rounded-lg border overflow-hidden">
                    {/* Tier Header */}
                    <button
                      onClick={() => toggleTier(tierNum)}
                      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${config.bg} ${config.color}`}>
                          {config.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {langs.length} languages
                        </span>
                        <div className="hidden sm:flex items-center gap-2 ml-4">
                          <Progress value={tierProgress} className="w-24 h-2" />
                          <span className="text-xs text-muted-foreground">{tierProgress}%</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Languages Grid */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                        {langs.map(lang => {
                          const isBase = ['es', 'en'].includes(lang.locale);
                          const progress = lang.translation_progress || 0;
                          const canInstall = !!onInstallLanguage && !isBase && progress < 100;
                          const isInstalling = installingLocale === lang.locale;

                          return (
                            <div
                              key={lang.locale}
                              className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors ${
                                isInstalling ? 'ring-2 ring-primary/50' : ''
                              }`}
                            >
                              <span className="text-xl">{lang.flag_emoji || '🌐'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">
                                    {lang.native_name || lang.name}
                                  </span>
                                  {lang.is_rtl && (
                                    <Badge variant="outline" className="text-[10px] px-1">RTL</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress 
                                    value={progress} 
                                    className="flex-1 h-1.5" 
                                  />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {progress}%
                                  </span>
                                </div>
                                {isInstalling && translationProgress && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Traduciendo: {translationProgress.current}/{translationProgress.total} claves
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {canInstall && (
                                  <Button
                                    size="sm"
                                    variant={progress > 0 ? "default" : "outline"}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onInstallLanguage?.(lang.locale);
                                    }}
                                    disabled={isInstalling}
                                    title={progress > 0 ? "Continuar traducción" : "Instalar idioma"}
                                  >
                                    {isInstalling ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : progress > 0 ? (
                                      'Continuar'
                                    ) : (
                                      'Instalar'
                                    )}
                                  </Button>
                                )}
                                {getStatusIcon(progress)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
