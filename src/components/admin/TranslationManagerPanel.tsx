import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSupportedLanguages } from '@/hooks/useSupportedLanguages';
import { supabase } from '@/integrations/supabase/client';
import { Languages, Globe, Play, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Spanish source translations (we'll translate from these)
import esTranslations from '@/locales/es';

interface TranslationJob {
  locale: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export const TranslationManagerPanel: React.FC = () => {
  const { toast } = useToast();
  const { languages, loading: languagesLoading, refresh: refreshLanguages } = useSupportedLanguages();
  const [jobs, setJobs] = useState<Record<string, TranslationJob>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2]);

  const translationKeys = Object.keys(esTranslations);
  const totalKeys = translationKeys.length;

  const translateLanguage = useCallback(async (locale: string): Promise<boolean> => {
    const BATCH_SIZE = 25;
    
    setJobs(prev => ({
      ...prev,
      [locale]: { locale, status: 'running', progress: 0, message: 'Starting...' }
    }));

    try {
      // Check existing translations
      const { data: existing } = await supabase
        .from('cms_translations')
        .select('translation_key')
        .eq('locale', locale);

      const existingKeys = new Set(existing?.map(e => e.translation_key) || []);
      const keysToTranslate = translationKeys.filter(k => !existingKeys.has(k));

      if (keysToTranslate.length === 0) {
        setJobs(prev => ({
          ...prev,
          [locale]: { locale, status: 'completed', progress: 100, message: 'Already complete' }
        }));
        return true;
      }

      // Process in batches
      const batches = [];
      for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
        batches.push(keysToTranslate.slice(i, i + BATCH_SIZE));
      }

      let completed = 0;
      for (const batch of batches) {
        const items = batch.map(key => ({
          key,
          text: esTranslations[key as keyof typeof esTranslations],
          namespace: 'ui'
        }));

        const { data, error } = await supabase.functions.invoke('cms-batch-translate', {
          body: {
            items,
            sourceLocale: 'es',
            targetLocale: locale,
            saveToDb: true
          }
        });

        if (error) {
          console.error(`Batch error for ${locale}:`, error);
          throw new Error(error.message);
        }

        completed += batch.length;
        const progress = Math.round((completed / keysToTranslate.length) * 100);
        
        setJobs(prev => ({
          ...prev,
          [locale]: { 
            locale, 
            status: 'running', 
            progress, 
            message: `${completed}/${keysToTranslate.length} keys` 
          }
        }));
      }

      setJobs(prev => ({
        ...prev,
        [locale]: { locale, status: 'completed', progress: 100, message: 'Done!' }
      }));

      return true;
    } catch (error) {
      console.error(`Translation error for ${locale}:`, error);
      setJobs(prev => ({
        ...prev,
        [locale]: { 
          locale, 
          status: 'error', 
          progress: 0, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
      return false;
    }
  }, [translationKeys]);

  const handleTranslateAll = async () => {
    setIsTranslating(true);
    
    const targetLanguages = languages.filter(
      l => selectedTiers.includes(l.tier || 1) && 
           !['es', 'ca', 'fr', 'en'].includes(l.locale) && 
           l.is_active
    );

    toast({
      title: 'Translation started',
      description: `Translating to ${targetLanguages.length} languages...`
    });

    // Process languages sequentially to avoid rate limits
    for (const lang of targetLanguages) {
      await translateLanguage(lang.locale);
      // Small delay between languages
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsTranslating(false);
    refreshLanguages();
    
    toast({
      title: 'Translation complete',
      description: 'All translations have been processed.'
    });
  };

  const handleTranslateSingle = async (locale: string) => {
    setIsTranslating(true);
    await translateLanguage(locale);
    setIsTranslating(false);
    refreshLanguages();
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Core';
      case 2: return 'Extended';
      case 3: return 'Regional';
      case 4: return 'Specialized';
      default: return 'Other';
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-primary/10 text-primary';
      case 2: return 'bg-blue-500/10 text-blue-600';
      case 3: return 'bg-amber-500/10 text-amber-600';
      case 4: return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (languagesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeLanguages = languages.filter(l => l.is_active);
  const groupedByTier = activeLanguages.reduce((acc, lang) => {
    const tier = lang.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(lang);
    return acc;
  }, {} as Record<number, typeof languages>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Translation Manager</CardTitle>
              <CardDescription>
                {totalKeys} translation keys • {activeLanguages.length} active languages
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleTranslateAll}
            disabled={isTranslating}
            className="gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Translate Selected Tiers
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Selection */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          {[1, 2, 3, 4].map(tier => (
            <div key={tier} className="flex items-center gap-2">
              <Switch
                id={`tier-${tier}`}
                checked={selectedTiers.includes(tier)}
                onCheckedChange={(checked) => {
                  setSelectedTiers(prev => 
                    checked ? [...prev, tier] : prev.filter(t => t !== tier)
                  );
                }}
              />
              <Label htmlFor={`tier-${tier}`} className="flex items-center gap-2">
                <Badge className={getTierColor(tier)}>{getTierLabel(tier)}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({groupedByTier[tier]?.length || 0} languages)
                </span>
              </Label>
            </div>
          ))}
        </div>

        {/* Language Grid */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedByTier)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, langs]) => (
                <div key={tier} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getTierColor(Number(tier))}>
                      {getTierLabel(Number(tier))}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {langs.length} languages
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {langs.map(lang => {
                      const job = jobs[lang.locale];
                      const isBaseLanguage = ['es', 'ca', 'fr', 'en'].includes(lang.locale);
                      
                      return (
                        <div
                          key={lang.locale}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{lang.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {lang.locale}
                              </Badge>
                              {lang.is_rtl && (
                                <Badge variant="secondary" className="text-xs">RTL</Badge>
                              )}
                            </div>
                            {!isBaseLanguage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTranslateSingle(lang.locale)}
                                disabled={isTranslating || job?.status === 'running'}
                              >
                                {job?.status === 'running' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : job?.status === 'completed' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : job?.status === 'error' ? (
                                  <AlertCircle className="h-3 w-3 text-destructive" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {isBaseLanguage ? 'Static file' : 'Dynamic DB'}
                              </span>
                              <span>
                                {isBaseLanguage ? '100%' : `${lang.translation_progress || 0}%`}
                              </span>
                            </div>
                            <Progress 
                              value={isBaseLanguage ? 100 : (job?.progress || lang.translation_progress || 0)} 
                              className="h-1.5"
                            />
                            {job?.message && job.status !== 'completed' && (
                              <p className="text-xs text-muted-foreground truncate">
                                {job.message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
